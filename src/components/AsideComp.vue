<script setup>
import { stockName, enName } from '../utils/search'

defineProps({
  hotCn: { type: Array, default: () => [] },
  hotUs: { type: Array, default: () => [] },
  hotHk: { type: Array, default: () => [] },
  results: { type: Array, default: () => [] },
  activeSymbol: { type: String, default: '' },
})
const emit = defineEmits(['select'])
function onMenuSelect(index) { emit('select', index) }
</script>

<template>
  <el-row class="side-row">
    <el-col :span="24">
      <div class="side-card">
        <div class="side-title">股票列表</div>
        <el-menu :default-active="activeSymbol" :default-openeds="['cn', 'us', 'hk']"
                 class="el-menu-vertical-demo stock-menu" @select="onMenuSelect">
          <el-sub-menu index="cn">
            <template #title><span class="sub-title">A股</span></template>
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
          <el-sub-menu index="us">
            <template #title><span class="sub-title">美股</span></template>
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
          <el-sub-menu index="hk">
            <template #title><span class="sub-title">港股</span></template>
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
          <el-sub-menu v-if="results.length" index="results">
            <template #title><span class="sub-title">搜索结果</span></template>
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
</template>
