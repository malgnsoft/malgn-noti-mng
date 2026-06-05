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
