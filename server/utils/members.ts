import { asc, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { member } from '../db/schema'

// 회원 저장소 — 프로덕션은 D1(Drizzle), dev(바인딩 없음)은 인메모리 폴백.
// dev 인메모리는 `pnpm dev` 프로세스가 살아있는 동안만 유지(재시작 시 초기화).
//  - 직접 회원가입: create() (source='direct', passwordHash 보유)
//  - 맑은오피스 연동: upsertByOffice() (source='office', office_id 키로 자동 가입/갱신)

export interface MemberRecord {
  id: number
  loginId: string
  passwordHash: string | null
  name: string
  company: string
  role: string
  email: string
  phone: string
  source: string // direct | office
  officeId: string | null
  status: string
  agreedAt: string | null
  createdAt: string
  updatedAt: string | null
}

// 직접 회원가입 입력
export interface NewMember {
  loginId: string
  passwordHash: string
  name: string
  company: string
  role: string
  email: string
  phone: string
  agreedAt: string // 약관 동의 시각(필수)
}

// 맑은오피스 연동 입력 (office_id 기준 upsert)
export interface OfficeMember {
  officeId: string
  loginId: string
  name: string
  company: string
  role: string
  email: string
  phone: string
}

// 내 정보 수정 입력 (본인 프로필)
export interface ProfileUpdate {
  name: string
  company: string
  role: string
  email: string
  phone: string
}

// 외부로 내보낼 때 비밀번호 해시 제거
export type PublicMember = Omit<MemberRecord, 'passwordHash'>

export function toPublic(m: MemberRecord): PublicMember {
  const { passwordHash, ...rest } = m
  void passwordHash
  return rest
}

interface MemberRepo {
  findByLoginId(loginId: string): Promise<MemberRecord | null>
  findById(id: number): Promise<MemberRecord | null>
  findByOfficeId(officeId: string): Promise<MemberRecord | null>
  create(input: NewMember): Promise<MemberRecord>
  upsertByOffice(input: OfficeMember): Promise<{ member: MemberRecord, created: boolean }>
  updateProfile(id: number, patch: ProfileUpdate): Promise<MemberRecord | null>
  updatePassword(id: number, passwordHash: string): Promise<void>
  list(): Promise<MemberRecord[]>
}

function nowIso(): string {
  return new Date().toISOString()
}

// ─── dev 인메모리 폴백 ─────────────────────────────────────
const memStore: MemberRecord[] = []
let memSeq = 1

const memRepo: MemberRepo = {
  findByLoginId: loginId =>
    Promise.resolve(memStore.find(m => m.loginId === loginId) ?? null),
  findById: id => Promise.resolve(memStore.find(m => m.id === id) ?? null),
  findByOfficeId: officeId =>
    Promise.resolve(memStore.find(m => m.officeId === officeId) ?? null),
  create: (input) => {
    const row: MemberRecord = {
      id: memSeq++,
      loginId: input.loginId,
      passwordHash: input.passwordHash,
      name: input.name,
      company: input.company,
      role: input.role,
      email: input.email,
      phone: input.phone,
      source: 'direct',
      officeId: null,
      status: 'active',
      agreedAt: input.agreedAt,
      createdAt: nowIso(),
      updatedAt: null,
    }
    memStore.push(row)
    return Promise.resolve(row)
  },
  upsertByOffice: (input) => {
    const existing = memStore.find(m => m.officeId === input.officeId)
    if (existing) {
      Object.assign(existing, {
        loginId: input.loginId,
        name: input.name,
        company: input.company,
        role: input.role,
        email: input.email,
        phone: input.phone,
        updatedAt: nowIso(),
      })
      return Promise.resolve({ member: existing, created: false })
    }
    const row: MemberRecord = {
      id: memSeq++,
      loginId: input.loginId,
      passwordHash: null,
      name: input.name,
      company: input.company,
      role: input.role,
      email: input.email,
      phone: input.phone,
      source: 'office',
      officeId: input.officeId,
      status: 'active',
      agreedAt: null,
      createdAt: nowIso(),
      updatedAt: null,
    }
    memStore.push(row)
    return Promise.resolve({ member: row, created: true })
  },
  updateProfile: (id, patch) => {
    const m = memStore.find(x => x.id === id)
    if (!m) return Promise.resolve(null)
    Object.assign(m, patch, { updatedAt: nowIso() })
    return Promise.resolve(m)
  },
  updatePassword: (id, passwordHash) => {
    const m = memStore.find(x => x.id === id)
    if (m) Object.assign(m, { passwordHash, updatedAt: nowIso() })
    return Promise.resolve()
  },
  list: () => Promise.resolve([...memStore]),
}

// ─── D1 구현 ──────────────────────────────────────────────
type Db = NonNullable<ReturnType<typeof useDb>>

function d1Repo(db: Db): MemberRepo {
  return {
    async findByLoginId(loginId) {
      const [row] = await db.select().from(member).where(eq(member.loginId, loginId)).limit(1)
      return row ?? null
    },
    async findById(id) {
      const [row] = await db.select().from(member).where(eq(member.id, id)).limit(1)
      return row ?? null
    },
    async findByOfficeId(officeId) {
      const [row] = await db.select().from(member).where(eq(member.officeId, officeId)).limit(1)
      return row ?? null
    },
    async create(input) {
      const [row] = await db.insert(member).values({
        ...input,
        source: 'direct',
        status: 'active',
        createdAt: nowIso(),
      }).returning()
      if (!row) throw new Error('회원 생성에 실패했습니다')
      return row
    },
    async upsertByOffice(input) {
      const [existing] = await db.select().from(member)
        .where(eq(member.officeId, input.officeId)).limit(1)
      if (existing) {
        const [row] = await db.update(member).set({
          loginId: input.loginId,
          name: input.name,
          company: input.company,
          role: input.role,
          email: input.email,
          phone: input.phone,
          updatedAt: nowIso(),
        }).where(eq(member.id, existing.id)).returning()
        if (!row) throw new Error('회원 갱신에 실패했습니다')
        return { member: row, created: false }
      }
      const [row] = await db.insert(member).values({
        loginId: input.loginId,
        passwordHash: null,
        name: input.name,
        company: input.company,
        role: input.role,
        email: input.email,
        phone: input.phone,
        source: 'office',
        officeId: input.officeId,
        status: 'active',
        createdAt: nowIso(),
      }).returning()
      if (!row) throw new Error('회원 생성에 실패했습니다')
      return { member: row, created: true }
    },
    async updateProfile(id, patch) {
      const [row] = await db.update(member).set({
        name: patch.name,
        company: patch.company,
        role: patch.role,
        email: patch.email,
        phone: patch.phone,
        updatedAt: nowIso(),
      }).where(eq(member.id, id)).returning()
      return row ?? null
    },
    async updatePassword(id, passwordHash) {
      await db.update(member).set({ passwordHash, updatedAt: nowIso() }).where(eq(member.id, id))
    },
    async list() {
      return db.select().from(member).orderBy(asc(member.id))
    },
  }
}

export function useMembers(event: H3Event): MemberRepo {
  const db = useDb(event)
  return db ? d1Repo(db) : memRepo
}
