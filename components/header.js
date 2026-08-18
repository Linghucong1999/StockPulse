/* Header 组件：品牌 + 导航链接 + 移动端菜单按钮（搜索框已移至 Hero 区） */
const HeaderComp = {
  name: 'HeaderComp',
  emits: ['toggle-menu'],
  template: `
    <div class="nav-inner">
      <div class="brand">
        <span class="brand-dot"></span>
        <span class="brand-name">StockPulse</span>
        <span class="brand-sub">股票分析</span>
      </div>
      <div class="nav-menu">
        <a class="nav-link active" href="#market">行情</a>
        <a class="nav-link" href="#stats">统计</a>
        <a class="nav-link" href="#news">新闻</a>
      </div>
      <el-button class="menu-btn" @click="$emit('toggle-menu')">☰ 菜单</el-button>
    </div>
  `,
};
