/* Aside 组件：el-row/el-col 包装 + el-menu 导航菜单（el-sub-menu 分组：A股/美股/港股/搜索结果） */
const AsideComp = {
  name: 'AsideComp',
  props: {
    hotCn: { type: Array, default: () => [] },
    hotUs: { type: Array, default: () => [] },
    hotHk: { type: Array, default: () => [] },
    results: { type: Array, default: () => [] },
    activeSymbol: { type: String, default: '' },
  },
  emits: ['select'],
  methods: {
    stockName(sym) { return STOCK_NAMES[sym] || ''; },
    enName(sym) { return STOCK_EN_NAMES[sym] || ''; },
    onMenuSelect(index) { this.$emit('select', index); },
  },
  template: `
    <el-row class="side-row">
      <el-col :span="24">
        <div class="side-card">
          <div class="side-title">股票列表</div>
          <el-menu
            :default-active="activeSymbol"
            :default-openeds="['cn', 'us', 'hk']"
            class="el-menu-vertical-demo stock-menu"
            @select="onMenuSelect">

            <!-- A股 -->
            <el-sub-menu index="cn">
              <template #title>
                <span class="sub-title">A股</span>
              </template>
              <el-menu-item-group title="A股">
                <el-menu-item v-for="s in hotCn" :key="s" :index="s">
                  <div class="mi-wrap">
                    <div class="mi-line1">
                      <span class="sname">{{ stockName(s) }}</span>
                      <span class="ticker">{{ s }}</span>
                    </div>
                    <div class="sen">{{ enName(s) }}</div>
                  </div>
                </el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>

            <!-- 美股 -->
            <el-sub-menu index="us">
              <template #title>
                <span class="sub-title">美股</span>
              </template>
              <el-menu-item-group title="美股">
                <el-menu-item v-for="s in hotUs" :key="s" :index="s">
                  <div class="mi-wrap">
                    <div class="mi-line1">
                      <span class="sname">{{ stockName(s) }}</span>
                      <span class="ticker">{{ s }}</span>
                    </div>
                    <div class="sen">{{ enName(s) }}</div>
                  </div>
                </el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>

            <!-- 港股 -->
            <el-sub-menu index="hk">
              <template #title>
                <span class="sub-title">港股</span>
              </template>
              <el-menu-item-group title="港股">
                <el-menu-item v-for="s in hotHk" :key="s" :index="s">
                  <div class="mi-wrap">
                    <div class="mi-line1">
                      <span class="sname">{{ stockName(s) }}</span>
                      <span class="ticker">{{ s }}</span>
                    </div>
                    <div class="sen">{{ enName(s) }}</div>
                  </div>
                </el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>

            <!-- 搜索结果 -->
            <el-sub-menu v-if="results.length" index="results">
              <template #title>
                <span class="sub-title">搜索结果</span>
              </template>
              <el-menu-item-group title="搜索结果">
                <el-menu-item v-for="r in results" :key="r.symbol" :index="r.symbol">
                  <div class="mi-wrap">
                    <div class="mi-line1">
                      <span class="sname">{{ stockName(r.symbol) || r.shortname }}</span>
                      <span class="ticker">{{ r.symbol }}</span>
                    </div>
                    <div class="sen">{{ stockName(r.symbol) ? r.shortname : '' }}</div>
                  </div>
                </el-menu-item>
              </el-menu-item-group>
            </el-sub-menu>

          </el-menu>
        </div>
      </el-col>
    </el-row>
  `,
};
