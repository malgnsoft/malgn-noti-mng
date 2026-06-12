// 앱 시작 시 현재 로그인 회원을 1회 로드(SSR 쿠키 포워딩) → 전역 상태 채움.
// 미들웨어/내비게이션이 초기 렌더부터 로그인 상태를 알 수 있게 한다.
export default defineNuxtPlugin(async () => {
  const member = useState<AuthMember | null>('auth:member', () => null)
  try {
    const res = await useRequestFetch()<{ data: AuthMember | null }>('/api/auth/me')
    member.value = res.data
  }
  catch {
    member.value = null
  }
})
