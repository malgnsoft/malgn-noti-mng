import { setSession, verifyPassword } from '../../utils/auth'
import { toPublic, useMembers } from '../../utils/members'

// 비밀번호 로그인 — 아이디 + 비밀번호. (직접가입 회원만, 오피스 연동 회원은 SSO 사용)
export default defineEventHandler(async (event) => {
  const b = await readBody(event)
  const loginId = String(b?.loginId ?? '').trim()
  const password = String(b?.password ?? '')

  if (!loginId || !password) {
    throw createError({ statusCode: 400, statusMessage: '아이디와 비밀번호를 입력하세요' })
  }

  const members = useMembers(event)
  const m = await members.findByLoginId(loginId)

  // 아이디 없음 / 비밀번호 미설정(오피스 회원) / 불일치 — 모두 동일 메시지(계정 존재 노출 방지)
  const ok = !!m && !!m.passwordHash && (await verifyPassword(password, m.passwordHash))
  if (!ok || !m) {
    throw createError({ statusCode: 401, statusMessage: '아이디 또는 비밀번호가 올바르지 않습니다' })
  }
  if (m.status !== 'active') {
    throw createError({ statusCode: 403, statusMessage: '사용이 정지된 계정입니다' })
  }

  await setSession(event, m.id)
  return { data: toPublic(m) }
})
