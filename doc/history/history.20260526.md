# 2026-05-26 — malgn-noti-api 데이터 모델·초기 DDL·Hyperdrive 연결·첫 프로덕션 배포 + 운영 컨벤션 명문화 + malgn-noti 배포 #53 + Aurora DDL 적용 + 기본 CRUD API 골격 + /doc + 두 번째 프로덕션 배포

## 한 줄 요약

`malgn-noti-api`의 **데이터 모델링부터 첫 프로덕션 배포까지** 한 흐름으로 진행 — 사용자단 화면·소스·MD를 읽고 49개 테이블 데이터 모델 작성(**TB_** 접두어, `company_id` FK, `status INT` 1/0/-1 + `*_state VARCHAR` 분리, `*_yn CHAR(1)` Y/N, `loginid`/`email` 분리), 시각 ERD를 Mermaid 9종으로 작성, 발송량 시나리오 분석 후 **월 RANGE 파티셔닝 + Hot/Warm/Cold + R2 오프로드** 확장성 전략을 정본 §13 + 별도 `SCALABILITY.md`로 정리, 49 테이블 초기 마이그레이션 SQL(파티션 5종 + `raw_payload_r2_key` 포함)을 작성, **Hyperdrive(MySQL) 바인딩 `a2ba4efe7421464da1d5ff5e620b33a3`** 연결 + `drizzle-orm/mysql2` 셋업 + `/health/db` 헬스 체크 + `wrangler dev --remote` 로 로컬에서도 실제 Aurora MySQL 8.0.42 응답 확인, **`https://malgn-noti-api.malgnsoft.workers.dev` 프로덕션 첫 배포** 완료 (모든 엔드포인트 200, `/health/db` mysql_version 8.0.42). 이어 `malgn-noti-api/CLAUDE.md §8.1`에 **배포·Git·작업 이력 운영 컨벤션을 명문화**하여, 프론트와 동일한 디스플린(typecheck → 배포 → 검증 → 커밋·푸시·history)을 백엔드에서도 강제하도록 정리. 작업 이력은 `malgn-noti/doc/history/`가 3 레포 공통 정본임을 §8.1에 못박음.

## 1. 데이터 모델 (`malgn-noti-api/doc/DATA-MODEL.md`)

- 입력: `malgn-noti`의 화면 73개·`app/types/*`·목업 데이터, `malgn-noti-api/CLAUDE.md §5 1차 모델`, `doc/DESIGN.md §14`.
- **49개 테이블** / 9개 도메인. Aurora MySQL 8.0 / Drizzle 대상.
- 공통 규칙:
  - **`TB_` 접두어 + 대문자 스네이크** (`TB_DISPATCH_REQUEST`).
  - 컬럼 `snake_case`, 고객사 FK는 `company_id`. 멀티 테넌트 격리(`§1.2`).
  - 시간 `DATETIME` UTC. PK `BIGINT UNSIGNED AUTO_INCREMENT`.
  - 불리언 `CHAR(1)` `'Y'`/`'N'`, 컬럼명 `*_yn` (`§1.11`).
  - **`status INT NOT NULL DEFAULT 1`** — `1`=정상/`0`=중지/`-1`=삭제 (`§1.12`).
  - 다단계 업무 상태는 **`*_state VARCHAR(20)`** 으로 분리 — `dispatch_state`/`review_state`/`approval_state`/`pay_state`/`answer_state` 등 16개.
  - `enum` 회피 → `VARCHAR` + Zod 검증.
  - JSON 컬럼(`spec`, `message_spec`, `nodes`)으로 채널 형상 다양성 흡수.
- **TB_USER** — `loginid` (로그인 ID, `UNIQUE(company_id, loginid)`) + `email` (알림·영수증 수신) 분리.
- 도메인별 §3~§10 — 계정/인증, 크레딧/결제, 발신정보, 주소록, 템플릿, 발송·Flow·캠페인, 이력/Export, 문의/시스템.

## 2. ERD (`malgn-noti-api/doc/ERD.md`)

- Mermaid `erDiagram` **9종** — 전체 관계 개관 1 + 도메인 8 (§2~§9).
- 모든 컬럼에 코멘트 4번째 항목 추가 — 박스 내부에 `bigint id PK "고객사 식별자"` 형태로 렌더링.
- 카디널리티 `||--o{`(1:N)·`||--||`(1:1)·`||--o|`(1:0/1)·M:N(junction)·자기참조(트리·중첩답글)·복합 PK 모두 표현.

## 3. 확장성·파티셔닝 전략 (`malgn-noti-api/doc/SCALABILITY.md`)

볼륨 가정(1년차 100만~1천만/월 → 5년차 1억+/월)에서 13억 행 Aurora 누적 시나리오를 분석하고, **DDL 첫 작성 시점부터** 적용해야 사후 마이그레이션 비용을 회피할 수 있는 결정 사항을 §1~§7로 정리.

- **§1 월 RANGE 파티셔닝** — `TB_DISPATCH_REQUEST/ITEM/EVENT` + `TB_CREDIT_LEDGER` + `TB_AUDIT_LOG` 5개. PK 복합 `(id, created_at)` (또는 `received_at`) — MySQL 8 파티셔닝 제약. `DROP PARTITION`으로 회수, `DELETE` 금지.
- **§2 Hot/Warm/Cold** — Hot(Aurora 90일) → Warm(Aurora 콜드 13개월) → **Cold(R2 Parquet)**. `DROP PARTITION` 직전 Parquet 덤프 Worker Cron.
- **§3 `raw_payload` R2 오프로드** — 1 KB 미만은 인라인, 초과분은 `raw_payload_r2_key`로 분리. 평균 DB 부담 1/10 수준.
- **§4 사전 집계** — 기존 `TB_DISPATCH_STAT_DAILY` 옆에 **`TB_DISPATCH_STAT_HOURLY`** 추가 (5분 주기). 시간 범위별 출처 계층화.
- **§5 인덱스·쿼리 가드** — OFFSET 금지·커서 페이징·30일 기본 윈도우·JSON generated column.
- **§6 Aurora 토폴로지** — Writer/Reader 분리, Hyperdrive 바인딩 2개(`_W`/`_R`), Limitless 전환 기준.
- **§7 운영 트리거** — `DISPATCH_ITEM > 5억 행 → ClickHouse PoC`, `Writer CPU 60%+ → Reader 추가` 등 임계 룰북.

## 4. 초기 DDL (`malgn-noti-api/src/db/migrations/0000_initial.sql`)

- **49개 테이블** — MySQL 8.0 / Aurora MySQL 3 호환, `utf8mb4_0900_ai_ci`, `ENGINE=InnoDB`, 모든 컬럼·테이블에 `COMMENT`.
- **파티션 적용** — 5개 테이블, 2026-05~2027-06 (14개월) + `pmax`. 매월 25일 `REORGANIZE`, 매월 1일 `DROP PARTITION`(외부 Cron Worker).
- **§13.3 R2 오프로드 컬럼** — `TB_DISPATCH_EVENT.raw_payload_r2_key VARCHAR(255) NULL` 1차 스키마에 포함.
- 파티션 테이블은 MySQL 제약상 FK 미사용 → application-level 정합성, 주석 명시.
- `drizzle.config.ts` 신설 — `db:introspect`/`db:generate`/`db:migrate` 스크립트.

## 5. Hyperdrive 연결 (`malgn-noti-api/wrangler.toml` + 신규 코드)

- 사용자 제공 Hyperdrive ID: **`a2ba4efe7421464da1d5ff5e620b33a3`**.
- `wrangler.toml`:
  ```toml
  [[hyperdrive]]
  binding = "HYPERDRIVE"
  id = "a2ba4efe7421464da1d5ff5e620b33a3"
  ```
- **`src/db/client.ts`** — `drizzle-orm/mysql2` + `mysql2/promise.createConnection`. `getDb(env, ctx)` 요청 스코프 핸들(`ctx.waitUntil(conn.end())`), `pingDb(env)` 헬스. mysql2 mixin 타입 이슈는 `db.execute(sql\`...\`)`로 우회.
- **`src/index.ts`** — `GET /health/db` 추가, `Bindings.HYPERDRIVE: Hyperdrive` 타입 결합 (cf-typegen).
- **의존성**: `drizzle-orm@0.36.4`, `mysql2@3.22.3`, `drizzle-kit@0.28.1`. wrangler `4.90 → 4.94` 업그레이드.

## 6. 로컬 개발 = 실제 Hyperdrive

- 로컬 `wrangler dev` 기본 모드는 Hyperdrive를 로컬 Postgres로 에뮬레이트하려 하므로 실패 → `wrangler dev --remote` 필요.
- Hyperdrive는 4.94 시점에도 per-binding `remote = true` 미지원 (`wrangler.toml`에 메모만 남김) → `package.json` `dev` 스크립트를 **`wrangler dev --remote`** 로 변경.
- `pnpm dev` 단독으로 `http://localhost:8787` 기동, 모든 요청이 실제 Cloudflare edge 경유 Hyperdrive → Aurora.

## 7. 프로덕션 배포

- `pnpm typecheck` 통과 → `pnpm run deploy` (`wrangler deploy`).
- 산출: **`https://malgn-noti-api.malgnsoft.workers.dev`**, Version `8b0d8674-57d0-4b00-966e-bdafc4de7a83`.
- 검증:
  ```
  GET /             → 200 {"name":"malgn-noti-api","status":"placeholder","env":"production"}
  GET /health       → 200 {"ok":true,"env":"production"}
  GET /health/db    → 200 {"ok":true,"mysql_version":"8.0.42"}   ← Aurora 응답
  ```
- 의미 — `malgn-noti-api`의 **첫 프로덕션 배포**이자, Cloudflare Workers ↔ Hyperdrive ↔ AWS Aurora MySQL 경로가 살아 있음을 확인한 마일스톤.

## 8. 산출물

### 신규 파일 (`malgn-noti-api/`)
- `doc/DATA-MODEL.md` (49 테이블 정본)
- `doc/ERD.md` (Mermaid 9 다이어그램)
- `doc/SCALABILITY.md` (§13 상세 가이드)
- `src/db/migrations/0000_initial.sql` (1049라인)
- `src/db/client.ts`
- `drizzle.config.ts`
- `worker-configuration.d.ts` (cf-typegen 산출)

### 수정 파일
- `wrangler.toml` — Hyperdrive 바인딩 추가
- `src/index.ts` — `/health/db` 라우트 + 타입 확장
- `package.json` — drizzle 의존성 + `dev: wrangler dev --remote` + db 스크립트
- `pnpm-lock.yaml`

### 커밋 (malgn-noti-api)
- `eecf226` — doc: 데이터 모델 / ERD / 확장성 전략 정리
- `0653472` — db: 초기 마이그레이션 0000_initial.sql + drizzle-kit 설정
- `7a17504` — Hyperdrive(MySQL) 연결 + /health/db + Drizzle 런타임 셋업

푸시: `decfaf0..7a17504 → origin/main`.

## 10. 운영 컨벤션 명문화 (`malgn-noti-api/CLAUDE.md §8.1`)

배포 직후 사용자가 "배포 규정은 `malgn-noti/CLAUDE.md` 파일을 참고해 줘"라고 명확히 짚어 — 이번 흐름이 우연이 아니라 **명문 규정**으로 박혀야 다음에도 재현됨을 확인. `malgn-noti-api/CLAUDE.md`에 §8.1을 추가하여 다음을 정리:

- **Git** — 단일 main, 사용자 명시 요청 시에만 커밋·푸시, 한국어 제목 + 본문 불릿 + `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer, 무관 untracked 파일 끌어들이지 않음.
- **배포 (Workers)** — `pnpm typecheck → pnpm run deploy` (`pnpm deploy`는 pnpm 워크스페이스 명령과 충돌하므로 `run` 명시), 프로덕션 URL `https://malgn-noti-api.malgnsoft.workers.dev`, 검증은 `/health` + `/health/db`(mysql_version 반환), DDL/시드는 Worker 배포와 분리 멱등 적용.
- **작업 이력** — `malgn-noti/doc/history/`가 **3 레포 공통 정본**임을 명문화. API 변경도 같은 폴더의 그날 파일에 기록하며, 산출물 절에 별 레포 커밋 해시까지 함께 표기.
- §8 개발 명령어 표 갱신 — `pnpm dev`가 `wrangler dev --remote`임을 반영, `cf-typegen`·`db:introspect` 추가, `pnpm run deploy` 명시.

산출물: `malgn-noti-api: e09f70e docs: 배포·Git·작업 이력 운영 컨벤션 명문화 (§8.1)`. 푸시 `7a17504..e09f70e → origin/main`.

## 11. malgn-noti 프론트 배포 #53 — 새로고침 버튼 일괄 제거

§7.1 흐름대로 `pnpm build → npx wrangler@4 pages deploy dist --project-name=malgn-noti --branch=main --commit-dirty=true --commit-message "Remove refresh buttons from list toolbars + update guide and DESIGN"` 실행. **Working tree에 누적된 사용자 작업분**(13개 파일)을 그대로 라이브로 올리고, 직후 `52f653b` 커밋으로 main을 라이브와 동기화.

- 변경 패턴: 발송 조회·관리·연락처·발신정보·랜딩 등 **목록 페이지의 `list-toolbar` 새로고침 버튼**과 보조 CSS(`toolbar-sep`, `toolbar-refresh`)를 일괄 제거. 페이지당 평균 −27~28라인.
- 동시 변경: `app/pages/guide.vue` +162라인(가이드 확장), `doc/DESIGN.md` 86라인 갱신.
- 빌드: Nitro `cloudflare-pages` 프리셋 → `dist/`, 총 2.96 MB / gzip 889 KB.
- 배포 URL: 프로덕션 https://malgn-noti.pages.dev, alias https://127705c3.malgn-noti.pages.dev.
- 검증: `/`, `/sender/numbers`, `/history/sms` 모두 HTTP 200. 새로고침 버튼 제거 마커 확인 — `curl -s /sender/numbers | grep -c toolbar-refresh` → `0` (제거 확정).
- 산출물: `malgn-noti: 52f653b list 툴바 새로고침 버튼 일괄 제거 + guide / DESIGN 갱신` (13 files, +226 −297). 푸시 `252033d..52f653b → origin/main`.

## 12. Aurora MySQL에 0000_initial.sql 적용 — 49 테이블 + 75 파티션 라이브

Aurora가 SG로 Hyperdrive egress IP만 허용해 로컬 mysql CLI는 차단됨 → **Worker 경유 마이그레이션** 인프라를 구축하고 첫 DDL을 적용.

### 12.1 `/admin/*` 라우트 (`malgn-noti-api/src/routes/admin.ts`)

- **게이트**: 모든 `/admin/*`는 `X-Migrate-Token` 헤더 = `env.MIGRATE_TOKEN` 일치 필수. 미설정 시 라우트 전체 403. 로컬은 `.dev.vars`(gitignored, `openssl rand -hex 16`로 생성), 프로덕션은 `wrangler secret put MIGRATE_TOKEN`.
- `GET /admin/tables` — `information_schema.TABLES`에서 `TB_*` 목록 조회.
- `GET /admin/partitions` — `information_schema.PARTITIONS`에서 파티션 명세 조회.
- `POST /admin/migrate` — body로 SQL 텍스트를 받아 **statement 단위로 순차 실행**:
  - `--` 주석 제거 + `;` 줄바꿈 기준 split.
  - 이미 `TB_*` 테이블이 존재하면 409 거부(실수 방지).
  - 첫 에러에서 중단(DDL 부분 적용 위험).
  - 응답: `{ ok, statements_total, statements_succeeded, duration_ms, errors[] }`.

### 12.2 적용 절차

`pnpm dev`(`wrangler dev --remote`)로 로컬 Worker가 실제 Hyperdrive → Aurora에 접근. curl로 SQL을 본문 전달:

```bash
TOKEN=$(cat .dev.vars | cut -d= -f2)
curl -X POST http://localhost:8787/admin/migrate \
  -H "X-Migrate-Token: $TOKEN" \
  -H "Content-Type: application/sql" \
  --data-binary @src/db/migrations/0000_initial.sql
```

응답:
```json
{ "ok": true, "statements_total": 52, "statements_succeeded": 52, "duration_ms": 6684, "errors": [] }
```

### 12.3 검증

- `GET /admin/tables` → **49개 `TB_*` 테이블** 전부 생성 확인.
- `GET /admin/partitions` → **75개 파티션** (`TB_DISPATCH_REQUEST`·`TB_DISPATCH_ITEM`·`TB_DISPATCH_EVENT`·`TB_CREDIT_LEDGER`·`TB_AUDIT_LOG` × 각 15 파티션 = `p202605..p202706` + `pmax`).
- 적용 시간 6.7초.

### 12.4 산출물

- `malgn-noti-api: a390f32 admin: /admin/migrate · /admin/tables · /admin/partitions 라우트 추가` (2 files, +163).
- `.dev.vars`는 gitignored — `MIGRATE_TOKEN`만 로컬 보관. 프로덕션 배포 시에는 별도로 `wrangler secret put` 필요(현 시점 미배포 — 라이브 Worker에는 admin 라우트 없음).
- 푸시 `e09f70e..a390f32 → origin/main`.

### 12.5 결정 — admin 라우트는 **로컬 전용** (선택 A 유지)

향후 0001+ 마이그레이션도 동일 방식(`pnpm dev --remote` + curl localhost)으로 적용. 프로덕션에는 배포하지 않음. 이유: 라우트가 공개 URL에 노출되면 토큰 유출 = DB 전체 권한 탈취 위험. 마이그레이션 빈도가 낮아 로컬 적용 부담이 작음. 잦아지면 그때 별도 admin-worker 분리 또는 GitHub Actions OIDC 등 더 안전한 방식으로 전환.

### 12.6 환경 가드 추가 — 실수로도 프로덕션에 안 뚫리도록 (`63ba424`)

토큰 게이트만으로도 보호되지만, 누군가 `wrangler secret put MIGRATE_TOKEN`을 실수로 프로덕션에 등록하면 라우트가 살아남. 이걸 막는 **이중 안전망**:

```ts
admin.use('*', async (c, next) => {
  if (c.env.APP_ENV !== 'local') {
    return c.json({ code: 'not_found', message: 'Route not found' }, 404)
  }
  // ... 토큰 검사 ...
})
```

- 로컬 `.dev.vars`에 `APP_ENV=local` 추가하여 오버라이드 (gitignored).
- 프로덕션 `wrangler.toml [vars] APP_ENV="production"` 유지 → 라우트가 무조건 404.
- 외부에서 보면 "라우트가 존재하지 않는 것"처럼 위장 (`{"code":"not_found"}`).
- 검증:
  - `localhost:8787/admin/tables` + 토큰 → **200**, 49 tables.
  - `localhost:8787/admin/tables` 토큰 누락 → **403**.
  - `malgn-noti-api.malgnsoft.workers.dev/admin/tables` + 유효 토큰 → **404**.

### 12.7-pdf ERD를 인쇄용 PDF로 (`malgn-noti-api/doc/ERD.pdf`, `470b55a`)

DDL과 동기화된 시각 ERD를 외부 공유·인쇄용 PDF로 생성:

- `@mermaid-js/mermaid-cli` (mmdc)가 ERD.md의 9개 mermaid 코드블록을 페이지별 PDF로 렌더 (Chromium 1회 다운로드).
- `python3 -m pip install --user pypdf` 후 `PdfWriter.append`로 9 페이지를 1 파일(925 KB)로 병합.
- 각 페이지에서 한국어 텍스트 추출 검증 (테이블·컬럼·관계 라벨 모두 정상).
- `ERD.md §10`에 재생성 절차 명문화 — 다음 누군가 갱신할 때 막힘 없음.

### 12.7 마이그레이션 절차 정본 — `malgn-noti-api/doc/MIGRATION.md` (`47afe1a`)

위 12.1~12.6의 결정·절차를 운영 문서 1개로 정리해서 정본화. 9개 섹션 — 왜 이런 절차인가(Aurora SG 제약), 사전 준비, SQL 작성 규칙, 적용 절차 step-by-step, 실패 처리 3안, FAQ 8건, 적용 이력 책임(git + history/), 파티션 운영 분리, 관련 문서. `CLAUDE.md §8`에 링크 추가, `pnpm db:migrate`는 직접 연결 불가라 비현실적임을 표기.

### 12.8 다음 단계 (마이그레이션 운영)

- 파티션 자동 운영 Cron Worker(`src/workers/partition-maintenance.ts`) — 매월 25일 다음 달 파티션 `REORGANIZE`, 매월 1일 13개월 전 파티션 R2 덤프 + `DROP PARTITION` (SCALABILITY §1·§2).
- 시드 데이터 `0001_seed.sql` (system terms, 샘플 템플릿 카탈로그).
- `pnpm db:introspect`로 `src/db/schema.ts` 자동 생성.

## 13. 기본 CRUD API 골격 — Hono + Drizzle + Zod (`a146e81`, `8128468`, `2b6f720`)

49 테이블 전부 CRUD는 과하므로, **재사용 가능한 인프라(errors/pagination/auth/schema) + 가장 활용도 높은 도메인(주소록·발신번호)을 패턴 사례로** 완성. 나머지 도메인은 동일 패턴 복제.

### 13.1 사전 픽스 (`a146e81`)

- `getDb()`가 `ctx.waitUntil(conn.end())`을 즉시 등록해서 핸들러 사용 전에 연결이 닫히던 버그. 모든 라우트가 500 (`Can't add new command when connection is in closed state`). → `conn.end()` 호출 제거. Hyperdrive 풀링에 의존, isolate 종료시 GC. TODO: `withDb` 미들웨어로 finally + waitUntil 구조 리팩터.
- `/admin/migrate`에 `?allow_existing=1` 쿼리 — 0001+ 마이그레이션 / 시드 데이터 적용 시 TB_* 존재 가드 우회. 신규 DDL은 가드 유지.

### 13.2 의존성 (`8128468`)

`zod 4.4.3` + `@hono/zod-validator 0.8.0`. CLAUDE.md §9 "모든 입력은 Zod로 파싱" 규칙 준수. Zod v4는 `.partial()`이 `.refine()`된 스키마에서 동작하지 않으므로 베이스 스키마 공유 + refine 각각 적용 패턴 채택.

### 13.3 인프라 + 라우트 (`2b6f720`)

**재사용 가능 인프라**
- `src/lib/errors.ts` — `AppError` + `errors` 헬퍼(notFound/forbidden/conflict/validation 등).
- `src/lib/pagination.ts` — 커서 페이징 (SCALABILITY §5) base64url JSON `{ c: ISO, i: id }`, `paginate(rows, limit, toCursor)` 헬퍼.
- `src/middleware/auth.ts` — `requireAuth()`/`requireRole()`/`authCtx()`. 로컬 dev 단축(`X-Dev-Company-Id`/`X-Dev-User-Id`/`X-Dev-Role` 헤더). 프로덕션 JWT는 signup/login 라우트 구현 시 활성.
- `src/db/schema.ts` — Drizzle 수기 스키마 (touch한 6개 — TB_COMPANY, TB_USER, TB_CONTACT, TB_CONTACT_GROUP, TB_CONTACT_GROUP_MEMBER, TB_SENDER_PHONE). TS camelCase ↔ 물리 snake_case, `status INT default 1`, `*_yn CHAR(1)`.

**도메인 라우트**
- `GET /me` — 현재 사용자 + 소속 고객사 (auth 검증용 최소).
- `/contacts` — CRUD 완전체. list (커서·`?q=`·`?status=`), POST/GET/PATCH/DELETE(soft).
- `/contact-groups` — CRUD + `/:id/members` POST·DELETE (memberCount 캐시 자동 갱신, IN 절 + 소유 검증).
- `/sender-phones` — 신청·조회·삭제. `approval_state=대기` 신청, 승인된 번호는 자가 삭제 금지(403).

**전역 wiring (`src/index.ts`)**
- `AppError` `onError` 핸들러 → `{ code, message, details? }` 표준 응답.
- 4개 라우트 등록 + 기존 `/health`·`/health/db`·`/admin/*` 유지.

### 13.4 검증 (`pnpm dev --remote` + curl)

```bash
TOKEN=$(grep ^MIGRATE_TOKEN= .dev.vars | cut -d= -f2)
# 시드
{ echo 'INSERT IGNORE INTO TB_COMPANY (id, name, status) VALUES (1, "테스트사", 1);';
  echo 'INSERT IGNORE INTO TB_USER (id, company_id, loginid, password_hash, name, role, status) VALUES (1, 1, "admin@test.com", "stub", "테스트관리자", "admin", 1);';
} | curl -X POST "http://localhost:8787/admin/migrate?allow_existing=1" \
    -H "X-Migrate-Token: $TOKEN" -H "Content-Type: application/sql" --data-binary @-
```

확인된 동작:
- 401 미인증 / 200 인증 / 400 Zod 검증 실패 / 404 미존재 모두 표준 응답
- `GET /me` → 200, `{ user, company, ctxRole }`
- `POST /contacts` → 201, 한글·JSON 필드 정상 (`extraVars: {"city":"서울"}`)
- `GET /contacts?limit=5` → 커서 페이지, `nextCursor: null` (1건)
- `POST /sender-phones` → 201, `approvalState: "대기"`
- `GET /sender-phones?approvalState=대기` → URL 인코딩 한글 필터 정상

### 13.5 다음 단계

동일 패턴 복제:
- `/optout-entries`, `/templates`(채널별 spec), `/history/*`(read-only 조인 뷰), `/sender-*`(브랜드·도메인·인증서), `/campaigns`, `/charge`·`/credit`.

코어 미흡 영역:
- `signup`/`login` → JWT 검증 + auth 미들웨어 활성. 현재는 dev 단축만.
- `withDb` 미들웨어 (finally + waitUntil 패턴) — 현재는 conn auto-close 안 함.
- Zod 검증 실패 응답 — 현재 `@hono/zod-validator` 기본 형식. `AppError` 형식과 통일하려면 hook 등록 검토.

## 14. API 문서 페이지 — `/doc` Scalar UI (`beef401`)

### 14.1 엔드포인트

- `GET /doc/openapi.json` — OpenAPI 3.1 스펙 (raw JSON, ~17 KB)
- `GET /doc` — Scalar API Reference UI (현대적 OpenAPI 뷰어, Swagger UI 대안)

### 14.2 내용 (`src/openapi.ts`)

- **10 paths / 16 operations** — `/health`·`/health/db`·`/me`·`/contacts(/{id})`·`/contact-groups(/{id}, /{id}/members)`·`/sender-phones(/{id})`
- **11 schemas** — `Contact`/`ContactCreate`/`ContactPatch`/`ContactGroup`/`ContactGroupCreate`/`ContactGroupPatch`/`MembersBody`/`SenderPhone`/`SenderPhoneCreate`/`Me`/`Error`
- **security schemes** — `DevCompanyId`/`DevUserId`/`DevRole`(로컬 dev API 키 방식) + `BearerAuth`(프로덕션 JWT, 구현 시 활성)
- **공통 parameters** — `Cursor`/`Limit`/`IdPath`. **공통 responses** — `Unauthorized`/`NotFound`/`Validation`
- **사용 가이드** — 인증 방식·응답 형식·커서 페이징·멀티 테넌트 격리·관련 문서 링크 — `info.description`에 명문화

### 14.3 설계 결정

- **손으로 작성** (zod-openapi 자동 생성 미사용). Zod v4 호환 우려 + 단순성 우선. 라우트가 안정화되면 자동 생성 마이그레이션 검토.
- **드리프트 위험**: 라우트 추가/변경 시 `src/openapi.ts`도 함께 갱신 필요. PR 리뷰 체크리스트에 명시.
- **Scalar UI 선택** — Swagger UI 대비 모던 디자인·다크모드·코드 샘플 자동 생성.

### 14.4 검증

```
GET /doc/openapi.json → 200, 17 KB, openapi 3.1.0
  paths: 10, schemas: 11
GET /doc              → 200, text/html, scalar 마커 포함
```

브라우저로 http://localhost:8787/doc 접속 → 좌측 사이드바 네비게이션 + 우측 인터랙티브 콜 패널.

## 15. malgn-noti-api 프로덕션 배포 #2

§7에서 적용한 첫 배포(`Version 8b0d8674`) 이후 누적된 변경(§10 운영 컨벤션 명문화 / §12 admin 라우트 + Aurora DDL 적용 인프라 / §13 기본 CRUD API + Drizzle 스키마 / §14 /doc Scalar UI)을 한 번에 라이브로.

### 15.1 배포 흐름 (`malgn-noti-api/CLAUDE.md §8.1` 준수)

```
pnpm typecheck       → 통과
pnpm run deploy      → Cloudflare Workers
검증                  → /health, /health/db, /doc, /doc/openapi.json, /me, /admin/* 7건
커밋·푸시              → 이미 sync (이전 단계마다 push했음)
history              → 본 절 추가
```

### 15.2 배포 결과

- **Version ID**: `1fdc3b12-9e43-4c31-90c4-609845569e65`
- 번들: 2309.97 KiB / gzip 549.75 KiB (이전 1638.71 KiB → 2309.97 KiB, drizzle + mysql2 + zod + Scalar 포함으로 증가)
- Worker Startup: 49 ms

### 15.3 검증 (https://malgn-noti-api.malgnsoft.workers.dev)

| 엔드포인트 | 결과 |
| --- | --- |
| `GET /` | 200, `env: "production"` |
| `GET /health` | 200 |
| `GET /health/db` | 200, `mysql_version: "8.0.42"` |
| `GET /doc/openapi.json` | 200, 17 KB, 10 paths |
| `GET /doc` | 200, text/html (Scalar UI) |
| `GET /me` (인증 없음) | **401** `unauthenticated` ← 인증 가드 작동 |
| `GET /admin/tables` (유효 토큰) | **404** `not_found` ← env 가드(APP_ENV=production) 작동 |

두 가드 모두 프로덕션에서 정상 작동 — auth는 dev 헤더 거부 + JWT 미구현으로 401, admin은 토큰과 무관하게 404로 위장.

### 15.4 라이브 ↔ main 일치

배포 시점 working tree와 `main`이 이미 일치 (`beef401`). 추가 동기화 커밋 불필요.

## 16. 14개 도메인 라우트 추가 — 발신정보 / 주소록 / 템플릿 / 문의 / 결제 (`3bd9864`)

§13의 4개 라우트(기본 CRUD 골격) 패턴을 복제해 나머지 주요 도메인을 일괄 확장. 49 테이블 중 ~24개를 API로 노출.

### 16.1 스키마 확장 (`src/db/schema.ts`)

13개 Drizzle 테이블 추가:
- 발신정보: `rcsBrand`·`emailDomain`·`pushCert`·`kakaoProfileGroup`·`kakaoSenderProfile`·`optout080Number`
- 주소록: `optoutEntry`
- 템플릿: `templateCategory`·`template`
- 시스템: `inquiry`·`inquiryReply`·`landingPage`·`companySettings`
- 결제: `paymentMethod`·`creditLedger`(파티션 PK)

### 16.2 신규 라우트 14종

| 라우트 | 메서드 | 특징 |
| --- | --- | --- |
| `/rcs-brands` | CRUD | brandCode UNIQUE 409 처리 |
| `/email-domains` | CRUD | verified_yn / dkim_state 워크플로 |
| `/push-certs` | CRUD | credentialEnc 응답 제외, base64 입력 |
| `/kakao-profile-groups` | CRUD | 단순 그룹 메타 |
| `/kakao-sender-profiles` | CRUD | sendKeyEnc 응답 제외, profileId UNIQUE |
| `/optout-080-numbers` | CRUD | line_state 워크플로 |
| `/optout-entries` | CRUD | 채널별, 발송 직전 핫 경로, status=-1로 거부 해제 |
| `/template-categories` | CRUD | 트리(부모 검증), 자식 있으면 삭제 거부 |
| `/templates` | CRUD | 채널 필터, 시스템 샘플(company_id NULL) 조회 포함, 수정 시 review_state→draft |
| `/inquiries` | CRUD + `/:id/replies` | 답변 추가 시 answer_state→progress |
| `/company-settings` | GET / PUT | 1:1 upsert (settings JSON) |
| `/payment-methods` | CRUD | billingKeyEnc 마스킹, default_yn 단일성 보장 |
| `/landing-pages` | CRUD | publishedYn=Y 시 publishedAt 자동 |
| `/credit-ledger` | GET (read-only) | append-only, entryType/기간 필터 |

### 16.3 공통 패턴 (기존 §13과 동일)

- `requireAuth()` 미들웨어 + `companyId` 스코프
- 커서 페이징 `(created_at DESC, id DESC)`
- soft delete `status=-1`
- 시크릿 필드(credentialEnc·sendKeyEnc·billingKeyEnc)는 응답에서 제외
- UNIQUE 위반은 409 conflict 응답

### 16.4 검증 (pnpm dev + curl)

9개 라우트 POST/GET 정상 동작 확인:
- `/rcs-brands`, `/email-domains`, `/optout-entries`, `/template-categories`
- `/templates` (한글 + JSON spec)
- `/inquiries`, `/company-settings` (GET/PUT upsert)
- `/credit-ledger` (빈 목록 페이징)

### 16.5 미완료 / 알려진 한계

- **`/doc` OpenAPI 스펙 동기화 미반영** — 14개 신규 라우트가 `src/openapi.ts`에 없음. 손으로 작성 부담이 너무 큼. 다음 단계로 **`hono-openapi` 자동 생성 마이그레이션** 후 일괄 갱신 권장.
- 일부 PATCH 미제공 — sender-phones, kakao-profile-groups, optout-080-numbers, optout-entries 등 워크플로 상태 변경은 별도 RPC 라우트(`/sender-phones/:id/approve`)로 분리하는 게 깔끔.
- 인증·JWT는 여전히 dev 헤더만. signup/login 구현이 다음 큰 마일스톤.
- `dispatch-*` 라우트(발송 이력 read-only)는 파티션 테이블이라 별도 설계 필요. 다음 단계.

## 17. Phase 1·2·3 — /doc 동기화 + 인증 + 발송 이력 (`32f7ce4`, `c19f116`, `f45ad01`)

§16 직후 사용자의 "차례대로 진행" 지시에 따라 3 phase 연속 진행.

### 17.1 Phase 1 — openapi.ts 확장 (`32f7ce4`)

§16에서 추가한 14개 라우트가 `/doc`에 안 보이던 문제 해결.
- 자동 생성 시도(`hono-openapi` 1.x) → Standard Schema 기반 새 버전이 Zod v4 vendor 등록 필요로 복잡 → 롤백.
- 대신 **수기 확장** + `cursorList()`·`single()`·`ok` 헬퍼로 응답 재사용해 간결화.
- 규모: paths 10→**37**, operations 16→**71**, schemas 11→**45**, tags 5→**19**, 스펙 17 KB → **54 KB**.

### 17.2 Phase 2 — 인증 (signup / login + JWT) (`c19f116`)

dev 헤더만으론 외부에서 호출 불가 → JWT 흐름 정식 구현.

신규 파일:
- `src/lib/password.ts` — **PBKDF2-SHA256** 100k 라운드 + salt 16B (Workers Web Crypto). 저장 형식 `pbkdf2$<iter>$<saltB64>$<hashB64>`. timing-safe compare.
- `src/lib/jwt.ts` — HS256 (hono/utils/jwt), payload `{ sub, cid, role, iat, exp }`, 기본 만료 7일.
- `src/routes/auth.ts`
  - `POST /auth/signup` — 신규 고객사 + owner 사용자 생성, JWT 발급. loginid 중복 → 409. 사용자 생성 실패 시 고객사 best-effort 무효화.
  - `POST /auth/login` — companyId + loginid + password 검증, JWT 발급. account enumeration 방지(일관된 401). lastLoginAt 갱신.

미들웨어:
- `requireAuth()` — **Bearer JWT 우선** 검증 → 실패하면 dev 헤더(APP_ENV=local) 백업 → 둘 다 없으면 401.

설정:
- `JWT_SECRET` 환경변수 추가 (`.dev.vars` + 운영은 `wrangler secret put`).

검증 6건:
- signup → 201 + JWT
- GET /me with JWT → 200
- login(정확) → 200 + JWT, lastLoginAt 갱신
- login(틀린 pw) → 401
- 잘못된 JWT → 401
- 헤더 없음 → 401

알려진 한계:
- OTP·약관·재설정·2FA·refresh token·세션 강제 로그아웃 미구현
- 고객사+사용자 생성 트랜잭션 미사용 (saga 권장)

### 17.3 Phase 3 — 발송 이력 read-only (`f45ad01`)

발송 화면(history/*.vue) 백엔드 API. 파티션 테이블이므로 시간 윈도우 강제.

스키마 추가:
- `dispatchRequest`·`dispatchItem` 파티션 PK `(id, created_at)`
- `dispatchStatDaily` 복합 PK `(companyId, channel, statDate)`

신규 라우트 (`src/routes/dispatch-history.ts`):
- `GET /dispatch/requests` — 기본 30일, **max 90일** 윈도우 강제, channel/dispatchState 필터, 커서 페이징. window > 90일 → 400 Validation + "Use Export job" 힌트
- `GET /dispatch/requests/:id?createdAt=` — 단건. **createdAt 필수** (파티션 pruning, SCALABILITY §1)
- `GET /dispatch/requests/:id/items` — 수신자별 항목. `companyId` 비정규화로 스코프 격리
- `GET /dispatch-stats` — 일별 집계 (max 365일)

설계 (SCALABILITY §5 준수):
- OFFSET 금지, 커서 페이징
- 단건 조회는 `createdAt` 명시 — 파티션 pruning 안 되면 전 파티션 스캔
- 시간 윈도우 강제로 사용자 실수에 의한 대량 스캔 차단
- 더 넓은 범위는 Export 잡(/export-jobs)으로 우회 — 추후 추가

openapi.ts에 4 paths + 3 스키마(DispatchRequest/Item/Stat) 추가. 최종 paths 41, operations 76, schemas 49.

검증:
- /dispatch/requests 기본 30일 → 200 empty + window
- from-to 145일 → 400 validation + "range too wide ... use Export job"
- /dispatch-stats 채널·기간 필터 → 200 empty + window

## 18. malgn-noti-api 프로덕션 배포 #3 — 인증·14 라우트·발송 이력 라이브

§16·§17 누적 변경(14 도메인 라우트 + /auth + /dispatch + openapi 확장)을 라이브 반영.

### 18.1 사전

- `JWT_SECRET` wrangler secret 등록 — `openssl rand -hex 32 | pnpm wrangler secret put JWT_SECRET` (값은 로그 안 남김, 향후에도 노출 불가).
- typecheck 통과, working tree clean (`main`이 모든 변경 이미 포함).

### 18.2 배포

- `pnpm run deploy` (wrangler deploy)
- Version: `926017d2-6ba8-440f-b405-5330ef3f2ffb`
- 번들: 2439 KiB / gzip 568 KiB (이전 #2 2310 → +130 KiB, auth + dispatch + openapi 확장)
- Worker Startup 62 ms

### 18.3 검증 — 프로덕션 엔드투엔드 인증 흐름

| 엔드포인트 | 결과 |
| --- | --- |
| `GET /health` | 200 `env: production` |
| `GET /health/db` | 200 `mysql_version: 8.0.42` |
| `GET /doc/openapi.json` | 200, 61.9 KB, **43 paths · 77 ops · 51 schemas** (`/auth/signup`·`/auth/login` 포함) |
| `GET /admin/tables` (유효 토큰) | **404** ← env 가드 유지 |
| `GET /me` (no auth) | **401** |
| `POST /auth/signup` (실제 가입) | **201** + JWT — companyId=4, "프로덕션테스트" 생성 |
| `GET /me` with Bearer JWT | **200** — `user.role=owner`, `company.name=프로덕션테스트` |
| `POST /auth/login` (잘못된 pw) | **401** |

**의미** — 프로덕션 Worker가 실제 Aurora에 직접 INSERT/SELECT 수행, JWT가 7일 만료로 발급, dev 헤더는 production에서 무시되어 보안 격리 유지.

### 18.4 라이브 ↔ main 일치

배포 시점 working tree와 `main`(`f45ad01`) 일치. 추가 동기화 커밋 불필요.

### 18.5 다음 단계

추천 2번 — **POST /send (발송 큐 producer)** + NHN 어댑터. 발송 이력은 readonly 갖췄으니 쓰기 경로 차례.
추천 3번 — Export 잡 (`/export-jobs`): 90일 초과 이력 조회 우회.

## 19. POST /send/sms — 발송 producer (DB 적재까지) (`fb99b66`)

### 19.1 흐름

1. `Idempotency-Key` 헤더 필수 (멱등성 — 현재 버그 있음, 19.4 참조)
2. 발신번호 검증 — 본인 고객사 + `approval_state=승인`
3. smsType 자동 추론(90B 초과→LMS, 첨부→MMS) 또는 명시
4. 옵트아웃 필터 — `TB_OPTOUT_ENTRY` IN 절 lookup
5. 단가 계산 (임시 단가표: SMS 9.9, LMS 30, MMS 100)
6. 트랜잭션 — 크레딧 조건부 차감 + 원장 hold + `TB_DISPATCH_REQUEST` + bulk `TB_DISPATCH_ITEMs`

### 19.2 신규 파일

- `src/lib/pricing.ts` — `SMS_PRICING` + `detectSmsType(body, hasAttachment)`
- `src/routes/send.ts` — `POST /send/sms`, 최대 1000 수신자/요청

### 19.3 검증

- 정상 발송 → 201, `recipientCount` · `totalCredit` · 잔액 갱신 OK
- 옵트아웃 필터: 2명 중 1명만 발송 동작 확인
- 미승인 발신번호 → 403
- 잘못된 senderPhoneId → 404
- 크레딧 부족 (조건부 UPDATE affectedRows=0) → 409 conflict

openapi.ts: `SendSmsRequest`·`SendResponse` + `POST /send/sms`. 최종 paths 44, ops 78, schemas 53.

### 19.4 알려진 한계 — IDEMPOTENCY BUG

같은 `Idempotency-Key` 연달아 호출 시 멱등 SELECT가 직전 INSERT를 못 보고 중복 적재됨. 두 번 호출에 `dispatchRequestId` 2개 생성, 크레딧 2번 차감 발생.

- Drizzle 일반 select / `db.execute(sql\`...\`)` raw / cache-bust 주석 모두 같은 동작
- Hyperdrive read-cache 후보가 가장 유력했으나 raw + 주석에도 실패 → 다른 원인 가능
- **TODO(idempotency v2)** — 별 `TB_IDEMPOTENCY` (비파티션, `UNIQUE(company_id, key)`) 테이블로 INSERT-then-conflict 패턴 정식 구현. race-free + 캐시 무관. 코드에 상세 주석 남김.

### 19.5 다음 단계

본 라우트는 DB 적재까지만. 실제 NHN 발송까지:
- **Cloudflare Queues 설정** — `wrangler.toml [[queues.producers]]` + 큐 생성
- **Queue consumer worker** — `src/workers/dispatch.ts` (NHN 어댑터 호출)
- **NHN SMS 어댑터** — `src/adapters/nhn/sms.ts` (AppKey/SecretKey 사용)
- **Webhook handler** — `POST /webhooks/nhn` → `TB_DISPATCH_EVENT` 적재
- **다른 채널** — `/send/rcs`, `/send/kakao`, `/send/email`, `/send/push`, `/send/flow`

## 20. malgn-noti-api 프로덕션 배포 #4 — /send/sms 발송 producer 라이브

§19 발송 producer(`fb99b66`)를 라이브 반영.

### 20.1 배포

- Version: `4d9e1fbe-c8c5-4b70-933d-a48196fc2599`
- 번들: 2450 KiB / gzip 571 KiB (#3 2439 → 2450, send 라우트 + openapi 추가분 +11 KB)
- Worker Startup 70 ms

### 20.2 검증 (https://malgn-noti-api.malgnsoft.workers.dev)

| 엔드포인트 | 결과 |
| --- | --- |
| `GET /health` | 200 `env: production` |
| `GET /health/db` | 200 `mysql_version: 8.0.42` |
| `GET /doc/openapi.json` | 200, 65 KB, **paths 44 · ops 78 · schemas 53** (`/send/sms` 포함) |
| `GET /admin/tables` (유효 토큰) | 404 ← env 가드 |
| `GET /me` (no auth) | 401 |
| `POST /auth/login` (`prod-1@test.com`) | 200 + JWT |
| `GET /sender-phones` with JWT | 200 빈 결과 (tenant 격리 정상) |
| `POST /send/sms` (잘못된 senderPhoneId) | **404** `sender_phone not found` ← 검증 흐름 동작 |
| `POST /send/sms` (Idempotency-Key 누락) | **400** `Idempotency-Key 헤더 필수` ← 헤더 가드 동작 |

### 20.3 의미

- /send/sms 라우트가 프로덕션 Aurora에 도달하여 검증·격리·에러 응답 모두 정상.
- 발신번호·옵트아웃·크레딧 hold·트랜잭션 등 코드 경로는 로컬에서 검증 완료, 프로덕션은 발신번호 시드가 없어 실 발송까지는 미테스트 (시드 적용 후 가능).
- 프로덕션 admin/migrate가 404 차단이라 시드는 로컬 dev 경유로만 — 향후 신청·승인 흐름 도입 시 자연스레 해결.

### 20.4 라이브 ↔ main 일치

배포 시점 working tree와 `main`(`fb99b66`) 일치. 추가 동기화 커밋 불필요.

### 20.5 다음 단계 (변경 없음)

1. 🐛 멱등 버그 수정 — `TB_IDEMPOTENCY` + INSERT-then-conflict
2. NHN SMS 어댑터 + Queues + consumer worker (실 발송)
3. 다른 채널 send (RCS/Kakao/Email/Push/Flow)
4. Export 잡 — 90일 초과 이력 우회

## 21. 재배포 #5 — 코드 변경 없는 새 Version 발급

§20 배포 직후 `git push` 단계에서 도구 권한 오류로 history 커밋이 중단됨. 다음 세션에서 사용자가 "배포"를 재실행하여 finalize. API 코드는 `fb99b66` 그대로 (linter가 `src/lib/jwt.ts`에 `as unknown as JwtPayload` 캐스트 명시화 — HEAD에 이미 반영).

- Version: `afaa4c89-999e-4c0d-832e-3aef96acc326`
- 같은 번들(2450 KiB / gzip 571), Worker Startup 60 ms
- 검증: `/health` · `/health/db` (mysql 8.0.42) · `/doc` (paths 44 · ops 78 · schemas 53) · `/send/sms` 미인증 401 — 4건 모두 정상.

라이브 ↔ main: `fb99b66`로 일치.

## 22. 🐛 멱등 버그 해결 — TB_IDEMPOTENCY + INSERT-then-conflict (`020307f`)

§19·§21에서 추적했던 발송 멱등 버그(같은 Idempotency-Key 재호출 시 중복 적재) 정식 수정.

### 22.1 해결 패턴

- **0001_idempotency.sql** — 비파티션 추적 테이블 `TB_IDEMPOTENCY` (PK `company_id` + `scope` + `idempotency_key`, `result_id NULL→채움`)
- **race-free**: MySQL이 PK 인덱스로 atomic dedup. 진행 중 트랜잭션과는 row-lock 대기 후 duplicate key error.
- **/send/sms 신규 흐름**:
  1. `INSERT TB_IDEMPOTENCY (resultType='pending')` — 점유 시도
  2. 중복키 에러 → 다른 요청이 owner. `result_id`로 기존 `TB_DISPATCH_REQUEST` 반환 (idempotent:true)
  3. 점유 성공 → 검증·트랜잭션 진행, 마지막에 `UPDATE result_id` 로 매핑
  4. 트랜잭션 실패 시 `rollbackIdempotency()` — 키 해제(재시도 가능)
  5. 진행 중인 요청이 commit 전인 경우 `202 idempotent_in_flight` 응답

### 22.2 적용 + 검증

- Aurora에 `0001_idempotency.sql` 적용: `count=50` (TB_IDEMPOTENCY 신규)
- pnpm dev 검증:
  - call 1 (key=K) → dispatchRequestId=8, idempotent:false
  - call 2 (key=K) → dispatchRequestId=**8** (같음), idempotent:**true** ✅
  - call 3 (key=K2) → dispatchRequestId=9 (새), idempotent:false ✅

### 22.3 부속 변경

- `src/db/schema.ts` — `idempotency` 테이블 정의 추가
- `src/openapi.ts` — `/send/sms` description의 TODO 문구 제거 + 202 `idempotent_in_flight` 응답 추가
- `src/lib/jwt.ts` — linter가 `verifyJwt` 캐스트를 `as unknown as JwtPayload`로 명시화

### 22.4 다음 단계 (변동 없음)

1. ✅ 멱등 버그 — 완료
2. NHN SMS 어댑터 + Cloudflare Queues + consumer worker (실 발송)
3. 다른 채널 send (RCS/Kakao/Email/Push/Flow)
4. Export 잡 — 90일 초과 이력 우회

## 23. malgn-noti-api 프로덕션 배포 #6 — Queues Producer + Consumer 라이브

§22 멱등 수정 + NHN 어댑터 + Queues 일체(`020307f`, `5e1ac72`) 라이브 반영.

### 23.1 배포

- Version: `b30dc2a3-dc5a-4050-a435-c3d03a5e69a7`
- 번들: 2460 KiB / gzip 572 KiB
- Worker Startup 74 ms
- **신규 바인딩 라이브**:
  - `env.DISPATCH_QUEUE` (`malgn-noti-dispatch`) — Producer + Consumer 동시
  - `env.NHN_MOCK` secret = `"1"` (모의 모드)

### 23.2 검증

| 엔드포인트 | 결과 |
| --- | --- |
| `GET /health` | 200 `env: production` |
| `GET /health/db` | 200 `mysql_version: 8.0.42` |
| `GET /doc/openapi.json` | 200, 65.3 KB, paths 44 · ops 78 · schemas 53 |
| `POST /send/sms` (no auth) | 401 `unauthenticated` |
| `POST /auth/login` (`prod-1@test.com`) | 200 + JWT |

배포 명세 — `Producer for malgn-noti-dispatch` + `Consumer for malgn-noti-dispatch` 동시 등록 확인.

### 23.3 큐 end-to-end 검증 — 보류

**원인**: Cloudflare 원격 미리보기 인프라 장애 (1105 Temporarily unavailable, Ray ID `a02212096ea185af`·`a02213318ecb85af` 등). 30분간 지속.

- 로컬 `pnpm dev --remote`가 Cloudflare edge-preview 토큰을 받아오는 단계에서 503 → 시드 SQL POST가 모두 1105 응답
- 결과: 프로덕션 company 4에 `sender_phone` (승인) + `credit_balance` 시드 불가 → `/send/sms` 호출이 404 `sender_phone not found`로 종료

코드·바인딩 자체는 정상 등록됐고, 큐 처리 흐름은 Cloudflare 회복 후 재검증 예정. 검증 절차:
1. `pnpm dev --remote` (인프라 회복 후)
2. `/admin/migrate?allow_existing=1` 로 company 4 시드
3. PROD URL `/auth/login` → JWT
4. PROD URL `/send/sms` (senderPhoneId=100)
5. 5~10초 대기 후 PROD `/dispatch/requests/:id` 로 `dispatch_state` 천이 추적: `queued` → `sending` → `delivered`
6. `/dispatch/requests/:id/items` 에서 `send_state=sent`, `nhn_request_id=mock-...` 확인

### 23.4 라이브 ↔ main 일치

배포 시점 working tree와 `main`(`5e1ac72`) 일치.

## 24. 다음 단계 / 알려진 한계

- **DDL 적용** — Hyperdrive 콘솔은 자격증명만 보유. Aurora 측에 `0000_initial.sql`을 적용해야 실제 테이블 생성. MySQL CLI 또는 Bastion 경유.
- **파티션 자동 운영 Cron Worker** — `src/workers/partition-maintenance.ts` (월 1일 DROP + 25일 REORGANIZE).
- **시드 데이터** — `0001_seed.sql` (system terms, 샘플 템플릿 카탈로그).
- **Drizzle 스키마 자동 생성** — DDL 적용 후 `pnpm db:introspect`로 `src/db/schema.ts` 생성, 카멜케이스 객체명 정리.
- **Reader 분리** — 트래픽 증가 시 별도 Reader Hyperdrive 추가, `HYPERDRIVE_R` 바인딩 (SCALABILITY §6).
- **`before`/`after`** — `TB_AUDIT_LOG`는 DDL에서 MySQL 예약어 충돌 회피 차 `before_json`/`after_json`으로 명명. DATA-MODEL.md 본문 표기와 다음 동기화 시 일치 필요.
- **로컬 MySQL 옵션** — 오프라인 개발이 필요해지면 `localConnectionString = "mysql://..."` 추가하고 `dev`에서 `--remote` 제거.
