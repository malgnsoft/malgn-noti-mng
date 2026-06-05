<template>
  <div class="page">
    <h1 class="page-title">문서</h1>
    <p class="page-desc">malgn-noti <code>doc/</code> 트리의 공통·도메인 정본 문서입니다.</p>

    <ul class="doc-list">
      <li v-for="doc in docs" :key="doc.path">
        <NuxtLink :to="'/docs' + doc.path" class="doc-row">
          <UIcon name="i-lucide-file-text" class="doc-row-ico" />
          <span class="doc-row-body">
            <span class="doc-row-title">{{ doc.title || doc.path }}</span>
            <span v-if="doc.description" class="doc-row-desc">{{ doc.description }}</span>
          </span>
          <code class="doc-row-path">{{ doc.path }}</code>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { data: all } = await useAllDocs()
const docs = computed(() => (all.value ?? []).filter(d => !isHistory(d.path)))
</script>

<style scoped>
.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 24px 64px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink-900);
}
.page-desc {
  margin: 6px 0 28px;
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
.doc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.doc-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 10px;
}
.doc-row:hover {
  border-color: var(--ink-300);
}
.doc-row-ico {
  width: 18px;
  height: 18px;
  color: var(--ink-400);
  flex-shrink: 0;
}
.doc-row-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.doc-row-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-900);
}
.doc-row-desc {
  font-size: 12px;
  color: var(--ink-400);
}
.doc-row-path {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-300);
  flex-shrink: 0;
}
</style>
