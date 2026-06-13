// 이슈 게시판 표시 메타 — 타입·상태·우선순위의 한글 라벨/뱃지 클래스(§7.2).
// 서버 enum 과 1:1. 화면 전반(목록·상세·폼)에서 공용.

export interface IssueListItem {
  id: number
  type: string
  title: string
  status: string
  priority: string | null
  authorId: number
  authorName: string
  createdAt: string
  updatedAt: string | null
  preview: string
}

export interface IssueDetail {
  id: number
  type: string
  title: string
  body: string
  status: string
  priority: string | null
  authorId: number
  authorName: string
  createdAt: string
  updatedAt: string | null
}

export const ISSUE_TYPE_OPTIONS = [
  { value: 'policy', label: '정책' },
  { value: 'issue', label: '이슈' },
  { value: 'notice', label: '공지' },
  { value: 'discussion', label: '논의' },
] as const

export const ISSUE_STATUS_OPTIONS = [
  { value: 'open', label: '열림' },
  { value: 'in_progress', label: '진행중' },
  { value: 'resolved', label: '해결' },
  { value: 'hold', label: '보류' },
] as const

export const ISSUE_PRIORITY_OPTIONS = [
  { value: 'low', label: '낮음' },
  { value: 'normal', label: '보통' },
  { value: 'high', label: '높음' },
] as const

export function issueTypeLabel(v: string): string {
  return ISSUE_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v
}
export function issueStatusLabel(v: string): string {
  return ISSUE_STATUS_OPTIONS.find(o => o.value === v)?.label ?? v
}
export function issuePriorityLabel(v: string | null): string {
  if (!v) return '—'
  return ISSUE_PRIORITY_OPTIONS.find(o => o.value === v)?.label ?? v
}

// 상태별 뱃지 색상 클래스(prose/디자인 토큰 기반)
export function issueStatusClass(v: string): string {
  return `st-${v}`
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  // KST(Asia/Seoul, UTC+9·DST 없음) 고정 — 서버(UTC)·클라이언트 TZ 무관하게 동일 표기.
  // +9h 후 UTC 파트로 포맷하면 Intl 24시 버그 없이 결정적.
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${kst.getUTCFullYear()}-${p(kst.getUTCMonth() + 1)}-${p(kst.getUTCDate())} ${p(kst.getUTCHours())}:${p(kst.getUTCMinutes())}`
}
