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
</style>
