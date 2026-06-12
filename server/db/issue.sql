-- 이슈 게시판(§5.7) 테이블 — 원격 D1 직접 적용용 (이 레포는 d1_migrations 미추적, db:apply 금지).
--   적용: wrangler d1 execute malgn-noti-project --remote --file=server/db/issue.sql
-- 스키마 정본은 server/db/schema.ts(issue) / drizzle 마이그레이션 0004. 본 파일은 표준 적용 경로.
CREATE TABLE IF NOT EXISTS `issue` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `type` text DEFAULT 'issue' NOT NULL,
  `title` text NOT NULL,
  `body` text DEFAULT '' NOT NULL,
  `status` text DEFAULT 'open' NOT NULL,
  `priority` text,
  `author_id` integer NOT NULL,
  `author_name` text DEFAULT '' NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text
);
CREATE INDEX IF NOT EXISTS `idx_issue_status` ON `issue` (`status`);
CREATE INDEX IF NOT EXISTS `idx_issue_type` ON `issue` (`type`);
CREATE INDEX IF NOT EXISTS `idx_issue_updated_at` ON `issue` (`updated_at`);
