import { getSessionMemberId } from '../../../../utils/auth'
import { useIssueComments } from '../../../../utils/issueComments'
import { useMembers } from '../../../../utils/members'

// 이슈 답글 삭제 — 작성자 본인 또는 관리자. 둘 다 아니면 403.
export default defineEventHandler(async (event) => {
  const memberId = await getSessionMemberId(event)
  if (!memberId) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const cid = Number(getRouterParam(event, 'cid'))
  if (!cid) throw createError({ statusCode: 400, statusMessage: 'invalid id' })

  const repo = useIssueComments(event)
  const c = await repo.findById(cid)
  if (!c) throw createError({ statusCode: 404, statusMessage: '답글을 찾을 수 없습니다' })

  if (c.authorId !== memberId) {
    const me = await useMembers(event).findById(memberId)
    if (me?.grade !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: '삭제 권한이 없습니다' })
    }
  }

  await repo.remove(cid)
  return { ok: true }
})
