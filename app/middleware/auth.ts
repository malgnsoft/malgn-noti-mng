// 보호 페이지 — 비로그인 시 /login 으로(원래 목적지 redirect 보존).
export default defineNuxtRouteMiddleware((to) => {
  const { member } = useAuth()
  if (!member.value) {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
