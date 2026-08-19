# StockPulse 本地代理服务器
# 功能：静态托管前端 + 转发 Yahoo Finance API（绕过 CORS）
# 用法：python server.py  然后浏览器打开 http://localhost:5173
import json
import os
import re
import ssl
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from crawler.news_crawler import crawl_news

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 5173
YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart/{sym}"
YAHOO_SEARCH = "https://query1.finance.yahoo.com/v1/finance/search"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
CTX = ssl.create_default_context()

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".json": "application/json; charset=utf-8",
    ".ico": "image/x-icon",
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20, context=CTX) as r:
        return r.status, r.read()


def _translate_mymemory(text, target="zh-CN"):
    q = urllib.parse.quote(text)
    url = f"https://api.mymemory.translated.net/get?q={q}&langpair=en|zh-CN"
    st, data = fetch(url)
    if st != 200:
        raise RuntimeError("MyMemory 翻译 HTTP %d" % st)
    j = json.loads(data)
    # 业务状态校验：配额耗尽 / 超长 / 限流时抛出，由上层处理
    if j.get("quotaFinished"):
        raise RuntimeError("MyMemory 今日配额已用尽")
    if j.get("responseStatus", 200) != 200:
        raise RuntimeError("MyMemory 状态异常")
    t = (j.get("responseData") or {}).get("translatedText", "") or ""
    if "QUERY LENGTH LIMIT" in t or "MYMEMORY WARNING" in t:
        raise RuntimeError("MyMemory 单次查询超长")
    return t


def _split_for_translate(text, limit=480):
    """按句界/空格把文本切分为 ≤limit 字符的片段（MyMemory 单次 500 字符限制）。"""
    chunks = re.split(r"(?<=[.!?])\s+|\n", text)
    parts, cur = [], ""
    for s in chunks:
        if len(s) > limit:
            for w in s.split():
                if len(cur) + len(w) + 1 > limit:
                    if cur:
                        parts.append(cur)
                    cur = w
                else:
                    cur = cur + " " + w if cur else w
            continue
        if len(cur) + len(s) + 1 > limit:
            if cur:
                parts.append(cur)
            cur = s
        else:
            cur = cur + " " + s if cur else s
    if cur:
        parts.append(cur)
    return parts


def translate_text(text, target="zh-CN"):
    """翻译英文为中文：MyMemory（国内可访问），超长文本自动分段合并。"""
    if len(text) <= 480:
        return _translate_mymemory(text, target)
    results = [_translate_mymemory(p, target) for p in _split_for_translate(text)]
    return " ".join(r for r in results if r)


# 新闻抓取 host 白名单（防 SSRF：拒绝内网/私网地址）
NEWS_HOST_WHITELIST = (
    "finance.yahoo.com", "www.yahoo.com", "news.yahoo.com",
    "markets.yahoo.com", "www.investing.com", "investing.com",
)


def _is_allowed_news_url(url):
    try:
        host = (urllib.parse.urlparse(url).hostname or "").lower()
    except Exception:  # noqa: BLE001
        return False
    if not host:
        return False
    # 拒绝 IP 直连（含内网/元数据地址）
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host) or host.startswith("["):
        return False
    return host in NEWS_HOST_WHITELIST


class Handler(BaseHTTPRequestHandler):
    server_version = "StockPulse/1.0"

    def _send(self, status, body, ctype="application/json; charset=utf-8", extra=None):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            if path == "/api/chart":
                q = urllib.parse.parse_qs(parsed.query)
                sym = q.get("symbol", ["AAPL"])[0].strip().upper()
                rng = q.get("range", ["6mo"])[0]
                interval = q.get("interval", ["1d"])[0]
                url = (YAHOO_CHART.format(sym=urllib.parse.quote(sym))
                       + f"?range={rng}&interval={interval}&includePrePost=false")
                st, data = fetch(url)
                self._send(st, data)
            elif path == "/api/search":
                q = urllib.parse.parse_qs(parsed.query)
                query = q.get("q", [""])[0].strip()
                news = q.get("newsCount", ["8"])[0]
                quotes = q.get("quotesCount", ["12"])[0]
                url = (YAHOO_SEARCH
                       + f"?q={urllib.parse.quote(query)}&newsCount={news}&quotesCount={quotes}")
                st, data = fetch(url)
                self._send(st, data)
            elif path == "/api/news-content":
                q = urllib.parse.parse_qs(parsed.query)
                news_url = q.get("url", [""])[0].strip()
                if not news_url.startswith(("https://", "http://")) or not _is_allowed_news_url(news_url):
                    self._send(403, json.dumps({"error": "不支持的新闻来源"}).encode())
                    return
                try:
                    result = crawl_news(news_url)
                    self._send(200, json.dumps(result, ensure_ascii=False).encode())
                except Exception:  # noqa: BLE001
                    self._send(502, json.dumps({"error": "新闻内容获取失败"}).encode())
            elif path == "/api/translate":
                q = urllib.parse.parse_qs(parsed.query)
                text = q.get("text", [""])[0]
                if not text:
                    self._send(400, json.dumps({"error": "缺少 text 参数"}).encode())
                    return
                if len(text) > 2000:
                    self._send(413, json.dumps({"error": "文本过长(限2000字符)"}).encode())
                    return
                try:
                    translated = translate_text(text)
                    self._send(200, json.dumps({"translated": translated}, ensure_ascii=False).encode())
                except Exception:  # noqa: BLE001
                    self._send(502, json.dumps({"error": "翻译服务暂不可用"}).encode())
            else:
                if path == "/":
                    path = "/index.html"
                rel = path.lstrip("/")
                fp = os.path.normpath(os.path.join(ROOT, rel))
                if not fp.startswith(ROOT):
                    self._send(403, json.dumps({"error": "forbidden"}).encode())
                    return
                if os.path.isfile(fp):
                    ctype = CONTENT_TYPES.get(os.path.splitext(fp)[1].lower(),
                                              "application/octet-stream")
                    with open(fp, "rb") as f:
                        self._send(200, f.read(), ctype=ctype)
                else:
                    self._send(404, json.dumps({"error": "not found"}).encode())
        except Exception as e:  # noqa: BLE001
            try:
                self._send(500, json.dumps({"error": str(e)}).encode())
            except Exception:
                pass

    def log_message(self, fmt, *args):  # 静默请求日志
        pass


if __name__ == "__main__":
    print(f"StockPulse 服务已启动: http://localhost:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
