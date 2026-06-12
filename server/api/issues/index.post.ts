import { getSessionMemberId } from '../../utils/auth'
import { isIssuePriority, isIssueType, useIssues } from '../../utils/issues'
import { useMembers } from '../../utils/members'

// 이슈 작성 — 세션 필수. 작성자 = 세션 회원, authorName 은 작성 시점 스냅샷.
// status 기본값('open')은 서버에서 설정. title 필수·type enum 검증.
export default defineEventHandler(async (event) => {
  const memberId = await getSessionMemberId(event)
  if (!memberId) throw createError({ statusCode: 401, statusMessage: '로그인이 필요합니다' })

  const b = await readBody(event)
  const title = String(b?.title ?? '').trim()
  if (!title) throw createError({ statusCode: 400, statusMessage: '제목을 입력하세요' })

  const type = b?.type
  if (!isIssueType(type)) throw createError({ statusCode: 400, statusMessage: '유효하지 않은 분류입니다' })

  const priorityRaw = b?.priority
  if (priorityRaw != null && priorityRaw !== '' && !isIssuePriority(priorityRaw)) {
    throw createError({ statusCode: 400, statusMessage: '유효하지 않은 우선순위입니다' })
  }

  const me = await useMembers(event).findById(memberId)
  if (!me) throw createError({ statusCode: 401, statusMessage: '회원 정보를 찾을 수 없습니다' })

  const row = await useIssues(event).create({
    type,
    title,
    body: String(b?.body ?? ''),
    priority: isIssuePriority(priorityRaw) ? priorityRaw : null,
    authorId: memberId,
    authorName: me.name,
  })
  return { data: row }
})
