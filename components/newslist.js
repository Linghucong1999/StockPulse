/* 新闻组件：公司新闻列表 + 站内抽屉查看全文（自动翻译为中文，可切换原文） */
const NewsPanelComp = {
  name: 'NewsPanelComp',
  props: {
    news: { type: Array, default: () => [] },
    symbol: { type: String, default: '' },
    loading: { type: Boolean, default: false },
  },
  data() {
    return {
      drawer: false, current: null,
      content: [], translated: [], loadingContent: false, translating: false, error: '',
      showOriginal: false,
      _seq: 0,
      _cache: {},
    };
  },
  methods: {
    open(n) {
      this.current = n;
      this.drawer = true;
      this.loadContent();
    },
    async loadContent() {
      if (!this.current || !this.current.link) return;
      const seq = ++this._seq;
      this.loadingContent = true;
      this.error = '';
      this.content = [];
      this.translated = [];
      this.translating = false;
      this.showOriginal = false;
      const link = this.current.link;
      /* 缓存命中：直接使用已抓取与已翻译内容 */
      if (this._cache[link]) {
        this.content = this._cache[link].content || [];
        this.translated = this._cache[link].translated || [];
        this.loadingContent = false;
        return;
      }
      try {
        const res = await fetch('/api/news-content?url=' + encodeURIComponent(link));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const d = await res.json();
        if (d.error) throw new Error(d.error);
        if (seq !== this._seq) return;   /* 已切换新闻，丢弃过期结果 */
        this.content = d.content || [];
      } catch (e) {
        if (seq !== this._seq) return;
        this.error = '本站暂无法加载该新闻内容：' + e.message;
      } finally {
        if (seq === this._seq) this.loadingContent = false;
      }
      /* 加载完成后自动翻译为中文（并发分批 + 代际校验） */
      if (this.content.length && seq === this._seq) this.translateAll(seq);
    },
    async translateAll(seq) {
      this.translating = true;
      const result = new Array(this.content.length).fill('');
      const batch = 5;
      for (let start = 0; start < this.content.length; start += batch) {
        const end = Math.min(start + batch, this.content.length);
        await Promise.all(this.content.slice(start, end).map(async (p, i) => {
          const idx = start + i;
          try {
            const res = await fetch('/api/translate?text=' + encodeURIComponent(p));
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const d = await res.json();
            result[idx] = (d && d.translated) || '';
          } catch (e) {
            result[idx] = '';
          }
        }));
        if (seq !== this._seq) return;   /* 已切换新闻，丢弃过期译文 */
        this.translated = result.slice();
      }
      this.translating = false;
      /* 缓存：内容 + 译文，避免重复消耗配额 */
      this._cache[this.current.link] = {
        content: this.content.slice(),
        translated: this.translated.slice(),
      };
    },
    fmtTime(ts) {
      if (!ts) return '';
      const d = new Date(ts * 1000);
      return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    },
  },
  template: `
    <div class="news-panel" id="news">
      <div class="panel-title">公司新闻 · {{ symbol }}</div>
      <div v-if="loading" class="news-empty">加载新闻中…</div>
      <el-empty v-else-if="!news.length" description="暂无相关新闻" :image-size="60" />
      <div v-for="n in news" :key="n.link" class="news-item" @click="open(n)">
        <div class="news-title">{{ n.title }}</div>
        <div class="news-meta">{{ n.publisher }} · {{ fmtTime(n.providerPublishTime) }}</div>
        <div class="news-open">点击查看 →</div>
      </div>

      <!-- 站内新闻详情抽屉（全文自动翻译为中文） -->
      <el-drawer v-model="drawer" title="新闻详情" direction="rtl" size="520px" class="news-drawer">
        <template v-if="current">
          <div class="nd-inner">
            <h3 class="nd-title">{{ current.title }}</h3>
            <div class="nd-meta">{{ current.publisher }} · {{ fmtTime(current.providerPublishTime) }}</div>

            <!-- 译文/原文切换 -->
            <div v-if="content.length && !loadingContent" class="nd-tools">
              <el-radio-group v-model="showOriginal" size="small">
                <el-radio-button :value="false">中文译文</el-radio-button>
                <el-radio-button :value="true">英文原文</el-radio-button>
              </el-radio-group>
              <span v-if="translating" class="nd-translating">翻译中…</span>
            </div>

            <div v-if="loadingContent" class="nd-loading">正文加载中…</div>
            <div v-else-if="error" class="nd-error">{{ error }}</div>
            <div v-else-if="!content.length" class="nd-note">该新闻暂无正文内容</div>
            <div v-else class="nd-body">
              <template v-if="!showOriginal">
                <p v-if="translating && !translated.length" class="nd-para nd-dim">正在翻译全文…</p>
                <!-- 译文优先；翻译失败/未完成的段落回退显示原文 -->
                <p v-for="(p, i) in content" :key="i" class="nd-para">
                  {{ translated[i] || (translating ? '翻译中…' : p) }}
                </p>
              </template>
              <template v-else>
                <p v-for="(p, i) in content" :key="'o' + i" class="nd-para nd-dim">{{ p }}</p>
              </template>
            </div>
          </div>
        </template>
      </el-drawer>
    </div>
  `,
};
