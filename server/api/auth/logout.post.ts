import { clearAuthSession } from '../../utils/auth'

// 로그아웃 — 세션 쿠키 제거.
export default defineEventHandler((event) => {
  clearAuthSession(event)
  return { ok: true }
})
