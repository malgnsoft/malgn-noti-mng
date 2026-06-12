<template>
  <div class="page">
    <section class="head">
      <div>
        <h1 class="title">이슈</h1>
        <p class="desc">정책·이슈·공지·논의를 올리고 확인하는 게시판입니다.</p>
      </div>
      <NuxtLink to="/issues/new" class="btn btn-primary">
        <UIcon name="i-lucide-plus" class="btn-ico" />
        새 이슈
      </NuxtLink>
    </section>

    <section class="filters">
      <select v-model="filters.status" class="select">
        <option value="">모든 상태</option>
        <option v-for="o in ISSUE_STATUS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <div class="seg">
        <button
          class="seg-btn"
          :class="{ on: !filters.type }"
          type="button"
          @click="filters.type = ''"
        >전체</button>
        <button
          v-for="o in ISSUE_TYPE_OPTIONS"
          :key="o.value"
          class="seg-btn"
          :class="{ on: filters.type === o.value }"
          type="button"
          @click="filters.type = o.value"
        >{{ o.label }}</button>
      </div>

      <form class="search" @submit.prevent="applySearch">
        <UIcon name="i-lucide-search" class="search-ico" />
        <input v-model.trim="qInput" class="search-input" type="text" placeholder="제목 검색">
      </form>
    </section>

    <div v-if="pending" class="state">불러오는 중…</div>
    <div v-else-if="error" class="state">목록을 불러올 수 없습니다.</div>
    <template v-else>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="c-type">분류</th>
              <th>제목</th>
              <th class="c-status">상태</th>
              <th class="c-author">작성자</th>
              <th class="c-date">작성일</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in rows" :key="it.id" class="issue-row" @click="open(it.id)">
              <td><span class="badge type">{{ issueTypeLabel(it.type) }}</span></td>
              <td>
                <span class="row-title">{{ it.title }}</span>
              </td>
              <td><span class="badge" :class="issueStatusClass(it.status)">{{ issueStatusLabel(it.status) }}</span></td>
              <td class="author">{{ it.authorName || '—' }}</td>
              <td class="date">{{ formatDate(it.updatedAt || it.createdAt) }}</td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="5" class="empty">등록된 이슈가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="pager">
        <button class="pg-btn" type="button" :disabled="page <= 1" @click="page--">이전</button>
        <span class="pg-info">{{ page }} / {{ totalPages }}</span>
        <button class="pg-btn" type="button" :disabled="page >= totalPages" @click="page++">다음</button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ISSUE_STATUS_OPTIONS,
  ISSUE_TYPE_OPTIONS,
  formatDate,
  issueStatusClass,
  issueStatusLabel,
  issueTypeLabel,
} from '~/utils/issueMeta'
import type { IssueListItem } from '~/utils/issueMeta'

const filters = reactive({ type: '', status: '' })
const qInput = ref('')
const q = ref('')
const page = ref(1)

function applySearch() {
  q.value = qInput.value
  page.value = 1
}

// 필터 변경 시 1페이지로
watch(() => [filters.type, filters.status], () => { page.value = 1 })

const query = computed(() => ({
  type: filters.type || undefined,
  status: filters.status || undefined,
  q: q.value || undefined,
  page: page.value,
}))

const { data, pending, error } = await useFetch<{ data: IssueListItem[], total: number, page: number }>(
  '/api/issues',
  { query, key: 'issues-list' },
)

const rows = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / 20)))

function open(id: number) {
  navigateTo(`/issues/${id}`)
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
  margin-bottom: 22px;
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
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: var(--r-md, 8px);
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  cursor: pointer;
}
.btn-ico {
  width: 16px;
  height: 16px;
}
.btn-primary {
  color: var(--ink-900);
  background: var(--accent);
  border: 1px solid var(--accent);
}
.btn-primary:hover {
  filter: brightness(0.97);
}
.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.seg {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: var(--ink-50);
  border-radius: var(--r-md, 8px);
}
.seg-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-500);
  cursor: pointer;
}
.seg-btn:hover {
  color: var(--ink-900);
}
.seg-btn.on {
  background: var(--white);
  color: var(--ink-900);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}
/* 전역 `.input,.select,.textarea{width:100%}` 충돌 방지 — 상태 필터는 내용 폭만. */
.select {
  width: auto;
  font-size: 13px;
  color: var(--ink-700);
}
.search {
  position: relative;
  margin-left: auto;
  display: flex;
  align-items: center;
}
.search-ico {
  position: absolute;
  left: 10px;
  width: 15px;
  height: 15px;
  color: var(--ink-400);
}
.search-input {
  padding: 7px 12px 7px 30px;
  font-size: 13px;
  color: var(--ink-900);
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-md, 8px);
  outline: none;
  width: 200px;
}
.search-input:focus {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 3px var(--accent-soft);
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
  table-layout: fixed; /* 컬럼 폭(c-type/status/author/date) 확정 → 헤더·본문 정렬 */
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
  padding: 12px 14px;
  color: var(--ink-700);
  border-bottom: 1px solid var(--line);
  vertical-align: top;
}
.table tbody tr:last-child td {
  border-bottom: none;
}
/* tbody tr 에 .row 를 쓰면 전역 유틸 `.row{display:flex}`(main.css)와 충돌해
   행이 flex 박스가 되어 table-layout:fixed 컬럼을 무시한다 → .issue-row 로 분리. */
.issue-row {
  cursor: pointer;
}
.issue-row:hover td {
  background: var(--ink-50);
}
.c-type {
  width: 84px;
}
.c-status {
  width: 84px;
}
.c-author {
  width: 120px;
}
.c-date {
  width: 140px;
}
.row-title {
  display: block;
  font-weight: 600;
  color: var(--ink-900);
}
.author, .date {
  white-space: nowrap;
}
.date {
  font-size: 12px;
  color: var(--ink-500);
}
.empty {
  text-align: center;
  color: var(--ink-400);
  padding: 40px 0 !important;
}
.badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: var(--r-full, 999px);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.badge.type {
  background: var(--ink-100);
  color: var(--ink-600);
}
.badge.st-open {
  background: var(--accent-soft);
  color: var(--accent-ink);
}
.badge.st-in_progress {
  background: #dbeafe;
  color: #1e40af;
}
.badge.st-resolved {
  background: var(--ink-100);
  color: var(--ink-500);
}
.badge.st-hold {
  background: #fef3c7;
  color: #92400e;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 20px;
}
.pg-btn {
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-700);
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-md, 8px);
  cursor: pointer;
}
.pg-btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.pg-info {
  font-size: 13px;
  color: var(--ink-500);
}
</style>
