import { getSessionMemberId } from '../../utils/auth'
import { toPublic, useMembers } from '../../utils/members'

// 현재 로그인 회원 — 세션 없으면 data:null (401 아님, 게스트 판별용).
export default defineEventHandler(async (event) => {
  const id = await getSessionMemberId(event)
  if (!id) return { data: null }
  const m = await useMembers(event).findById(id)
  return { data: m ? toPublic(m) : null }
})
