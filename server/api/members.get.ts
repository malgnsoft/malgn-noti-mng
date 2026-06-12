import { getSessionMemberId } from '../utils/auth'
import { toPublic, useMembers } from '../utils/members'

// 프로젝트 참여자 목록 — 로그인 필요.
export default defineEventHandler(async (event) => {
  const id = await getSessionMemberId(event)
  if (!id) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })
  const rows = await useMembers(event).list()
  return { data: rows.map(toPublic) }
})
