// 统计计算工具（从旧 app.js 迁移，模块化导出）

// 涨跌颜色（与 style.css 的 --up/--down 一致）
export const C_UP = '#ff4d6a'
export const C_DOWN = '#2ecc71'
export const C_MA5 = '#f5c542'
export const C_MA20 = '#4fc3f7'
export const C_MA60 = '#ab8cff'

export function or(v, def) { return v == null ? def : v }

/* ---------- 技术指标 ---------- */
export function sma(arr, n) {
  const out = new Array(arr.length).fill(null)
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]
    if (i >= n) sum -= arr[i - n]
    if (i >= n - 1) out[i] = sum / n
  }
  return out
}

export function ema(arr, n) {
  const out = new Array(arr.length).fill(null)
  const k = 2 / (n + 1)
  let prev = null
  for (let i = 0; i < arr.length; i++) {
    prev = prev === null ? arr[i] : arr[i] * k + prev * (1 - k)
    out[i] = prev
  }
  return out
}

export function calcMACD(closes) {
  const e12 = ema(closes, 12)
  const e26 = ema(closes, 26)
  const dif = closes.map((_, i) => e12[i] - e26[i])
  const dea = ema(dif, 9)
  const hist = dif.map((d, i) => (d - dea[i]) * 2)
  return { dif, dea, hist }
}

export function calcRSI(closes, n = 14) {
  const out = new Array(closes.length).fill(null)
  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i < closes.length; i++) {
    const chg = closes[i] - closes[i - 1]
    const gain = Math.max(chg, 0)
    const loss = Math.max(-chg, 0)
    if (i <= n) {
      avgGain += gain / n
      avgLoss += loss / n
      if (i === n) out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
    } else {
      avgGain = (avgGain * (n - 1) + gain) / n
      avgLoss = (avgLoss * (n - 1) + loss) / n
      out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
    }
  }
  return out
}

export function calcBOLL(closes, n = 20, k = 2) {
  const mid = sma(closes, n)
  const upper = new Array(closes.length).fill(null)
  const lower = new Array(closes.length).fill(null)
  for (let i = n - 1; i < closes.length; i++) {
    let s = 0
    for (let j = i - n + 1; j <= i; j++) s += (closes[j] - mid[i]) ** 2
    const sd = Math.sqrt(s / n)
    upper[i] = mid[i] + k * sd
    lower[i] = mid[i] - k * sd
  }
  return { upper, mid, lower }
}

export function maxDrawdown(closes) {
  let peak = -Infinity
  let mdd = 0
  for (const c of closes) {
    if (c > peak) peak = c
    const dd = c / peak - 1
    if (dd < mdd) mdd = dd
  }
  return mdd
}

export function annualVol(returns, factor) {
  const n = returns.length
  if (n < 2) return 0
  const mean = returns.reduce((a, b) => a + b, 0) / n
  const v = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)
  return Math.sqrt(v) * Math.sqrt(factor)
}

/* ---------- 描述统计 ---------- */
export function median(arr) {
  const s = [...arr].sort((a, b) => a - b)
  const n = s.length
  if (n === 0) return 0
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}

export function quantile(arr, q) {
  const s = [...arr].sort((a, b) => a - b)
  const n = s.length
  if (n === 0) return 0
  const pos = (n - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (pos - lo)
}

export function calcMode(closes) {
  const freq = new Map()
  for (const c of closes) {
    const k = c.toFixed(2)
    freq.set(k, (freq.get(k) || 0) + 1)
  }
  let maxF = 1
  let best = null
  let ties = 0
  for (const [k, f] of freq) {
    if (f > maxF) { maxF = f; best = k; ties = 1 }
    else if (f === maxF) ties++
  }
  return (maxF <= 1 || ties > 1) ? null : Number(best)
}

export function meanAbsDev(arr, m) {
  return arr.reduce((a, x) => a + Math.abs(x - m), 0) / arr.length
}

export function calcSkewness(closes) {
  const n = closes.length
  if (n < 3) return 0
  const m = closes.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(closes.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1))
  if (sd === 0) return 0
  const s3 = closes.reduce((a, x) => a + ((x - m) / sd) ** 3, 0)
  return (n / ((n - 1) * (n - 2))) * s3
}

export function calcKurtosis(closes) {
  const n = closes.length
  if (n < 4) return 0
  const m = closes.reduce((a, b) => a + b, 0) / n
  const sd = Math.sqrt(closes.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1))
  if (sd === 0) return 0
  const s4 = closes.reduce((a, x) => a + ((x - m) / sd) ** 4, 0)
  return (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * s4
    - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3))
}

/* ---------- 矩阵分析 ---------- */
export const MATRIX_FIELDS = ['o', 'h', 'l', 'c', 'v']

export function covariance(x, y, mx, my, n) {
  let s = 0
  for (let i = 0; i < n; i++) s += (x[i] - mx) * (y[i] - my)
  return s / (n - 1)
}

export function calcMatrix(candles) {
  const n = candles.length
  const cols = MATRIX_FIELDS.map(f => candles.map(c => c[f]))
  const means = cols.map(col => col.reduce((a, b) => a + b, 0) / n)
  const cov = MATRIX_FIELDS.map((_, i) =>
    MATRIX_FIELDS.map((_, j) => covariance(cols[i], cols[j], means[i], means[j], n)))
  const sds = MATRIX_FIELDS.map((_, i) => Math.sqrt(cov[i][i]))
  const corr = MATRIX_FIELDS.map((_, i) =>
    MATRIX_FIELDS.map((_, j) => {
      if (sds[i] === 0 || sds[j] === 0) return 0
      return cov[i][j] / (sds[i] * sds[j])
    }))
  return { cov, corr }
}
