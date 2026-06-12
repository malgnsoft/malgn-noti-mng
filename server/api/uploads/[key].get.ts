import { getSessionMemberId } from '../../utils/auth'
import { useFileStore } from '../../utils/uploads'

// 이슈 첨부 이미지 서빙 — 세션 필수(/api/uploads 는 인증 게이트 보호).
// 본문에 삽입된 <img src="/api/uploads/<key>"> 요청은 동일 출처 쿠키를 동반하므로
// 로그인 사용자에게는 정상 노출되고, 비로그인엔 401(전체 사이트 게이트와 일관).
// 키는 UUID 기반이라 추측 불가 + 콘텐츠 불변 → 장기 immutable 캐시.
export default defineEventHandler(async (event) => {
  const memberId = await getSessionMemberId(event)
  if (!memberId) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const key = getRouterParam(event, 'key') ?? ''
  if (!/^[a-f0-9-]+\.(png|jpg|gif|webp)$/i.test(key)) {
    throw createError({ statusCode: 400, statusMessage: '잘못된 파일 경로입니다' })
  }

  const file = await useFileStore(event).get(key)
  if (!file) throw createError({ statusCode: 404, statusMessage: '파일을 찾을 수 없습니다' })

  setResponseHeader(event, 'content-type', file.contentType)
  setResponseHeader(event, 'cache-control', 'private, max-age=31536000, immutable')
  return new Uint8Array(file.body)
})
