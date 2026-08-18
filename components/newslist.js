/* 新闻组件：公司新闻列表 + 点击在站内抽屉查看完整内容（不跳转 Yahoo） */
const NewsPanelComp = {
  name: 'NewsPanelComp',
  props: {
    news: { type: Array, default: () => [] },
    symbol: { type: String, default: '' },
    loading: { type: Boolean, default: false },
  },
  data() {
    return { drawer: false, current: null, content: [], loadingContent: false, error: '' };
  },
  methods: {
    open(n) {
      this.current = n;
      this.drawer = true;
      this.loadContent();
    },
    async loadContent() {
      if (!this.current || !this.current.link) return;
      this.loadingContent = true;
      this.error = '';
      this.content = [];
      try {
        const res = await fetch('/api/news-content?url=' + encodeURIComponent(this.current.link));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const d = await res.json();
        if (d.error) throw new Error(d.error);
        this.content = d.content || [];
      } catch (e) {
        this.error = '本站暂无法加载该新闻内容：' + e.message;
      } finally {
        this.loadingContent = false;
      }
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

      <!-- 站内新闻详情抽屉（展示完整内容，不跳转外部） -->
      <el-drawer v-model="drawer" title="新闻详情" direction="rtl" size="480px" class="news-drawer">
        <template v-if="current">
          <div class="nd-inner">
            <h3 class="nd-title">{{ current.title }}</h3>
            <div class="nd-meta">{{ current.publisher }} · {{ fmtTime(current.providerPublishTime) }}</div>
            <div v-if="loadingContent" class="nd-loading">正文加载中…</div>
            <div v-else-if="error" class="nd-error">{{ error }}</div>
            <div v-else-if="!content.length" class="nd-note">该新闻暂无正文内容</div>
            <div v-else class="nd-body">
              <p v-for="(p, i) in content" :key="i" class="nd-para">{{ p }}</p>
            </div>
          </div>
        </template>
      </el-drawer>
    </div>
  `,
};
