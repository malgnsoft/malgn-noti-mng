<template>
  <div class="page">
    <section class="hero">
      <h1 class="hero-title">맑은노티 프로젝트 관리</h1>
      <p class="hero-desc">
        맑은노티(맑은 메시징) 프로젝트의 문서·기록·진행 사항을 한곳에서 조망합니다.
      </p>
    </section>

    <div class="grid">
      <section class="col">
        <div class="col-head">
          <h2 class="col-title">문서</h2>
          <NuxtLink to="/docs" class="col-more">전체 보기 →</NuxtLink>
        </div>
        <ul class="card-list">
          <li v-for="doc in topDocs" :key="doc.path">
            <NuxtLink :to="'/docs' + doc.path" class="doc-card">
              <UIcon name="i-lucide-file-text" class="doc-card-ico" />
              <span class="doc-card-body">
                <span class="doc-card-title">{{ doc.title || doc.path }}</span>
                <span v-if="doc.description" class="doc-card-desc">{{ doc.description }}</span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section class="col">
        <div class="col-head">
          <h2 class="col-title">최근 작업 이력</h2>
          <NuxtLink to="/history" class="col-more">전체 보기 →</NuxtLink>
        </div>
        <ul class="card-list">
          <li v-for="h in recentHistory" :key="h.path">
            <NuxtLink :to="'/docs' + h.path" class="doc-card">
              <span class="hist-date">{{ formatYmd(historyDate(h.path)) }}</span>
              <span class="doc-card-body">
                <span class="doc-card-title">{{ h.title || h.path }}</span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: all } = await useAllDocs()

const docs = computed(() => (all.value ?? []).filter(d => !isHistory(d.path)))
const histories = computed(() =>
  (all.value ?? [])
    .filter(d => isHistory(d.path) && historyDate(d.path))
    .sort((a, b) => (historyDate(b.path) ?? '').localeCompare(historyDate(a.path) ?? ''))
)

const topDocs = computed(() => docs.value.slice(0, 8))
const recentHistory = computed(() => histories.value.slice(0, 6))
</script>

<style scoped>
.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 24px 64px;
}
.hero {
  margin-bottom: 40px;
}
.hero-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.02em;
}
.hero-desc {
  margin-top: 8px;
  font-size: 15px;
  color: var(--ink-500);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}
@media (max-width: 780px) {
  .grid { grid-template-columns: 1fr; }
}
.col-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.col-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-800);
}
.col-more {
  font-size: 13px;
  color: var(--accent-ink);
}
.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.doc-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 10px;
}
.doc-card:hover {
  border-color: var(--ink-300);
}
.doc-card-ico {
  width: 18px;
  height: 18px;
  color: var(--ink-400);
  flex-shrink: 0;
}
.doc-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.doc-card-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-900);
}
.doc-card-desc {
  font-size: 12px;
  color: var(--ink-400);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hist-date {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent-ink);
  width: 78px;
}
</style>
