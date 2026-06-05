import { eq } from 'drizzle-orm'
import { wbsItem } from '../../db/schema'

// WBS 항목 수정
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  if (!db) throw createError({ statusCode: 503, statusMessage: 'D1 not available' })
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  const b = await readBody(event)
  const patch: Record<string, unknown> = {}
  if ('step' in b) patch.step = Number(b.step) || 1
  if ('group' in b || 'grp' in b) patch.grp = String(b.group ?? b.grp ?? '').trim() || '미분류'
  if ('name' in b) patch.name = String(b.name ?? '').trim()
  if ('owner' in b) patch.owner = String(b.owner ?? '').trim()
  if ('start' in b) patch.start = b.start || null
  if ('end' in b) patch.end = b.end || null
  if ('progress' in b) patch.progress = Math.max(0, Math.min(100, Number(b.progress) || 0))
  if ('note' in b) patch.note = b.note ? String(b.note) : null
  if ('href' in b) patch.href = b.href ? String(b.href) : null
  if ('sort' in b) patch.sort = Number(b.sort) || 0
  const [row] = await db.update(wbsItem).set(patch).where(eq(wbsItem.id, id)).returning()
  if (!row) throw createError({ statusCode: 404, statusMessage: 'not found' })
  return { data: row }
})
