import { getSessionMemberId } from '../utils/auth'

// 데이터 API 인증 게이트 — 보호 대상 /api/* 엔드포인트는 유효 세션 필수(401).
// 페이지는 전역 라우트 미들웨어가 막고, 서버 데이터는 이 미들웨어가 막는다.
//
// 보호 대상(프리픽스): /api/wbs, /api/members, /api/account, /api/board.
// 공개(인증 불필요): /api/auth/*(login·signup·check-id·me·sso·logout),
//   /api/integration/office/*(자체 공유 시크릿으로 검증), @nuxt/content 런타임 조회 등.
// → 명시적 보호 목록 방식으로, 콘텐츠/넉스트 내부 라우트를 깨뜨리지 않는다.
const PROTECTED_PREFIXES = ['/api/wbs', '/api/members', '/api/account', '/api/board']

function isProtected(path: string): boolean {
  return PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!isProtected(path)) return

  const memberId = await getSessionMemberId(event)
  if (!memberId) {
    throw createError({ statusCode: 401, statusMessage: '인증이 필요합니다' })
  }
})
