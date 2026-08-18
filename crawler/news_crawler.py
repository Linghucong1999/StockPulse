# -*- coding: utf-8 -*-
"""新闻爬虫模块：抓取 Yahoo 新闻页并提取标题与正文段落。"""
import http.cookiejar
import re
import ssl
import urllib.error
import urllib.parse
import urllib.request

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
CTX = ssl.create_default_context()


def fetch_page(url, timeout=25, max_redirects=3):
    """带 cookie 的 HTTP 抓取（跟随 308 等重定向），返回 (status, html_text)。"""
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()),
        urllib.request.HTTPSHandler(context=CTX),
    )
    for _ in range(max_redirects + 1):
        req = urllib.request.Request(url, headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })
        try:
            with opener.open(req, timeout=timeout) as r:
                if r.status in (301, 302, 303, 307, 308):
                    loc = r.headers.get("Location")
                    if not loc:
                        break
                    url = urllib.parse.urljoin(url, loc)
                    continue
                return r.status, r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code in (301, 302, 303, 307, 308):
                loc = e.headers.get("Location")
                if not loc:
                    raise
                url = urllib.parse.urljoin(url, loc)
                continue
            raise
    raise RuntimeError("重定向次数过多")


def html_to_text(s):
    s = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"&nbsp;|&#160;", " ", s, flags=re.I)
    s = re.sub(r"&amp;", "&", s, flags=re.I)
    s = re.sub(r"&quot;", '"', s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip()


def extract_title(html):
    m = re.search(r'<meta[^>]+property="og:title"[^>]+content="([^"]*)"', html, re.I)
    if m:
        return html_to_text(m.group(1))
    m = re.search(r"<h1[^>]*>([\s\S]*?)</h1>", html, re.I)
    if m:
        return html_to_text(m.group(1))
    m = re.search(r"<title[^>]*>([\s\S]*?)</title>", html, re.I)
    if m:
        return html_to_text(m.group(1)).split(" - ")[0]
    return ""


def _extract_ps(html):
    out = []
    for p in re.findall(r"<p[^>]*>([\s\S]*?)</p>", html, re.I):
        t = html_to_text(p)
        if not t or len(t) < 20:
            continue
        if t.lower() == "oops, something went wrong":
            continue
        out.append(t)
    return out


def extract_paragraphs(html):
    candidates = []
    m = re.search(r'<div[^>]+class="[^"]*caas-body[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]+class="[^"]*caas-footer|$)', html, re.I)
    if m:
        candidates.append(m.group(1))
    m = re.search(r"<article[\s\S]*?</article>", html, re.I)
    if m:
        candidates.append(m.group(0))
    m = re.search(r"<main[\s\S]*?</main>", html, re.I)
    if m:
        candidates.append(m.group(0))
    candidates.append(html)
    best = []
    for body in candidates:
        ps = _extract_ps(body)
        if len(ps) >= 3:
            return ps[:60]
        if len(ps) > len(best):
            best = ps
    return best[:60]


def crawl_news(url):
    """抓取新闻页，返回 {title, content: [...]}。"""
    st, html = fetch_page(url)
    if st != 200:
        raise RuntimeError("抓取失败 HTTP %d" % st)
    return {
        "title": extract_title(html),
        "content": extract_paragraphs(html),
    }
