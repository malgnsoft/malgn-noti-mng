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
          <div v-if="canManage" class="head-actions">
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
          <label v-if="canManage" class="status-change">
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

      <section class="comments">
        <h2 class="comments-head">답글 <span class="cc">{{ comments.length }}</span></h2>

        <ul v-if="comments.length" class="comment-list">
          <li v-for="c in comments" :key="c.id" class="comment">
            <div class="c-top">
              <span class="c-author">{{ c.authorName || '—' }}</span>
              <span class="c-date">{{ formatDate(c.createdAt) }}</span>
              <button
                v-if="canManageComment(c)"
                type="button"
                class="c-del"
                @click="deleteComment(c)"
              >삭제</button>
            </div>
            <!-- renderMarkdown 이 이스케이프 후 서식만 입힘(XSS 안전). -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="c-body doc-prose" v-html="renderMarkdown(c.body)" />
          </li>
        </ul>
        <p v-else class="comments-empty">아직 답글이 없습니다. 첫 답글을 남겨보세요.</p>

        <form class="comment-form" @submit.prevent="submitComment">
          <AppMarkdownEditor
            v-model="commentBody"
            :rows="3"
            :disabled="commentBusy"
            placeholder="답글을 입력하세요. 마크다운·이미지 첨부를 지원합니다."
          />
          <div class="comment-actions">
            <button type="submit" class="comment-btn" :disabled="commentBusy || !commentBody.trim()">
              {{ commentBusy ? '등록 중…' : '답글 등록' }}
            </button>
          </div>
        </form>
      </section>
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

const { member, isAdmin } = useAuth()
// 수정/삭제·상태 변경: 작성자 본인 또는 관리자.
const isAuthor = computed(() => !!member.value && !!issue.value && member.value.id === issue.value.authorId)
const canManage = computed(() => isAuthor.value || isAdmin.value)

// ── 답글 ────────────────────────────────────────────────
interface CommentItem {
  id: number
  issueId: number
  body: string
  authorId: number
  authorName: string
  createdAt: string
}
const { data: commentsData, refresh: refreshComments } = await useFetch<{ data: CommentItem[] }>(
  () => `/api/issues/${id.value}/comments`,
  { key: () => `issue-comments-${id.value}` },
)
const comments = computed(() => commentsData.value?.data ?? [])
const commentBody = ref('')
const commentBusy = ref(false)

function canManageComment(c: CommentItem) {
  return isAdmin.value || (!!member.value && member.value.id === c.authorId)
}

async function submitComment() {
  const body = commentBody.value.trim()
  if (!body || commentBusy.value) return
  commentBusy.value = true
  try {
    await $fetch(`/api/issues/${id.value}/comments`, { method: 'POST', body: { body } })
    commentBody.value = ''
    await refreshComments()
  }
  catch (e) {
    toast.add({ title: extractError(e, '답글을 등록하지 못했습니다'), color: 'error' })
  }
  finally {
    commentBusy.value = false
  }
}

async function deleteComment(c: CommentItem) {
  if (!confirm('이 답글을 삭제할까요?')) return
  try {
    await $fetch(`/api/issues/${id.value}/comments/${c.id}`, { method: 'DELETE' })
    await refreshComments()
  }
  catch (e) {
    toast.add({ title: extractError(e, '답글을 삭제하지 못했습니다'), color: 'error' })
  }
}

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
/* ── 답글 ── */
.comments {
  margin-top: 40px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
}
.comments-head {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 16px;
}
.comments-head .cc {
  margin-left: 4px;
  color: var(--accent-ink);
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 22px;
}
.comment {
  padding: 14px 16px;
  background: var(--ink-50);
  border-radius: var(--r-md, 8px);
}
.c-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.c-author {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-800);
}
.c-date {
  font-size: 12px;
  color: var(--ink-400);
}
.c-del {
  margin-left: auto;
  font-size: 12px;
  color: #dc2626;
  cursor: pointer;
}
.c-del:hover {
  text-decoration: underline;
}
.c-body {
  font-size: 14px;
}
.c-body :deep(:first-child) {
  margin-top: 0;
}
.c-body :deep(:last-child) {
  margin-bottom: 0;
}
.comments-empty {
  margin-bottom: 22px;
  font-size: 13px;
  color: var(--ink-400);
}
.comment-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.comment-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-900);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--r-md, 8px);
  cursor: pointer;
}
.comment-btn:hover:not(:disabled) {
  filter: brightness(0.97);
}
.comment-btn:disabled {
  opacity: 0.5;
  cursor: default;
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
