<script setup lang="ts">
import { wbsGantt, wbsSteps, type GanttItem } from '~/utils/wbsData'

useHead({ title: '전체 일정' })

const TODAY = '2026-06-05'

/* ── 담당자 색 ── */
const PEOPLE = ['김도형', '김경은', '김덕조', '컨설팅팀', '안병훈', '미정'] as const
const PCOLOR: Record<string, string> = {
  김도형: '#2563eb', 김경은: '#7c3aed', 김덕조: '#0d9488',
  컨설팅팀: '#d97706', 안병훈: '#db2777', 미정: '#94a3b8',
}
function whoOf(owner: string): string[] {
  if (!owner || owner === '—') return []
  return owner.split(',').map(s => s.trim()).filter(Boolean)
}

/* ── 날짜 ── */
function toDate(iso: string) { const [y, m, d] = iso.split('-').map(Number); return new Date(y!, m! - 1, d!) }
function toIso(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
function md(iso?: string | null) { if (!iso) return '–'; const [, m, d] = iso.split('-').map(Number); return `${m}/${d}` }

const dated = wbsGantt.filter(x => x.start && x.end)
const minIso = dated.reduce((a, x) => (x.start! < a ? x.start! : a), dated[0]!.start!)
const maxIso = dated.reduce((a, x) => (x.end! > a ? x.end! : a), dated[0]!.end!)

interface Day { iso: string, day: number, month: number, dow: number, weekend: boolean, sat: boolean, sun: boolean, today: boolean }
const days: Day[] = (() => {
  const out: Day[] = []; const cur = toDate(minIso); const last = toDate(maxIso)
  while (cur <= last) {
    const dow = cur.getDay()
    out.push({ iso: toIso(cur), day: cur.getDate(), month: cur.getMonth() + 1, dow, weekend: dow === 0 || dow === 6, sat: dow === 6, sun: dow === 0, today: toIso(cur) === TODAY })
    cur.setDate(cur.getDate() + 1)
  }
  return out
})()
const idxOf = new Map(days.map((d, i) => [d.iso, i]))
const todayIdx = idxOf.get(TODAY) ?? -1
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const months = (() => {
  const out: { month: number, span: number, startIdx: number }[] = []
  days.forEach((d, i) => { const l = out[out.length - 1]; if (l && l.month === d.month) l.span++; else out.push({ month: d.month, span: 1, startIdx: i }) })
  return out
})()

/* ── 상태 계산 ── */
type Status = 'done' | 'active' | 'plan' | 'late'
function statusOf(t: GanttItem): Status {
  if (t.progress >= 100) return 'done'
  if (!t.start || t.start > TODAY) return 'plan'
  if (t.end && t.end < TODAY && t.progress < 100) return 'late'
  return 'active'
}
const STATUS_LABEL: Record<Status, string> = { done: '완료', active: '진행중', plan: '예정', late: '지연' }

/* ── 트리 구성: Step → 구분 → 작업 ── */
interface Task extends GanttItem { who: string[], status: Status }
interface Cat { id: string, name: string, tasks: Task[] }
interface Step { id: string, badge: string, title: string, cats: Cat[] }

const tree: Step[] = (() => {
  const steps: Step[] = []
  for (const it of wbsGantt) {
    const [badge, title] = (wbsSteps[it.step] ?? `Step ${it.step}`).split(' · ')
    let s = steps.find(x => x.id === `step-${it.step}`)
    if (!s) { s = { id: `step-${it.step}`, badge: badge!, title: title ?? '', cats: [] }; steps.push(s) }
    let c = s.cats.find(x => x.name === it.group)
    if (!c) { c = { id: `${s.id}-${s.cats.length}`, name: it.group, tasks: [] }; s.cats.push(c) }
    c.tasks.push({ ...it, who: whoOf(it.owner), status: statusOf(it) })
  }
  return steps
})()
const allTasks = tree.flatMap(s => s.cats.flatMap(c => c.tasks))

/* ── KPI (전체) ── */
const kpi = computed(() => {
  const n = allTasks.length
  const avg = n ? Math.round(allTasks.reduce((a, t) => a + t.progress, 0) / n) : 0
  const c = { done: 0, active: 0, plan: 0, late: 0 }
  allTasks.forEach(t => c[t.status]++)
  return { n, avg, ...c }
})

/* ── 담당자별 카운트 ── */
const peopleCount = computed(() => {
  const m: Record<string, number> = {}
  for (const p of PEOPLE) m[p] = 0
  for (const t of allTasks) { if (!t.who.length) m['미정']!++; else t.who.forEach(w => { if (w in m) m[w]!++ }) }
  return m
})

/* ── 필터/접기 상태 ── */
const fPeople = ref<Set<string>>(new Set())
const fStatus = ref<'all' | Status>('all')
const fSearch = ref('')
const stepOpen = reactive<Record<string, boolean>>(Object.fromEntries(tree.map(s => [s.id, true])))
const catOpen = reactive<Record<string, boolean>>(Object.fromEntries(tree.flatMap(s => s.cats.map(c => [c.id, true]))))

function togglePerson(p: string) { const s = new Set(fPeople.value); if (s.has(p)) s.delete(p); else s.add(p); fPeople.value = s }
function setStatus(s: Status) { fStatus.value = fStatus.value === s ? 'all' : s }
const allOpen = computed(() => Object.values(stepOpen).every(Boolean) && Object.values(catOpen).every(Boolean))
function toggleAll() {
  const v = !allOpen.value
  for (const k in stepOpen) stepOpen[k] = v
  for (const k in catOpen) catOpen[k] = v
}

function taskPass(t: Task): boolean {
  if (fStatus.value !== 'all' && t.status !== fStatus.value) return false
  if (fSearch.value && !t.name.toLowerCase().includes(fSearch.value.toLowerCase())) return false
  if (fPeople.value.size) {
    const set = fPeople.value
    const hit = (t.who.length ? t.who.some(w => set.has(w)) : set.has('미정'))
    if (!hit) return false
  }
  return true
}

/* ── 집계 ── */
function agg(tasks: Task[]) {
  const ds = tasks.filter(t => t.start && t.end)
  const minI = ds.length ? Math.min(...ds.map(t => idxOf.get(t.start!) ?? 0)) : -1
  const maxI = ds.length ? Math.max(...ds.map(t => idxOf.get(t.end!) ?? 0)) : -1
  const avg = tasks.length ? Math.round(tasks.reduce((a, t) => a + t.progress, 0) / tasks.length) : 0
  return { count: tasks.length, avg, minI, maxI, hasBar: minI >= 0 }
}

/* ── 가시 행 목록 ── */
type Row =
  | { kind: 'step', id: string, badge: string, title: string, a: ReturnType<typeof agg> }
  | { kind: 'group', id: string, name: string, a: ReturnType<typeof agg> }
  | { kind: 'task', t: Task }
const rows = computed<Row[]>(() => {
  const out: Row[] = []
  for (const s of tree) {
    const cats = s.cats
      .map(c => ({ c, tasks: c.tasks.filter(taskPass) }))
      .filter(x => x.tasks.length)
    if (!cats.length) continue
    const stepTasks = cats.flatMap(x => x.tasks)
    out.push({ kind: 'step', id: s.id, badge: s.badge, title: s.title, a: agg(stepTasks) })
    if (!stepOpen[s.id]) continue
    for (const { c, tasks } of cats) {
      out.push({ kind: 'group', id: c.id, name: c.name, a: agg(tasks) })
      if (!catOpen[c.id]) continue
      for (const t of tasks) out.push({ kind: 'task', t })
    }
  }
  return out
})

/* ── 막대 기하 ── */
const colDay = (n: number) => `calc(var(--day-w) * ${n})`
function barStyle(t: Task) {
  const s = idxOf.get(t.start!)!, e = idxOf.get(t.end!)!
  return { left: colDay(s), width: colDay(e - s + 1) }
}
function msStyle(t: Task) {
  const s = idxOf.get(t.start!)!
  return { left: `calc(${colDay(s)} + var(--day-w) * 0.5)` }
}
function rollStyle(a: ReturnType<typeof agg>) {
  return { left: colDay(a.minI), width: colDay(a.maxI - a.minI + 1) }
}
const trackWidth = colDay(days.length)
function onFill(t: Task) { return t.progress >= 35 && (idxOf.get(t.end!)! - idxOf.get(t.start!)! + 1) >= 3 }

/* ── 툴팁 ── */
const tip = ref<{ t: Task, x: number, y: number } | null>(null)
function showTip(t: Task, e: MouseEvent) { tip.value = { t, x: e.clientX, y: e.clientY } }
function moveTip(e: MouseEvent) { if (tip.value) { tip.value = { ...tip.value, x: e.clientX, y: e.clientY } } }
function hideTip() { tip.value = null }
const tipPos = computed(() => {
  if (!tip.value) return {}
  const x = Math.min(tip.value.x + 16, (import.meta.client ? window.innerWidth : 1280) - 300)
  return { left: x + 'px', top: (tip.value.y + 16) + 'px' }
})

const subtitle = 'WBS 간트 · Step 1 · 3 · 5 · 화면 단위 · 기준일'
</script>

<template>
  <div class="wbsx">
    <!-- Topbar -->
    <header class="topbar">
      <div class="title-wrap">
        <h1>전체 일정</h1>
        <span class="sub">{{ subtitle }} <b>{{ md(TODAY) }}</b></span>
      </div>
      <div class="kpis">
        <div class="kpi overall">
          <span class="v">{{ kpi.avg }}%</span>
          <span class="l">전체 진척 · {{ kpi.n }}개 작업</span>
          <div class="meter"><i :style="{ width: kpi.avg + '%' }" /></div>
        </div>
        <div class="kpi done"><span class="v">{{ kpi.done }}</span><span class="l">완료</span></div>
        <div class="kpi active"><span class="v">{{ kpi.active }}</span><span class="l">진행중</span></div>
        <div class="kpi late"><span class="v">{{ kpi.late }}</span><span class="l">지연</span></div>
        <div class="kpi"><span class="v">{{ kpi.plan }}</span><span class="l">예정</span></div>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="tgroup">
        <span class="lab">담당</span>
        <button
          v-for="p in PEOPLE"
          :key="p"
          class="chip"
          :data-on="fPeople.has(p)"
          @click="togglePerson(p)"
        >
          <span class="dot" :style="{ background: PCOLOR[p] }" />
          {{ p }}<span class="ct">{{ peopleCount[p] }}</span>
        </button>
      </div>
      <div class="divider" />
      <div class="tgroup">
        <span class="lab">상태</span>
        <div class="seg">
          <button :data-on="fStatus === 'all'" @click="fStatus = 'all'">전체</button>
          <button v-for="st in (['done','active','late','plan'] as const)" :key="st" :data-on="fStatus === st" @click="setStatus(st)">
            <span class="sw" :style="{ background: `var(--${st})` }" />{{ STATUS_LABEL[st] }}
          </button>
        </div>
      </div>
      <input v-model="fSearch" class="search" placeholder="작업 검색…">
      <button class="tbtn" @click="toggleAll">{{ allOpen ? '모두 접기' : '모두 펼치기' }}</button>
      <span class="spacer" />
      <div class="legend">
        <span class="li"><span class="sw" style="background:var(--done)" />완료</span>
        <span class="li"><span class="sw" style="background:var(--active)" />진행중</span>
        <span class="li"><span class="sw" style="background:var(--plan)" />예정</span>
        <span class="li"><span class="sw" style="background:var(--late)" />지연</span>
      </div>
    </div>

    <!-- Gantt -->
    <div class="gantt">
      <div class="ginner">
        <!-- bg grid -->
        <div class="gridbg" :style="{ width: trackWidth }">
          <div class="daylines" />
          <template v-for="(d, i) in days" :key="'wk' + i">
            <div v-if="d.weekend" class="wk" :style="{ left: colDay(i), width: 'var(--day-w)' }" />
          </template>
          <div v-for="(m, i) in months" :key="'ml' + i" class="mline" :style="{ left: colDay(m.startIdx) }" />
        </div>
        <div v-if="todayIdx >= 0" class="todayline" :data-label="md(TODAY)" :style="{ left: `calc(var(--info-w) + ${colDay(todayIdx)} + var(--day-w) * 0.5)` }" />

        <!-- header -->
        <div class="ghead">
          <div class="ihead">
            <div class="hc c-name">구분 · 작업 (화면)</div>
            <div class="hc c-who">담당</div>
            <div class="hc c-s">시작</div>
            <div class="hc c-e">종료</div>
            <div class="hc c-done">완료</div>
            <div class="hc c-prog">진척율</div>
          </div>
          <div class="thead">
            <div class="month-row">
              <div v-for="(m, i) in months" :key="'m' + i" class="month-cell" :style="{ width: colDay(m.span) }">{{ m.month }}월</div>
            </div>
            <div class="day-row">
              <div
                v-for="(d, i) in days"
                :key="'d' + i"
                class="day-cell"
                :class="{ we: d.weekend, sat: d.sat, sun: d.sun, today: d.today, mstart: d.day === 1 }"
              >
                <span class="dn">{{ d.day }}</span>
                <span class="dw">{{ DOW[d.dow] }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- rows -->
        <div v-if="!rows.length" class="empty">조건에 맞는 작업이 없습니다.</div>

        <template v-for="(r, ri) in rows" :key="ri">
          <!-- Step -->
          <div v-if="r.kind === 'step'" class="row srow">
            <div class="info">
              <div class="scell">
                <button class="chev" :data-open="stepOpen[r.id]" @click="stepOpen[r.id] = !stepOpen[r.id]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6" /></svg></button>
                <span class="badge">{{ r.badge }}</span>
                <span class="stitle">{{ r.title }}</span>
                <span class="scount">· {{ r.a.count }}개 · 평균 {{ r.a.avg }}%</span>
              </div>
            </div>
            <div class="track" :style="{ width: trackWidth }">
              <div v-if="r.a.hasBar" class="rollup" style="background:var(--band-2)" :style="rollStyle(r.a)"><i style="background:var(--accent);opacity:1" :style="{ width: r.a.avg + '%' }" /></div>
            </div>
          </div>

          <!-- Group -->
          <div v-else-if="r.kind === 'group'" class="row grow">
            <div class="info">
              <div class="gcell">
                <button class="chev" :data-open="catOpen[r.id]" @click="catOpen[r.id] = !catOpen[r.id]"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6" /></svg></button>
                <span class="gtitle">{{ r.name }}</span>
                <span class="gmeta"><span class="scount">{{ r.a.count }}</span><span class="pct">{{ r.a.avg }}%</span></span>
              </div>
            </div>
            <div class="track" :style="{ width: trackWidth }">
              <div v-if="r.a.hasBar" class="rollup" :style="rollStyle(r.a)"><i :style="{ width: r.a.avg + '%' }" /></div>
            </div>
          </div>

          <!-- Task -->
          <div v-else class="row">
            <div class="info">
              <div class="cell c-name">
                <span class="indent" />
                <a v-if="r.t.href" :href="r.t.href" target="_blank" rel="noopener noreferrer" class="tname"><span>{{ r.t.name }}</span></a>
                <span v-else class="tname" :title="r.t.note ? r.t.name + ' — ' + r.t.note : r.t.name">{{ r.t.name }}</span>
              </div>
              <div class="cell c-who">
                <span v-if="r.t.who.length" class="who">
                  <span class="ava" :style="{ background: PCOLOR[r.t.who[0]!] ?? '#94a3b8' }">{{ r.t.who[0]![0] }}</span>
                  <span class="nm">{{ r.t.who[0] }}</span>
                  <span v-if="r.t.who.length > 1" class="more">+{{ r.t.who.length - 1 }}</span>
                </span>
                <span v-else class="who"><span class="nm dash">미정</span></span>
              </div>
              <div class="cell c-s tnum">{{ md(r.t.start) }}</div>
              <div class="cell c-e tnum">{{ md(r.t.end) }}</div>
              <div class="cell c-done tnum">
                <span v-if="r.t.progress >= 100 && r.t.end" class="dn">{{ md(r.t.end) }}</span>
                <span v-else class="dash">–</span>
              </div>
              <div class="cell c-prog">
                <div class="miniwrap">
                  <div class="mini"><i :style="{ width: r.t.progress + '%', background: `var(--${r.t.status})` }" /></div>
                  <span class="pct" :style="{ color: `var(--${r.t.status})` }">{{ r.t.progress }}%</span>
                </div>
              </div>
            </div>
            <div class="track" :style="{ width: trackWidth }">
              <template v-if="r.t.start && r.t.end">
                <!-- milestone -->
                <div
                  v-if="r.t.start === r.t.end"
                  class="bar ms"
                  :class="r.t.status"
                  :style="msStyle(r.t)"
                  @mouseenter="showTip(r.t, $event)" @mousemove="moveTip" @mouseleave="hideTip"
                ><span class="dia" :style="{ background: `var(--${r.t.status})` }" /></div>
                <!-- bar -->
                <div
                  v-else
                  class="bar"
                  :class="r.t.status"
                  :style="barStyle(r.t)"
                  @mouseenter="showTip(r.t, $event)" @mousemove="moveTip" @mouseleave="hideTip"
                >
                  <span class="fill" :style="{ width: r.t.progress + '%' }" />
                  <span class="blab" :class="{ onfill: onFill(r.t) }">{{ r.t.progress }}%</span>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- tooltip -->
    <div v-if="tip" class="tip" :style="tipPos">
      <div class="tt">{{ tip.t.name }}</div>
      <div class="trow"><span>담당</span><b>{{ tip.t.who.length ? tip.t.who.join(', ') : '미정' }}</b></div>
      <div class="trow"><span>기간</span><b>{{ md(tip.t.start) }} – {{ md(tip.t.end) }}</b></div>
      <div class="trow"><span>상태</span><b class="stat" :style="{ color: `var(--${tip.t.status})` }"><span class="sw" :style="{ background: `var(--${tip.t.status})` }" />{{ STATUS_LABEL[tip.t.status] }}</b></div>
      <div class="trow"><span>진척율</span><b>{{ tip.t.progress }}%</b></div>
      <div class="barmini"><i :style="{ width: tip.t.progress + '%', background: `var(--${tip.t.status})` }" /></div>
    </div>
  </div>
</template>

<style scoped>
.wbsx {
  --bg: #f4f6f8; --surface: #fff; --surface-2: #f8fafc;
  --band: #eef1f5; --band-2: #e7ebf0; --line: #e3e8ee; --line-2: #eef1f5;
  --ink: #1b2330; --ink-2: #5a6675; --ink-3: #8a93a3; --accent: #2563eb;
  --done: #16a34a; --done-bg: #d7f0de; --active: #2563eb; --active-bg: #d6e4fd;
  --plan: #94a3b8; --plan-bg: #e6eaf0; --late: #e0524d; --late-bg: #fadcd9;
  --weekend: #f3f5f8; --today: #f59e0b;
  --shadow-pop: 0 6px 16px rgba(20,30,48,.10), 0 18px 48px rgba(20,30,48,.18);
  --col-name: 300px; --col-who: 84px; --col-s: 50px; --col-e: 50px; --col-done: 56px; --col-prog: 86px;
  --info-w: calc(var(--col-name) + var(--col-who) + var(--col-s) + var(--col-e) + var(--col-done) + var(--col-prog));
  --day-w: 26px; --row-h: 30px; --grp-h: 34px; --step-h: 38px; --fs: 12.5px; --radius: 5px;
  height: calc(100vh - 56px);
  display: flex; flex-direction: column;
  background: var(--bg); color: var(--ink);
  font-size: var(--fs); letter-spacing: -0.01em;
}
.wbsx :deep(.tnum), .tnum { font-variant-numeric: tabular-nums; }

/* topbar */
.topbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 14px 22px 12px; background: var(--surface); border-bottom: 1px solid var(--line); }
.title-wrap { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.topbar h1 { margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.02em; }
.sub { color: var(--ink-2); font-size: 12.5px; font-weight: 500; }
.sub b { color: var(--ink); font-weight: 700; }
.kpis { display: flex; gap: 10px; flex-shrink: 0; }
.kpi { background: var(--surface-2); border: 1px solid var(--line); border-radius: 9px; padding: 8px 13px; min-width: 76px; display: flex; flex-direction: column; gap: 2px; }
.kpi .v { font-size: 19px; font-weight: 800; line-height: 1; letter-spacing: -0.02em; }
.kpi .l { font-size: 10.5px; color: var(--ink-3); font-weight: 600; }
.kpi.done .v { color: var(--done); } .kpi.active .v { color: var(--active); } .kpi.late .v { color: var(--late); }
.kpi.overall { min-width: 150px; }
.meter { height: 6px; border-radius: 4px; background: var(--band-2); overflow: hidden; margin-top: 5px; }
.meter > i { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), #4f86ff); border-radius: 4px; }

/* toolbar */
.toolbar { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 9px 22px; background: var(--surface); border-bottom: 1px solid var(--line); }
.tgroup { display: flex; align-items: center; gap: 7px; }
.tgroup .lab { font-size: 11px; font-weight: 700; color: var(--ink-3); }
.divider { width: 1px; height: 22px; background: var(--line); }
.chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface-2); color: var(--ink-2); font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all .12s ease; }
.chip:hover { border-color: var(--ink-3); color: var(--ink); }
.chip .dot { width: 8px; height: 8px; border-radius: 50%; }
.chip .ct { font-variant-numeric: tabular-nums; color: var(--ink-3); font-size: 11px; }
.chip[data-on="true"] { background: var(--accent); border-color: var(--accent); color: #fff; }
.chip[data-on="true"] .ct { color: rgba(255,255,255,.85); }
.seg { display: inline-flex; background: var(--band); border-radius: 8px; padding: 3px; gap: 2px; }
.seg button { border: 0; background: transparent; cursor: pointer; font: inherit; font-size: 12px; font-weight: 600; color: var(--ink-2); padding: 4px 11px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px; transition: all .12s ease; }
.seg button[data-on="true"] { background: var(--surface); color: var(--ink); box-shadow: 0 1px 2px rgba(20,30,48,.12); }
.seg .sw { width: 8px; height: 8px; border-radius: 2px; }
.search { height: 28px; border: 1px solid var(--line); background: var(--surface-2); border-radius: 8px; padding: 0 10px; font: inherit; font-size: 12px; color: var(--ink); width: 150px; outline: none; transition: border-color .12s, box-shadow .12s; }
.search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--active-bg); }
.tbtn { height: 28px; padding: 0 11px; border-radius: 8px; border: 1px solid var(--line); background: var(--surface-2); color: var(--ink-2); font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .12s ease; }
.tbtn:hover { border-color: var(--ink-3); color: var(--ink); }
.spacer { flex: 1; }
.legend { display: flex; gap: 13px; align-items: center; }
.legend .li { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--ink-2); font-weight: 600; }
.legend .sw { width: 11px; height: 11px; border-radius: 3px; }

/* gantt */
.gantt { flex: 1; overflow: auto; position: relative; background: var(--surface); }
.ginner { position: relative; min-width: max-content; }
.ghead { position: sticky; top: 0; z-index: 40; display: flex; background: var(--surface); box-shadow: 0 1px 0 var(--line); }
.ihead { position: sticky; left: 0; z-index: 2; width: var(--info-w); flex-shrink: 0; display: flex; align-items: stretch; background: var(--surface); border-right: 1.5px solid var(--line); }
.ihead .hc { display: flex; align-items: center; padding: 0 10px; font-size: 11px; font-weight: 700; color: var(--ink-3); border-bottom: 1px solid var(--line); }
.hc.c-name { width: var(--col-name); } .hc.c-who { width: var(--col-who); }
.hc.c-s { width: var(--col-s); justify-content: flex-end; } .hc.c-e { width: var(--col-e); justify-content: flex-end; }
.hc.c-done { width: var(--col-done); justify-content: flex-end; } .hc.c-prog { width: var(--col-prog); justify-content: flex-end; }
.thead { display: flex; flex-direction: column; }
.month-row { display: flex; height: 19px; }
.month-cell { display: flex; align-items: center; padding-left: 8px; font-size: 11px; font-weight: 800; color: var(--ink-2); border-left: 1px solid var(--line); border-bottom: 1px solid var(--line-2); background: var(--surface-2); flex-shrink: 0; }
.day-row { display: flex; }
.day-cell { width: var(--day-w); flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; border-left: 1px solid var(--line-2); border-bottom: 1px solid var(--line); padding: 2px 0; }
.day-cell .dn { font-size: 11px; font-weight: 700; color: var(--ink); line-height: 1; }
.day-cell .dw { font-size: 8.5px; font-weight: 600; color: var(--ink-3); line-height: 1; }
.day-cell.we { background: var(--weekend); }
.day-cell.sun .dn, .day-cell.sun .dw { color: var(--late); }
.day-cell.sat .dn, .day-cell.sat .dw { color: var(--accent); }
.day-cell.today { background: color-mix(in srgb, var(--today) 16%, transparent); }
.day-cell.today .dn { color: var(--today); }
.day-cell.mstart { border-left: 1px solid var(--line); }

/* rows */
.row { display: flex; position: relative; }
.row .info { position: sticky; left: 0; z-index: 10; width: var(--info-w); flex-shrink: 0; display: flex; align-items: stretch; background: var(--surface); border-right: 1.5px solid var(--line); border-bottom: 1px solid var(--line-2); }
.row:hover .info { background: var(--surface-2); }
.row .track { position: relative; height: var(--row-h); border-bottom: 1px solid var(--line-2); flex-shrink: 0; }
.row:hover .track { background: color-mix(in srgb, var(--accent) 4%, transparent); }
.cell { display: flex; align-items: center; padding: 0 10px; height: var(--row-h); }
.cell.c-name { width: var(--col-name); gap: 6px; }
.cell.c-who { width: var(--col-who); }
.cell.c-s { width: var(--col-s); justify-content: flex-end; color: var(--ink-2); font-size: 11px; }
.cell.c-e { width: var(--col-e); justify-content: flex-end; color: var(--ink-2); font-size: 11px; }
.cell.c-done { width: var(--col-done); justify-content: flex-end; font-size: 11px; }
.cell.c-done .dn { color: var(--done); font-weight: 700; display: inline-flex; align-items: center; gap: 3px; }
.cell.c-done .dn::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--done); }
.cell.c-prog { width: var(--col-prog); justify-content: flex-end; gap: 7px; }
.tname { font-size: var(--fs); color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
.tname a, a.tname { color: var(--accent); text-decoration: none; }
a.tname:hover { text-decoration: underline; }
.dash { color: var(--ink-3); }
.who { display: inline-flex; align-items: center; gap: 3px; min-width: 0; }
.ava { width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0; display: grid; place-items: center; font-size: 9.5px; font-weight: 800; color: #fff; }
.who .nm { font-size: 11px; color: var(--ink-2); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.who .more { font-size: 10px; color: var(--ink-3); }
.miniwrap { display: flex; align-items: center; gap: 6px; }
.mini { width: 30px; height: 5px; border-radius: 3px; background: var(--band-2); overflow: hidden; }
.mini > i { display: block; height: 100%; border-radius: 3px; }
.pct { font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums; min-width: 30px; text-align: right; }

/* bars */
.bar { position: absolute; top: 50%; transform: translateY(-50%); height: calc(var(--row-h) - 12px); min-height: 13px; border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: filter .12s, box-shadow .12s; display: flex; align-items: center; }
.bar:hover { filter: brightness(1.04); box-shadow: 0 0 0 2px var(--surface), 0 0 0 3px currentColor; z-index: 3; }
.bar .fill { position: absolute; inset: 0 auto 0 0; height: 100%; border-radius: var(--radius); }
.bar .blab { position: relative; z-index: 1; padding: 0 6px; font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
.bar.done { background: var(--done-bg); color: var(--done); } .bar.done .fill { background: var(--done); }
.bar.active { background: var(--active-bg); color: var(--active); } .bar.active .fill { background: var(--active); }
.bar.plan { background: var(--plan-bg); color: var(--plan); } .bar.plan .fill { background: var(--plan); opacity: .55; }
.bar.late { background: var(--late-bg); color: var(--late); } .bar.late .fill { background: var(--late); }
.bar .blab.onfill { color: #fff; }
.bar.ms { width: 0 !important; overflow: visible; background: transparent !important; }
.bar.ms .dia { position: absolute; top: 50%; left: 0; transform: translate(-50%,-50%) rotate(45deg); width: 12px; height: 12px; border-radius: 2px; box-shadow: 0 0 0 2px var(--surface); }

/* group/step */
.srow { position: sticky; z-index: 20; }
.srow .info { height: var(--step-h); background: var(--band-2); border-bottom: 1px solid var(--line); align-items: center; z-index: 22; }
.srow .track { height: var(--step-h); background: var(--band-2); border-bottom: 1px solid var(--line); }
.scell { display: flex; align-items: center; gap: 9px; padding: 0 10px; width: var(--info-w); }
.badge { font-size: 10.5px; font-weight: 800; color: #fff; background: var(--ink); padding: 2px 8px; border-radius: 5px; }
.stitle { font-size: 13.5px; font-weight: 800; color: var(--ink); }
.scount { font-size: 11px; color: var(--ink-3); font-weight: 600; }
.grow .info { height: var(--grp-h); background: var(--surface); align-items: center; }
.grow .track { height: var(--grp-h); }
.grow:hover .info { background: var(--surface-2); }
.gcell { display: flex; align-items: center; gap: 7px; padding: 0 10px; width: var(--col-name); }
.gtitle { font-size: 12.5px; font-weight: 700; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gmeta { display: flex; align-items: center; margin-left: auto; padding-right: 10px; gap: 8px; }
.gmeta .pct { color: var(--ink-2); }
.chev { width: 16px; height: 16px; flex-shrink: 0; border: 0; background: transparent; cursor: pointer; display: grid; place-items: center; color: var(--ink-3); border-radius: 4px; padding: 0; }
.chev:hover { background: var(--band); color: var(--ink); }
.chev svg { width: 11px; height: 11px; transition: transform .15s ease; }
.chev[data-open="false"] svg { transform: rotate(-90deg); }
.indent { width: 16px; flex-shrink: 0; }
.rollup { position: absolute; top: 50%; transform: translateY(-50%); height: 9px; border-radius: 3px; background: var(--band-2); overflow: hidden; }
.rollup > i { display: block; height: 100%; background: var(--ink-3); opacity: .85; border-radius: 3px; }

/* bg grid */
.gridbg { position: absolute; top: 0; bottom: 0; left: var(--info-w); pointer-events: none; z-index: 0; }
.gridbg .wk { position: absolute; top: 0; bottom: 0; background: var(--weekend); }
.gridbg .daylines { position: absolute; inset: 0; background-image: repeating-linear-gradient(to right, transparent 0, transparent calc(var(--day-w) - 1px), var(--line-2) calc(var(--day-w) - 1px), var(--line-2) var(--day-w)); }
.gridbg .mline { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--line); }
.todayline { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--today); z-index: 6; pointer-events: none; }
.todayline::before { content: "오늘 " attr(data-label); position: absolute; top: 51px; left: 50%; transform: translateX(-50%); font-size: 9.5px; font-weight: 800; color: #fff; background: var(--today); padding: 1px 6px; border-radius: 999px; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,.18); }

/* tooltip */
.tip { position: fixed; z-index: 9999; pointer-events: none; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; box-shadow: var(--shadow-pop); padding: 11px 13px; min-width: 210px; max-width: 290px; font-size: 12px; color: var(--ink); }
.tip .tt { font-weight: 700; font-size: 13px; margin-bottom: 7px; line-height: 1.35; }
.tip .trow { display: flex; justify-content: space-between; gap: 14px; padding: 2.5px 0; color: var(--ink-2); }
.tip .trow b { color: var(--ink); font-weight: 700; font-variant-numeric: tabular-nums; }
.tip .stat { display: inline-flex; align-items: center; gap: 5px; }
.tip .stat .sw { width: 9px; height: 9px; border-radius: 3px; }
.tip .barmini { height: 6px; border-radius: 3px; background: var(--band-2); overflow: hidden; margin-top: 8px; }
.tip .barmini > i { display: block; height: 100%; border-radius: 3px; }
.empty { position: sticky; left: 0; width: 100vw; padding: 40px; text-align: center; color: var(--ink-3); font-size: 13px; }
</style>
