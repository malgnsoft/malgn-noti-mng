<template>
  <div class="wbs-overview">
    <!-- HERO STATS -->
    <section class="wbs-hero">
      <div class="hero-card hero-card--wide">
        <div class="hero-card-head">
          <div>
            <p class="hero-label">전체 진행률</p>
            <p class="hero-value">
              {{ weightedAverage }}<span class="hero-value-unit">%</span>
            </p>
          </div>
          <p class="hero-note">가중평균 · {{ stages.length }}단계</p>
        </div>
        <div class="hero-bar">
          <div class="hero-bar-fill" :style="{ width: weightedAverage + '%' }" />
        </div>
      </div>

      <div class="hero-card">
        <div class="hero-mini-head">
          <span class="hero-dot bg-emerald-500" />
          <p class="hero-label">완료</p>
        </div>
        <p class="hero-mini-value">
          {{ totalCounts.done }}<span class="hero-mini-total">/{{ allTasks.length }}</span>
        </p>
      </div>
      <div class="hero-card">
        <div class="hero-mini-head">
          <span class="hero-dot bg-amber-500" />
          <p class="hero-label">진행 중</p>
        </div>
        <p class="hero-mini-value">{{ totalCounts.in_progress }}</p>
      </div>
    </section>

    <!-- 단계별 진행률 (개요 리스트) -->
    <section class="mt-8">
      <div class="overview-head">
        <h2>단계별 진행률</h2>
        <p>행을 클릭하면 상세로 이동</p>
      </div>
      <ul class="overview-list">
        <NuxtLink
          v-for="(s, i) in stages"
          :key="s.id"
          :to="`/board#stage-${s.id}`"
          custom
        >
          <template #default="{ navigate }">
            <li
              class="overview-row"
              :class="i > 0 ? 'overview-row--bordered' : ''"
              @click="navigate"
            >
              <span class="overview-emoji">{{ s.emoji }}</span>
              <span class="overview-no">{{ String(i + 1).padStart(2, '0') }}</span>
              <div class="overview-text">
                <p class="overview-name">{{ s.no }} · {{ s.name }}</p>
                <p class="overview-summary">{{ s.summary }}</p>
              </div>
              <span class="overview-count">{{ s.tasks.length }}건</span>
              <div class="overview-progress">
                <div class="overview-progress-track">
                  <div :class="['overview-progress-fill', wbsProgressFill(s.progress)]" :style="{ width: s.progress + '%' }" />
                </div>
                <span class="overview-progress-text">{{ s.progress }}%</span>
              </div>
              <span class="overview-arrow">→</span>
            </li>
          </template>
        </NuxtLink>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { WbsStage } from '~/composables/useWbs'

defineProps<{
  stages: WbsStage[]
  weightedAverage: number
  totalCounts: Record<string, number>
  allTasks: unknown[]
}>()
</script>

<style scoped>
/* ── Hero stats ── */
.wbs-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 768px) {
  .wbs-hero { grid-template-columns: repeat(4, 1fr); }
  .hero-card--wide { grid-column: span 2; }
}
.hero-card {
  background: #fff;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  padding: 20px;
}
.hero-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.hero-label { font-size: 12px; color: #71717a; }
.hero-value {
  margin-top: 4px;
  font-size: 36px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #18181b;
  font-variant-numeric: tabular-nums;
}
.hero-value-unit { margin-left: 2px; font-size: 24px; color: #a1a1aa; }
.hero-note { font-size: 13px; color: #a1a1aa; padding-bottom: 4px; }
.hero-bar {
  margin-top: 16px;
  height: 6px;
  border-radius: 999px;
  background: #f4f4f5;
  overflow: hidden;
}
.hero-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: #18181b;
  transition: width .3s;
}
.hero-mini-head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hero-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
}
.hero-mini-value {
  margin-top: 4px;
  font-size: 28px;
  font-weight: 600;
  color: #18181b;
  font-variant-numeric: tabular-nums;
}
.hero-mini-total { font-size: 16px; color: #a1a1aa; }

/* ── Overview 리스트 ── */
.overview-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.overview-head h2 { font-size: 14px; font-weight: 600; color: #3f3f46; }
.overview-head p { font-size: 13px; color: #a1a1aa; }
.overview-list {
  background: #fff;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  overflow: hidden;
}
.overview-row {
  display: grid;
  grid-template-columns: 28px 28px 1fr auto 180px auto;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: background-color .15s;
}
.overview-row:hover { background: #fafafa; }
.overview-row--bordered { border-top: 1px solid #f4f4f5; }
.overview-emoji { font-size: 20px; line-height: 1; }
.overview-no {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 14px;
  color: #a1a1aa;
  font-variant-numeric: tabular-nums;
}
.overview-text { min-width: 0; }
.overview-name {
  font-size: 14px;
  font-weight: 500;
  color: #18181b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.overview-summary {
  font-size: 13px;
  color: #71717a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.overview-count { font-size: 13px; color: #a1a1aa; }
.overview-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}
.overview-progress-track {
  width: 120px;
  height: 4px;
  border-radius: 999px;
  background: #f4f4f5;
  overflow: hidden;
}
.overview-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width .3s;
}
.overview-progress-text {
  width: 36px;
  text-align: right;
  font-size: 13px;
  font-weight: 500;
  color: #3f3f46;
  font-variant-numeric: tabular-nums;
}
.overview-arrow { color: #d4d4d8; }

.mt-8 { margin-top: 32px; }

@media (max-width: 720px) {
  .overview-row {
    grid-template-columns: 28px 1fr;
  }
  .overview-no, .overview-count, .overview-progress, .overview-arrow { display: none; }
}
</style>
