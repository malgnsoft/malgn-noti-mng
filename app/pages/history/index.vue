<template>
  <div class="page">
    <h1 class="page-title">작업 이력</h1>
    <p class="page-desc">
      일자별 작업 이력입니다. 앞으로의 history 는 이 레포(<code>doc/history/</code>)에서 작성·갱신합니다.
    </p>

    <ol class="timeline">
      <li v-for="h in histories" :key="h.path" class="tl-item">
        <span class="tl-dot" />
        <NuxtLink :to="'/docs' + h.path" class="tl-card">
          <span class="tl-date">{{ formatYmd(historyDate(h.path)) }}</span>
          <span class="tl-title">{{ h.title || h.path }}</span>
          <span v-if="h.description" class="tl-desc">{{ h.description }}</span>
        </NuxtLink>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
const { data: all } = await useAllDocs()

const histories = computed(() =>
  (all.value ?? [])
    .filter(d => isHistory(d.path) && historyDate(d.path))
    .sort((a, b) => (historyDate(b.path) ?? '').localeCompare(historyDate(a.path) ?? ''))
)
</script>

<style scoped>
.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 24px 64px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink-900);
}
.page-desc {
  margin: 6px 0 32px;
  font-size: 14px;
  color: var(--ink-500);
}
.page-desc code {
  font-family: var(--font-mono);
  font-size: 12px;
  background: var(--ink-50);
  padding: 1px 5px;
  border-radius: 4px;
}
.timeline {
  position: relative;
  margin-left: 8px;
  padding-left: 24px;
  border-left: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.tl-item {
  position: relative;
}
.tl-dot {
  position: absolute;
  left: -29px;
  top: 18px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--paper);
}
.tl-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 14px 16px;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 10px;
}
.tl-card:hover {
  border-color: var(--ink-300);
}
.tl-date {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent-ink);
}
.tl-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-900);
}
.tl-desc {
  font-size: 12px;
  color: var(--ink-400);
}
</style>
