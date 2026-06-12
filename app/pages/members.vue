<template>
  <div class="page">
    <section class="head">
      <div>
        <h1 class="title">프로젝트 참여자</h1>
        <p class="desc">직접 가입 또는 맑은오피스 연동으로 등록된 참여자 목록입니다.</p>
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
            <th>역할</th>
            <th>이메일</th>
            <th>휴대전화</th>
            <th>구분</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in rows" :key="m.id">
            <td class="strong">{{ m.name }}</td>
            <td class="mono">{{ m.loginId }}</td>
            <td>{{ m.company || '—' }}</td>
            <td>{{ m.role || '—' }}</td>
            <td>{{ m.email || '—' }}</td>
            <td class="mono">{{ m.phone || '—' }}</td>
            <td>
              <span class="badge" :class="m.source === 'office' ? 'badge-office' : 'badge-direct'">
                {{ m.source === 'office' ? '맑은오피스' : '직접가입' }}
              </span>
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
// 인증은 전역 미들웨어(01.require-auth.global)가 처리한다.

const { data, pending, error } = await useFetch<{ data: AuthMember[] }>('/api/members', { key: 'members' })
const rows = computed(() => data.value?.data ?? [])
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
.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
.empty {
  text-align: center;
  color: var(--ink-400);
  padding: 40px 0 !important;
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
</style>
