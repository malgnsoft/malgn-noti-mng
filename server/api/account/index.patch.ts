import { getSessionMemberId } from '../../utils/auth'
import { toPublic, useMembers } from '../../utils/members'

// 내 정보 수정 — 로그인 회원 본인의 프로필(성명·회사명·역할·이메일·휴대폰).
// 아이디·비밀번호·source 는 변경 대상 아님.
export default defineEventHandler(async (event) => {
  const id = await getSessionMemberId(event)
  if (!id) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const b = await readBody(event)
  const name = String(b?.name ?? '').trim()
  const email = String(b?.email ?? '').trim()
  const phone = String(b?.phone ?? '').trim()

  if (!name) throw createError({ statusCode: 400, statusMessage: '성명을 입력하세요' })
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: '이메일 형식이 올바르지 않습니다' })
  }
  if (phone && !/^[0-9-]{9,20}$/.test(phone)) {
    throw createError({ statusCode: 400, statusMessage: '휴대전화번호 형식이 올바르지 않습니다' })
  }

  const updated = await useMembers(event).updateProfile(id, {
    name,
    company: String(b?.company ?? '').trim(),
    role: String(b?.role ?? '').trim(),
    email,
    phone,
  })
  if (!updated) throw createError({ statusCode: 404, statusMessage: '회원을 찾을 수 없습니다' })

  return { data: toPublic(updated) }
})
