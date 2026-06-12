import { and, desc, eq, like, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { issue } from '../db/schema'

// 이슈 게시판 저장소(§5.7) — 프로덕션 D1(Drizzle), dev(바인딩 없음)은 인메모리 폴백.
// dev 인메모리는 `pnpm dev` 프로세스가 살아있는 동안만 유지(재시작 시 초기화).
// 작성자 = 세션 회원(member). authorName 은 작성 시점 스냅샷(비정규화).

export const ISSUE_TYPES = ['policy', 'issue', 'notice', 'discussion'] as const
export const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'hold'] as const
export const ISSUE_PRIORITIES = ['low', 'normal', 'high'] as const

export type IssueType = (typeof ISSUE_TYPES)[number]
export type IssueStatus = (typeof ISSUE_STATUSES)[number]
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number]

export interface IssueRecord {
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

export interface NewIssue {
  type: IssueType
  title: string
  body: string
  priority: IssuePriority | null
  authorId: number
  authorName: string
}

// 부분 수정 — 전달된 키만 갱신. status 단독 변경(상태 변경)도 동일 경로.
export interface IssuePatch {
  type?: IssueType
  title?: string
  body?: string
  status?: IssueStatus
  priority?: IssuePriority | null
}

export interface IssueListFilter {
  type?: string
  status?: string
  q?: string
  page?: number
  pageSize?: number
}

export interface IssueListResult {
  rows: IssueRecord[]
  total: number
}

export function isIssueType(v: unknown): v is IssueType {
  return typeof v === 'string' && (ISSUE_TYPES as readonly string[]).includes(v)
}
export function isIssueStatus(v: unknown): v is IssueStatus {
  return typeof v === 'string' && (ISSUE_STATUSES as readonly string[]).includes(v)
}
export function isIssuePriority(v: unknown): v is IssuePriority {
  return typeof v === 'string' && (ISSUE_PRIORITIES as readonly string[]).includes(v)
}

// 목록 미리보기용 본문 절단(평문) — 상세에서만 마크다운 렌더.
export function bodyPreview(body: string, max = 160): string {
  const flat = body.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max)}…` : flat
}

const DEFAULT_PAGE_SIZE = 20

interface IssueRepo {
  list(filter: IssueListFilter): Promise<IssueListResult>
  findById(id: number): Promise<IssueRecord | null>
  create(input: NewIssue): Promise<IssueRecord>
  update(id: number, patch: IssuePatch): Promise<IssueRecord | null>
  remove(id: number): Promise<boolean>
}

function nowIso(): string {
  return new Date().toISOString()
}

function sortKey(r: IssueRecord): string {
  return r.updatedAt || r.createdAt
}

// ─── dev 인메모리 폴백 ─────────────────────────────────────
const memStore: IssueRecord[] = []
let memSeq = 1

function applyMemFilter(rows: IssueRecord[], filter: IssueListFilter): IssueRecord[] {
  let out = rows
  if (filter.type) out = out.filter(r => r.type === filter.type)
  if (filter.status) out = out.filter(r => r.status === filter.status)
  if (filter.q) {
    const q = filter.q.toLowerCase()
    out = out.filter(r => r.title.toLowerCase().includes(q))
  }
  return out.slice().sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
}

const memRepo: IssueRepo = {
  list: (filter) => {
    const filtered = applyMemFilter(memStore, filter)
    const total = filtered.length
    const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE
    const page = Math.max(1, filter.page ?? 1)
    const rows = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
    return Promise.resolve({ rows, total })
  },
  findById: id => Promise.resolve(memStore.find(r => r.id === id) ?? null),
  create: (input) => {
    const row: IssueRecord = {
      id: memSeq++,
      type: input.type,
      title: input.title,
      body: input.body,
      status: 'open',
      priority: input.priority,
      authorId: input.authorId,
      authorName: input.authorName,
      createdAt: nowIso(),
      updatedAt: null,
    }
    memStore.push(row)
    return Promise.resolve(row)
  },
  update: (id, patch) => {
    const r = memStore.find(x => x.id === id)
    if (!r) return Promise.resolve(null)
    if (patch.type !== undefined) r.type = patch.type
    if (patch.title !== undefined) r.title = patch.title
    if (patch.body !== undefined) r.body = patch.body
    if (patch.status !== undefined) r.status = patch.status
    if (patch.priority !== undefined) r.priority = patch.priority
    r.updatedAt = nowIso()
    return Promise.resolve(r)
  },
  remove: (id) => {
    const i = memStore.findIndex(x => x.id === id)
    if (i < 0) return Promise.resolve(false)
    memStore.splice(i, 1)
    return Promise.resolve(true)
  },
}

// ─── D1 구현 ──────────────────────────────────────────────
type Db = NonNullable<ReturnType<typeof useDb>>

function d1Repo(db: Db): IssueRepo {
  // 정렬: 갱신/작성 시각 중 최신(COALESCE) 내림차순.
  const recencyDesc = sql`COALESCE(${issue.updatedAt}, ${issue.createdAt}) DESC`

  function buildWhere(filter: IssueListFilter) {
    const conds = []
    if (filter.type) conds.push(eq(issue.type, filter.type))
    if (filter.status) conds.push(eq(issue.status, filter.status))
    if (filter.q) conds.push(like(issue.title, `%${filter.q}%`))
    return conds.length ? and(...conds) : undefined
  }

  return {
    async list(filter) {
      const where = buildWhere(filter)
      const pageSize = filter.pageSize ?? DEFAULT_PAGE_SIZE
      const page = Math.max(1, filter.page ?? 1)
      const countRows = await db
        .select({ count: sql<number>`count(*)` })
        .from(issue)
        .where(where)
      const total = Number(countRows[0]?.count ?? 0)
      const rows = await db
        .select()
        .from(issue)
        .where(where)
        .orderBy(recencyDesc, desc(issue.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize)
      return { rows, total }
    },
    async findById(id) {
      const [row] = await db.select().from(issue).where(eq(issue.id, id)).limit(1)
      return row ?? null
    },
    async create(input) {
      const [row] = await db.insert(issue).values({
        type: input.type,
        title: input.title,
        body: input.body,
        status: 'open',
        priority: input.priority,
        authorId: input.authorId,
        authorName: input.authorName,
        createdAt: nowIso(),
      }).returning()
      if (!row) throw new Error('이슈 생성에 실패했습니다')
      return row
    },
    async update(id, patch) {
      const set: Record<string, unknown> = { updatedAt: nowIso() }
      if (patch.type !== undefined) set.type = patch.type
      if (patch.title !== undefined) set.title = patch.title
      if (patch.body !== undefined) set.body = patch.body
      if (patch.status !== undefined) set.status = patch.status
      if (patch.priority !== undefined) set.priority = patch.priority
      const [row] = await db.update(issue).set(set).where(eq(issue.id, id)).returning()
      return row ?? null
    },
    async remove(id) {
      const [row] = await db.delete(issue).where(eq(issue.id, id)).returning()
      return !!row
    },
  }
}

export function useIssues(event: H3Event): IssueRepo {
  const db = useDb(event)
  return db ? d1Repo(db) : memRepo
}
