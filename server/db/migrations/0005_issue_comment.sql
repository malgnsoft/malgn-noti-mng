-- 이슈 답글(댓글) 테이블.
-- 이 레포는 d1_migrations 추적을 쓰지 않으므로 직접 execute 로 적용:
--   wrangler d1 execute malgn-noti-project --remote --file=server/db/migrations/0005_issue_comment.sql
CREATE TABLE IF NOT EXISTS issue_comment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_id INTEGER NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  author_id INTEGER NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_issue_comment_issue ON issue_comment(issue_id);
