import { getSessionMemberId } from '../../utils/auth'
import { isIssuePriority, isIssueStatus, isIssueType, useIssues } from '../../utils/issues'
import type { IssuePatch } from '../../utils/issues'

// 이슈 수정 / 상태 변경 — 세션 + 소유권(작성자 본인). 부분 업데이트.
// 작성자(또는 향후 admin) 아니면 403. 상태만 변경도 동일 엔드포인트.
export default defineEventHandler(async (event) => {
  const memberId = await getSessionMemberId(event)
  if (!memberId) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid id' })

  const repo = useIssues(event)
  const existing = await repo.findById(id)
  if (!existing) throw createError({ statusCode: 404, statusMessage: '이슈를 찾을 수 없습니다' })
  if (existing.authorId !== memberId) {
    throw createError({ statusCode: 403, statusMessage: '수정 권한이 없습니다' })
  }

  const b = await readBody(event)
  const patch: IssuePatch = {}

  if ('type' in b) {
    if (!isIssueType(b.type)) throw createError({ statusCode: 400, statusMessage: '유효하지 않은 분류입니다' })
    patch.type = b.type
  }
  if ('title' in b) {
    const title = String(b.title ?? '').trim()
    if (!title) throw createError({ statusCode: 400, statusMessage: '제목을 입력하세요' })
    patch.title = title
  }
  if ('body' in b) patch.body = String(b.body ?? '')
  if ('status' in b) {
    if (!isIssueStatus(b.status)) throw createError({ statusCode: 400, statusMessage: '유효하지 않은 상태입니다' })
    patch.status = b.status
  }
  if ('priority' in b) {
    if (b.priority == null || b.priority === '') patch.priority = null
    else if (isIssuePriority(b.priority)) patch.priority = b.priority
    else throw createError({ statusCode: 400, statusMessage: '유효하지 않은 우선순위입니다' })
  }

  const row = await repo.update(id, patch)
  if (!row) throw createError({ statusCode: 404, statusMessage: '이슈를 찾을 수 없습니다' })
  return { data: row }
})
