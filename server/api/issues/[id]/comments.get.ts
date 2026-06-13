import { getSessionMemberId } from '../../../utils/auth'
import { useIssueComments } from '../../../utils/issueComments'

// 이슈 답글 목록 — 로그인 필요(읽기는 모든 회원 허용).
export default defineEventHandler(async (event) => {
  const memberId = await getSessionMemberId(event)
  if (!memberId) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const issueId = Number(getRouterParam(event, 'id'))
  if (!issueId) throw createError({ statusCode: 400, statusMessage: 'invalid id' })

  const rows = await useIssueComments(event).listByIssue(issueId)
  return { data: rows }
})
