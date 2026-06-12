import { verifyOfficeSecret } from '../../../utils/auth'
import { toPublic, useMembers } from '../../../utils/members'

// 맑은오피스 → 회원 자동 가입/갱신 (서버 간 푸시).
// 인증: `x-office-secret` 헤더 == OFFICE_SHARED_SECRET.
// office_id 기준 upsert — 있으면 정보 갱신, 없으면 신규 생성(source='office').
// ⚠️ 필드 매핑은 맑은오피스 실제 스펙 확정 후 조정.
export default defineEventHandler(async (event) => {
  if (!verifyOfficeSecret(event)) {
    throw createError({ statusCode: 401, statusMessage: '인증 실패' })
  }

  const b = await readBody(event)
  const officeId = String(b?.officeId ?? '').trim()
  const loginId = String(b?.loginId ?? officeId).trim()
  const name = String(b?.name ?? '').trim()

  if (!officeId) throw createError({ statusCode: 400, statusMessage: 'officeId가 필요합니다' })
  if (!name) throw createError({ statusCode: 400, statusMessage: '성명(name)이 필요합니다' })

  const members = useMembers(event)

  // loginId 가 다른 회원(직접가입 또는 다른 officeId)에 이미 쓰이면 UNIQUE 충돌(500) 대신 409.
  const clash = await members.findByLoginId(loginId)
  if (clash && clash.officeId !== officeId) {
    throw createError({ statusCode: 409, statusMessage: '해당 아이디가 이미 다른 회원에 사용 중입니다' })
  }

  const { member, created } = await members.upsertByOffice({
    officeId,
    loginId,
    name,
    company: String(b?.company ?? '').trim(),
    role: String(b?.role ?? '').trim(),
    email: String(b?.email ?? '').trim(),
    phone: String(b?.phone ?? '').trim(),
  })

  return { data: toPublic(member), created }
})
