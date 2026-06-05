<template>
  <div class="wbs-overview">
    <!-- 전체 진행률 -->
    <div class="hero-card">
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

    <!-- 단계별 진행률 — 박스 스타일 (대시보드) -->
    <div v-if="variant === 'boxes'" class="stage-grid">
      <NuxtLink
        v-for="(s, i) in stages"
        :key="s.id"
        :to="`/board#stage-${s.id}`"
        class="stage-box"
      >
        <div class="stage-box-top">
          <span class="stage-box-emoji">{{ s.emoji }}</span>
          <span class="stage-box-no">{{ String(i + 1).padStart(2, '0') }}</span>
        </div>
        <p class="stage-box-name">{{ s.no }} · {{ s.name }}</p>
        <div class="stage-box-foot">
          <div class="stage-box-track">
            <div :class="['stage-box-fill', wbsProgressFill(s.progress)]" :style="{ width: s.progress + '%' }" />
          </div>
          <div class="stage-box-meta">
            <span class="stage-box-pct">{{ s.progress }}%</span>
            <span class="stage-box-count">{{ s.tasks.length }}건</span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- 단계별 진행률 — 행 스타일 (현황판) -->
    <section v-else class="overview-section">
      <div class="overview-head">
        <h2>단계별 진행률</h2>
        <p>행을 클릭하면 상세로 이동</p>
      </div>
      <ul class="overview-list">
        <NuxtLink
          v-for="(s, i) in stages"
          :key="s.id"
          :to="`/board#stage-${s.id}`"
          class="overview-row"
          :class="i > 0 ? 'overview-row--bordered' : ''"
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
        </NuxtLink>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { WbsStage } from '~/composables/useWbs'

withDefaults(defineProps<{
  stages: WbsStage[]
  weightedAverage: number
  variant?: 'boxes' | 'rows'
}>(), {
  variant: 'boxes',
})
</script>

<style scoped>
.wbs-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── 전체 진행률 ── */
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

/* ── 박스 스타일 (대시보드) ── */
.stage-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}
.stage-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #fff;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  padding: 16px;
  transition: border-color .15s, box-shadow .15s;
}
.stage-box:hover {
  border-color: #d4d4d8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.stage-box-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stage-box-emoji { font-size: 20px; line-height: 1; }
.stage-box-no {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
  color: #a1a1aa;
  font-variant-numeric: tabular-nums;
}
.stage-box-name {
  font-size: 13px;
  font-weight: 600;
  color: #18181b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 36px;
}
.stage-box-foot {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stage-box-track {
  height: 4px;
  border-radius: 999px;
  background: #f4f4f5;
  overflow: hidden;
}
.stage-box-fill {
  height: 100%;
  border-radius: 999px;
  transition: width .3s;
}
.stage-box-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.stage-box-pct {
  font-size: 15px;
  font-weight: 600;
  color: #18181b;
  font-variant-numeric: tabular-nums;
}
.stage-box-count {
  font-size: 12px;
  color: #a1a1aa;
}

/* ── 행 스타일 (현황판) ── */
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
  grid-template-columns: 28px 28px minmax(0, 1fr) auto 180px auto;
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

@media (max-width: 900px) {
  .stage-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .overview-row { grid-template-columns: 28px minmax(0, 1fr); }
  .overview-no, .overview-count, .overview-progress, .overview-arrow { display: none; }
}
@media (max-width: 560px) {
  .stage-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
