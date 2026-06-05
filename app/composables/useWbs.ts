// malgn-noti-api 공개 WBS 엔드포인트(GET /wbs) 조회 + 파생 통계.
// 현황판(/board)과 대시보드(/)가 공유. read-only (편집은 malgn-noti /wbs 에서).

export type WbsStatus = 'done' | 'in_progress' | 'pending' | 'blocked'

export interface WbsTask {
  id: string
  group?: string
  title: string
  status: WbsStatus
  owner: string
  note?: string
  targetDate?: string
  completionDate?: string
  href?: string
}

export interface WbsStage {
  id: string
  no: string
  emoji: string
  name: string
  summary: string
  weight: number
  progress: number
  tasks: WbsTask[]
}

export interface WbsDocument {
  projectName: string
  lastUpdated: string
  stages: WbsStage[]
}

export const wbsStatusMeta: Record<WbsStatus, { label: string, dot: string, chip: string }> = {
  done: { label: '완료', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: '진행 중', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending: { label: '대기', dot: 'bg-neutral-300', chip: 'bg-neutral-50 text-neutral-600 border-neutral-200' },
  blocked: { label: '보류', dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
}

export function wbsProgressFill(pct: number) {
  if (pct >= 70) return 'bg-emerald-500'
  if (pct >= 30) return 'bg-amber-500'
  if (pct > 0) return 'bg-neutral-400'
  return 'bg-neutral-200'
}

/* 정본 저장 포맷: `YYYY.MM.DD`. 레거시(`5/8`)는 2026 기준 표시 변환만. */
export function wbsFormatYmd(raw?: string): string {
  if (!raw) return ''
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(raw)) return raw
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.replace(/-/g, '.')
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})$/)
  if (m) return `2026.${m[1]!.padStart(2, '0')}.${m[2]!.padStart(2, '0')}`
  return raw
}

export function wbsGroupedTasks(stage: WbsStage) {
  const groups: { name: string, tasks: WbsTask[] }[] = []
  for (const t of stage.tasks) {
    const name = t.group ?? ''
    let g = groups.find(x => x.name === name)
    if (!g) { g = { name, tasks: [] }; groups.push(g) }
    g.tasks.push(t)
  }
  return groups
}

export function useWbs() {
  const config = useRuntimeConfig()

  const { data, pending, error, refresh } = useFetch<{ data: WbsDocument }>('/wbs', {
    baseURL: config.public.apiBaseUrl,
    key: 'wbs',
  })

  const doc = computed<WbsDocument | null>(() => data.value?.data ?? null)
  const stages = computed<WbsStage[]>(() => doc.value?.stages ?? [])
  const projectName = computed(() => doc.value?.projectName ?? '맑은 메시징')
  const lastUpdated = computed(() => doc.value?.lastUpdated ?? '—')

  const allTasks = computed(() => stages.value.flatMap(s => s.tasks))

  const totalCounts = computed(() => {
    const acc: Record<WbsStatus, number> = { done: 0, in_progress: 0, pending: 0, blocked: 0 }
    for (const t of allTasks.value) acc[t.status]++
    return acc
  })

  const weightedAverage = computed(() => {
    const s = stages.value
    if (s.length === 0) return 0
    const totalWeight = s.reduce((a, x) => a + x.weight, 0)
    const numerator = s.reduce((a, x) => a + x.weight * x.progress, 0)
    return Math.round((numerator / totalWeight) * 10) / 10
  })

  return {
    doc,
    stages,
    projectName,
    lastUpdated,
    allTasks,
    totalCounts,
    weightedAverage,
    pending,
    error,
    refresh,
  }
}
