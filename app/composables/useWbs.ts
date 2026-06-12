// WBS 공용 타입 + 표시 헬퍼(상태 메타·진행률 색·날짜 포맷·그룹핑).
// 데이터 정본은 WBS(간트) — D1 wbs_item + wbsStageMeta(단계 진척). 대시보드 요약도 동일 소스.

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
