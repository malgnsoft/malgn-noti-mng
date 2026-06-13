import { requireAdmin, useMembers } from '../../utils/members'

// 참여자 삭제(가입 거절 포함) — 관리자 전용. 본인 삭제 불가.
export default defineEventHandler(async (event) => {
  const me = await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  if (id === me.id) {
    throw createError({ statusCode: 400, statusMessage: '본인 계정은 삭제할 수 없습니다' })
  }

  const ok = await useMembers(event).remove(id)
  if (!ok) throw createError({ statusCode: 404, statusMessage: '회원을 찾을 수 없습니다' })
  return { ok: true }
})
