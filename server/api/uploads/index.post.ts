import { getSessionMemberId } from '../../utils/auth'
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, useFileStore } from '../../utils/uploads'

// 이슈 첨부 이미지 업로드 — 세션 필수(/api/uploads 는 인증 게이트 보호).
// multipart/form-data 의 `file` 파트를 R2 에 저장하고 본문 삽입용 URL 을 반환.
// 화이트리스트 이미지 MIME 만 허용(SVG/스크립트 차단), 5MB 상한.
export default defineEventHandler(async (event) => {
  const memberId = await getSessionMemberId(event)
  if (!memberId) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(p => p.name === 'file' && p.filename)
  if (!filePart) throw createError({ statusCode: 400, statusMessage: '파일이 없습니다' })

  const contentType = (filePart.type || '').toLowerCase().split(';')[0]?.trim() ?? ''
  const ext = ALLOWED_IMAGE_TYPES[contentType]
  if (!ext) {
    throw createError({ statusCode: 415, statusMessage: 'PNG·JPG·GIF·WEBP 이미지만 업로드할 수 있습니다' })
  }

  const data = filePart.data
  if (!data || data.byteLength === 0) {
    throw createError({ statusCode: 400, statusMessage: '빈 파일입니다' })
  }
  if (data.byteLength > MAX_UPLOAD_BYTES) {
    throw createError({ statusCode: 413, statusMessage: '이미지는 5MB 이하만 업로드할 수 있습니다' })
  }

  const key = `${crypto.randomUUID()}.${ext}`
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  await useFileStore(event).put(key, buffer, contentType)

  // 원본 파일명을 마크다운 alt 로 활용(확장자 제거·이스케이프는 클라이언트에서 처리).
  const name = (filePart.filename ?? '').replace(/\.[^.]+$/, '') || '이미지'
  return { data: { url: `/api/uploads/${key}`, name } }
})
