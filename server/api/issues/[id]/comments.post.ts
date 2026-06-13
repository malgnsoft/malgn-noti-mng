import { getSessionMemberId } from '../../../utils/auth'
import { useIssueComments } from '../../../utils/issueComments'
import { useIssues } from '../../../utils/issues'
import { useMembers } from '../../../utils/members'

// 이슈 답글 작성 — 로그인 필요. 작성자 = 세션 회원(authorName 스냅샷).
export default defineEventHandler(async (event) => {
  const memberId = await getSessionMemberId(event)
  if (!memberId) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const issueId = Number(getRouterParam(event, 'id'))
  if (!issueId) throw createError({ statusCode: 400, statusMessage: 'invalid id' })

  const exists = await useIssues(event).findById(issueId)
  if (!exists) throw createError({ statusCode: 404, statusMessage: '이슈를 찾을 수 없습니다' })

  const b = await readBody(event)
  const body = String(b?.body ?? '').trim()
  if (!body) throw createError({ statusCode: 400, statusMessage: '내용을 입력하세요' })
  if (body.length > 5000) throw createError({ statusCode: 400, statusMessage: '답글은 5000자 이하로 입력하세요' })

  const me = await useMembers(event).findById(memberId)
  if (!me) throw createError({ statusCode: 401, statusMessage: '회원 정보를 찾을 수 없습니다' })

  const row = await useIssueComments(event).create({
    issueId,
    body,
    authorId: memberId,
    authorName: me.name,
  })
  return { data: row }
})
