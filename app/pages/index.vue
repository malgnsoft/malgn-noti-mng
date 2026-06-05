<template>
  <div class="page">
    <section class="hero">
      <h1 class="hero-title">맑은노티 프로젝트 관리</h1>
      <p class="hero-desc">
        맑은노티(맑은 메시징) 프로젝트의 문서·기록·진행 사항을 한곳에서 조망합니다.
      </p>
    </section>

    <!-- 프로젝트 개요 (목표 · 기획 방향) -->
    <section class="overview">
      <div class="overview-head">
        <h2 class="overview-title">프로젝트 개요</h2>
        <NuxtLink to="/docs/wbs" class="overview-more">WBS 문서 →</NuxtLink>
      </div>
      <div class="overview-grid">
        <div class="ov-card">
          <p class="ov-label">목표</p>
          <p class="ov-goal">
            맑은소프트가 <b>NHN Cloud Notification Hub</b>를 래핑하여, 고객사가 자체 브랜드로 메시지를 발송·관리하는
            <b>멀티 테넌트 SaaS “맑은 메시징”</b>을 구축한다.
          </p>
          <div class="ov-channels">
            <span v-for="ch in channels" :key="ch" class="ov-chip">{{ ch }}</span>
          </div>
        </div>
        <div class="ov-card">
          <p class="ov-label">기획 방향</p>
          <ul class="ov-list">
            <li v-for="d in directions" :key="d">{{ d }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 프로젝트 현황 (현황판 요약) -->
    <section class="board-summary">
      <div class="board-summary-head">
        <h2 class="board-summary-title">프로젝트 현황</h2>
        <NuxtLink to="/board" class="board-summary-more">현황판 전체 보기 →</NuxtLink>
      </div>

      <div v-if="wbsPending" class="board-summary-state">현황 불러오는 중…</div>
      <div v-else-if="wbsError || !wbsDoc" class="board-summary-state">현황을 불러올 수 없습니다.</div>
      <AppWbsOverview
        v-else
        :stages="stages"
        :weighted-average="weightedAverage"
      >
        <template #aside>
          <div class="links-card">
            <p class="links-title">바로가기</p>
            <ul class="links">
              <li v-for="link in shortcuts" :key="link.url">
                <a :href="link.url" target="_blank" rel="noopener noreferrer" class="link">
                  <span class="link-main">
                    <span class="link-label">{{ link.label }}</span>
                    <span class="link-url">{{ stripProto(link.url) }}</span>
                  </span>
                  <UIcon name="i-lucide-arrow-up-right" class="link-ext" />
                </a>
              </li>
            </ul>
          </div>
        </template>
      </AppWbsOverview>
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
const shortcuts = [
  { label: '사용자단 콘솔', url: 'https://malgn-noti.pages.dev' },
  { label: '관리자단 콘솔', url: 'https://malgn-noti-admin.pages.dev' },
  { label: 'API 서버', url: 'https://malgn-noti-api.malgnsoft.workers.dev' },
  { label: 'GitHub', url: 'https://github.com/malgnsoft/malgn-noti-mng' },
]

const stripProto = (u: string) => u.replace(/^https?:\/\//, '')

const channels = ['SMS / LMS / MMS', 'RCS', '알림톡 / 친구톡', 'Email', 'Push', '복합 (Flow)']
const directions = [
  '멀티 테넌트 SaaS — 고객사(테넌트)별 자체 브랜드 · 발송 한도 · 크레딧 과금',
  '5채널 + 복합(Flow) 폴백·순서 발송 (예: 알림톡 → 친구톡 → LMS)',
  '모든 발송은 백엔드(malgn-noti-api) 경유 — NHN 키 비노출 · 과금 · 감사 통제',
  '핵심 도메인: 발송 · 캠페인 · 이력/통계 · 주소록 · 발신정보 · 템플릿 · 크레딧 · 계정/인증 · 문의',
  '디자인: Relay-inspired 저밀도 시스템 · 스택: Nuxt 3 + Tailwind v4 + Nuxt UI v3',
]

const {
  doc: wbsDoc,
  stages,
  weightedAverage,
  pending: wbsPending,
  error: wbsError,
} = useWbs()

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
  margin-bottom: 32px;
}
/* 전체 진행률 옆 간단 바로가기 */
.links-card {
  height: 100%;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
}
.links-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-400);
  margin-bottom: 6px;
}
.links {
  display: flex;
  flex-direction: column;
}
.link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid var(--ink-50);
}
.links li:first-child .link { border-top: 0; }
.link-main {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.link-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-800);
  flex-shrink: 0;
}
.link-url {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-400);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.link:hover .link-label { color: var(--accent-ink); }
.link:hover .link-url { color: var(--accent-ink); }
.link-ext {
  width: 14px;
  height: 14px;
  color: var(--ink-300);
  flex-shrink: 0;
}
.link:hover .link-ext { color: var(--accent-ink); }

/* 프로젝트 개요 */
.overview { margin-bottom: 44px; }
.overview-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
.overview-title { font-size: 16px; font-weight: 700; color: var(--ink-900); }
.overview-more { font-size: 13px; color: var(--accent-ink); }
.overview-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px; }
@media (max-width: 780px) { .overview-grid { grid-template-columns: 1fr; } }
.ov-card { background: var(--white); border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px; }
.ov-label { font-size: 12px; font-weight: 600; color: var(--ink-400); margin-bottom: 8px; }
.ov-goal { font-size: 14px; line-height: 1.65; color: var(--ink-700); }
.ov-goal b { font-weight: 600; color: var(--ink-900); }
.ov-channels { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
.ov-chip { font-size: 12px; font-weight: 500; color: var(--ink-700); background: var(--ink-50); border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px; }
.ov-list { display: flex; flex-direction: column; gap: 8px; }
.ov-list li { position: relative; padding-left: 14px; font-size: 13px; line-height: 1.55; color: var(--ink-700); }
.ov-list li::before { content: ""; position: absolute; left: 0; top: 8px; width: 4px; height: 4px; border-radius: 50%; background: var(--accent); }

.board-summary {
  margin-bottom: 44px;
}
.board-summary-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}
.board-summary-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink-900);
}
.board-summary-more {
  font-size: 13px;
  color: var(--accent-ink);
}
.board-summary-state {
  padding: 28px;
  text-align: center;
  font-size: 14px;
  color: var(--ink-400);
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 12px;
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
  /* minmax(0, 1fr): 카드 내부의 nowrap 긴 텍스트(max-content)가 컬럼을
     밀어내 그리드가 .page 최대폭을 넘어 오버플로하던 문제 방지 → 위 현황
     섹션과 동일 폭 유지. */
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px;
}
.col {
  min-width: 0;
}
@media (max-width: 780px) {
  .grid { grid-template-columns: minmax(0, 1fr); }
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
