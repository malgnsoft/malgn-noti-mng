import { getSessionMemberId } from '../utils/auth'

// 데이터 인증 게이트 — 보호 대상 요청은 유효 세션 필수(401).
// 페이지는 전역 라우트 미들웨어가 막고, 서버 데이터/문서 덤프는 이 미들웨어가 막는다.
//
// 1) 데이터 API 프리픽스: /api/wbs, /api/issues, /api/members, /api/account, /api/board.
//    공개(인증 불필요): /api/auth/*(login·signup·check-id·me·sso·logout),
//    /api/integration/office/*(자체 공유 시크릿으로 검증) 등.
// 2) 문서 덤프(Task #8): `/__nuxt_content/**` — @nuxt/content 가 문서 전체 SQL 덤프를
//    런타임 핸들러로 서빙하는 경로. 비로그인 노출 차단.
//    ⚠️ redirect 가 아니라 401 로 막는다 — 콘텐츠 런타임의 내부 시드 fetch
//    (event.$fetch, 로그인 사용자 쿠키 전달)는 통과하고 익명만 차단해 /docs 가 깨지지 않게.
//    (루트 정적 사본 `/dump.docs.sql` 은 실제 파일이라 워커가 미들웨어 이전에 단락 처리하므로
//     여기서 못 막고 nuxt.config 의 _redirects 로 차단한다.)
const PROTECTED_PREFIXES = ['/api/wbs', '/api/issues', '/api/members', '/api/account', '/api/board', '/api/uploads']
const PROTECTED_DUMP_PREFIXES = ['/__nuxt_content']

function matches(path: string, prefixes: string[]): boolean {
  return prefixes.some(p => path === p || path.startsWith(`${p}/`))
}

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? ''
  if (!matches(path, PROTECTED_PREFIXES) && !matches(path, PROTECTED_DUMP_PREFIXES)) return

  const memberId = await getSessionMemberId(event)
  if (!memberId) {
    throw createError({ statusCode: 401, statusMessage: '인증이 필요합니다' })
  }
})
