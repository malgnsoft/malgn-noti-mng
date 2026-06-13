import { asc, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { issueComment } from '../db/schema'

// 이슈 답글(댓글) 저장소 — 프로덕션 D1(Drizzle), dev(바인딩 없음)은 인메모리 폴백.
// 작성자 = member. authorName 은 작성 시점 스냅샷(비정규화).

export interface CommentRecord {
  id: number
  issueId: number
  body: string
  authorId: number
  authorName: string
  createdAt: string
}

export interface NewComment {
  issueId: number
  body: string
  authorId: number
  authorName: string
}

interface CommentRepo {
  listByIssue(issueId: number): Promise<CommentRecord[]>
  findById(id: number): Promise<CommentRecord | null>
  create(input: NewComment): Promise<CommentRecord>
  remove(id: number): Promise<boolean>
}

function nowIso(): string {
  return new Date().toISOString()
}

// ─── dev 인메모리 폴백 ─────────────────────────────────────
const memStore: CommentRecord[] = []
let memSeq = 1

const memRepo: CommentRepo = {
  listByIssue: issueId => Promise.resolve(
    memStore.filter(c => c.issueId === issueId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  ),
  findById: id => Promise.resolve(memStore.find(c => c.id === id) ?? null),
  create: (input) => {
    const row: CommentRecord = { id: memSeq++, ...input, createdAt: nowIso() }
    memStore.push(row)
    return Promise.resolve(row)
  },
  remove: (id) => {
    const i = memStore.findIndex(c => c.id === id)
    if (i < 0) return Promise.resolve(false)
    memStore.splice(i, 1)
    return Promise.resolve(true)
  },
}

// ─── D1 구현 ──────────────────────────────────────────────
type Db = NonNullable<ReturnType<typeof useDb>>

function d1Repo(db: Db): CommentRepo {
  return {
    async listByIssue(issueId) {
      return db.select().from(issueComment)
        .where(eq(issueComment.issueId, issueId))
        .orderBy(asc(issueComment.createdAt), asc(issueComment.id))
    },
    async findById(id) {
      const [row] = await db.select().from(issueComment).where(eq(issueComment.id, id)).limit(1)
      return row ?? null
    },
    async create(input) {
      const [row] = await db.insert(issueComment).values({ ...input, createdAt: nowIso() }).returning()
      if (!row) throw new Error('답글 작성에 실패했습니다')
      return row
    },
    async remove(id) {
      const [row] = await db.delete(issueComment).where(eq(issueComment.id, id)).returning()
      return !!row
    },
  }
}

export function useIssueComments(event: H3Event): CommentRepo {
  const db = useDb(event)
  return db ? d1Repo(db) : memRepo
}
