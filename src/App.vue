<script setup>
import { ref, computed, onMounted } from 'vue'
import anime from 'animejs'
import HeaderComp from './components/HeaderComp.vue'
import AsideComp from './components/AsideComp.vue'
import MainComp from './components/MainComp.vue'
import stocksData from './data/stocks.json'
import { searchLocal } from './utils/search'
import {
  or, sma, calcMACD, calcRSI, calcBOLL, maxDrawdown, annualVol,
  median, quantile, calcMode, meanAbsDev, calcSkewness, calcKurtosis, calcMatrix,
} from './utils/stats'

const PERIODS = stocksData.periods
const HOT_US = stocksData.hotUS
const HOT_HK = stocksData.hotHK
const HOT_CN = stocksData.hotCN

const query = ref('')
const results = ref([])
const current = ref(null)
const meta = ref({})
const candles = ref([])
const period = ref('1d')
const periods = Object.entries(PERIODS).map(([key, v]) => ({ key, label: v.label }))
const stats = ref({
  rangeChgPct: 0, high: 0, low: 0, mean: 0, std: 0, annVol: 0, maxDD: 0,
  volRatio: 0, ma5: 0, ma20: 0, rsi: 0, macd: { dif: 0, dea: 0, hist: 0 },
  boll: { upper: 0, mid: 0, lower: 0 }, trend: '—',
  median: 0, mode: null, range: 0, iqr: 0, mad: 0, variance: 0, skew: 0, kurt: 0,
  matrix: { cov: [], corr: [] },
  longScore: 0, shortScore: 0, longAdvice: false, shortAdvice: false,
  adviceText: '建议观望', adviceTagType: 'info',
})
const news = ref([])
const newsLoading = ref(false)
const loading = ref(false)
const menuDrawer = ref(false)

const activeSymbol = computed(() => (current.value ? current.value.symbol : ''))

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}

async function doSearch() {
  const q = query.value.trim()
  if (!q) return
  const local = searchLocal(q)
  if (local.length) {
    results.value = local.map(x => ({ symbol: x.code, shortname: x.cn || x.en || x.code }))
    if (local.length === 1) select(local[0].code)
    return
  }
  try {
    const data = await fetchJSON('/api/search?q=' + encodeURIComponent(q) + '&newsCount=8&quotesCount=15')
    results.value = (data.quotes || []).filter(x => x.quoteType === 'EQUITY' && x.symbol).slice(0, 8)
    if (results.value.length === 1) select(results.value[0].symbol)
    else if (results.value.length === 0 && /^[\w.\-]+$/.test(q)) select(q.toUpperCase())
  } catch (e) {
    console.error('搜索失败', e)
  }
}

async function select(symbol) {
  current.value = { symbol }
  query.value = ''
  results.value = []
  news.value = []
  loading.value = true
  try {
    await Promise.all([loadChart(symbol), loadNews(symbol)])
  } catch (e) {
    console.error('加载失败', e)
  } finally {
    loading.value = false
  }
}

async function loadChart(symbol, periodKey) {
  const p = PERIODS[periodKey || period.value]
  const data = await fetchJSON(`/api/chart?symbol=${encodeURIComponent(symbol)}&range=${p.range}&interval=${p.interval}`)
  const res = data.chart && data.chart.result && data.chart.result[0]
  if (!res) throw new Error('无数据: ' + symbol)
  const m = res.meta
  const q = res.indicators.quote[0]
  const ts = res.timestamp || []
  const list = []
  for (let i = 0; i < ts.length; i++) {
    const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i], v = q.volume[i]
    if (o == null || h == null || l == null || c == null || v == null) continue
    list.push({ t: ts[i] * 1000, o, h, l, c, v })
  }
  if (!list.length) throw new Error('K 线数据为空: ' + symbol)
  candles.value = list
  meta.value = m
  if (periodKey) period.value = periodKey
  computeStats(list)
}

function computeStats(candlesList) {
  const closes = candlesList.map(x => x.c)
  const n = closes.length
  const last = closes[n - 1]
  const ma5 = or(sma(closes, 5)[n - 1], last)
  const ma20 = or(sma(closes, 20)[n - 1], last)
  const ma60 = or(sma(closes, 60)[n - 1], last)
  const macd = calcMACD(closes)
  const rsiArr = calcRSI(closes, 14)
  const boll = calcBOLL(closes, 20, 2)
  const returns = closes.slice(1).map((c, i) => c / closes[i] - 1)
  const mean = closes.reduce((a, b) => a + b, 0) / n
  const std = n > 1 ? Math.sqrt(closes.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0
  const avgVol = candlesList.reduce((a, x) => a + x.v, 0) / n
  const volRatio = avgVol ? candlesList[n - 1].v / avgVol : 0
  const trend = (ma5 > ma20 && macd.hist[n - 1] > 0) ? '上升趋势'
    : (ma5 < ma20 && macd.hist[n - 1] < 0) ? '下降趋势' : '震荡整理'

  const annVolVal = annualVol(returns, PERIODS[period.value].volFactor)
  const maxDDVal = maxDrawdown(closes)
  const rangeChgVal = (last / closes[0] - 1) * 100
  const rsiVal = or(rsiArr[n - 1], 50)
  const macdHistVal = or(macd.hist[n - 1], 0)

  let longScore = 0
  if (ma20 > ma60) longScore++
  if (annVolVal < 0.3) longScore++
  if (maxDDVal > -0.2) longScore++
  if (rangeChgVal > 0) longScore++
  let shortScore = 0
  if (ma5 > ma20) shortScore++
  if (macdHistVal > 0) shortScore++
  if (rsiVal >= 30 && rsiVal <= 70) shortScore++
  if (rsiVal < 30) shortScore++
  const longAdvice = longScore >= 3
  const shortAdvice = shortScore >= 2
  let adviceText = '建议观望'
  let adviceTagType = 'info'
  if (longAdvice && shortAdvice) { adviceText = '长期短期均可持有'; adviceTagType = 'success' }
  else if (longAdvice) { adviceText = '建议长期持有'; adviceTagType = 'success' }
  else if (shortAdvice) { adviceText = '建议短期持有'; adviceTagType = 'warning' }

  stats.value = {
    rangeChgPct: rangeChgVal, high: Math.max(...closes), low: Math.min(...closes),
    mean, std, annVol: annVolVal, maxDD: maxDDVal, volRatio, ma5, ma20,
    rsi: rsiVal,
    macd: { dif: or(macd.dif[n - 1], 0), dea: or(macd.dea[n - 1], 0), hist: macdHistVal },
    boll: { upper: or(boll.upper[n - 1], last), mid: or(boll.mid[n - 1], last), lower: or(boll.lower[n - 1], last) },
    trend,
    median: median(closes), mode: calcMode(closes),
    range: Math.max(...closes) - Math.min(...closes),
    iqr: quantile(closes, 0.75) - quantile(closes, 0.25),
    mad: meanAbsDev(closes, mean), variance: std * std,
    skew: calcSkewness(closes), kurt: calcKurtosis(closes),
    matrix: calcMatrix(candlesList),
    longScore, shortScore, longAdvice, shortAdvice, adviceText, adviceTagType,
  }
  anime({
    targets: '.stat, .ind-table tr', opacity: [0, 1], translateY: [6, 0],
    delay: anime.stagger(24), duration: 420, easing: 'easeOutQuad',
  })
}

async function loadNews(symbol) {
  newsLoading.value = true
  try {
    const data = await fetchJSON('/api/search?q=' + encodeURIComponent(symbol) + '&newsCount=10&quotesCount=2')
    news.value = (data.news || []).filter(n => n.title && n.link).slice(0, 10)
  } finally {
    newsLoading.value = false
  }
}

function onPeriodChange(key) {
  if (period.value !== key) period.value = key
  if (current.value) loadChart(current.value.symbol, key).catch(e => console.error(e))
}

function onDrawerSelect(symbol) {
  menuDrawer.value = false
  select(symbol)
}

onMounted(() => select(HOT_CN[0]))
</script>

<template>
  <el-container class="app-layout">
    <el-header class="app-header" height="60px">
      <HeaderComp @toggle-menu="menuDrawer = true" />
    </el-header>
    <el-container class="app-body">
      <el-aside class="app-aside" width="240px">
        <AsideComp :hot-cn="HOT_CN" :hot-us="HOT_US" :hot-hk="HOT_HK" :results="results"
                   :active-symbol="activeSymbol" @select="select" />
      </el-aside>
      <el-main class="app-main">
        <MainComp :current="current" :meta="meta" :candles="candles" :period="period"
                  :periods="periods" :stats="stats" :news="news" :news-loading="newsLoading"
                  :loading="loading" :query="query" :hot-cn="HOT_CN" :hot-us="HOT_US" :hot-hk="HOT_HK"
                  @update:query="q => query = q" @search="doSearch" @select="select"
                  @period-change="onPeriodChange" />
      </el-main>
    </el-container>
  </el-container>

  <el-drawer v-model="menuDrawer" title="股票列表" direction="ltr" size="300px"
             class="stock-drawer">
    <AsideComp :hot-cn="HOT_CN" :hot-us="HOT_US" :hot-hk="HOT_HK" :results="results"
               :active-symbol="activeSymbol" @select="onDrawerSelect" />
  </el-drawer>
</template>
