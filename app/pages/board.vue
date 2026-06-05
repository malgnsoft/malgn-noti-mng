<script setup lang="ts">
useHead({ title: '맑은노티 현황판' })

// 현황판 정본은 doc/BOARD.md (content path: /board). 단순화 카테고리 정의를 그대로 렌더.
const { data: doc } = await useAsyncData('board-doc', () =>
  queryCollection('docs').path('/board').first()
)
</script>

<template>
  <div class="board-page">
    <div class="board-bar">
      <span class="board-crumb">현황판</span>
      <a
        href="https://malgn-noti.pages.dev/wbs"
        target="_blank"
        rel="noopener noreferrer"
        class="board-source-link"
      >
        원본 WBS
        <UIcon name="i-lucide-arrow-up-right" />
      </a>
    </div>

    <article v-if="doc" class="prose-wrap">
      <ContentRenderer :value="doc" class="doc-prose" />
    </article>

    <UAlert
      v-else
      color="warning"
      variant="soft"
      title="현황판 내용을 불러올 수 없습니다"
      description="doc/BOARD.md 를 확인하세요."
    />
  </div>
</template>

<style scoped>
.board-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}
.board-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.board-crumb {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--ink-400);
}
.board-source-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  color: var(--ink-500);
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--white);
}
.board-source-link:hover {
  background: var(--ink-50);
  border-color: var(--ink-300);
  color: var(--ink-800);
}
.prose-wrap {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 40px 44px;
}
</style>
