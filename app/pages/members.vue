<template>
  <div class="page">
    <section class="head">
      <div>
        <h1 class="title">프로젝트 참여자</h1>
        <p class="desc">참여자 승인·등급 관리(관리자 전용). 직접 가입 회원은 승인 후 로그인할 수 있습니다.</p>
      </div>
      <span class="count">{{ rows.length }}명</span>
    </section>

    <div v-if="pending" class="state">불러오는 중…</div>
    <div v-else-if="error" class="state">목록을 불러올 수 없습니다.</div>
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>성명</th>
            <th>아이디</th>
            <th>회사명</th>
            <th>등급</th>
            <th>상태</th>
            <th>구분</th>
            <th class="ta-right">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in rows" :key="m.id">
            <td class="strong">
              {{ m.name }}
              <span v-if="m.id === member?.id" class="me">나</span>
            </td>
            <td class="mono">{{ m.loginId }}</td>
            <td>{{ m.company || '—' }}</td>
            <td>
              <span class="badge" :class="m.grade === 'admin' ? 'badge-admin' : 'badge-member'">
                {{ m.grade === 'admin' ? '관리자' : '참여자' }}
              </span>
            </td>
            <td>
              <span class="badge" :class="`st-${m.status}`">{{ statusLabel(m.status) }}</span>
            </td>
            <td>
              <span class="badge" :class="m.source === 'office' ? 'badge-office' : 'badge-direct'">
                {{ m.source === 'office' ? '맑은오피스' : '직접가입' }}
              </span>
            </td>
            <td class="actions">
              <template v-if="m.id === member?.id">
                <span class="muted">—</span>
              </template>
              <template v-else-if="m.status === 'pending'">
                <button class="act ok" :disabled="busyId === m.id" @click="approve(m)">승인</button>
                <button class="act danger" :disabled="busyId === m.id" @click="remove(m)">거절</button>
              </template>
              <template v-else>
                <button class="act" :disabled="busyId === m.id" @click="toggleGrade(m)">
                  {{ m.grade === 'admin' ? '참여자로' : '관리자로' }}
                </button>
                <button class="act danger" :disabled="busyId === m.id" @click="remove(m)">삭제</button>
              </template>
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="7" class="empty">등록된 참여자가 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
// 관리자 전용 페이지 — 인증은 전역 미들웨어(01.require-auth.global), 등급은 아래에서 가드.
const { member, isAdmin } = useAuth()
const toast = useToast()

// 비관리자 접근 차단(서버 /api/members 도 403). 멤버 로드 후 등급 확인.
watchEffect(() => {
  if (member.value && !isAdmin.value) navigateTo('/')
})

const { data, pending, error, refresh } = await useFetch<{ data: AuthMember[] }>('/api/members', { key: 'members' })
const rows = computed(() => data.value?.data ?? [])

const busyId = ref<number | null>(null)

function statusLabel(s: string) {
  return s === 'active' ? '활성' : s === 'pending' ? '승인대기' : s === 'suspended' ? '정지' : s
}

async function patch(m: AuthMember, body: Record<string, string>, okMsg: string) {
  if (busyId.value) return
  busyId.value = m.id
  try {
    await $fetch(`/api/members/${m.id}`, { method: 'PATCH', body })
    await refresh()
    toast.add({ title: okMsg, color: 'success' })
  }
  catch (e) {
    toast.add({ title: extractError(e, '처리하지 못했습니다'), color: 'error' })
  }
  finally {
    busyId.value = null
  }
}

function approve(m: AuthMember) {
  patch(m, { status: 'active' }, `${m.name}님을 승인했습니다.`)
}

function toggleGrade(m: AuthMember) {
  const grade = m.grade === 'admin' ? 'member' : 'admin'
  patch(m, { grade }, `${m.name}님을 ${grade === 'admin' ? '관리자' : '참여자'}로 변경했습니다.`)
}

async function remove(m: AuthMember) {
  const msg = m.status === 'pending' ? '이 가입 신청을 거절(삭제)할까요?' : `${m.name}님을 삭제할까요?`
  if (!confirm(msg)) return
  if (busyId.value) return
  busyId.value = m.id
  try {
    await $fetch(`/api/members/${m.id}`, { method: 'DELETE' })
    await refresh()
    toast.add({ title: '처리했습니다.', color: 'success' })
  }
  catch (e) {
    toast.add({ title: extractError(e, '처리하지 못했습니다'), color: 'error' })
  }
  finally {
    busyId.value = null
  }
}
</script>

<style scoped>
.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 40px 24px 64px;
}
.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.01em;
}
.desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--ink-400);
}
.count {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-500);
}
.state {
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: var(--ink-400);
}
.table-wrap {
  border: 1px solid var(--line);
  border-radius: var(--r-lg, 12px);
  overflow: hidden;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.table th {
  text-align: left;
  padding: 11px 14px;
  background: var(--ink-50);
  color: var(--ink-600);
  font-weight: 600;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
.ta-right {
  text-align: right;
}
.table td {
  padding: 11px 14px;
  color: var(--ink-700);
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
.table tbody tr:last-child td {
  border-bottom: none;
}
.table tbody tr:hover td {
  background: var(--ink-50);
}
.strong {
  font-weight: 600;
  color: var(--ink-900);
}
.me {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-ink);
  background: var(--accent-soft);
  padding: 1px 6px;
  border-radius: var(--r-full, 999px);
}
.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
.empty {
  text-align: center;
  color: var(--ink-400);
  padding: 40px 0 !important;
}
.actions {
  text-align: right;
}
.act {
  padding: 5px 10px;
  margin-left: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-700);
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-sm, 6px);
  cursor: pointer;
}
.act:hover:not(:disabled) {
  background: var(--ink-50);
}
.act:disabled {
  opacity: 0.5;
  cursor: default;
}
.act.ok {
  color: var(--accent-ink);
  border-color: var(--accent);
  background: var(--accent-soft);
}
.act.danger {
  color: #dc2626;
}
.act.danger:hover:not(:disabled) {
  background: #fef2f2;
}
.muted {
  color: var(--ink-300);
}
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--r-full, 999px);
  font-size: 11px;
  font-weight: 600;
}
.badge-direct {
  background: var(--ink-100);
  color: var(--ink-600);
}
.badge-office {
  background: var(--accent-soft);
  color: var(--accent-ink);
}
.badge-admin {
  background: #ede9fe;
  color: #6d28d9;
}
.badge-member {
  background: var(--ink-100);
  color: var(--ink-600);
}
.st-active {
  background: var(--accent-soft);
  color: var(--accent-ink);
}
.st-pending {
  background: #fef3c7;
  color: #92400e;
}
.st-suspended {
  background: var(--ink-100);
  color: var(--ink-500);
}
</style>
