// 서버 시그니처(event, collection) 명시 — 자동 import 는 typecheck 가 클라 오버로드로 오인.
import { queryCollection } from '@nuxt/content/nitro'

// 콘텐츠(문서 + history) 목록 — 서버에서 콘텐츠 D1 을 조회해 path/title/description 만 반환.
// 클라이언트 queryCollection 은 클릭 네비 시 클라 콘텐츠 DB 로딩 타이밍 문제로 빈 결과를 주므로,
// 목록은 서버 API 로 일원화(SSR·클라 네비 모두 D1 에서 동일하게 조회). 인증 게이트(/api/docs) 보호.
export default defineEventHandler(async (event) => {
  const docs = await queryCollection(event, 'docs').order('path', 'ASC').all()
  return docs.map(d => ({ path: d.path, title: d.title, description: d.description }))
})
