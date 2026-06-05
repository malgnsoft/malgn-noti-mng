import type { WbsDocument, WbsStage, WbsTask, WbsStatus } from '~/composables/useWbs'

// 현황판 데이터 API — Cloudflare D1(malgn-noti-project) 의 board_meta/stage/task 를 조립해 반환.
// D1 바인딩이 없는 로컬 dev 에서는 시드(boardSeed, server/utils 자동 임포트)로 폴백.

interface D1Like {
  prepare(query: string): {
    first<T = unknown>(): Promise<T | null>
    all<T = unknown>(): Promise<{ results: T[] }>
  }
}

interface StageRow {
  id: string
  no: string
  name: string
  emoji: string | null
  summary: string | null
  weight: number
  progress: number
}
interface TaskRow {
  id: string
  stage_id: string
  grp: string | null
  title: string
  status: string
  owner: string | null
  note: string | null
  target_date: string | null
  completion_date: string | null
  href: string | null
}

export default defineEventHandler(async (event): Promise<{ data: WbsDocument }> => {
  const db = (event.context.cloudflare?.env as { DB?: D1Like } | undefined)?.DB

  // 로컬 dev (D1 바인딩 없음) → 시드 폴백
  if (!db) {
    return { data: boardSeed }
  }

  const meta = await db
    .prepare('SELECT project_name, last_updated FROM board_meta WHERE id = 1')
    .first<{ project_name: string, last_updated: string }>()

  const stageRows = (await db.prepare('SELECT * FROM stage ORDER BY sort').all<StageRow>()).results
  const taskRows = (await db.prepare('SELECT * FROM task ORDER BY sort').all<TaskRow>()).results

  const stages: WbsStage[] = stageRows.map(s => ({
    id: s.id,
    no: s.no,
    name: s.name,
    emoji: s.emoji ?? '',
    summary: s.summary ?? '',
    weight: s.weight,
    progress: s.progress,
    tasks: taskRows
      .filter(t => t.stage_id === s.id)
      .map((t): WbsTask => ({
        id: t.id,
        group: t.grp ?? undefined,
        title: t.title,
        status: t.status as WbsStatus,
        owner: t.owner ?? '',
        note: t.note ?? undefined,
        targetDate: t.target_date ?? undefined,
        completionDate: t.completion_date ?? undefined,
        href: t.href ?? undefined,
      })),
  }))

  return {
    data: {
      projectName: meta?.project_name ?? '맑은 메시징',
      lastUpdated: meta?.last_updated ?? '—',
      stages,
    },
  }
})
