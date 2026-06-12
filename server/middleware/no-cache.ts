// HTML 페이지 응답은 브라우저가 캐시하지 않도록 no-cache 를 강제한다.
// 배경: 이 앱은 그동안 SSR HTML 응답에 Cache-Control 이 없어 브라우저 휴리스틱 캐시가
//       옛 문서를 재사용 → "배포했는데 화면이 그대로"(옛 CSS/레이아웃) 문제를 유발.
// 정책:
//  - 해시된 정적 에셋(/_nuxt/*)·API(/api/*)·콘텐츠 덤프(/__nuxt_content)는 건드리지 않는다
//    (에셋은 파일명 해시로 immutable 캐시 유지가 맞고, API/덤프는 별도 미들웨어 관할).
//  - 그 외 text/html 내비게이션 응답에만 no-cache, must-revalidate 를 부여 →
//    매 방문마다 서버 재검증 → 배포 직후 최신 HTML(=최신 인라인 CSS) 수신 보장.
export default defineEventHandler((event) => {
  const path = (event.path.split('?')[0] ?? '')
  if (path.startsWith('/_nuxt/') || path.startsWith('/api/') || path.startsWith('/__nuxt_content')) return

  const accept = getRequestHeader(event, 'accept') ?? ''
  if (!accept.includes('text/html')) return

  setResponseHeader(event, 'cache-control', 'no-cache, must-revalidate')
})
