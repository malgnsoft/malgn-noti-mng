import { asc, eq } from 'drizzle-orm'
import type { WbsDocument, WbsStage, WbsTask, WbsStatus } from '~/composables/useWbs'
import { boardMeta, stage, task } from '../db/schema'

// 현황판 데이터 API — D1(malgn-noti-project)을 Drizzle ORM 으로 직접 조회해 조립.
// D1 바인딩이 없는 로컬 dev 는 시드(boardSeed, server/utils 자동 임포트)로 폴백.

export default defineEventHandler(async (event): Promise<{ data: WbsDocument }> => {
  const db = useDb(event)
  if (!db) {
    return { data: boardSeed }
  }

  const [meta] = await db.select().from(boardMeta).where(eq(boardMeta.id, 1)).limit(1)
  const stageRows = await db.select().from(stage).orderBy(asc(stage.sort))
  const taskRows = await db.select().from(task).orderBy(asc(task.sort))

  const stages: WbsStage[] = stageRows.map(s => ({
    id: s.id,
    no: s.no,
    name: s.name,
    emoji: s.emoji ?? '',
    summary: s.summary ?? '',
    weight: s.weight,
    progress: s.progress,
    tasks: taskRows
      .filter(t => t.stageId === s.id)
      .map((t): WbsTask => ({
        id: t.id,
        group: t.grp ?? undefined,
        title: t.title,
        status: t.status as WbsStatus,
        owner: t.owner ?? '',
        note: t.note ?? undefined,
        targetDate: t.targetDate ?? undefined,
        completionDate: t.completionDate ?? undefined,
        href: t.href ?? undefined,
      })),
  }))

  return {
    data: {
      projectName: meta?.projectName ?? '맑은 메시징',
      lastUpdated: meta?.lastUpdated ?? '—',
      stages,
    },
  }
})
