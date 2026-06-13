import { getSessionMemberId } from '../../utils/auth'
import { useIssues } from '../../utils/issues'
import { useMembers } from '../../utils/members'

// 이슈 삭제 — 세션 + 권한(작성자 본인 또는 관리자). 둘 다 아니면 403.
export default defineEventHandler(async (event) => {
  const memberId = await getSessionMemberId(event)
  if (!memberId) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid id' })

  const repo = useIssues(event)
  const existing = await repo.findById(id)
  if (!existing) throw createError({ statusCode: 404, statusMessage: '이슈를 찾을 수 없습니다' })
  if (existing.authorId !== memberId) {
    const me = await useMembers(event).findById(memberId)
    if (me?.grade !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: '삭제 권한이 없습니다' })
    }
  }

  await repo.remove(id)
  return { ok: true }
})
