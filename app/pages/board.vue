<script setup lang="ts">
import {
  useWbs,
  wbsStatusMeta,
  wbsProgressFill,
  wbsFormatYmd,
  wbsGroupedTasks,
} from '~/composables/useWbs'

useHead({ title: '맑은노티 현황판' })

const {
  doc,
  stages,
  lastUpdated,
  allTasks,
  totalCounts,
  weightedAverage,
  pending,
  error,
  refresh,
} = useWbs()
</script>

<template>
  <div class="board-page">
    <div class="board-body">
      <!-- 로딩 / 에러 -->
      <div v-if="pending" class="board-state">불러오는 중…</div>
      <div v-else-if="error || !doc" class="board-state board-state--err">
        현황판을 불러올 수 없습니다.
        <button type="button" class="board-retry" @click="() => refresh()">다시 시도</button>
      </div>

      <template v-else>
        <!-- Title -->
        <div class="board-title-row">
          <div>
            <h1 class="board-title">맑은노티 현황판</h1>
            <p class="board-subtitle">
              NHN Cloud Notification Hub 기반 멀티 테넌트 메시징 SaaS · 마지막 현행화
              <b>{{ lastUpdated }}</b>
            </p>
          </div>
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

        <!-- 개요 (대시보드와 공유) -->
        <div class="board-overview">
          <AppWbsOverview
            :stages="stages"
            :weighted-average="weightedAverage"
            :done="totalCounts.done"
            :in-progress="totalCounts.in_progress"
            :total="allTasks.length"
            variant="rows"
          />
        </div>

        <!-- STAGE 상세 -->
        <section
          v-for="(s, sIdx) in stages"
          :id="`stage-${s.id}`"
          :key="s.id"
          class="stage-section"
        >
          <div class="stage-head">
            <div class="stage-head-left">
              <span class="stage-emoji">{{ s.emoji }}</span>
              <h2 class="stage-name">{{ s.no }} · {{ s.name }}</h2>
              <span class="stage-id">{{ s.id }}</span>
            </div>
            <div class="stage-head-right">
              <span>비중 {{ s.weight }}%</span>
              <span class="stage-sep">·</span>
              <span class="stage-progress">진행 {{ s.progress }}%</span>
            </div>
          </div>
          <p class="stage-summary">{{ s.summary }}</p>
          <div class="stage-bar">
            <div :class="['stage-bar-fill', wbsProgressFill(s.progress)]" :style="{ width: s.progress + '%' }" />
          </div>

          <div
            v-for="(g, gIdx) in wbsGroupedTasks(s)"
            :key="g.name || sIdx + '-' + gIdx"
            class="group-card"
          >
            <div v-if="g.name" class="group-title">
              <span class="group-bullet" />
              {{ g.name }}
              <span class="group-count">{{ g.tasks.length }}건</span>
            </div>

            <ul class="task-list">
              <li v-for="t in g.tasks" :key="t.id" class="task-row">
                <div class="task-left">
                  <span class="task-id">{{ t.id }}</span>
                  <span :class="['task-dot', wbsStatusMeta[t.status].dot]" />
                  <div class="task-main">
                    <div class="task-title-row">
                      <span class="task-title">{{ t.title }}</span>
                      <a
                        v-if="t.href"
                        :href="t.href"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="task-link"
                      >
                        <UIcon name="i-lucide-arrow-up-right" class="task-link-icon" />
                      </a>
                    </div>
                    <p v-if="t.note" class="task-note">{{ t.note }}</p>
                  </div>
                </div>
                <div class="task-right">
                  <span :class="['task-chip', wbsStatusMeta[t.status].chip]">
                    {{ wbsStatusMeta[t.status].label }}
                  </span>
                  <span class="task-owner">{{ t.owner }}</span>
                  <span class="task-date">
                    <span class="task-date-label">목표</span>
                    <span class="task-date-val">{{ wbsFormatYmd(t.targetDate) || '—' }}</span>
                    <span class="task-date-sep">→</span>
                    <span class="task-date-label">완료</span>
                    <span class="task-date-val">{{ wbsFormatYmd(t.completionDate) || '—' }}</span>
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.board-page { max-width: 1080px; margin: 0 auto; padding: 32px 24px 64px; }
.board-body { min-height: 40vh; }
.board-state {
  padding: 48px 0;
  text-align: center;
  color: #71717a;
  font-size: 14px;
}
.board-state--err { color: #b91c1c; }
.board-retry {
  margin-left: 8px;
  font-size: 13px;
  padding: 4px 10px;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.board-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
.board-title {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #18181b;
}
.board-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #71717a;
}
.board-subtitle b { font-weight: 600; color: #3f3f46; }
.board-source-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  color: #71717a;
  padding: 6px 10px;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  background: #fff;
}
.board-source-link:hover { background: #fafafa; border-color: #d4d4d8; color: #27272a; }

.board-overview { margin-top: 24px; }

/* ── Stage 상세 ── */
.stage-section { margin-top: 48px; scroll-margin-top: 72px; }
.stage-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}
.stage-head-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.stage-emoji { font-size: 22px; line-height: 1; }
.stage-name {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #18181b;
}
.stage-id {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
  color: #a1a1aa;
}
.stage-head-right {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #71717a;
}
.stage-sep { color: #e4e4e7; }
.stage-progress { font-weight: 500; color: #3f3f46; }
.stage-summary {
  margin-top: 4px;
  font-size: 13px;
  color: #71717a;
}
.stage-bar {
  margin-top: 12px;
  height: 4px;
  border-radius: 999px;
  background: #f4f4f5;
  overflow: hidden;
}
.stage-bar-fill { height: 100%; border-radius: 999px; transition: width .3s; }

/* 그룹 카드 */
.group-card {
  margin-top: 16px;
  background: #fff;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  overflow: hidden;
}
.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #3f3f46;
  background: #fafafa;
  border-bottom: 1px solid #f4f4f5;
}
.group-bullet {
  width: 4px;
  height: 12px;
  border-radius: 2px;
  background: #18181b;
}
.group-count {
  margin-left: auto;
  font-weight: 400;
  font-size: 12px;
  color: #a1a1aa;
}

/* Task 행 */
.task-list { display: flex; flex-direction: column; }
.task-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 12px 16px;
  border-top: 1px solid #f4f4f5;
}
.task-row:first-child { border-top: 0; }
.task-left {
  display: grid;
  grid-template-columns: 56px 10px 1fr;
  gap: 10px;
  align-items: start;
  min-width: 0;
}
.task-id {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  color: #a1a1aa;
  padding-top: 4px;
}
.task-dot {
  margin-top: 6px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
}
.task-main { min-width: 0; }
.task-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.task-title {
  font-size: 14px;
  color: #18181b;
  font-weight: 500;
}
.task-link { color: #71717a; transition: color .15s; }
.task-link:hover { color: #18181b; }
.task-link-icon { width: 14px; height: 14px; }
.task-note {
  margin-top: 2px;
  font-size: 13px;
  color: #71717a;
  line-height: 1.55;
}

.task-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.task-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  border-style: solid;
  border-width: 1px;
}
.task-owner {
  font-size: 12px;
  color: #52525b;
  min-width: 64px;
  text-align: right;
}
.task-date {
  display: inline-grid;
  grid-template-columns: 28px 80px 14px 28px 80px;
  align-items: center;
  column-gap: 4px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  color: #a1a1aa;
  font-variant-numeric: tabular-nums;
}
.task-date-label { color: #d4d4d8; font-size: 10px; text-align: left; }
.task-date-val { color: #52525b; text-align: left; }
.task-date-sep { color: #d4d4d8; text-align: center; }

@media (max-width: 720px) {
  .task-row { grid-template-columns: 1fr; }
  .task-right { justify-content: flex-end; flex-wrap: wrap; }
  .task-date { min-width: 0; }
}
</style>
