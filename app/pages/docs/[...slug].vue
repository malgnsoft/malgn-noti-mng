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

// 서버 API 경유로 콘텐츠 D1 조회 — 클라이언트 queryCollection 의 네비 시 빈 결과 문제 회피.
const { data: docRes } = await useFetch('/api/doc', {
  query: { path: contentPath },
  key: 'doc:' + contentPath.value,
})
const doc = computed(() => docRes.value?.data ?? null)

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
/* 마크다운 prose 스타일은 전역(app/assets/css/prose.css)에 정의 —
   프리렌더 문서 페이지가 scoped CSS 청크를 링크하지 않아 적용 안 되던 문제 회피. */
</style>
