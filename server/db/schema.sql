-- 맑은노티 현황판(board) 스키마 — Cloudflare D1 (db: malgn-noti-project)
-- 현황판 = 프로젝트 메타 + 단계(stage) + 작업(task) 3 테이블.

DROP TABLE IF EXISTS task;
DROP TABLE IF EXISTS stage;
DROP TABLE IF EXISTS board_meta;

CREATE TABLE board_meta (
  id           INTEGER PRIMARY KEY,        -- 단일 행(=1)
  project_name TEXT    NOT NULL,
  last_updated TEXT    NOT NULL            -- YYYY-MM-DD
);

CREATE TABLE stage (
  id       TEXT    PRIMARY KEY,            -- step-1 …
  no       TEXT    NOT NULL,               -- "Step 1"
  name     TEXT    NOT NULL,
  emoji    TEXT,
  summary  TEXT,
  weight   INTEGER NOT NULL DEFAULT 0,     -- 가중치(%)
  progress INTEGER NOT NULL DEFAULT 0,     -- 진행률(%)
  sort     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE task (
  id              TEXT    PRIMARY KEY,      -- 5-2-A1 …
  stage_id        TEXT    NOT NULL,
  grp             TEXT,                     -- 그룹(카테고리)명
  title           TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'pending', -- done|in_progress|pending|blocked
  owner           TEXT,
  note            TEXT,
  target_date     TEXT,
  completion_date TEXT,
  href            TEXT,
  sort            INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (stage_id) REFERENCES stage(id)
);

CREATE INDEX idx_task_stage ON task (stage_id, sort);
