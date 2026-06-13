// 전역 인증 게이트 — 공개 allowlist 외 모든 페이지/문서는 로그인 필수.
// 프리렌더를 끄고 SSR(Functions)로 전환했으므로, 매 요청이 워커를 거치며
// SSR 단계에서 비로그인 시 /login 으로 리다이렉트된다(정적 HTML 직접 노출 방지).
// 공개 경로: 로그인·회원가입(가입은 승인 대기라 세션 미발급 → 완료 안내 페이지도 공개).
// 그 외(/, /docs, /wbs, /history, /account, /members …)는 전부 보호.
const PUBLIC_PATHS = new Set(['/login', '/signup', '/signup/complete'])

export default defineNuxtRouteMiddleware((to) => {
  if (PUBLIC_PATHS.has(to.path)) return

  const { member } = useAuth()
  if (!member.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
