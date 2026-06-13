import { requireAdmin, toPublic, useMembers } from '../../utils/members'

// 참여자 승인/등급 변경 — 관리자 전용.
//  body.status: 'active'(승인) | 'suspended'(정지)
//  body.grade:  'admin' | 'member'
// 자기 자신의 등급/상태는 변경 불가(마지막 관리자 잠금·자기 권한 박탈 방지).
export default defineEventHandler(async (event) => {
  const me = await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'invalid id' })
  if (id === me.id) {
    throw createError({ statusCode: 400, statusMessage: '본인 계정의 등급·상태는 변경할 수 없습니다' })
  }

  const repo = useMembers(event)
  const target = await repo.findById(id)
  if (!target) throw createError({ statusCode: 404, statusMessage: '회원을 찾을 수 없습니다' })

  const b = await readBody(event)
  let row = target

  if ('status' in b) {
    if (!['active', 'suspended', 'pending'].includes(b.status)) {
      throw createError({ statusCode: 400, statusMessage: '유효하지 않은 상태입니다' })
    }
    row = (await repo.setStatus(id, b.status)) ?? row
  }
  if ('grade' in b) {
    if (!['admin', 'member'].includes(b.grade)) {
      throw createError({ statusCode: 400, statusMessage: '유효하지 않은 등급입니다' })
    }
    row = (await repo.setGrade(id, b.grade)) ?? row
  }

  return { data: toPublic(row) }
})
