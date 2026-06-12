import { getSessionMemberId } from '../../utils/auth'
import { bodyPreview, useIssues } from '../../utils/issues'

// 이슈 목록 — 세션 필수. 타입·상태 필터 + 제목 검색(q) + 페이지네이션.
// 본문은 목록에서 평문 미리보기로 절단(상세에서만 마크다운 렌더).
export default defineEventHandler(async (event) => {
  const memberId = await getSessionMemberId(event)
  if (!memberId) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const q = getQuery(event)
  const page = Math.max(1, Number(q.page) || 1)
  const { rows, total } = await useIssues(event).list({
    type: typeof q.type === 'string' && q.type ? q.type : undefined,
    status: typeof q.status === 'string' && q.status ? q.status : undefined,
    q: typeof q.q === 'string' && q.q.trim() ? q.q.trim() : undefined,
    page,
  })

  return {
    data: rows.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      status: r.status,
      priority: r.priority,
      authorId: r.authorId,
      authorName: r.authorName,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      preview: bodyPreview(r.body),
    })),
    total,
    page,
  }
})
