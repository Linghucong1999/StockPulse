/* StockPulse 根组件：全局常量、状态管理、数据加载，注册 Header/Aside/Main 子组件 */
const { createApp } = Vue;

/* ---------- 全局常量 ---------- */
const PERIODS = {
  '1d':  { label: '日K', range: '6mo', interval: '1d',  volFactor: 252 },
  '60m': { label: '时K', range: '5d',  interval: '60m', volFactor: 252 * 6.5 },
  '1wk': { label: '周K', range: '2y',  interval: '1wk', volFactor: 52 },
  '1mo': { label: '月K', range: '5y',  interval: '1mo', volFactor: 12 },
};

const HOT_US = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'INTC', 'NFLX', 'ADBE', 'ORCL', 'CRM', 'AVGO', 'CSCO', 'QCOM', 'MU', 'COST', 'WMT', 'JPM', 'BAC', 'DIS', 'KO', 'PEP', 'PG', 'JNJ', 'UNH', 'V', 'MA', 'XOM'];
const HOT_HK = ['0700.HK', '9988.HK', '3690.HK', '1810.HK', '9618.HK', '1211.HK', '0005.HK', '0388.HK', '0939.HK', '2318.HK', '2020.HK', '1024.HK', '0992.HK', '2628.HK', '3988.HK', '1299.HK', '0175.HK', '2382.HK', '0981.HK', '6060.HK', '0027.HK', '0001.HK', '0016.HK', '0002.HK', '0012.HK', '0868.HK', '1093.HK', '2388.HK', '0669.HK', '0883.HK'];
const HOT_CN = ['600519.SS', '601318.SS', '600036.SS', '000858.SZ', '000333.SZ', '000651.SZ', '600900.SS', '601899.SS', '601398.SS', '601939.SS', '601988.SS', '600028.SS', '601857.SS', '600030.SS', '601166.SS', '600887.SS', '603288.SS', '600276.SS', '300760.SZ', '002415.SZ', '002475.SZ', '000725.SZ', '300059.SZ', '600585.SS', '601012.SS', '300750.SZ', '002594.SZ', '002230.SZ', '688981.SS', '600941.SS'];

const STOCK_NAMES = {
  /* A股 */
  '600519.SS': '贵州茅台', '601318.SS': '中国平安', '600036.SS': '招商银行', '000858.SZ': '五粮液',
  '000333.SZ': '美的集团', '000651.SZ': '格力电器', '600900.SS': '长江电力', '601899.SS': '紫金矿业',
  '601398.SS': '工商银行', '601939.SS': '建设银行', '601988.SS': '中国银行', '600028.SS': '中国石化',
  '601857.SS': '中国石油', '600030.SS': '中信证券', '601166.SS': '兴业银行', '600887.SS': '伊利股份',
  '603288.SS': '海天味业', '600276.SS': '恒瑞医药', '300760.SZ': '迈瑞医疗', '002415.SZ': '海康威视',
  '002475.SZ': '立讯精密', '000725.SZ': '京东方A', '300059.SZ': '东方财富', '600585.SS': '海螺水泥',
  '601012.SS': '隆基绿能', '300750.SZ': '宁德时代', '002594.SZ': '比亚迪', '002230.SZ': '科大讯飞',
  '688981.SS': '中芯国际', '600941.SS': '中国移动',
  /* 美股 */
  'AAPL': '苹果', 'MSFT': '微软', 'NVDA': '英伟达', 'TSLA': '特斯拉', 'GOOGL': '谷歌', 'AMZN': '亚马逊',
  'META': 'Meta', 'AMD': '超威半导体', 'INTC': '英特尔', 'NFLX': '奈飞', 'ADBE': '奥多比(Adobe)',
  'ORCL': '甲骨文', 'CRM': '赛富时', 'AVGO': '博通', 'CSCO': '思科', 'QCOM': '高通', 'MU': '美光科技',
  'COST': '好市多', 'WMT': '沃尔玛', 'JPM': '摩根大通', 'BAC': '美国银行', 'DIS': '迪士尼',
  'KO': '可口可乐', 'PEP': '百事', 'PG': '宝洁', 'JNJ': '强生', 'UNH': '联合健康', 'V': 'Visa',
  'MA': '万事达', 'XOM': '埃克森美孚',
  /* 港股 */
  '0700.HK': '腾讯控股', '9988.HK': '阿里巴巴', '3690.HK': '美团', '1810.HK': '小米集团',
  '9618.HK': '京东集团', '1211.HK': '比亚迪股份', '0005.HK': '汇丰控股', '0388.HK': '香港交易所',
  '0939.HK': '建设银行', '2318.HK': '中国平安', '2020.HK': '安踏体育', '1024.HK': '快手',
  '0992.HK': '联想集团', '2628.HK': '中国人寿', '3988.HK': '中国银行', '1299.HK': '友邦保险',
  '0175.HK': '吉利汽车', '2382.HK': '舜宇光学', '0981.HK': '中芯国际', '6060.HK': '众安在线',
  '0027.HK': '银河娱乐', '0001.HK': '长和', '0016.HK': '新鸿基地产', '0002.HK': '中电控股',
  '0012.HK': '恒基地产', '0868.HK': '信义玻璃', '1093.HK': '石药集团', '2388.HK': '中银香港',
  '0669.HK': '创科实业', '0883.HK': '中国海洋石油',
};

/* 英文名映射（与 STOCK_NAMES 对应，用于中英文并存显示） */
const STOCK_EN_NAMES = {
  /* A股 */
  '600519.SS': 'Kweichow Moutai Co., Ltd.', '601318.SS': 'Ping An Insurance (Group) Co.',
  '600036.SS': 'China Merchants Bank Co., Ltd.', '000858.SZ': 'Wuliangye Yibin Co., Ltd.',
  '000333.SZ': 'Midea Group Co., Ltd.', '000651.SZ': 'Gree Electric Appliances, Inc.',
  '600900.SS': 'China Yangtze Power Co., Ltd.', '601899.SS': 'Zijin Mining Group Co., Ltd.',
  '601398.SS': 'ICBC', '601939.SS': 'China Construction Bank Corp.',
  '601988.SS': 'Bank of China Ltd.', '600028.SS': 'China Petroleum & Chemical Corp.',
  '601857.SS': 'PetroChina Co., Ltd.', '600030.SS': 'CITIC Securities Co., Ltd.',
  '601166.SS': 'Industrial Bank Co., Ltd.', '600887.SS': 'Inner Mongolia Yili Industrial',
  '603288.SS': 'Foshan Haitian Flavouring', '600276.SS': 'Jiangsu Hengrui Pharmaceuticals',
  '300760.SZ': 'Shenzhen Mindray Bio-Medical', '002415.SZ': 'Hangzhou Hikvision Digital',
  '002475.SZ': 'Luxshare Precision Industry', '000725.SZ': 'BOE Technology Group',
  '300059.SZ': 'East Money Information', '600585.SS': 'Anhui Conch Cement Co., Ltd.',
  '601012.SS': 'LONGi Green Energy Technology', '300750.SZ': 'Contemporary Amperex Technology',
  '002594.SZ': 'BYD Company Limited', '002230.SZ': 'iFLYTEK Co., Ltd.',
  '688981.SS': 'Semiconductor Mfg. Intl.', '600941.SS': 'China Mobile Limited',
  /* 美股 */
  'AAPL': 'Apple Inc.', 'MSFT': 'Microsoft Corporation', 'NVDA': 'NVIDIA Corporation',
  'TSLA': 'Tesla, Inc.', 'GOOGL': 'Alphabet Inc.', 'AMZN': 'Amazon.com, Inc.',
  'META': 'Meta Platforms, Inc.', 'AMD': 'Advanced Micro Devices, Inc.',
  'INTC': 'Intel Corporation', 'NFLX': 'Netflix, Inc.', 'ADBE': 'Adobe Inc.',
  'ORCL': 'Oracle Corporation', 'CRM': 'Salesforce, Inc.', 'AVGO': 'Broadcom Inc.',
  'CSCO': 'Cisco Systems, Inc.', 'QCOM': 'QUALCOMM Incorporated', 'MU': 'Micron Technology, Inc.',
  'COST': 'Costco Wholesale Corporation', 'WMT': 'Walmart Inc.', 'JPM': 'JPMorgan Chase & Co.',
  'BAC': 'Bank of America Corporation', 'DIS': 'The Walt Disney Company', 'KO': 'The Coca-Cola Company',
  'PEP': 'PepsiCo, Inc.', 'PG': 'The Procter & Gamble Company', 'JNJ': 'Johnson & Johnson',
  'UNH': 'UnitedHealth Group Incorporated', 'V': 'Visa Inc.', 'MA': 'Mastercard Incorporated',
  'XOM': 'ExxonMobil Corporation',
  /* 港股 */
  '0700.HK': 'Tencent Holdings Limited', '9988.HK': 'Alibaba Group Holding Ltd.',
  '3690.HK': 'Meituan', '1810.HK': 'Xiaomi Corporation', '9618.HK': 'JD.com, Inc.',
  '1211.HK': 'BYD Company Limited', '0005.HK': 'HSBC Holdings plc', '0388.HK': 'HKEX Limited',
  '0939.HK': 'China Construction Bank Corp.', '2318.HK': 'Ping An Insurance (Group) Co.',
  '2020.HK': 'ANTA Sports Products Ltd.', '1024.HK': 'Kuaishou Technology',
  '0992.HK': 'Lenovo Group Limited', '2628.HK': 'China Life Insurance Co., Ltd.',
  '3988.HK': 'Bank of China Limited', '1299.HK': 'AIA Group Limited',
  '0175.HK': 'Geely Automobile Holdings', '2382.HK': 'Sunny Optical Technology',
  '0981.HK': 'Semiconductor Mfg. Intl.', '6060.HK': 'ZhongAn Online P & C Insurance',
  '0027.HK': 'Galaxy Entertainment Group', '0001.HK': 'CK Hutchison Holdings Limited',
  '0016.HK': 'Sun Hung Kai Properties', '0002.HK': 'CLP Holdings Limited',
  '0012.HK': 'Henderson Land Development', '0868.HK': 'Xinyi Glass Holdings Limited',
  '1093.HK': 'CSPC Pharmaceutical Group', '2388.HK': 'BOC Hong Kong (Holdings) Ltd.',
  '0669.HK': 'Techtronic Industries', '0883.HK': 'CNOOC Limited',
};

/* 拼音索引：[全拼, 首字母]（A股/港股；美股用英文/代码搜索即可） */
const STOCK_PINYIN = {
  /* A股 */
  '600519.SS': ['guizhoumaotai', 'gzmt'], '601318.SS': ['zhongguopingan', 'zgpa'],
  '600036.SS': ['zhaoshangyinhang', 'zsyh'], '000858.SZ': ['wuliangye', 'wly'],
  '000333.SZ': ['meidijituan', 'mdjt'], '000651.SZ': ['gelidianqi', 'gldq'],
  '600900.SS': ['changjiangdianli', 'cjdl'], '601899.SS': ['zijinkuangye', 'zjky'],
  '601398.SS': ['gongshangyinhang', 'gsyh'], '601939.SS': ['jiansheyinhang', 'jsyh'],
  '601988.SS': ['zhongguoyinhang', 'zgyh'], '600028.SS': ['zhongguoshihua', 'zgsh'],
  '601857.SS': ['zhongguoshiyou', 'zgsy'], '600030.SS': ['zhongxinzhengquan', 'zxzq'],
  '601166.SS': ['xingyeyinhang', 'xyyh'], '600887.SS': ['yiligufen', 'ylgf'],
  '603288.SS': ['haitianweiye', 'htwy'], '600276.SS': ['hengruiyiyao', 'hryy'],
  '300760.SZ': ['mairuiyiliao', 'mryl'], '002415.SZ': ['haikangweishi', 'hkws'],
  '002475.SZ': ['lixunjingmi', 'lxjm'], '000725.SZ': ['jingdongfang', 'jdf'],
  '300059.SZ': ['dongfangcaifu', 'dfcf'], '600585.SS': ['hailuoshuini', 'hlsn'],
  '601012.SS': ['longjilvneng', 'ljln'], '300750.SZ': ['ningdeshidai', 'ndsd'],
  '002594.SZ': ['biyadi', 'byd'], '002230.SZ': ['kedaxunfei', 'kdxf'],
  '688981.SS': ['zhongxinguoji', 'zxgj'], '600941.SS': ['zhongguoyidong', 'zgyd'],
  /* 港股 */
  '0700.HK': ['tengxunkonggu', 'txkg'], '9988.HK': ['alibaba', 'albb'],
  '3690.HK': ['meituan', 'mt'], '1810.HK': ['xiaomijituan', 'xmjt'],
  '9618.HK': ['jingdongjituan', 'jdjt'], '1211.HK': ['biyadigufen', 'bydgf'],
  '0005.HK': ['huifengkonggu', 'hfkg'], '0388.HK': ['xianggangjiaoyisuo', 'xgjys'],
  '0939.HK': ['jiansheyinhang', 'jsyh'], '2318.HK': ['zhongguopingan', 'zgpa'],
  '2020.HK': ['antatiyu', 'atty'], '1024.HK': ['kuaishou', 'ks'],
  '0992.HK': ['lianxiangjituan', 'lxjt'], '2628.HK': ['zhongguorenshou', 'zgrs'],
  '3988.HK': ['zhongguoyinhang', 'zgyh'], '1299.HK': ['youbangbaoxian', 'ybbx'],
  '0175.HK': ['jiliqiche', 'jlqc'], '2382.HK': ['shunyuguangxue', 'sygx'],
  '0981.HK': ['zhongxinguoji', 'zxgj'], '6060.HK': ['zhonganzaixian', 'zazx'],
  '0027.HK': ['yinheyule', 'yhyl'], '0001.HK': ['changhe', 'ch'],
  '0016.HK': ['xinhongjidi', 'xhjd'], '0002.HK': ['zhongdiankonggu', 'zdkg'],
  '0012.HK': ['hengjidichan', 'hjdc'], '0868.HK': ['xinyiboli', 'xybl'],
  '1093.HK': ['shiyaojituan', 'syjt'], '2388.HK': ['zhongyinxinggang', 'zyxg'],
  '0669.HK': ['chuangkeshiye', 'cksy'], '0883.HK': ['zhongguohaiyangshiyou', 'zghysy'],
};

/* ---------- 本地模糊搜索（中文/英文/代码/拼音） ---------- */
const ALL_STOCK_CODES = [...HOT_CN, ...HOT_US, ...HOT_HK];

function searchLocal(q) {
  const raw = q.trim();
  const ql = raw.toLowerCase();
  if (!ql) return [];
  const hits = [];
  for (const code of ALL_STOCK_CODES) {
    const cn = STOCK_NAMES[code] || '';
    const en = (STOCK_EN_NAMES[code] || '').toLowerCase();
    const pys = STOCK_PINYIN[code] || [];
    if (code.toLowerCase().includes(ql) || cn.includes(raw) || en.includes(ql) ||
        pys.some(p => p.includes(ql))) {
      hits.push({ code, cn, en: STOCK_EN_NAMES[code] || '' });
    }
  }
  return hits;
}

const C_UP = '#ff4d6a';
const C_DOWN = '#2ecc71';
const C_MA5 = '#f5c542', C_MA20 = '#4fc3f7', C_MA60 = '#ab8cff';

/* ---------- 工具函数 ---------- */
function or(v, def) { return v == null ? def : v; }

/* ---------- 技术指标计算 ---------- */
function sma(arr, n) {
  const out = new Array(arr.length).fill(null);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= n) sum -= arr[i - n];
    if (i >= n - 1) out[i] = sum / n;
  }
  return out;
}

function ema(arr, n) {
  const out = new Array(arr.length).fill(null);
  const k = 2 / (n + 1);
  let prev = null;
  for (let i = 0; i < arr.length; i++) {
    prev = prev === null ? arr[i] : arr[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

function calcMACD(closes) {
  const e12 = ema(closes, 12), e26 = ema(closes, 26);
  const dif = closes.map((_, i) => e12[i] - e26[i]);
  const dea = ema(dif, 9);
  const hist = dif.map((d, i) => (d - dea[i]) * 2);
  return { dif, dea, hist };
}

function calcRSI(closes, n = 14) {
  const out = new Array(closes.length).fill(null);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i < closes.length; i++) {
    const chg = closes[i] - closes[i - 1];
    const gain = Math.max(chg, 0), loss = Math.max(-chg, 0);
    if (i <= n) {
      avgGain += gain / n;
      avgLoss += loss / n;
      if (i === n) out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    } else {
      avgGain = (avgGain * (n - 1) + gain) / n;
      avgLoss = (avgLoss * (n - 1) + loss) / n;
      out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
  }
  return out;
}

function calcBOLL(closes, n = 20, k = 2) {
  const mid = sma(closes, n);
  const upper = new Array(closes.length).fill(null);
  const lower = new Array(closes.length).fill(null);
  for (let i = n - 1; i < closes.length; i++) {
    let s = 0;
    for (let j = i - n + 1; j <= i; j++) s += (closes[j] - mid[i]) ** 2;
    const sd = Math.sqrt(s / n);
    upper[i] = mid[i] + k * sd;
    lower[i] = mid[i] - k * sd;
  }
  return { upper, mid, lower };
}

function maxDrawdown(closes) {
  let peak = -Infinity, mdd = 0;
  for (const c of closes) {
    if (c > peak) peak = c;
    const dd = c / peak - 1;
    if (dd < mdd) mdd = dd;
  }
  return mdd;
}

function annualVol(returns, factor) {
  const n = returns.length;
  if (n < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const v = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(v) * Math.sqrt(factor);
}

/* ---------- 描述统计（集中趋势 / 离散程度 / 分布形态） ---------- */
function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return 0;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

function quantile(arr, q) {
  // Type-7 线性插值（numpy 默认分位数算法）
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return 0;
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

function calcMode(closes) {
  // 众数：收盘价保留 2 位小数统计频率；频率唯一或并列则视为无单一众数
  const freq = new Map();
  for (const c of closes) {
    const k = c.toFixed(2);
    freq.set(k, (freq.get(k) || 0) + 1);
  }
  let maxF = 1;
  let best = null;
  let ties = 0;
  for (const [k, f] of freq) {
    if (f > maxF) { maxF = f; best = k; ties = 1; }
    else if (f === maxF) ties++;
  }
  return (maxF <= 1 || ties > 1) ? null : Number(best);
}

function meanAbsDev(arr, m) {
  return arr.reduce((a, x) => a + Math.abs(x - m), 0) / arr.length;
}

function calcSkewness(closes) {
  // 样本偏度：n/((n-1)(n-2)) * Σ((x-μ)/s)³
  const n = closes.length;
  if (n < 3) return 0;
  const m = closes.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(closes.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1));
  if (sd === 0) return 0;
  const s3 = closes.reduce((a, x) => a + ((x - m) / sd) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * s3;
}

function calcKurtosis(closes) {
  // 样本超额峰度（正态分布为 0）
  const n = closes.length;
  if (n < 4) return 0;
  const m = closes.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(closes.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1));
  if (sd === 0) return 0;
  const s4 = closes.reduce((a, x) => a + ((x - m) / sd) ** 4, 0);
  return (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * s4
    - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
}

/* ---------- 矩阵分析（K 线多字段协方差 / 相关系数） ---------- */
const MATRIX_FIELDS = ['o', 'h', 'l', 'c', 'v'];

function covariance(x, y, mx, my, n) {
  let s = 0;
  for (let i = 0; i < n; i++) s += (x[i] - mx) * (y[i] - my);
  return s / (n - 1);
}

function calcMatrix(candles) {
  const n = candles.length;
  const cols = MATRIX_FIELDS.map(f => candles.map(c => c[f]));
  const means = cols.map(col => col.reduce((a, b) => a + b, 0) / n);
  const cov = MATRIX_FIELDS.map((_, i) =>
    MATRIX_FIELDS.map((_, j) => covariance(cols[i], cols[j], means[i], means[j], n)));
  const sds = MATRIX_FIELDS.map((_, i) => Math.sqrt(cov[i][i]));
  const corr = MATRIX_FIELDS.map((_, i) =>
    MATRIX_FIELDS.map((_, j) => {
      if (sds[i] === 0 || sds[j] === 0) return 0;
      return cov[i][j] / (sds[i] * sds[j]);
    }));
  return { cov, corr };
}

/* ---------- 根组件 ---------- */
const app = createApp({
  components: { HeaderComp, AsideComp, MainComp },

  /* 显式模板字符串（保留 PascalCase 组件标签，避免浏览器小写化导致组件解析失败） */
  template: `
    <el-container class="app-layout">
      <el-header class="app-header" height="60px">
        <HeaderComp @toggle-menu="menuDrawer = true" />
      </el-header>
      <el-container class="app-body">
        <el-aside class="app-aside" width="240px">
          <AsideComp :hot-cn="hotCN" :hot-us="hotUS" :hot-hk="hotHK" :results="results"
                     :active-symbol="activeSymbol" @select="select" />
        </el-aside>
        <el-main class="app-main">
          <MainComp :current="current" :meta="meta" :candles="candles" :period="period"
                    :periods="periods" :stats="stats" :news="news" :news-loading="newsLoading"
                    :loading="loading" :query="query" :hot-cn="hotCN" :hot-us="hotUS" :hot-hk="hotHK"
                    @update:query="q => query = q" @search="doSearch" @select="select"
                    @period-change="onPeriodChange" />
        </el-main>
      </el-container>
    </el-container>

    <!-- 移动端：侧滑抽屉菜单 -->
    <el-drawer v-model="menuDrawer" title="股票列表" direction="ltr" size="300px"
               class="stock-drawer" :with-header="true">
      <AsideComp :hot-cn="hotCN" :hot-us="hotUS" :hot-hk="hotHK" :results="results"
                 :active-symbol="activeSymbol" @select="onDrawerSelect" />
    </el-drawer>
  `,

  data() {
    return {
      query: '',
      results: [],
      hotUS: HOT_US, hotHK: HOT_HK, hotCN: HOT_CN,
      current: null,          // { symbol }
      meta: {},               // chart meta
      candles: [],            // [{t,o,h,l,c,v}]
      period: '1d',
      periods: Object.entries(PERIODS).map(([key, v]) => ({ key, label: v.label })),
      stats: {
        rangeChgPct: 0, high: 0, low: 0, mean: 0, std: 0, annVol: 0, maxDD: 0,
        volRatio: 0, ma5: 0, ma20: 0, rsi: 0, macd: { dif: 0, dea: 0, hist: 0 },
        boll: { upper: 0, mid: 0, lower: 0 }, trend: '—',
        median: 0, mode: null, range: 0, iqr: 0, mad: 0, variance: 0, skew: 0, kurt: 0,
        matrix: { cov: [], corr: [] },
        longScore: 0, shortScore: 0, longAdvice: false, shortAdvice: false,
        adviceText: '建议观望', adviceTagType: 'info',
      },
      news: [], newsLoading: false,
      loading: false,
      menuDrawer: false,
    };
  },

  computed: {
    activeSymbol() { return this.current ? this.current.symbol : ''; },
  },

  methods: {
    async fetchJSON(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    },

    async doSearch() {
      const q = this.query.trim();
      if (!q) return;
      // 1) 本地模糊匹配（中文/英文/代码/拼音）
      const local = searchLocal(q);
      if (local.length) {
        this.results = local.map(x => ({ symbol: x.code, shortname: x.cn || x.en || x.code }));
        if (local.length === 1) this.select(local[0].code);
        return;
      }
      // 2) Yahoo 兜底（英文/代码；中文查询 Yahoo 不支持）
      try {
        const data = await this.fetchJSON('/api/search?q=' + encodeURIComponent(q) + '&newsCount=8&quotesCount=15');
        this.results = (data.quotes || []).filter(x => x.quoteType === 'EQUITY' && x.symbol)
          .slice(0, 8);
        if (this.results.length === 1) this.select(this.results[0].symbol);
        else if (this.results.length === 0 && /^[\w.\-]+$/.test(q)) this.select(q.toUpperCase());
      } catch (e) {
        console.error('搜索失败', e);
      }
    },

    async select(symbol) {
      this.current = { symbol };
      this.query = '';
      this.results = [];
      this.news = [];
      this.loading = true;
      try {
        await Promise.all([this.loadChart(symbol), this.loadNews(symbol)]);
      } catch (e) {
        console.error('加载失败', e);
      } finally {
        this.loading = false;
      }
    },

    async loadChart(symbol, periodKey) {
      const p = PERIODS[periodKey || this.period];
      const data = await this.fetchJSON(
        `/api/chart?symbol=${encodeURIComponent(symbol)}&range=${p.range}&interval=${p.interval}`);
      const res = data.chart && data.chart.result && data.chart.result[0];
      if (!res) throw new Error('无数据: ' + symbol);
      const meta = res.meta;
      const q = res.indicators.quote[0];
      const ts = res.timestamp || [];
      const candles = [];
      for (let i = 0; i < ts.length; i++) {
        const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i], v = q.volume[i];
        if (o == null || h == null || l == null || c == null || v == null) continue;
        candles.push({ t: ts[i] * 1000, o, h, l, c, v });
      }
      if (!candles.length) throw new Error('K 线数据为空: ' + symbol);
      this.candles = candles;
      this.meta = meta;
      if (periodKey) this.period = periodKey;
      this.computeStats(candles);
    },

    computeStats(candles) {
      const closes = candles.map(x => x.c);
      const n = closes.length;
      const last = closes[n - 1];
      const ma5 = or(sma(closes, 5)[n - 1], last);
      const ma20 = or(sma(closes, 20)[n - 1], last);
      const ma60 = or(sma(closes, 60)[n - 1], last);
      const macd = calcMACD(closes);
      const rsiArr = calcRSI(closes, 14);
      const boll = calcBOLL(closes, 20, 2);
      const returns = closes.slice(1).map((c, i) => c / closes[i] - 1);
      const mean = closes.reduce((a, b) => a + b, 0) / n;
      const std = n > 1 ? Math.sqrt(closes.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
      const avgVol = candles.reduce((a, x) => a + x.v, 0) / n;
      const volRatio = avgVol ? candles[n - 1].v / avgVol : 0;
      const trend = (ma5 > ma20 && macd.hist[n - 1] > 0) ? '上升趋势'
        : (ma5 < ma20 && macd.hist[n - 1] < 0) ? '下降趋势' : '震荡整理';
      /* 数学分析：长短期持有评分（0-4） */
      const annVolVal = annualVol(returns, PERIODS[this.period].volFactor);
      const maxDDVal = maxDrawdown(closes);
      const rangeChgVal = (last / closes[0] - 1) * 100;
      const rsiVal = or(rsiArr[n - 1], 50);
      const macdHistVal = or(macd.hist[n - 1], 0);
      let longScore = 0;
      if (ma20 > ma60) longScore++;
      if (annVolVal < 0.3) longScore++;
      if (maxDDVal > -0.2) longScore++;
      if (rangeChgVal > 0) longScore++;
      let shortScore = 0;
      if (ma5 > ma20) shortScore++;
      if (macdHistVal > 0) shortScore++;
      if (rsiVal >= 30 && rsiVal <= 70) shortScore++;
      if (rsiVal < 30) shortScore++;
      const longAdvice = longScore >= 3;
      const shortAdvice = shortScore >= 2;
      let adviceText = '建议观望';
      let adviceTagType = 'info';
      if (longAdvice && shortAdvice) { adviceText = '长期短期均可持有'; adviceTagType = 'success'; }
      else if (longAdvice) { adviceText = '建议长期持有'; adviceTagType = 'success'; }
      else if (shortAdvice) { adviceText = '建议短期持有'; adviceTagType = 'warning'; }
      this.stats = {
        rangeChgPct: rangeChgVal,
        high: Math.max(...closes), low: Math.min(...closes),
        mean, std,
        annVol: annVolVal,
        maxDD: maxDDVal,
        volRatio,
        ma5, ma20,
        rsi: rsiVal,
        macd: { dif: or(macd.dif[n - 1], 0), dea: or(macd.dea[n - 1], 0), hist: macdHistVal },
        boll: { upper: or(boll.upper[n - 1], last), mid: or(boll.mid[n - 1], last), lower: or(boll.lower[n - 1], last) },
        trend,
        /* 集中趋势 */
        median: median(closes),
        mode: calcMode(closes),
        /* 离散程度 */
        range: Math.max(...closes) - Math.min(...closes),
        iqr: quantile(closes, 0.75) - quantile(closes, 0.25),
        mad: meanAbsDev(closes, mean),
        variance: std * std,
        /* 分布形态 */
        skew: calcSkewness(closes),
        kurt: calcKurtosis(closes),
        /* 矩阵分析 */
        matrix: calcMatrix(candles),
        /* 数学分析 · 长短期持有建议 */
        longScore, shortScore,
        longAdvice, shortAdvice,
        adviceText, adviceTagType,
      };
      anime({
        targets: '.stat, .ind-table tr', opacity: [0, 1], translateY: [6, 0],
        delay: anime.stagger(24), duration: 420, easing: 'easeOutQuad',
      });
    },

    async loadNews(symbol) {
      this.newsLoading = true;
      try {
        const data = await this.fetchJSON('/api/search?q=' + encodeURIComponent(symbol) + '&newsCount=10&quotesCount=2');
        this.news = (data.news || []).filter(n => n.title && n.link).slice(0, 10);
      } finally {
        this.newsLoading = false;
      }
    },

    onPeriodChange(key) {
      if (this.period !== key) this.period = key;
      if (this.current) this.loadChart(this.current.symbol, key).catch(e => console.error(e));
    },

    onDrawerSelect(symbol) {
      this.menuDrawer = false;
      this.select(symbol);
    },
  },

  mounted() {
    this.select(HOT_CN[0]);
  },
});

app.use(ElementPlus);
app.mount('#app');
