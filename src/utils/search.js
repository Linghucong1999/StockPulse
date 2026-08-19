import stocksData from '../data/stocks.json'

export const ALL_STOCK_CODES = [...stocksData.hotCN, ...stocksData.hotUS, ...stocksData.hotHK]

export function stockName(sym) {
  return stocksData.names[sym] || ''
}

export function enName(sym) {
  return stocksData.enNames[sym] || ''
}

// 本地模糊搜索：中文/英文/代码/拼音
export function searchLocal(q) {
  const raw = q.trim()
  const ql = raw.toLowerCase()
  if (!ql) return []
  const hits = []
  for (const code of ALL_STOCK_CODES) {
    const cn = stocksData.names[code] || ''
    const en = (stocksData.enNames[code] || '').toLowerCase()
    const pys = stocksData.pinyin[code] || []
    if (code.toLowerCase().includes(ql) || cn.includes(raw) || en.includes(ql) || pys.some(p => p.includes(ql))) {
      hits.push({ code, cn, en: stocksData.enNames[code] || '' })
    }
  }
  return hits
}
