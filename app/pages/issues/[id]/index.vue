<template>
  <div class="page">
    <NuxtLink to="/issues" class="back">
      <UIcon name="i-lucide-arrow-left" class="back-ico" />
      이슈 목록
    </NuxtLink>

    <div v-if="pending" class="state">불러오는 중…</div>
    <div v-else-if="error || !issue" class="state">이슈를 찾을 수 없습니다.</div>

    <article v-else class="issue">
      <header class="issue-head">
        <div class="head-top">
          <div class="meta-top">
            <span class="badge type">{{ issueTypeLabel(issue.type) }}</span>
            <span class="badge" :class="issueStatusClass(issue.status)">{{ issueStatusLabel(issue.status) }}</span>
            <span v-if="issue.priority" class="badge prio">우선순위 {{ issuePriorityLabel(issue.priority) }}</span>
          </div>
          <div v-if="isAuthor" class="head-actions">
            <NuxtLink :to="`/issues/${issue.id}/edit`" class="act">
              <UIcon name="i-lucide-pencil" class="act-ico" />수정
            </NuxtLink>
            <button type="button" class="act danger" :disabled="busy" @click="onDelete">
              <UIcon name="i-lucide-trash-2" class="act-ico" />삭제
            </button>
          </div>
        </div>
        <h1 class="issue-title">{{ issue.title }}</h1>
        <div class="meta-sub">
          <span class="author">{{ issue.authorName || '—' }}</span>
          <span class="dot">·</span>
          <span>작성 {{ formatDate(issue.createdAt) }}</span>
          <template v-if="issue.updatedAt">
            <span class="dot">·</span>
            <span>수정 {{ formatDate(issue.updatedAt) }}</span>
          </template>
          <label v-if="isAuthor" class="status-change">
            <span class="dot">·</span>
            <span class="status-label">상태</span>
            <select v-model="statusModel" class="select" :disabled="busy" @change="changeStatus">
              <option v-for="o in ISSUE_STATUS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
        </div>
      </header>

      <!-- renderMarkdown 이 HTML 이스케이프 후 서식만 입히므로 안전(사용자 본문 XSS 방지) -->
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="issue.body" class="doc-prose body" v-html="renderedBody" />
      <p v-else class="no-body">본문이 없습니다.</p>
    </article>
  </div>
</template>

<script setup lang="ts">
import {
  ISSUE_STATUS_OPTIONS,
  formatDate,
  issuePriorityLabel,
  issueStatusClass,
  issueStatusLabel,
  issueTypeLabel,
} from '~/utils/issueMeta'
import type { IssueDetail } from '~/utils/issueMeta'
import { renderMarkdown } from '~/utils/markdown'

const route = useRoute()
const id = computed(() => Number(route.params.id))

const { data, pending, error } = await useFetch<{ data: IssueDetail }>(
  () => `/api/issues/${id.value}`,
  { key: () => `issue-${id.value}` },
)

const issue = computed(() => data.value?.data ?? null)
const renderedBody = computed(() => (issue.value ? renderMarkdown(issue.value.body) : ''))

const { member } = useAuth()
const isAuthor = computed(() => !!member.value && !!issue.value && member.value.id === issue.value.authorId)

const statusModel = ref('')
watch(issue, (v) => { if (v) statusModel.value = v.status }, { immediate: true })

const busy = ref(false)
const toast = useToast()

async function changeStatus() {
  if (!issue.value || statusModel.value === issue.value.status) return
  busy.value = true
  try {
    const res = await $fetch<{ data: IssueDetail }>(`/api/issues/${issue.value.id}`, {
      method: 'PATCH',
      body: { status: statusModel.value },
    })
    if (data.value) data.value.data = res.data
    toast.add({ title: '상태를 변경했습니다.', color: 'success' })
  }
  catch (e) {
    if (issue.value) statusModel.value = issue.value.status
    toast.add({ title: extractError(e, '상태를 변경하지 못했습니다'), color: 'error' })
  }
  finally {
    busy.value = false
  }
}

async function onDelete() {
  if (!issue.value) return
  if (!confirm('이 이슈를 삭제할까요? 되돌릴 수 없습니다.')) return
  busy.value = true
  try {
    await $fetch(`/api/issues/${issue.value.id}`, { method: 'DELETE' })
    toast.add({ title: '이슈를 삭제했습니다.', color: 'success' })
    await navigateTo('/issues')
  }
  catch (e) {
    toast.add({ title: extractError(e, '이슈를 삭제하지 못했습니다'), color: 'error' })
    busy.value = false
  }
}

useHead(() => ({ title: issue.value?.title ?? '이슈' }))
</script>

<style scoped>
.page {
  max-width: 820px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  font-size: 13px;
  color: var(--ink-500);
}
.back:hover {
  color: var(--ink-900);
}
.back-ico {
  width: 15px;
  height: 15px;
}
.state {
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: var(--ink-400);
}
.issue-head {
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.head-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.meta-top {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.head-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}
.act {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: var(--r-md, 8px);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-600);
  white-space: nowrap;
  cursor: pointer;
}
.act:hover {
  background: var(--ink-50);
  color: var(--ink-900);
}
.act-ico {
  width: 14px;
  height: 14px;
}
.act.danger {
  color: #dc2626;
}
.act.danger:hover {
  background: #fef2f2;
  color: #b91c1c;
}
.issue-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.015em;
  line-height: 1.3;
}
.meta-sub {
  margin-top: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  font-size: 13px;
  color: var(--ink-500);
}
.author {
  font-weight: 600;
  color: var(--ink-700);
}
.dot {
  color: var(--ink-300);
}
.status-change {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
}
.status-label {
  font-weight: 600;
  color: var(--ink-600);
  white-space: nowrap;
}
.select {
  padding: 4px 8px;
  font-size: 13px;
  color: var(--ink-900);
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-sm, 6px);
  cursor: pointer;
}
.select:hover {
  border-color: var(--ink-300);
}
.body {
  margin-top: 28px;
}
.no-body {
  margin-top: 22px;
  font-size: 14px;
  color: var(--ink-400);
}
.badge {
  display: inline-block;
  padding: 2px 9px;
  border-radius: var(--r-full, 999px);
  font-size: 11px;
  font-weight: 600;
}
.badge.type {
  background: var(--ink-100);
  color: var(--ink-600);
}
.badge.prio {
  background: var(--ink-100);
  color: var(--ink-500);
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
</style>
