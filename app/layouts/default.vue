<template>
  <div class="layout-default">
    <header class="gnb" :class="{ 'gnb-hidden': gnbHidden }">
      <div class="gnb-inner">
        <NuxtLink to="/" class="brand">
          <span class="brand-icon"><AppLogoMark /></span>
          <span class="brand-text">맑은</span>
          <span class="brand-message">message</span>
          <span class="brand-sub">프로젝트 관리</span>
        </NuxtLink>
        <nav class="gnb-nav">
          <NuxtLink
            v-for="item in visibleNav"
            :key="item.to"
            :to="item.to"
            class="gnb-link"
          >
            <UIcon :name="item.icon" class="gnb-link-ico" />
            {{ item.label }}
          </NuxtLink>
        </nav>
        <div class="gnb-right">
          <ClientOnly>
            <div v-if="member" class="gnb-auth">
              <NuxtLink to="/account" class="gnb-user">
                <UIcon name="i-lucide-user-round" class="gnb-link-ico" />
                {{ member.name }}
              </NuxtLink>
              <button class="gnb-logout" type="button" @click="onLogout">로그아웃</button>
            </div>
            <NuxtLink v-else to="/login" class="gnb-link gnb-login">
              <UIcon name="i-lucide-log-in" class="gnb-link-ico" />
              로그인
            </NuxtLink>
          </ClientOnly>
        </div>
      </div>
    </header>

    <main class="layout-main">
      <slot />
    </main>

    <footer v-if="!hideFooter" class="footer">
      <span>맑은노티(맑은 메시징) 프로젝트 문서·작업 이력</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
// /wbs(간트)는 100vh 풀스크린 앱 — 푸터 숨김(바깥 페이지 스크롤 제거)
const route = useRoute()
const isFullScreen = computed(() => route.path === '/wbs')
const hideFooter = isFullScreen
// /wbs 간트 스크롤 다운 시 GNB도 함께 접음(wbs.vue가 set 하는 공유 상태)
const chromeHidden = useState('wbsChromeHidden', () => false)
const gnbHidden = computed(() => isFullScreen.value && chromeHidden.value)

const nav = [
  { to: '/', label: '대시보드', icon: 'i-lucide-layout-dashboard' },
  { to: '/wbs', label: 'WBS', icon: 'i-lucide-gantt-chart' },
  { to: '/issues', label: '이슈', icon: 'i-lucide-message-square-warning' },
  { to: '/docs', label: '문서', icon: 'i-lucide-book-text' },
  { to: '/history', label: '작업 이력', icon: 'i-lucide-history' },
  { to: '/members', label: '참여자', icon: 'i-lucide-users', adminOnly: true }
]

const { member, isAdmin, logout } = useAuth()
// '참여자' 등 adminOnly 메뉴는 관리자에게만 노출.
const visibleNav = computed(() => nav.filter(item => !item.adminOnly || isAdmin.value))
async function onLogout() {
  await logout()
  await navigateTo('/')
}
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
  overflow: hidden;
  transition: height .24s ease, border-color .24s ease;
}
/* /wbs 스크롤 다운 시 GNB를 위로 접음 (간트 영역 확장) */
.gnb.gnb-hidden {
  height: 0;
  border-bottom-color: transparent;
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
.gnb-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.gnb-auth {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 8px;
  border-left: 1px solid var(--line);
}
.gnb-user {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-700);
}
.gnb-user:hover {
  background: var(--ink-50);
}
.gnb-logout {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-400);
}
.gnb-logout:hover {
  color: var(--ink-900);
  background: var(--ink-50);
}
.gnb-login {
  color: var(--accent-ink);
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
