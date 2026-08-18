/* Main 组件：Hero + 股票详情（统计/K线/新闻）+ 空状态 + 页脚 */
const MainComp = {
  name: 'MainComp',
  components: { NewsPanelComp },
  props: {
    current: { type: Object, default: null },
    meta: { type: Object, default: () => ({}) },
    candles: { type: Array, default: () => [] },
    period: { type: String, default: '1d' },
    periods: { type: Array, default: () => [] },
    stats: { type: Object, default: () => ({}) },
    news: { type: Array, default: () => [] },
    newsLoading: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    query: { type: String, default: '' },
    hotCn: { type: Array, default: () => [] },
    hotUs: { type: Array, default: () => [] },
    hotHk: { type: Array, default: () => [] },
  },
  emits: ['update:query', 'search', 'select', 'period-change'],
  data() {
    return {
      chart: null, histChart: null, corrChart: null, histBins: 20,
    };
  },
  computed: {
    dayChange() {
      const p = this.meta.regularMarketPrice, prev = this.meta.chartPreviousClose;
      if (p == null || prev == null || prev === 0) return 0;
      return p - prev;
    },
    dayChangePct() {
      const prev = this.meta.chartPreviousClose;
      if (!prev) return 0;
      return (this.dayChange / prev) * 100;
    },
    chgCls() {
      const d = this.dayChange;
      return d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
    },
    trendTagType() {
      return { '上升趋势': 'danger', '下降趋势': 'success', '震荡整理': 'info' }[this.stats.trend] || 'info';
    },
    rangeLabel() { return PERIODS[this.period].range; },
  },
  watch: {
    candles() { this.renderChart(); this.renderHistogram(); this.renderCorrHeatmap(); },
  },
  methods: {
    fmt(v) {
      if (v == null || isNaN(v)) return '—';
      return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    fmtSigned(v) {
      if (v == null || isNaN(v)) return '—';
      const s = v > 0 ? '+' : '';
      return s + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    fmtPct(v) {
      if (v == null || isNaN(v)) return '—';
      return (v * 100).toFixed(2) + '%';
    },
    fmtVol(v) {
      if (v == null || isNaN(v)) return '—';
      if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿';
      if (v >= 1e4) return (v / 1e4).toFixed(2) + '万';
      return String(v);
    },
    fmtTime(ts) {
      if (!ts) return '';
      const d = new Date(ts * 1000);
      return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    },
    maCls(n) { return (this.stats['ma' + n] || 0) >= (this.meta.regularMarketPrice || 0) ? 'down' : 'up'; },
    signCls(v) { return v > 0 ? 'up' : v < 0 ? 'down' : 'flat'; },
    rsiCls() { const r = this.stats.rsi; return r > 70 ? 'up' : r < 30 ? 'down' : 'flat'; },
    exchName(exch) {
      return ({
        'NMS': '纳斯达克', 'NGS': '纳斯达克', 'NASDAQ': '纳斯达克',
        'NYQ': '纽约证券交易所', 'NYSE': '纽约证券交易所', 'ASE': '美国证券交易所',
        'HKG': '香港交易所', 'HKSE': '香港交易所', 'PNK': '场外交易(OTC)',
        'SHH': '上海证券交易所', 'SSH': '上海证券交易所', 'SHZ': '深圳证券交易所', 'SHE': '深圳证券交易所',
        'MEX': '墨西哥证券交易所', 'LSE': '伦敦证券交易所', 'TSE': '东京证券交易所',
        'TOR': '多伦多证券交易所', 'FRA': '法兰克福证券交易所', 'KSC': '韩国交易所',
      })[exch] || exch;
    },
    curName(cur) {
      return ({ 'USD': '美元', 'HKD': '港币', 'CNY': '人民币', 'EUR': '欧元', 'JPY': '日元', 'GBP': '英镑' })[cur] || cur;
    },
    stockName(sym) { return STOCK_NAMES[sym] || ''; },
    fieldName(i) { return ['开', '高', '低', '收', '量'][i] || ''; },
    fmtCorr(v) {
      if (v == null || isNaN(v)) return '—';
      return v.toFixed(2);
    },
    fmtCompact(v) {
      if (v == null || isNaN(v)) return '—';
      const a = Math.abs(v);
      if (a >= 1e8) return (v / 1e8).toFixed(1) + '亿';
      if (a >= 1e4) return (v / 1e4).toFixed(1) + '万';
      return v.toFixed(1);
    },
    querySuggestions(queryString, cb) {
      cb(searchLocal(queryString).slice(0, 8).map(x => ({
        value: x.cn || x.en || x.code,
        code: x.code,
        cn: x.cn,
        en: x.en,
      })));
    },
    onSelect(item) {
      this.$emit('update:query', item.value);
      this.$emit('select', item.code);
    },
    renderChart() {
      const candles = this.candles;
      if (!candles.length) return;
      const el = document.getElementById('kchart');
      if (!this.chart) this.chart = echarts.init(el);
      const dates = candles.map(x => {
        const d = new Date(x.t);
        return this.period === '60m'
          ? d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
          : d.toLocaleDateString('zh-CN');
      });
      const kData = candles.map(x => [x.o, x.c, x.l, x.h]);
      const vols = candles.map(x => x.v);
      const closes = candles.map(x => x.c);
      const ma5 = sma(closes, 5), ma20 = sma(closes, 20), ma60 = sma(closes, 60);
      const macd = calcMACD(closes);

      this.chart.setOption({
        animationDuration: 400,
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis', axisPointer: { type: 'cross' },
          backgroundColor: '#1b1b2e', borderColor: 'rgba(255,255,255,0.1)',
          textStyle: { color: '#f4f4f8' },
          formatter: (params) => {
            const p = params[0];
            const d = new Date(candles[p.dataIndex].t).toLocaleString('zh-CN');
            let s = `<b>${d}</b><br/>`;
            for (const item of params) {
              if (item.seriesType === 'candlestick') {
                const k = candles[item.dataIndex];
                s += `开盘 ${k.o.toFixed(2)}　收盘 <b>${k.c.toFixed(2)}</b><br/>最高 ${k.h.toFixed(2)}　最低 ${k.l.toFixed(2)}<br/>成交量 ${this.fmtVol(k.v)}`;
              } else if (item.seriesType === 'line' && item.seriesName !== 'MACD') {
                s += `${item.seriesName} ${item.value.toFixed(2)}<br/>`;
              }
            }
            return s;
          },
        },
        legend: { show: false },
        axisPointer: { link: [{ xAxisIndex: 'all' }] },
        grid: [
          { left: 62, right: 16, top: 16, height: '58%' },
          { left: 62, right: 16, top: '72%', height: '12%' },
          { left: 62, right: 16, top: '87%', height: '9%' },
        ],
        xAxis: [
          { type: 'category', data: dates, boundaryGap: true, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } }, axisLabel: { color: '#9a9ab0', fontSize: 11 } },
          { type: 'category', gridIndex: 1, data: dates, axisLabel: { show: false }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisTick: { show: false } },
          { type: 'category', gridIndex: 2, data: dates, axisLabel: { color: '#9a9ab0', fontSize: 11 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisTick: { show: false } },
        ],
        yAxis: [
          { scale: true, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }, axisLabel: { color: '#9a9ab0', fontSize: 11 } },
          { gridIndex: 1, splitLine: { show: false }, axisLabel: { show: false } },
          { gridIndex: 2, splitLine: { show: false }, axisLabel: { color: '#9a9ab0', fontSize: 10 } },
        ],
        dataZoom: [
          { type: 'inside', xAxisIndex: [0, 1, 2], start: 55, end: 100 },
          { type: 'slider', xAxisIndex: [0, 1, 2], bottom: 4, height: 16, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: '#12121c', fillerColor: 'rgba(124,92,252,0.25)', textStyle: { color: '#9a9ab0' } },
        ],
        series: [
          {
            name: 'K线', type: 'candlestick', data: kData,
            itemStyle: { color: C_UP, color0: C_DOWN, borderColor: C_UP, borderColor0: C_DOWN },
          },
          { name: '均线MA5', type: 'line', data: ma5, smooth: true, showSymbol: false, lineStyle: { width: 1, color: C_MA5 } },
          { name: '均线MA20', type: 'line', data: ma20, smooth: true, showSymbol: false, lineStyle: { width: 1, color: C_MA20 } },
          { name: '均线MA60', type: 'line', data: ma60, smooth: true, showSymbol: false, lineStyle: { width: 1, color: C_MA60 } },
          {
            name: '成交量', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: vols,
            itemStyle: { color: (p) => candles[p.dataIndex].c >= candles[p.dataIndex].o ? 'rgba(255,77,106,0.55)' : 'rgba(46,204,113,0.55)' },
          },
          {
            name: 'MACD', type: 'bar', xAxisIndex: 2, yAxisIndex: 2,
            data: macd.hist.map((v) => ({ value: v, itemStyle: { color: v >= 0 ? 'rgba(255,77,106,0.7)' : 'rgba(46,204,113,0.7)' } })),
            barWidth: '60%',
          },
        ],
      }, { notMerge: true });
    },

    /* 价格分布直方图（数形结合：分布 + 均值/中位数/众数彩色标注） */
    renderHistogram() {
      const closes = this.candles.map(x => x.c);
      if (!closes.length) return;
      const el = document.getElementById('hist');
      if (!this.histChart) this.histChart = echarts.init(el);
      const bins = this.histBins;
      const min = Math.min(...closes), max = Math.max(...closes);
      const w = (max - min) / bins || 1;
      const counts = new Array(bins).fill(0);
      for (const c of closes) {
        let idx = Math.floor((c - min) / w);
        if (idx >= bins) idx = bins - 1;
        counts[idx]++;
      }
      const labels = counts.map((_, i) => (min + w * (i + 0.5)).toFixed(0));
      const binOf = (v) => Math.max(0, Math.min(bins - 1, Math.floor((v - min) / w)));
      /* 彩色标注线：均值(黄) / 中位数(蓝)；众数改为柱体上方显示 */
      const fmtShort = (v) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1));
      const statDefs = [
        { v: this.stats.mean, name: '均值', color: '#f5c542', pos: 'end' },
        { v: this.stats.median, name: '中位数', color: '#4fc3f7', pos: 'start' },
      ];
      const markData = statDefs.filter(d => d.v != null && !isNaN(d.v)).map(d => ({
        xAxis: binOf(d.v),
        name: d.name + ' ' + fmtShort(d.v),
        lineStyle: { color: d.color, width: 1, type: 'dashed' },
        label: {
          color: d.color, fontSize: 10,
          formatter: '{b}', position: d.pos,
          rotate: 0, overflow: 'none', width: undefined,
        },
      }));
      /* 众数所在柱体：紫色高亮 + 柱体上方显示标签 */
      const modeIdx = (this.stats.mode != null && !isNaN(this.stats.mode)) ? binOf(this.stats.mode) : -1;
      const barData = counts.map((c, i) => ({
        value: c,
        itemStyle: i === modeIdx ? { color: 'rgba(171,140,255,0.95)', borderRadius: [3, 3, 0, 0] } : undefined,
      }));
      this.histChart.setOption({
        animationDuration: 400,
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: '#1b1b2e', borderColor: 'rgba(255,255,255,0.1)',
          textStyle: { color: '#f4f4f8' },
          formatter: (p) => {
            const x = labels[p.dataIndex] != null ? labels[p.dataIndex] : (p.axisValueLabel || p.axisValue);
            return '<b>横轴(价格区间): ' + x + '</b><br/>纵轴(频数): ' + p.value;
          },
        },
        grid: { left: 44, right: 16, top: 24, bottom: 26 },
        xAxis: {
          type: 'category', data: labels,
          axisLabel: { color: '#9a9ab0', fontSize: 10, interval: Math.max(0, Math.ceil(bins / 10) - 1) },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
        },
        yAxis: {
          type: 'value', name: '频数',
          nameTextStyle: { color: '#9a9ab0', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
          axisLabel: { color: '#9a9ab0', fontSize: 10 },
        },
        series: [{
          type: 'bar', data: barData, barWidth: '70%',
          itemStyle: { color: 'rgba(124,92,252,0.65)', borderRadius: [3, 3, 0, 0] },
          emphasis: { itemStyle: { color: 'rgba(124,92,252,1)' } },
          label: {
            show: true,
            position: 'top',
            color: '#ab8cff', fontSize: 10, fontWeight: 600,
            formatter: (p) => (p.dataIndex === modeIdx ? '众数 ' + fmtShort(this.stats.mode) : ''),
          },
          markLine: {
            silent: true, symbol: 'none',
            data: markData,
          },
        }],
      }, { notMerge: true });
    },

    /* 相关系数热力图（-1 绿 → 0 深 → +1 红） */
    renderCorrHeatmap() {
      const corr = this.stats.matrix.corr;
      if (!corr || !corr.length) return;
      const el = document.getElementById('corr-heat');
      if (!this.corrChart) this.corrChart = echarts.init(el);
      const fields = ['开', '高', '低', '收', '量'];
      const data = [];
      for (let i = 0; i < corr.length; i++) {
        for (let j = 0; j < corr[i].length; j++) {
          data.push([j, i, corr[i][j]]);
        }
      }
      /* 颜色与网站涨跌色绑定：正相关(同涨同跌)=涨色(红)，负相关=跌色(绿) */
      const rootStyle = getComputedStyle(document.documentElement);
      const upColor = (rootStyle.getPropertyValue('--up') || '#ff4d6a').trim();
      const downColor = (rootStyle.getPropertyValue('--down') || '#2ecc71').trim();
      this.corrChart.setOption({
        animationDuration: 400,
        backgroundColor: 'transparent',
        tooltip: {
          position: 'top',
          backgroundColor: '#1b1b2e', borderColor: 'rgba(255,255,255,0.1)',
          textStyle: { color: '#f4f4f8' },
          formatter: (p) => fields[p.value[1]] + ' × ' + fields[p.value[0]] + '：' + p.value[2].toFixed(2),
        },
        grid: { left: 34, right: 10, top: 10, bottom: 40 },
        xAxis: {
          type: 'category', data: fields,
          axisLabel: { color: '#9a9ab0', fontSize: 10 },
          splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] } },
        },
        yAxis: {
          type: 'category', data: fields,
          axisLabel: { color: '#9a9ab0', fontSize: 10 },
          splitArea: { show: true, areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] } },
        },
        visualMap: {
          min: -1, max: 1, calculable: false,
          orient: 'horizontal', left: 'center', bottom: 0,
          itemWidth: 8, itemHeight: 80,
          textStyle: { color: '#9a9ab0', fontSize: 10 },
          inRange: { color: [downColor, '#12121c', upColor] },   /* 色阶：绿(-1) → 深色(0) → 红(+1)，绿红与股票涨跌色绑定 */
        },
        series: [{
          type: 'heatmap', data,
          label: { show: true, color: '#f4f4f8', fontSize: 10, formatter: (p) => p.value[2].toFixed(2) },
          itemStyle: { borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1 },
        }],
      }, { notMerge: true });
    },
  },
  mounted() {
    anime({
      targets: '.hero-title, .hero-sub, .hero-search', opacity: [0, 1], translateY: [18, 0],
      delay: anime.stagger(120), duration: 650, easing: 'easeOutCubic',
    });
    this._onResize = () => {
      if (this.chart) this.chart.resize();
      if (this.histChart) this.histChart.resize();
      if (this.corrChart) this.corrChart.resize();
    };
    window.addEventListener('resize', this._onResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this._onResize);
    if (this.chart) { this.chart.dispose(); this.chart = null; }
    if (this.histChart) { this.histChart.dispose(); this.histChart = null; }
    if (this.corrChart) { this.corrChart.dispose(); this.corrChart = null; }
  },
  template: `
    <div class="main-scroll">

      <!-- Hero -->
      <section class="hero">
        <h1 class="hero-title">洞察每一只股票的<span class="accent">趋势</span></h1>
        <p class="hero-sub">港美股行情 · K 线分析 · 统计学证据 · 公司新闻，一站尽览</p>
        <div class="hero-search">
          <el-autocomplete
            :model-value="query"
            :fetch-suggestions="querySuggestions"
            placeholder="输入中文名/代码/拼音，例如 茅台 / 600519 / maotai / AAPL"
            clearable
            popper-class="stock-suggest"
            @select="onSelect"
            @update:model-value="$emit('update:query', $event)"
            @keyup.enter="$emit('search')">
            <template #default="{ item }">
              <div class="sug-item">
                <span class="sug-cn">{{ item.cn || item.en }}</span>
                <span class="sug-code">{{ item.code }}</span>
              </div>
            </template>
          </el-autocomplete>
          <el-button type="primary" size="large" @click="$emit('search')">开始分析</el-button>
        </div>
      </section>

      <!-- 已选股票：详情 -->
      <template v-if="current">
        <div v-loading="loading">
          <div class="stock-head" id="market">
            <div>
              <div class="stock-name">{{ stockName(meta.symbol) || meta.longName || meta.shortName || meta.symbol }}
                <span v-if="stockName(meta.symbol) && (meta.longName || meta.shortName)" class="stock-en">{{ meta.longName || meta.shortName }}</span>
                <span class="stock-symbol">{{ meta.symbol }} · {{ exchName(meta.exchangeName) }}</span>
              </div>
              <div class="price-line">
                <span class="price" :class="chgCls">{{ fmt(meta.regularMarketPrice) }}</span>
                <span class="chg" :class="chgCls">{{ fmtSigned(dayChange) }} ({{ fmtPct(dayChangePct) }})</span>
                <span class="cur">{{ curName(meta.currency) }}</span>
              </div>
            </div>
            <div class="head-stats">
              <div class="hs-item"><label>今开</label><b>{{ fmt(meta.regularMarketOpen) }}</b></div>
              <div class="hs-item"><label>最高</label><b class="up">{{ fmt(meta.regularMarketDayHigh) }}</b></div>
              <div class="hs-item"><label>最低</label><b class="down">{{ fmt(meta.regularMarketDayLow) }}</b></div>
              <div class="hs-item"><label>成交量</label><b>{{ fmtVol(meta.regularMarketVolume) }}</b></div>
              <div class="hs-item"><label>昨收</label><b>{{ fmt(meta.chartPreviousClose) }}</b></div>
            </div>
          </div>

          <!-- 统计学板块（数据 + 数形结合图表） -->
          <div class="stats-section" id="stats">
            <div class="panel-title">统计学证据</div>
            <div class="stats-row">
              <div class="stat-col">
                <div class="group-label">区间统计<span class="range-tag">{{ rangeLabel }}</span></div>
                <div class="stat"><label>区间涨跌</label><b :class="chgCls">{{ fmtSigned(stats.rangeChgPct) }}%</b></div>
                <div class="stat"><label>区间最高</label><b>{{ fmt(stats.high) }}</b></div>
                <div class="stat"><label>区间最低</label><b>{{ fmt(stats.low) }}</b></div>
                <div class="stat"><label>年化波动率</label><b>{{ fmtPct(stats.annVol) }}</b></div>
                <div class="stat"><label>最大回撤</label><b class="down">{{ fmtPct(stats.maxDD) }}</b></div>
                <div class="stat"><label>量比(当日/区间均)</label><b>{{ stats.volRatio.toFixed(2) }}</b></div>
              </div>
              <div class="stat-col">
                <div class="group-label">集中趋势</div>
                <div class="stat"><label>均值</label><b>{{ fmt(stats.mean) }}</b></div>
                <div class="stat"><label>中位数</label><b>{{ fmt(stats.median) }}</b></div>
                <div class="stat"><label>众数</label><b>{{ fmt(stats.mode) }}</b></div>
                <div class="group-label">分布形态</div>
                <div class="stat"><label>偏度</label><b>{{ fmt(stats.skew) }}</b></div>
                <div class="stat"><label>峰度(超额)</label><b>{{ fmt(stats.kurt) }}</b></div>
              </div>
              <div class="stat-col">
                <div class="group-label">离散程度</div>
                <div class="stat"><label>极差</label><b>{{ fmt(stats.range) }}</b></div>
                <div class="stat"><label>四分位差</label><b>{{ fmt(stats.iqr) }}</b></div>
                <div class="stat"><label>平均绝对偏差</label><b>{{ fmt(stats.mad) }}</b></div>
                <div class="stat"><label>方差</label><b>{{ fmt(stats.variance) }}</b></div>
                <div class="stat"><label>标准差</label><b>{{ fmt(stats.std) }}</b></div>
              </div>
              <div class="stat-col">
                <div class="group-label">技术指标</div>
                <table class="ind-table">
                  <tr><td><el-tooltip content="MA5 为 5 日简单移动平均线（短期趋势），MA20 为 20 日均线（中期趋势）。价格在均线上方运行偏强，下方偏弱；MA5 上穿 MA20 为金叉（看多），下穿为死叉（看空）。" placement="top"><span class="ind-name">均线 MA5 / MA20</span></el-tooltip></td><td :class="maCls(5)">{{ fmt(stats.ma5) }} <span class="dim">/</span> <span :class="maCls(20)">{{ fmt(stats.ma20) }}</span></td></tr>
                  <tr><td><el-tooltip content="RSI（相对强弱指标）衡量近期涨跌动能，取值 0-100。通常 &gt;70 视为超买（回调风险），&lt;30 视为超卖（反弹机会）。" placement="top"><span class="ind-name">RSI 相对强弱(14)</span></el-tooltip></td><td :class="rsiCls">{{ stats.rsi.toFixed(2) }}</td></tr>
                  <tr><td><el-tooltip content="DIF = 快线 EMA12 − 慢线 EMA26，反映趋势动能方向。DIF &gt; 0 表示中期多头，&lt; 0 为空头。" placement="top"><span class="ind-name">MACD 差离值(DIF)</span></el-tooltip></td><td :class="signCls(stats.macd.dif)">{{ fmt(stats.macd.dif) }}</td></tr>
                  <tr><td><el-tooltip content="DEA 为 DIF 的 9 日平滑均线（信号线）。DIF 上穿 DEA 为金叉（买入信号），下穿为死叉（卖出信号）。" placement="top"><span class="ind-name">MACD 信号线(DEA)</span></el-tooltip></td><td :class="signCls(stats.macd.dea)">{{ fmt(stats.macd.dea) }}</td></tr>
                  <tr><td><el-tooltip content="MACD 柱 = 2 × (DIF − DEA)，柱 &gt; 0 表示多头动能增强，&lt; 0 为空头动能增强；柱由负转正常视为趋势转强信号。" placement="top"><span class="ind-name">MACD 柱</span></el-tooltip></td><td :class="signCls(stats.macd.hist)">{{ fmt(stats.macd.hist) }}</td></tr>
                  <tr><td><el-tooltip content="布林带上轨 = 中轨 + 2 倍标准差。价格触及或突破上轨通常意味着短期超买。" placement="top"><span class="ind-name">布林带(BOLL) 上轨</span></el-tooltip></td><td>{{ fmt(stats.boll.upper) }}</td></tr>
                  <tr><td><el-tooltip content="布林带中轨 = 20 日均线，构成趋势参考线。" placement="top"><span class="ind-name">布林带(BOLL) 中轨</span></el-tooltip></td><td>{{ fmt(stats.boll.mid) }}</td></tr>
                  <tr><td><el-tooltip content="布林带下轨 = 中轨 − 2 倍标准差。价格触及或跌破下轨通常意味着短期超卖。" placement="top"><span class="ind-name">布林带(BOLL) 下轨</span></el-tooltip></td><td>{{ fmt(stats.boll.lower) }}</td></tr>
                  <tr><td><el-tooltip content="综合短期均线（MA5/MA20）与 MACD 动能得出的趋势方向：上升 / 下降 / 震荡整理。" placement="top"><span class="ind-name">趋势判定</span></el-tooltip></td><td><el-tag :type="trendTagType" size="small" effect="dark">{{ stats.trend }}</el-tag></td></tr>
                </table>
              </div>
            </div>

            <div class="stats-lower">
              <div class="stats-matrix-col">
                <div class="group-label">矩阵分析 · 相关系数（热力图）</div>
                <div id="corr-heat" class="corr-heat"></div>
                <div class="group-label">矩阵分析 · 协方差</div>
                <table class="matrix-table">
                  <tr><th></th><th>开</th><th>高</th><th>低</th><th>收</th><th>量</th></tr>
                  <tr v-for="(row, i) in stats.matrix.cov" :key="'cv' + i">
                    <th>{{ fieldName(i) }}</th>
                    <td v-for="(v, j) in row" :key="'v' + i + '-' + j">{{ fmtCompact(v) }}</td>
                  </tr>
                </table>
              </div>
              <div class="stats-hist-col">
                <div class="group-label">价格分布（数形结合）</div>
                <div class="hist-controls">
                  <span class="hist-label">分箱数 {{ histBins }}</span>
                  <el-slider v-model="histBins" :min="5" :max="50" :step="1" size="small" @change="renderHistogram" class="hist-slider" />
                </div>
                <div id="hist" class="hist-chart"></div>
                <div class="hist-note">均值(黄) / 中位数(蓝) 虚线标注；众数标注于柱体上方</div>
              </div>
            </div>
            <!-- 数学分析 · 长短期持有建议 -->
            <div class="advice-box">
              <div class="group-label">数学分析 · 持有建议</div>
              <div class="advice-row">
                <div class="advice-item">
                  <span class="advice-label">长期评分</span>
                  <span class="advice-score">{{ stats.longScore }}/4</span>
                  <el-tag :type="stats.longAdvice ? 'success' : 'info'" size="small" effect="dark">
                    {{ stats.longAdvice ? '适合长期持有' : '暂不建议长期' }}
                  </el-tag>
                </div>
                <div class="advice-item">
                  <span class="advice-label">短期评分</span>
                  <span class="advice-score">{{ stats.shortScore }}/4</span>
                  <el-tag :type="stats.shortAdvice ? 'warning' : 'info'" size="small" effect="dark">
                    {{ stats.shortAdvice ? '适合短期持有' : '暂不建议短期' }}
                  </el-tag>
                </div>
              </div>
              <div class="advice-final">
                <span>综合建议</span>
                <el-tag :type="stats.adviceTagType" size="large" effect="dark">{{ stats.adviceText }}</el-tag>
              </div>
              <div class="advice-note">长期评分(0-4)：中期趋势/波动率/回撤/区间涨跌；短期评分(0-4)：短均线/MACD/RSI。仅供参考，不构成投资建议</div>
            </div>
            <div class="stat-foot">指标基于当前周期 K 线数据实时计算</div>
          </div>

          <!-- K 线图（置于统计板块之下） -->
          <div class="chart-wrap">
            <div class="chart-tabs">
              <el-radio-group :model-value="period" size="small" @change="$emit('period-change', $event)">
                <el-radio-button v-for="p in periods" :key="p.key" :value="p.key">{{ p.label }}</el-radio-button>
              </el-radio-group>
            </div>
            <div id="kchart" class="kchart"></div>
            <div class="chart-note">
              <span class="legend ma5">均线MA5</span><span class="legend ma20">均线MA20</span>
              <span class="legend ma60">均线MA60</span><span class="legend vol">成交量</span>
            </div>
          </div>

          <!-- K 线图下方：公司新闻（站内查看） -->
          <NewsPanelComp :news="news" :symbol="meta.symbol" :loading="newsLoading" />
        </div>
      </template>

      <!-- 未选股票时的空状态 -->
      <template v-else>
        <section class="content empty-box">
          <el-empty description="选择一只股票开始分析">
            <p class="empty-tip">在上方搜索框输入代码或英文名（A股请用数字代码，如 <code>600519</code>、<code>300750</code>），或点击下方热门股票。</p>
            <div class="chips">
              <el-button v-for="s in hotCn" :key="s" round size="small" @click="$emit('select', s)">{{ s }}</el-button>
              <el-button v-for="s in hotUs" :key="s" round size="small" @click="$emit('select', s)">{{ s }}</el-button>
              <el-button v-for="s in hotHk" :key="s" round size="small" @click="$emit('select', s)">{{ s }}</el-button>
            </div>
          </el-empty>
        </section>
      </template>

      <footer class="footer">
        <div class="footer-inner">
          <span>© 2026 StockPulse · 数据来源 Yahoo Finance，仅供学习参考，不构成投资建议</span>
        </div>
      </footer>

    </div>
  `,
};
