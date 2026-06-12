import { safeRedirectPath, setSession, verifyOfficeToken } from '../../utils/auth'
import { useMembers } from '../../utils/members'

// 맑은오피스 SSO 핸드오프 — 가입 없이 사이트 진입.
// 흐름: 맑은오피스가 서명 토큰으로 `/api/auth/sso?token=...&redirect=/` 리다이렉트
//   → 토큰 검증 → 회원 upsert(자동 가입/갱신) → 세션 발급 → redirect 로 이동.
// ⚠️ 토큰 서명·필드 규약은 맑은오피스 실제 스펙 확정 후 조정.
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const token = String(q.token ?? '')
  const redirect = safeRedirectPath(q.redirect)

  if (!token) throw createError({ statusCode: 400, statusMessage: '토큰이 필요합니다' })

  const payload = await verifyOfficeToken(event, token)
  if (!payload) throw createError({ statusCode: 401, statusMessage: '유효하지 않거나 만료된 토큰입니다' })

  const { member } = await useMembers(event).upsertByOffice({
    officeId: payload.officeId,
    loginId: payload.loginId,
    name: payload.name,
    company: payload.company ?? '',
    role: payload.role ?? '',
    email: payload.email ?? '',
    phone: payload.phone ?? '',
  })

  await setSession(event, member.id)
  return sendRedirect(event, redirect, 302)
})
