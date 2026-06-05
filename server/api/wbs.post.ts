import { wbsItem } from '../db/schema'

// WBS 항목 등록
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  if (!db) throw createError({ statusCode: 503, statusMessage: 'D1 not available' })
  const b = await readBody(event)
  const name = String(b?.name ?? '').trim()
  if (!name) throw createError({ statusCode: 400, statusMessage: '작업명을 입력하세요' })
  const [row] = await db.insert(wbsItem).values({
    step: Number(b.step) || 1,
    grp: String(b.group ?? b.grp ?? '').trim() || '미분류',
    name,
    owner: String(b.owner ?? '').trim(),
    start: b.start || null,
    end: b.end || null,
    progress: Math.max(0, Math.min(100, Number(b.progress) || 0)),
    note: b.note ? String(b.note) : null,
    href: b.href ? String(b.href) : null,
    sort: Number(b.sort) || 999,
  }).returning()
  return { data: row }
})
