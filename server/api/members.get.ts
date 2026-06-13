import { requireAdmin, toPublic, useMembers } from '../utils/members'

// 프로젝트 참여자 목록 — 관리자(grade=admin) 전용. 승인 대기(pending) 회원 포함 전체.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await useMembers(event).list()
  return { data: rows.map(toPublic) }
})
