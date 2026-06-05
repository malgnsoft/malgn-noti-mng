<template>
  <div class="layout-default">
    <header class="gnb">
      <div class="gnb-inner">
        <NuxtLink to="/" class="brand">
          <span class="brand-icon"><AppLogoMark /></span>
          <span class="brand-text">맑은</span>
          <span class="brand-message">message</span>
          <span class="brand-sub">프로젝트 관리</span>
        </NuxtLink>
        <nav class="gnb-nav">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="gnb-link"
          >
            <UIcon :name="item.icon" class="gnb-link-ico" />
            {{ item.label }}
          </NuxtLink>
        </nav>
        <a
          class="gnb-link gnb-repo"
          href="https://github.com/malgnsoft/malgn-noti-mng"
          target="_blank"
          rel="noopener"
        >
          <UIcon name="i-lucide-github" class="gnb-link-ico" />
          GitHub
        </a>
      </div>
    </header>

    <main class="layout-main">
      <slot />
    </main>

    <footer class="footer">
      <span>맑은노티(맑은 메시징) 프로젝트 문서·작업 이력</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
const nav = [
  { to: '/', label: '대시보드', icon: 'i-lucide-layout-dashboard' },
  { to: '/board', label: '현황판', icon: 'i-lucide-gauge' },
  { to: '/wbs', label: 'WBS', icon: 'i-lucide-gantt-chart' },
  { to: '/docs', label: '문서', icon: 'i-lucide-book-text' },
  { to: '/history', label: '작업 이력', icon: 'i-lucide-history' }
]
</script>

<style scoped>
.layout-default {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--paper);
  overflow-x: clip;
}

.gnb {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 56px;
  background: var(--white);
  border-bottom: 1px solid var(--line);
}
.gnb-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px;
}
/* 사용자단(malgn-noti) GNB 로고와 동일 — 마크 아이콘 + "맑은" + "message" */
.brand {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}
.brand-icon {
  width: 24px;
  height: 24px;
  background: var(--ink-900);
  color: var(--white);
  border-radius: var(--r-md, 8px);
  display: grid;
  place-items: center;
}
.brand-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.01em;
  line-height: 1;
}
.brand-message {
  font-size: 16px;
  font-weight: 400;
  color: var(--ink-400);
  letter-spacing: -0.01em;
  line-height: 1;
  margin-left: -5px;
}
.brand-sub {
  margin-left: 3px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-ink);
  line-height: 1;
}
.gnb-nav {
  display: flex;
  gap: 4px;
  margin-right: auto;
}
.gnb-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-500);
}
.gnb-link:hover {
  color: var(--ink-900);
  background: var(--ink-50);
}
.gnb-link.router-link-active {
  color: var(--ink-900);
  background: var(--ink-50);
}
.gnb-link-ico {
  width: 16px;
  height: 16px;
}
.gnb-repo {
  color: var(--ink-400);
}

.layout-main {
  flex: 1;
  width: 100%;
  min-width: 0;
}

.footer {
  border-top: 1px solid var(--line);
  padding: 20px 24px;
  text-align: center;
  font-size: 12px;
  color: var(--ink-400);
}
</style>
