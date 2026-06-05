import { eq } from 'drizzle-orm'
import { wbsItem } from '../../db/schema'

// WBS 항목 삭제
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  if (!db) throw createError({ statusCode: 503, statusMessage: 'D1 not available' })
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  await db.delete(wbsItem).where(eq(wbsItem.id, id))
  return { ok: true }
})
