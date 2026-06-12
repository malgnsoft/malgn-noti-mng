import { getSessionMemberId, hashPassword, verifyPassword } from '../../utils/auth'
import { useMembers } from '../../utils/members'

// 비밀번호 변경 — 현재 비밀번호 확인 후 새 비밀번호로 교체.
// 오피스 연동 회원(password_hash null)은 로컬 비밀번호가 없어 불가(SSO 전용).
export default defineEventHandler(async (event) => {
  const id = await getSessionMemberId(event)
  if (!id) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const b = await readBody(event)
  const currentPassword = String(b?.currentPassword ?? '')
  const newPassword = String(b?.newPassword ?? '')

  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, statusMessage: '새 비밀번호는 8자 이상이어야 합니다' })
  }

  const members = useMembers(event)
  const me = await members.findById(id)
  if (!me) throw createError({ statusCode: 404, statusMessage: '회원을 찾을 수 없습니다' })

  if (!me.passwordHash) {
    throw createError({ statusCode: 400, statusMessage: '비밀번호를 사용할 수 없는 계정입니다(맑은오피스 연동)' })
  }
  if (!(await verifyPassword(currentPassword, me.passwordHash))) {
    throw createError({ statusCode: 400, statusMessage: '현재 비밀번호가 올바르지 않습니다' })
  }

  await members.updatePassword(id, await hashPassword(newPassword))
  return { ok: true }
})
