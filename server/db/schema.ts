import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 현황판(board) D1 스키마 — Drizzle 정본. (db: malgn-noti-project)
// 마이그레이션은 drizzle-kit 으로 생성(server/db/migrations).

export const boardMeta = sqliteTable('board_meta', {
  id: integer('id').primaryKey(),
  projectName: text('project_name').notNull(),
  lastUpdated: text('last_updated').notNull(),
})

export const stage = sqliteTable('stage', {
  id: text('id').primaryKey(),
  no: text('no').notNull(),
  name: text('name').notNull(),
  emoji: text('emoji'),
  summary: text('summary'),
  weight: integer('weight').notNull().default(0),
  progress: integer('progress').notNull().default(0),
  sort: integer('sort').notNull().default(0),
})

export const task = sqliteTable('task', {
  id: text('id').primaryKey(),
  stageId: text('stage_id').notNull(),
  grp: text('grp'),
  title: text('title').notNull(),
  status: text('status').notNull().default('pending'),
  owner: text('owner'),
  note: text('note'),
  targetDate: text('target_date'),
  completionDate: text('completion_date'),
  href: text('href'),
  sort: integer('sort').notNull().default(0),
})

// 프로젝트 참여자(회원) — 직접 회원가입 + 맑은오피스 연동 자동가입/갱신 대상.
// 비밀번호는 PBKDF2 해시(`pbkdf2$iter$salt$hash`)만 저장, 평문 보관 금지.
//  - source='direct': 직접 회원가입(비밀번호 로그인). password_hash 보유.
//  - source='office': 맑은오피스에서 넘어온 회원. password_hash null 가능, office_id 로 upsert.
export const member = sqliteTable('member', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  loginId: text('login_id').notNull().unique(), // 아이디
  passwordHash: text('password_hash'), // 직접가입 회원만. 오피스 연동 회원은 null
  name: text('name').notNull(), // 성명
  company: text('company').notNull().default(''), // 회사명
  role: text('role').notNull().default(''), // 역할(직무)
  grade: text('grade').notNull().default('member'), // 권한 등급: admin | member
  email: text('email').notNull().default(''), // 이메일
  phone: text('phone').notNull().default(''), // 휴대전화번호
  source: text('source').notNull().default('direct'), // direct | office
  officeId: text('office_id').unique(), // 맑은오피스 사용자 식별자(연동 회원)
  status: text('status').notNull().default('pending'), // pending(승인대기) | active | suspended
  agreedAt: text('agreed_at'), // 약관·개인정보 수집·이용 동의 시각(직접가입). null=미동의/오피스
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
})

// 간트 WBS 항목 — 등록/수정/삭제 대상 (Step 1·3·5 화면 단위)
export const wbsItem = sqliteTable('wbs_item', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  step: integer('step').notNull(),
  grp: text('grp').notNull(),
  name: text('name').notNull(),
  owner: text('owner').notNull().default(''),
  start: text('start'),
  end: text('end'),
  progress: integer('progress').notNull().default(0),
  note: text('note'),
  href: text('href'),
  sort: integer('sort').notNull().default(0),
})

// 이슈 — 정책·이슈 게시판(§5.7). 작성자 = member
//  - type:   policy | issue | notice | discussion (§7.2 a)
//  - status: open | in_progress | resolved | hold  (공통 enum, §7.2 b)
//  - authorId 는 member.id 앱 레벨 참조(FK 강제 미사용 — board/wbs 관례). authorName 은 작성 시점 스냅샷.
export const issue = sqliteTable('issue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull().default('issue'),
  title: text('title').notNull(),
  body: text('body').notNull().default(''), // 마크다운 본문
  status: text('status').notNull().default('open'),
  priority: text('priority'), // (선택) low | normal | high — null 허용
  authorId: integer('author_id').notNull(),
  authorName: text('author_name').notNull().default(''),
  createdAt: text('created_at').notNull(), // ISO8601
  updatedAt: text('updated_at'), // ISO8601
})

// 이슈 답글(댓글). 작성자 = member. issueId 는 issue.id 앱 레벨 참조.
export const issueComment = sqliteTable('issue_comment', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  issueId: integer('issue_id').notNull(),
  body: text('body').notNull().default(''), // 평문(렌더 시 줄바꿈 보존)
  authorId: integer('author_id').notNull(),
  authorName: text('author_name').notNull().default(''),
  createdAt: text('created_at').notNull(), // ISO8601
})
