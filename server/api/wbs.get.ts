import { asc } from 'drizzle-orm'
import { wbsItem } from '../db/schema'
import { wbsGantt } from '~/utils/wbsData'

// WBS 항목 목록 — D1(wbs_item). dev(바인딩 없음)은 정적 시드 폴백.
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  if (!db) {
    return {
      data: wbsGantt.map((t, i) => ({
        id: i + 1, step: t.step, group: t.group, name: t.name, owner: t.owner,
        start: t.start ?? null, end: t.end ?? null, progress: t.progress,
        note: t.note ?? null, href: t.href ?? null,
      })),
    }
  }
  const rows = await db.select().from(wbsItem).orderBy(asc(wbsItem.sort), asc(wbsItem.id))
  return {
    data: rows.map(r => ({
      id: r.id, step: r.step, group: r.grp, name: r.name, owner: r.owner,
      start: r.start, end: r.end, progress: r.progress, note: r.note, href: r.href,
    })),
  }
})
