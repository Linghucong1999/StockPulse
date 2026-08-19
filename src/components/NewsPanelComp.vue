<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  news: { type: Array, default: () => [] },
  symbol: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

const drawer = ref(false)
const current = ref(null)
const content = ref([])
const translated = ref([])
const loadingContent = ref(false)
const translating = ref(false)
const error = ref('')
const showOriginal = ref(false)
let _seq = 0
const _cache = {}

function open(n) {
  current.value = n
  drawer.value = true
  loadContent()
}

async function loadContent() {
  if (!current.value || !current.value.link) return
  const seq = ++_seq
  loadingContent.value = true
  error.value = ''
  content.value = []
  translated.value = []
  translating.value = false
  showOriginal.value = false
  const link = current.value.link
  if (_cache[link]) {
    content.value = _cache[link].content || []
    translated.value = _cache[link].translated || []
    loadingContent.value = false
    return
  }
  try {
    const res = await fetch('/api/news-content?url=' + encodeURIComponent(link))
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const d = await res.json()
    if (d.error) throw new Error(d.error)
    if (seq !== _seq) return
    content.value = d.content || []
  } catch (e) {
    if (seq !== _seq) return
    error.value = '本站暂无法加载该新闻内容：' + e.message
  } finally {
    if (seq === _seq) loadingContent.value = false
  }
  if (content.value.length && seq === _seq) translateAll(seq)
}

async function translateAll(seq) {
  translating.value = true
  const result = new Array(content.value.length).fill('')
  const batch = 5
  for (let start = 0; start < content.value.length; start += batch) {
    const end = Math.min(start + batch, content.value.length)
    await Promise.all(content.value.slice(start, end).map(async (p, i) => {
      const idx = start + i
      try {
        const res = await fetch('/api/translate?text=' + encodeURIComponent(p))
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const d = await res.json()
        result[idx] = (d && d.translated) || ''
      } catch (e) {
        result[idx] = ''
      }
    }))
    if (seq !== _seq) return
    translated.value = result.slice()
  }
  translating.value = false
  _cache[current.value.link] = { content: content.value.slice(), translated: translated.value.slice() }
}

function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="news-panel" id="news">
    <div class="panel-title">公司新闻 · {{ symbol }}</div>
    <div v-if="loading" class="news-empty">加载新闻中…</div>
    <el-empty v-else-if="!news.length" description="暂无相关新闻" :image-size="60" />
    <div v-for="n in news" :key="n.link" class="news-item" @click="open(n)">
      <div class="news-title">{{ n.title }}</div>
      <div class="news-meta">{{ n.publisher }} · {{ fmtTime(n.providerPublishTime) }}</div>
      <div class="news-open">点击查看 →</div>
    </div>

    <el-drawer v-model="drawer" title="新闻详情" direction="rtl" size="520px" class="news-drawer">
      <template v-if="current">
        <div class="nd-inner">
          <h3 class="nd-title">{{ current.title }}</h3>
          <div class="nd-meta">{{ current.publisher }} · {{ fmtTime(current.providerPublishTime) }}</div>

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
</template>
