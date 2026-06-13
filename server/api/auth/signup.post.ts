import { hashPassword } from '../../utils/auth'
import { useMembers } from '../../utils/members'

// 직접 회원가입 — 아이디/비밀번호/성명/회사명/역할/이메일/휴대전화.
// status='pending' 으로 생성 → 관리자 승인 후에만 로그인 가능(세션 발급 안 함).
export default defineEventHandler(async (event) => {
  const b = await readBody(event)

  const loginId = String(b?.loginId ?? '').trim()
  const password = String(b?.password ?? '')
  const name = String(b?.name ?? '').trim()
  const company = String(b?.company ?? '').trim()
  const role = String(b?.role ?? '').trim()
  const email = String(b?.email ?? '').trim()
  const phone = String(b?.phone ?? '').trim()
  const agreedPrivacy = b?.agreedPrivacy === true

  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(loginId)) {
    throw createError({ statusCode: 400, statusMessage: '아이디는 영문/숫자 3~32자입니다' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: '비밀번호는 8자 이상이어야 합니다' })
  }
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: '성명을 입력하세요' })
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: '이메일 형식이 올바르지 않습니다' })
  }
  if (phone && !/^[0-9-]{9,20}$/.test(phone)) {
    throw createError({ statusCode: 400, statusMessage: '휴대전화번호 형식이 올바르지 않습니다' })
  }
  if (!agreedPrivacy) {
    throw createError({ statusCode: 400, statusMessage: '개인정보 수집·이용에 동의해야 합니다' })
  }

  const members = useMembers(event)
  if (await members.findByLoginId(loginId)) {
    throw createError({ statusCode: 409, statusMessage: '이미 사용 중인 아이디입니다' })
  }

  const passwordHash = await hashPassword(password)
  const created = await members.create({
    loginId, passwordHash, name, company, role, email, phone,
    agreedAt: new Date().toISOString(),
  })

  // 자동 로그인하지 않는다 — 관리자 승인(status=active) 후 로그인 가능.
  return { data: { pending: true, name: created.name } }
})
