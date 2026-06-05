<template>
  <div class="page">
    <NuxtLink :to="backTo" class="back">
      <UIcon name="i-lucide-arrow-left" class="back-ico" />
      {{ backLabel }}
    </NuxtLink>

    <article v-if="doc" class="prose-wrap">
      <ContentRenderer :value="doc" class="doc-prose" />
    </article>

    <UAlert
      v-else
      color="warning"
      variant="soft"
      title="문서를 찾을 수 없습니다"
      :description="`경로: ${contentPath}`"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const contentPath = computed(() => {
  const slug = route.params.slug
  const parts = Array.isArray(slug) ? slug : [slug]
  return '/' + parts.filter(Boolean).join('/')
})

const { data: doc } = await useAsyncData(
  () => 'doc:' + contentPath.value,
  () => queryCollection('docs').path(contentPath.value).first(),
  { watch: [contentPath] }
)

const isHist = computed(() => isHistory(contentPath.value))
const backTo = computed(() => (isHist.value ? '/history' : '/docs'))
const backLabel = computed(() => (isHist.value ? '작업 이력' : '문서'))

useHead(() => ({ title: doc.value?.title ?? '문서' }))
</script>

<style scoped>
.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;
  font-size: 13px;
  color: var(--ink-500);
}
.back:hover {
  color: var(--ink-900);
}
.back-ico {
  width: 15px;
  height: 15px;
}
.prose-wrap {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 40px 44px;
}

/* ── 마크다운 prose ── */
.doc-prose {
  font-size: 15px;
  line-height: 1.7;
  color: var(--ink-700);
  word-break: break-word;
}
.doc-prose :deep(> :first-child) { margin-top: 0; }
.doc-prose :deep(> :last-child) { margin-bottom: 0; }

.doc-prose :deep(h1),
.doc-prose :deep(h2),
.doc-prose :deep(h3),
.doc-prose :deep(h4),
.doc-prose :deep(h5),
.doc-prose :deep(h6) {
  color: var(--ink-900);
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
  scroll-margin-top: 72px;
}
.doc-prose :deep(h1) {
  font-size: 28px;
  margin: 0 0 24px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}
.doc-prose :deep(h2) {
  font-size: 21px;
  margin: 40px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}
.doc-prose :deep(h3) { font-size: 17px; margin: 32px 0 12px; }
.doc-prose :deep(h4) { font-size: 15px; margin: 24px 0 8px; }
.doc-prose :deep(h5),
.doc-prose :deep(h6) { font-size: 14px; margin: 20px 0 8px; color: var(--ink-700); }

.doc-prose :deep(p) { margin: 14px 0; }
.doc-prose :deep(strong) { font-weight: 600; color: var(--ink-900); }
.doc-prose :deep(em) { font-style: italic; }

.doc-prose :deep(a) {
  color: var(--accent-ink);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.doc-prose :deep(a:hover) { color: var(--ink-900); }

.doc-prose :deep(ul),
.doc-prose :deep(ol) {
  margin: 14px 0;
  padding-left: 24px;
}
.doc-prose :deep(ul) { list-style: disc; }
.doc-prose :deep(ol) { list-style: decimal; }
.doc-prose :deep(li) { margin: 6px 0; }
.doc-prose :deep(li::marker) { color: var(--ink-300); }
.doc-prose :deep(ul ul),
.doc-prose :deep(ul ol),
.doc-prose :deep(ol ul),
.doc-prose :deep(ol ol) { margin: 6px 0; }

/* 인라인 코드 */
.doc-prose :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.86em;
  background: var(--ink-50);
  color: var(--ink-800);
  padding: 2px 6px;
  border-radius: 5px;
  border: 1px solid var(--line);
  word-break: break-word;
}
/* 코드 블록 */
.doc-prose :deep(pre) {
  margin: 18px 0;
  padding: 16px 18px;
  background: var(--ink-900);
  color: #e4e4e7;
  border-radius: 10px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}
.doc-prose :deep(pre code) {
  background: transparent;
  border: 0;
  padding: 0;
  color: inherit;
  font-size: inherit;
}

/* 표 */
.doc-prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 18px 0;
  font-size: 14px;
  display: block;
  overflow-x: auto;
}
.doc-prose :deep(th),
.doc-prose :deep(td) {
  border: 1px solid var(--line);
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}
.doc-prose :deep(thead th) {
  background: var(--ink-50);
  font-weight: 600;
  color: var(--ink-800);
  white-space: nowrap;
}
.doc-prose :deep(tbody tr:nth-child(even)) { background: var(--paper); }

.doc-prose :deep(blockquote) {
  margin: 18px 0;
  padding: 4px 16px;
  border-left: 3px solid var(--ink-200);
  color: var(--ink-500);
}
.doc-prose :deep(blockquote p) { margin: 8px 0; }

.doc-prose :deep(hr) {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 32px 0;
}

.doc-prose :deep(img) { max-width: 100%; height: auto; border-radius: 8px; }

.doc-prose :deep(:not(pre) > code) { white-space: nowrap; }
</style>
