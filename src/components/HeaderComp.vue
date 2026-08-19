<script setup>
defineEmits(['toggle-menu'])
</script>

<template>
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
</template>
