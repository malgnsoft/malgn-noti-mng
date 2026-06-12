import { getSessionMemberId } from '../../utils/auth'
import { useIssues } from '../../utils/issues'

// 이슈 상세 — 세션 필수. 본문(마크다운 원문) 포함 전체 레코드 반환.
export default defineEventHandler(async (event) => {
  const memberId = await getSessionMemberId(event)
  if (!memberId) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid id' })

  const row = await useIssues(event).findById(id)
  if (!row) throw createError({ statusCode: 404, statusMessage: '이슈를 찾을 수 없습니다' })
  return { data: row }
})
