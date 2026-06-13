-- 회원 권한 등급(grade) 추가 + 기존 활성 회원을 관리자로 부트스트랩.
-- 이 레포는 d1_migrations 추적을 쓰지 않으므로 직접 execute 로 적용:
--   wrangler d1 execute malgn-noti-project --remote --file=server/db/migrations/0004_member_grade.sql
ALTER TABLE member ADD COLUMN grade TEXT NOT NULL DEFAULT 'member';
UPDATE member SET grade = 'admin' WHERE status = 'active';
