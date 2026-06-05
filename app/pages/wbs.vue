<script setup lang="ts">
import { wbsGantt, wbsSteps, type GanttItem } from '~/utils/wbsData'

useHead({ title: 'WBS (간트)' })

const TODAY = '2026-06-05'
const DOW = ['일', '월', '화', '수', '목', '금', '토']

function toDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}
function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function md(iso: string) {
  const [, m, d] = iso.split('-').map(Number)
  return `${m}/${d}`
}

// ── 날짜 열(일 단위) 생성 ──────────────────────────────────
const minIso = wbsGantt.reduce((a, x) => (x.start < a ? x.start : a), wbsGantt[0]!.start)
const maxIso = wbsGantt.reduce((a, x) => (x.end > a ? x.end : a), wbsGantt[0]!.end)

interface Day { iso: string, day: number, month: number, dow: number, weekend: boolean, today: boolean }
const days: Day[] = (() => {
  const out: Day[] = []
  const cur = toDate(minIso)
  const last = toDate(maxIso)
  while (cur <= last) {
    const iso = toIso(cur)
    const dow = cur.getDay()
    out.push({ iso, day: cur.getDate(), month: cur.getMonth() + 1, dow, weekend: dow === 0 || dow === 6, today: iso === TODAY })
    cur.setDate(cur.getDate() + 1)
  }
  return out
})()

// 월 헤더 colspan
const months = (() => {
  const out: { month: number, span: number }[] = []
  for (const d of days) {
    const last = out[out.length - 1]
    if (last && last.month === d.month) last.span++
    else out.push({ month: d.month, span: 1 })
  }
  return out
})()

const isoIndex = new Map(days.map((d, i) => [d.iso, i]))

// ── 행 모델 (스텝 헤더 + 항목, 구분 병합) ──────────────────
interface ItemRow {
  type: 'item'
  it: GanttItem
  showGroup: boolean
  startIdx: number
  endIdx: number
  doneDays: number
}
type Row = { type: 'step', step: number, label: string } | ItemRow

const rows: Row[] = (() => {
  const out: Row[] = []
  let curStep: number | null = null
  let curGroup: string | null = null
  for (const it of wbsGantt) {
    if (it.step !== curStep) {
      out.push({ type: 'step', step: it.step, label: wbsSteps[it.step]! })
      curStep = it.step
      curGroup = null
    }
    const startIdx = isoIndex.get(it.start) ?? 0
    const endIdx = isoIndex.get(it.end) ?? startIdx
    const span = endIdx - startIdx + 1
    const doneDays = Math.round(span * it.progress / 100)
    out.push({ type: 'item', it, showGroup: it.group !== curGroup, startIdx, endIdx, doneDays })
    curGroup = it.group
  }
  return out
})()

// 셀 상태: 'done' | 'todo' | '' (막대 아님)
function cellState(row: ItemRow, ci: number): 'done' | 'todo' | '' {
  if (ci < row.startIdx || ci > row.endIdx) return ''
  return (ci - row.startIdx) < row.doneDays ? 'done' : 'todo'
}

function pctBg(p: number) {
  if (p >= 100) return '#16a34a'
  if (p >= 70) return '#4ade80'
  if (p >= 30) return '#bbf7d0'
  if (p > 0) return '#e5f6ea'
  return 'transparent'
}
function pctColor(p: number) {
  return p >= 70 ? '#fff' : '#15803d'
}
const totalDays = days.length
</script>

<template>
  <div class="wbs-page">
    <div class="wbs-head">
      <div>
        <h1 class="wbs-title">맑은메시지(가칭) 프로젝트 작업 내역</h1>
        <p class="wbs-sub">WBS 간트 · Step 1 · 3 · 5 · 화면 단위 · 기준일 {{ md(TODAY) }}</p>
      </div>
      <div class="legend">
        <span><i class="sw sw-done" /> 완료</span>
        <span><i class="sw sw-todo" /> 예정</span>
        <span><i class="sw sw-weekend" /> 주말</span>
        <span><i class="sw sw-today" /> 오늘</span>
      </div>
    </div>

    <div class="grid-scroll">
      <table class="gantt">
        <thead>
          <tr>
            <th class="c-grp corner" rowspan="2">구분</th>
            <th class="c-name corner" rowspan="2">작업 (화면)</th>
            <th class="c-owner corner" rowspan="2">담당</th>
            <th class="c-date corner" rowspan="2">시작일</th>
            <th class="c-date corner" rowspan="2">종료일</th>
            <th class="c-pct corner" rowspan="2">진척율</th>
            <th v-for="(m, i) in months" :key="'m' + i" class="m-head" :colspan="m.span">{{ m.month }}월</th>
          </tr>
          <tr>
            <th
              v-for="(d, i) in days"
              :key="'d' + i"
              class="d-head"
              :class="{ weekend: d.weekend, today: d.today }"
            >
              <span class="d-num">{{ d.day }}</span>
              <span class="d-dow">{{ DOW[d.dow] }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(row, ri) in rows" :key="ri">
            <tr v-if="row.type === 'step'" class="step-row">
              <td class="step-cell" :colspan="6">{{ row.label }}</td>
              <td class="step-band" :colspan="totalDays" />
            </tr>
            <tr v-else class="item-row" :class="{ 'grp-start': row.showGroup }">
              <td class="c-grp">{{ row.showGroup ? row.it.group : '' }}</td>
              <td class="c-name">
                <a v-if="row.it.href" :href="row.it.href" target="_blank" rel="noopener noreferrer" class="name-link">{{ row.it.name }}</a>
                <span v-else>{{ row.it.name }}</span>
              </td>
              <td class="c-owner">{{ row.it.owner }}</td>
              <td class="c-date">{{ md(row.it.start) }}</td>
              <td class="c-date">{{ md(row.it.end) }}</td>
              <td class="c-pct" :style="{ background: pctBg(row.it.progress), color: pctColor(row.it.progress) }">{{ row.it.progress }}%</td>
              <td
                v-for="(d, ci) in days"
                :key="'c' + ci"
                class="d-cell"
                :class="[cellState(row, ci) ? 'bar-' + cellState(row, ci) : '', { weekend: d.weekend, today: d.today }]"
              />
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.wbs-page { padding: 24px; }
.wbs-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.wbs-title { font-size: 22px; font-weight: 800; color: #18181b; letter-spacing: -0.01em; }
.wbs-sub { margin-top: 4px; font-size: 13px; color: #71717a; }
.legend { display: flex; gap: 14px; font-size: 12px; color: #52525b; align-items: center; }
.legend span { display: inline-flex; align-items: center; gap: 5px; }
.sw { width: 12px; height: 12px; border: 1px solid #d4d4d8; display: inline-block; }
.sw-done { background: #16a34a; border-color: #16a34a; }
.sw-todo { background: #dcfce7; border-color: #86efac; }
.sw-weekend { background: #fff1f2; }
.sw-today { background: #fff; border-left: 2px solid #ef4444; }

/* ── 엑셀 스타일 그리드 ── */
.grid-scroll {
  overflow-x: auto;
  border: 1px solid #cfcfcf;
  background: #fff;
}
.gantt {
  border-collapse: collapse;
  font-size: 12px;
  color: #27272a;
  table-layout: fixed;
}
.gantt th, .gantt td {
  border: 1px solid #d8d8d8;
  padding: 0;
  box-sizing: border-box;
}

/* 좌측 고정 열 */
.c-grp, .c-name, .c-owner, .c-date, .c-pct {
  position: sticky;
  background: #fff;
  z-index: 10;
  height: 26px;
  padding: 0 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.c-grp { left: 0; width: 116px; min-width: 116px; max-width: 116px; font-weight: 600; color: #3f3f46; }
.c-name { left: 116px; width: 220px; min-width: 220px; max-width: 220px; }
.c-owner { left: 336px; width: 60px; min-width: 60px; max-width: 60px; text-align: center; color: #52525b; }
.c-date { width: 54px; min-width: 54px; max-width: 54px; text-align: center; font-family: var(--font-mono); color: #52525b; }
.c-date:nth-of-type(4) { left: 396px; }
.c-date:nth-of-type(5) { left: 450px; }
.c-pct { left: 504px; width: 56px; min-width: 56px; max-width: 56px; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
.name-link { color: #2563eb; text-decoration: underline; }

/* 헤더 */
.gantt thead th {
  background: #ededed;
  color: #3f3f46;
  font-weight: 700;
  height: 22px;
  text-align: center;
}
.gantt thead th.corner {
  position: sticky;
  z-index: 20;
  background: #e4e4e7;
  vertical-align: middle;
}
.corner.c-grp { left: 0; }
.corner.c-name { left: 116px; }
.corner.c-owner { left: 336px; }
.corner.c-date:nth-of-type(4) { left: 396px; }
.corner.c-date:nth-of-type(5) { left: 450px; }
.corner.c-pct { left: 504px; }
.m-head { background: #d9e2ef; color: #1e3a5f; font-weight: 700; }
.d-head { width: 24px; min-width: 24px; max-width: 24px; line-height: 1.05; padding: 1px 0; }
.d-head .d-num { display: block; font-size: 11px; }
.d-head .d-dow { display: block; font-size: 9px; color: #71717a; }
.d-head.weekend { background: #fde8ea; color: #b91c1c; }
.d-head.weekend .d-dow { color: #b91c1c; }
.d-head.today { box-shadow: inset 2px 0 0 #ef4444; }

/* 스텝 헤더 행 */
.step-row td { height: 24px; }
.step-cell {
  position: sticky;
  left: 0;
  z-index: 12;
  background: #cbd5e1;
  color: #0f172a;
  font-weight: 800;
  padding: 0 10px;
  white-space: nowrap;
}
.step-band { background: #e2e8f0; }

/* 항목 행 */
.item-row .c-grp, .item-row .c-name, .item-row .c-owner, .item-row .c-date, .item-row .c-pct { height: 26px; }
.item-row.grp-start td { border-top: 1px solid #b8b8b8; }
.d-cell { width: 24px; min-width: 24px; max-width: 24px; height: 26px; }
.d-cell.weekend { background: #fff5f6; }
.d-cell.today { box-shadow: inset 2px 0 0 rgba(239, 68, 68, 0.5); }
.d-cell.bar-done { background: #16a34a; }
.d-cell.bar-todo { background: #c9f0d4; }
.d-cell.bar-done.weekend, .d-cell.bar-todo.weekend { background-blend-mode: normal; }
.d-cell.bar-done.weekend { background: #15903f; }
.d-cell.bar-todo.weekend { background: #bde8c9; }
</style>
