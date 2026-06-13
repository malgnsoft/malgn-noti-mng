// 서버 시그니처(event, collection) 명시 — 자동 import 는 typecheck 가 클라 오버로드로 오인.
import { queryCollection } from '@nuxt/content/nitro'

// 단일 문서 조회 — 서버에서 콘텐츠 D1 을 path 로 조회해 전체 doc(렌더용 body AST 포함) 반환.
// 클라이언트 queryCollection 의 네비 시 빈 결과 문제를 피하기 위해 상세도 서버 API 로 일원화.
// 인증 게이트(/api/doc) 보호.
export default defineEventHandler(async (event) => {
  const path = getQuery(event).path
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw createError({ statusCode: 400, statusMessage: '잘못된 문서 경로입니다' })
  }
  const doc = await queryCollection(event, 'docs').path(path).first()
  return { data: doc ?? null }
})
