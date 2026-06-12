import { useMembers } from '../../utils/members'

// 아이디 중복확인 — `?loginId=`. 형식 검증 + 사용 가능 여부.
export default defineEventHandler(async (event) => {
  const loginId = String(getQuery(event).loginId ?? '').trim()

  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(loginId)) {
    return { loginId, valid: false, available: false, reason: '아이디는 영문/숫자 3~32자입니다' }
  }

  const exists = await useMembers(event).findByLoginId(loginId)
  return {
    loginId,
    valid: true,
    available: !exists,
    reason: exists ? '이미 사용 중인 아이디입니다' : '사용 가능한 아이디입니다',
  }
})
