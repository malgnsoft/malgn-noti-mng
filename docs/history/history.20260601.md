# 2026-06-01 — WBS 정본화 — `doc/WBS.md` 신규 + 사용자단 `/wbs` 라이브 카탈로그 (배포 #47)

## 한 줄 요약

`malgn-helper/doc/WBS.md` 양식 + `malgn-helper-pms/pages/wbs.vue` Notion soft SaaS 디자인을 차용해 **맑은 메시징 프로젝트 WBS 정본**을 두 산출물로 정착. `doc/WBS.md`(텍스트 정본 — 진행률 스냅샷·5단계 가중치·Step 1~5 작업 내역·알려진 한계)와 `app/pages/wbs.vue`(공개 라이브 카탈로그 — Hero stats·단계별 진행률 오버뷰·Stage 상세·그룹별 작업 카드·상태 칩·외부 링크). Step 5(서비스 개발)는 원본 WBS의 채널·도메인 단위 항목(대부분 0%)을 **2026-06-01까지의 실제 진행**(사용자단 6채널 + 전 도메인 화면 완료 / API 5채널·인증·OpenAPI·Queues·webhook 일부 완료 / 관리자단 셸+기획 / 배포 #1~#8)에 맞춰 5-1 설계·5-2 API·5-3 사용자단·5-4 관리자단·5-5 통합·배포의 5 그룹 58 작업으로 재정렬. Cloudflare Pages 프로덕션 배포 #47 (alias `0ecc825e.malgn-noti.pages.dev`).

## 1. 사전 조사

- **MD 양식 정본**: [`malgnsoft/malgn-helper/blob/main/doc/WBS.md`](https://github.com/malgnsoft/malgn-helper/blob/main/doc/WBS.md) — Phase 별 진행률 스냅샷 + 단계별 가중치 표 + 단계 상세 표(ID/작업/상태/산출물/비고) + 상태 범례(✅/🟢/⚪/⛔).
- **디자인 정본**: [`malgnsoft/malgn-helper-pms`](https://github.com/malgnsoft/malgn-helper-pms) `pages/wbs.vue` — Notion·Linear·Height 풍 "Soft SaaS". `UContainer max-w-5xl` + `rounded-xl border border-neutral-200` 카드 + 단계 이모지(🎯📐🛠️📚🧪🚀) + 가중평균 hero + 단계별 오버뷰 행 + Stage 상세 + 상태 칩(emerald/amber/neutral/rose) + 진척률 막대 컬러 룰(≥70 emerald / ≥30 amber / >0 neutral-400 / 0 neutral-200).
- **데이터 소스**: 사용자가 제공한 7장 스크린샷(Google Sheets 형식의 원본 WBS — `맑은메시지(가칭) 프로젝트 작업 내역`). Step 1~5 전체와 담당자/목표일/완료일/진척율(0~100%) 포함.
- **Step 5 재구성 근거**: `doc/history/history.20260511~20260527.md` 12 일치 누적 이력 — 사용자단 화면 15 종 ✅ / API 9 종 ✅ + 3 종 🟢 + 4 종 ⚪ / 관리자단 ✅ 셸·기획·디자인 가이드 + ⚪ 페이지 11 종 / 배포 사용자단 #1~#46·관리자단 #1·API #1~#8 + DDL `0002_export_flow.sql` ⛔(Cloudflare 1105).

## 2. 결정 사항

- **레포 위치**: 사용자단 `malgn-noti`. 관리자단·API도 후속 검토 가능하나 1차는 사용자가 가장 자주 보는 사용자단에 두기로 결정(공개·blank 레이아웃).
- **접근**: `/wbs` 공개. `definePageMeta({ layout: 'blank', auth: false })`. GNB·푸터 없는 단독 페이지 — 외부 공유에 그대로 쓸 수 있도록.
- **두 산출물 운영**: MD가 정본, Vue 페이지는 동일 데이터를 살아있는 카탈로그로 노출. 어긋나면 MD 우선. Vue 페이지 내부 데이터는 정적 embed (별도 API 없음 — helper-pms처럼 R2 영속·자동 저장은 과한 인프라).
- **5 단계 가중치**: 1 준비 10% · 2 정책 15% · 3 기획 20% · 4 디자인 10% · 5 개발 45% — 개발 비중이 큰 프로젝트라 Step 5를 45%로 가중. Step 1·2는 합의·문서 위주라 가볍게.
- **Step 5 재구성 방침**: 원본 항목(채널·도메인 단위, 대부분 0%)을 실제 산출물 단위 5 그룹으로 재구성 — `5-1 설계 및 준비`(7) / `5-2 API 서버`(16) / `5-3 사용자단 화면`(15) / `5-4 관리자단 화면`(13) / `5-5 통합·배포`(7).
- **상태 매핑**: `done` ✅ / `in_progress` 🟢 / `pending` ⚪ / `blocked` ⛔. Vue에서는 색칩 + 점 + 진척률 막대 색상으로 동시 표현.

## 3. 코드 변경

### 3.1 `doc/WBS.md` — 텍스트 정본 (신규)

[doc/WBS.md](../WBS.md) — 약 220 라인. 구조:

1. **진행률 스냅샷 (2026-06-01)** — 5 단계 × 가중치·진행률·핵심 진행 사항. 가중평균 계산식 명시(`0.10×55 + 0.15×55 + 0.20×35 + 0.10×20 + 0.45×55 ≈ 44.5`).
2. **상태 범례**.
3. **단계별 가중치** 표.
4. **Step 1 — 프로젝트 준비 (10%)** — 5 하위 섹션(R&R·사업기획 / 사업준비 / 커뮤니케이션 / 서비스 메타 / 환경 셋팅), 18 작업.
5. **Step 2 — 주요 서비스 정책 이슈 정리 (15%)** — 6 하위 섹션(프로토타입 / 주요 서비스 참조 / 캠페인 / 회원·결제·계약 / 메시지 채널 정책 / 캠페인·주소록·브랜드), 22 작업.
6. **Step 3 — 서비스 기획 (20%)** — 3 하위 섹션(Front / BackOffice 1차 / BackOffice 2차), 22 작업.
7. **Step 4 — 디자인 / 퍼블리싱 (10%)** — 2 작업 + "현재는 개발 측 `doc/DESIGN.md` + `/guide` 카탈로그로 대체 운영" 주석.
8. **Step 5 — 서비스 개발 (45%)** — ⚠️ 재구성 마커 + 5 하위 섹션(설계 및 준비 7 / API 서버 16 / 사용자단 화면 15 / 관리자단 화면 13 / 통합·배포 7), 총 58 작업.
9. **알려진 한계 / 다음 단계** — DDL 보류·백엔드 연동 미·관리자단 페이지 미·NHN real/PG/AI 게이트웨이 미정·시스템 페이지 재작업·Step 4 정식 산출물 미.

### 3.2 `app/pages/wbs.vue` — 공개 라이브 카탈로그 (신규)

[app/pages/wbs.vue](../../app/pages/wbs.vue) — 약 650 라인 (스크립트 280 + 템플릿 130 + 스타일 240).

- **definePageMeta** `{ layout: 'blank', auth: false }`. `/help`와 동일한 단독 셸 패턴.
- **데이터 형태**:
  ```ts
  type Status = 'done' | 'in_progress' | 'pending' | 'blocked'
  interface Task { id, group?, title, status, owner, note?, targetDate?, completionDate?, href? }
  interface Stage { id, no, emoji, name, summary, weight, progress, tasks }
  const STAGES: Stage[] = [/* Step 1~5, 113 tasks */]
  ```
- **헤더**: `/help` 패턴 차용 — `position: sticky` 56px 높이 + `<AppLogoMark/>` 로고 + `wbs-header-divider` + `WBS` crumb + `맑은 메시징 프로젝트 작업 내역` 타이틀 + 우측 `doc/WBS.md ↗` 외부 링크.
- **Title row** — `맑은 메시징` h1(30px·600·-0.01em) + 부제(서비스 한 줄 설명 + 마지막 현행화 날짜).
- **Hero stats** (4-col grid) — `전체 진행률`(가중평균 % + 36px tabular-nums + 너비 = 진행률인 검정 막대) span-2 + `완료`(N/총 작업 수) + `진행 중`(N).
- **단계별 진행률 오버뷰** — 카드형 ul, 행 클릭 시 `scrollToStage` smooth scroll. 6-col grid(이모지·번호·이름/요약·작업 수·진척률 막대+%·화살표).
- **Stage 상세** — 단계마다 head(이모지·이름·ID + 비중·진척률) + 작은 진척률 막대 + `groupedTasks(stage)`로 그룹 카드 분할 렌더링. 각 작업 행은 `task-id`(JetBrains Mono) + 상태 점 + 제목 + 외부 링크 아이콘 + 메모 + 우측(상태칩·담당자·목표→완료 날짜).
- **반응형** — 720px 미만에서 오버뷰 행과 작업 행 그리드를 단순화.
- **푸터** — 상단 1px border + 브랜드 + 카피.

### 3.3 데이터 채우기

- **Step 1·2** — 스크린샷 그대로 옮김.
- **Step 3** — 스크린샷 그대로 옮김. 운영가이드 메모에 "(사용자단 `/help` 라이브 — 컨텐츠 보강 필요)" 부기.
- **Step 4** — 스크린샷 그대로 옮기되 메모로 "(개발 측에서 `doc/DESIGN.md` Relay-inspired v1.0 + `/guide` 카탈로그로 대체 운영)" 부기.
- **Step 5** — 사용자 요청대로 재구성:
  - 5-1 설계 및 준비 — 아키텍처·데이터 모델링·DS·사용자단/관리자단 가이드·관리자단 셸·페이지 기획 MD 33종 ✅ 7건.
  - 5-2 API 서버 — Workers 부트스트랩·DB 49 테이블·기초 CRUD 14·OpenAPI 37·인증·발송 5채널·멱등성·NHN 어댑터 5·Queues + Consumer ✅ 9건 / Webhook 핸들러·Export·Flow 🟢 3건 / 캠페인·PG·AI·NHN real ⚪ 4건 = 16건.
  - 5-3 사용자단 화면 — 인증/계정·발송 6채널·이력 5+stats·주소록·발신정보 6·템플릿 5+settings·캠페인·크레딧/결제·문의·나의 페이지·랜딩페이지·공개 랜딩·디자인 가이드 ✅ 13건 / 시스템 페이지 🟢 1 / 백엔드 연동 ⚪ 1 = 15건.
  - 5-4 관리자단 화면 — 셸·기획 MD ✅ 2건 / P0·P1·P2 ⚪ 11건 = 13건.
  - 5-5 통합·배포 — 사용자단 Pages 🟢 / 관리자단 Pages ✅ / API Workers ✅ / DDL ⛔ / NHN real·PG·AI ⚪ = 7건.

## 4. 배포 #47 (사용자단)

- `pnpm build` → Nitro `cloudflare-pages` 프리셋 → `dist/_worker.js` 빌드 OK. `wbs-BWsapYCM.mjs` 30.3 kB / `wbs-styles.BOjKIqTn.mjs` 29.9 kB 청크 생성. Total 3.02 MB(903 kB gzip).
- `npx wrangler@4 pages deploy dist --project-name=malgn-noti --branch=main --commit-dirty=true --commit-message "deploy wbs page"`.
- alias `https://0ecc825e.malgn-noti.pages.dev`.
- 검증: `GET https://malgn-noti.pages.dev/wbs` → HTTP 200. 그렙으로 `맑은 메시징 프로젝트 작업 내역` 헤더·`wbs-header-title` 2·`전체 진행률` 1·`stage-emoji` 6 출력 확인(5 stages × 본문 + 1 hero/overview).

## 산출물

- `malgn-noti: WBS — doc/WBS.md 정본 + /wbs 공개 라이브 카탈로그 (배포 #47)`
- 신규 파일:
  - [doc/WBS.md](../WBS.md)
  - [app/pages/wbs.vue](../../app/pages/wbs.vue)
- 프로덕션: <https://malgn-noti.pages.dev/wbs> · alias `https://0ecc825e.malgn-noti.pages.dev/wbs`.

## 다음 단계 / 알려진 한계

- **MD ↔ Vue 동기화는 수동.** 가중치·진척률·작업 상태가 어긋나면 한 곳만 갱신해 두기 쉬움 — 큰 변화가 생기면 두 파일을 같이 수정하는 디스플린 유지.
- **진척률은 추정.** 실제 작업 수 대비 ✅/🟢/⚪/⛔ 비율을 기준으로 추정 — 객관 지표(완료 PR 수·테스트 통과율 등) 도입 시 더 정확히.
- **`/wbs` 인덱싱 차단 미비.** `nuxt.config.ts head`에 전체 `noindex,nofollow` 설정이 있는지 재확인 필요(검색 노출 방지).
- **외부 자료 링크 일부 placeholder.** 컨설팅팀/디자인팀 산출물(단가표·계약서·디자인 스타일 가이드 등)의 실제 URL이 정해지면 MD·Vue 양쪽에 채워 넣기.
- **Step 4 정식 산출물.** 디자인팀의 정식 디자인 스타일 가이드 + 퍼블리싱 MD는 여전히 미. 개발 측 `doc/DESIGN.md` + `/guide` 카탈로그로 대체 운영 중.
- **자동화 가능성**: helper-pms처럼 R2 영속 + 자동 저장 형태로 운영하고 싶다면, `malgn-noti-api`에 `GET /wbs` + `PUT /wbs` 추가 → 본 페이지를 편집 가능 페이지로 전환. 1차에서는 스코프에서 제외.

---

# §2. `0002_export_flow.sql` DDL — 라이브 이미 적용 확인 + 라이브 검증 + SQL 파일 동기화

## 한 줄

`wrangler dev --remote`의 1105 잔류로 `/admin/migrate` 경로가 막혀 있던 상태에서, Aurora 직결(`noti` 계정 + SSL REQUIRED)로 들어가 **4 신규 테이블(TB_EXPORT_JOB / TB_FLOW_DEFINITION / TB_FLOW_RUN / TB_FLOW_STEP_RUN)이 이미 적용돼 있음**을 확인. 컬럼은 우리 `0002_export_flow.sql`과 100% 일치, **인덱스·FK는 라이브 쪽이 더 정교**(FK 6개 + 의미 있는 인덱스명) — 출처는 사전 작업으로 추정. 라이브 워커의 `/export-jobs`·`/flow-definitions` GET/POST 4건 모두 200/201 정상 응답으로 e2e 확인. 검증 과정에서 생긴 테스트 데이터(임시 user/company 2건 + export_job/flow_def 각 1건)를 즉시 cleanup해 빈 상태 복구. `0002_export_flow.sql`을 라이브 정본(인덱스·FK 포함)에 맞춰 갱신해 신규 환경에서도 동일하게 적용되도록 동기화.

## 2.1 Cloudflare 1105 재시도 (3회) → 모두 실패

| 시도 | 시각 (UTC) | Ray ID | 결과 |
| --- | --- | --- | --- |
| 1차 | 01:47 | `a04a8ca2dd1125d4` | HTTP 503 — `Error 1105 Temporarily unavailable` |
| 2차 | 01:54 | `a04a9753cbaedd38` | HTTP 503 — 동일 |
| 3차 | 02:24~02:28 | — | HTTP 503 12회 폴링 모두 (10초 간격) |

- 모두 `wrangler dev --remote`가 띄운 임시 edge-preview 워커에서 발생. 라이브 워커(`https://malgn-noti-api.malgnsoft.workers.dev`)는 `/health`·`/health/db` 200으로 영향 없음 → **1105는 Cloudflare 측 dev/preview 인프라 한정 장애**로 확정.
- 결정: 한 번만 쓸 카드인 일회용 Aurora SG whitelist 경로로 우회. 운영 정책 갱신(Cloudflare Tunnel·RDS Proxy·bastion 등)은 별도 후속 작업으로 분리.

## 2.2 Hyperdrive ↔ Aurora 라이브 연결 정상성 사전 확인

- `wrangler hyperdrive get a2ba4efe7421464da1d5ff5e620b33a3` — 설정 정상 (origin: `malgn-dev-db.cluster-c53h9wjjbjbr.ap-northeast-2.rds.amazonaws.com:3306` / db `noti` / user `admin` / SSL REQUIRED / connection_limit 60 / 캐싱 활성).
- `/health/db` 3회 — 모두 200, `mysql_version: 8.0.42`, **cold 512ms → warm 355ms → warm 360ms** (Hyperdrive 캐시 효과 뚜렷).
- 보호 라우트 가드 — `/me`·`/contacts`·`/dispatch/requests` 모두 401 (DB 단계 진입 전 차단). `/admin/*` 404 (프로덕션 가드 정상).
- 실 DB write+read — `/auth/signup`(임시) → JWT 169자 → `/me` SELECT 2회 → **249ms 응답** + 컬럼 정상 매핑.
- 결론: 1105와 무관하게 라이브 인프라는 한 통으로 살아 있음.

## 2.3 Aurora 직결 — TCP 도달성 + mysql 인증

- 사용자 제공 — `noti` 계정 + 패스워드(채팅 외부에 기록 안 함, `MYSQL_PWD` 환경변수로만 1회 쉘에서 사용).
- 내 outbound IP — `211.119.233.35`.
- TCP probe: `nc -zv -G 5 malgn-dev-db.cluster-...:3306` → **즉시 connection succeeded** — SG 인바운드가 이미 열려 있는 상태(추정: 사전에 noti IP 또는 관련 대역이 화이트리스트됨).
- mysql 접속(`--ssl-mode=REQUIRED`): `noti@%`, DB `noti`, 서버 8.0.42 → ✅.

## 2.4 사전 DDL 적용 확인 — 컬럼 100% 일치, 인덱스·FK 더 풍부

- 전체 TB_ 카운트: **50** (= 49 initial + 1 idempotency + 4 신규 − 4 중복? 아님. 0000_initial.sql의 정확 적용본은 45 + 0001 1 + 0002 4 = 50.) — 4 신규가 50 안에 이미 포함돼 있음.
- 4 신규 테이블 컬럼 — `0002_export_flow.sql`(2026-05-31자 초안)과 **모두 일치**: 데이터 타입·NULL 여부·기본값·자동 타임스탬프 모두 동일.
- **인덱스/FK는 라이브 쪽이 더 정교**:
  - `TB_EXPORT_JOB`: 라이브 `idx_export_company_state(company_id, job_state, requested_at) + idx_export_user(user_id, requested_at) + FK fk_export_company → TB_COMPANY + FK fk_export_user → TB_USER`. 초안 안은 단일 `idx_export_company_user(company_id, user_id, requested_at) + idx_export_state(job_state, requested_at)`만 있었음.
  - `TB_FLOW_DEFINITION`: 라이브 `idx_flowdef_company_status(company_id, status, created_at) + FK fk_flowdef_company → TB_COMPANY`. 초안은 `idx_flow_def_company(company_id, created_at)`만.
  - `TB_FLOW_RUN`: 라이브 `idx_flowrun_company_state(company_id, run_state, started_at) + FK fk_flowrun_company → TB_COMPANY + FK fk_flowrun_def → TB_FLOW_DEFINITION + 보조 키 fk_flowrun_def`. 초안은 인덱스 2개만, FK 없음.
  - `TB_FLOW_STEP_RUN`: 라이브 `idx_fsr_run(flow_run_id, node_order) + idx_fsr_dispatch(dispatch_request_id) + FK fk_fsr_run → TB_FLOW_RUN`. 초안은 단일 인덱스만, FK 없음.
- 4 테이블 모두 행 수 **0** → 빈 신규 생성. **즉, 출처는 사전 작업(SG whitelist + 직결 또는 다른 운영 경로)**.

## 2.5 라이브 워커 e2e 검증 (4 호출 모두 통과)

| 호출 | 결과 |
| --- | --- |
| `GET /export-jobs` (auth) | 200 — `{data:[], nextCursor:null}` · 449ms |
| `POST /export-jobs` `{resourceType:"history_sms", params:{from,to}}` | 201 — id=1 / `jobState:"pending"` / `expires_at` 등록 +30일 자동 계산 · 306ms |
| `GET /flow-definitions` (auth) | 200 — `{data:[], nextCursor:null}` · 400ms |
| `POST /flow-definitions` (alimtalk→sms on_fail 5분 폴백) | 201 — id=1 / nodes JSON 보존 / `createdAt`·`updatedAt` 자동 / `deletedAt:null` · 563ms |

→ **라이브 워커 + 4 신규 라우트 + 라이브 DB**가 한 통으로 정상. CRUD ✅. 처리 worker / 실행 엔진은 여전히 미.

## 2.6 테스트 데이터 cleanup

- 검증 과정에서 생성: `TB_USER`(loginid `hd-check-…`·`ddl-…`) 2건 / `TB_COMPANY`(name `hyperdrive-check-…`·`ddl-live-check-…`) 2건 / `TB_EXPORT_JOB` id=1 / `TB_FLOW_DEFINITION` id=1 / `TB_TERMS_AGREEMENT` 0건(현재 약관 미배포로 자동 생성 없음).
- 단일 트랜잭션 묶음 없이 순서대로 DELETE — FK 제약을 만족하도록 자식 → 부모 순.
- 사후 카운트: `TB_EXPORT_JOB=0` / `TB_FLOW_DEFINITION=0` / `leftover_users=0` / `leftover_companies=0` ✅.
- AUTO_INCREMENT 잔류: `TB_EXPORT_JOB.AUTO_INCREMENT=2` / `TB_FLOW_DEFINITION.AUTO_INCREMENT=2` (정상 — 다음 INSERT는 id=2부터 시작).

## 2.7 `0002_export_flow.sql` 라이브 정본 동기화

- 초안 SQL 파일을 라이브 `SHOW CREATE TABLE` 결과 기준으로 갱신 — 인덱스명 변경(`idx_export_company_state` 등) + FK 6개 추가(`fk_export_company`·`fk_export_user`·`fk_flowdef_company`·`fk_flowrun_company`·`fk_flowrun_def`·`fk_fsr_run`) + 코멘트 일치(`'history_sms, contacts 등'`·`'[{order, channel, template_id, condition, delay_minutes}]'` 등).
- CLAUDE.md §5 "파티션 테이블 — FK 미사용" 원칙은 유지 — 이번 4 테이블은 모두 비파티션이라 FK 적용 가능.
- 파일 헤더에 "2026-06-01 현행화 — 라이브(Aurora) 정본과 동기화: FK 6개 + 의미 있는 인덱스명" 명시.

## 2.8 산출물

- `malgn-noti-api: src/db/migrations/0002_export_flow.sql` — 라이브 정본 동기화 (1 file, 인덱스명 변경 + FK 6 추가 + 코멘트 일치).
- 라이브 DB — 변경 없음(이미 적용된 정본 그대로 + cleanup으로 빈 상태 복원).
- 라이브 Worker — 변경 없음(이미 배포 #8 `95f9f894...`이 4 라우트를 정상 노출 중).
- `malgn-noti: doc/WBS.md` 갱신 — 5-2-11/12 🟢 (CRUD ✅, 처리 worker / 실행 엔진 미) / 5-5-4 ⛔→✅ (DDL 적용 확인).

## 2.9 다음 단계 / 알려진 한계

- **Drizzle schema.ts vs 라이브 인덱스/FK** — `src/db/schema.ts`의 export/flow 테이블 정의는 인덱스/FK를 선언하지 않음(컬럼만). 런타임 동작에는 영향 없지만, `drizzle-kit introspect` 또는 schema에서 명시적으로 `index()`/`foreignKey()`를 선언해 정합화하는 게 위생적. 후속.
- **운영 절차 갱신** — `wrangler dev --remote` 1105 같은 dev/preview 장애가 또 발생할 때를 대비, CLAUDE.md §12 후보 중 **Cloudflare Tunnel(cloudflared) → Aurora** 셋업 검토. 별도 작업.
- **SG 정책 재검토** — 사전 작업에서 어떤 IP 대역이 화이트리스트됐는지 한 번 정리. `noti` 계정의 권한 범위(CREATE TABLE 가능 여부)도 운영 문서화 필요.
- **처리 worker 미** — `/export-jobs` 처리 워커(R2 업로드 + presigned URL) / `/send/flow` 실행 엔진 + `TB_FLOW_RUN`·`TB_FLOW_STEP_RUN` 천이 — 둘 다 별도 마일스톤.

---

# §3. `schema.ts` 정합화 — export/flow 4 테이블 인덱스·FK 명시화

## 한 줄

§2에서 `0002_export_flow.sql` 파일을 라이브 Aurora 정본에 맞춰 동기화했지만, **Drizzle ORM의 `src/db/schema.ts`는 컬럼만 정의되어 있고 인덱스/FK는 0건** — 코드↔라이브 drift 8건이 남아 있던 상태. 이를 라이브 정본 기준으로 명시화 (인덱스 6 + FK 6, 총 12 항목). **컬럼 정의는 일절 변경하지 않음**, **다른 테이블은 손대지 않음**(서비스 중). 런타임 동작에 영향 0, Worker 재배포 불필요. typecheck 통과 + `git diff` 1 file +22 -4 — `schema.ts` 외 변경 0 확인.

## 3.1 작업 범위 — 4 테이블만

원칙: "다른 테이블은 현재 서비스 중이라 함부로 건들면 안 된다" — export/flow 4 테이블 **한정**.

| 테이블 | 추가 인덱스 | 추가 FK |
| --- | --- | --- |
| `exportJob` (TB_EXPORT_JOB) | `idx_export_company_state(company_id, job_state, requested_at)` + `idx_export_user(user_id, requested_at)` | `fk_export_company` → `company.id` · `fk_export_user` → `user.id` |
| `flowDefinition` (TB_FLOW_DEFINITION) | `idx_flowdef_company_status(company_id, status, created_at)` | `fk_flowdef_company` → `company.id` |
| `flowRun` (TB_FLOW_RUN) | `idx_flowrun_company_state(company_id, run_state, started_at)` | `fk_flowrun_company` → `company.id` · `fk_flowrun_def` → `flowDefinition.id` |
| `flowStepRun` (TB_FLOW_STEP_RUN) | `idx_fsr_run(flow_run_id, node_order)` + `idx_fsr_dispatch(dispatch_request_id)` | `fk_fsr_run` → `flowRun.id` |

총 **인덱스 6 + FK 6 = 12 항목**. 모두 라이브 `SHOW CREATE TABLE` 출력과 1:1 일치.

## 3.2 Drizzle 문법

각 `mysqlTable(name, columns)` 호출에 2번째 인자 콜백 `(t) => ({...})`을 추가하는 방식. 컬럼은 그대로, 콜백에 `index(...).on(...)` 및 `foreignKey({...})` 선언.

```ts
export const exportJob = mysqlTable('TB_EXPORT_JOB', {
  // ... 컬럼 (변경 없음)
}, t => ({
  idxCompanyState: index('idx_export_company_state').on(t.companyId, t.jobState, t.requestedAt),
  idxUser: index('idx_export_user').on(t.userId, t.requestedAt),
  fkCompany: foreignKey({ name: 'fk_export_company', columns: [t.companyId], foreignColumns: [company.id] }),
  fkUser: foreignKey({ name: 'fk_export_user', columns: [t.userId], foreignColumns: [user.id] }),
}))
```

import에 `foreignKey`, `index` 2개 추가 (drizzle-orm/mysql-core).

## 3.3 효과

- **`drizzle-kit introspect/generate` drift 해소** — 라이브와 코드 사이 인덱스/FK 12건 불일치가 0으로.
- **신규 마이그레이션 안전** — 누가 schema.ts 기준으로 새 마이그레이션 만들 때 "FK·인덱스 DROP" SQL이 생성되는 사고 방지.
- **신규 환경 부트스트랩 일관성** — 새 환경에서 schema.ts → 마이그레이션 → DB 적용 시 동일한 정합 보장.
- **PR 가독성** — "이 테이블에 어떤 인덱스가 있는가?" 답이 한 곳(`schema.ts`)에 모임.
- **타입 안전성** — FK 명시로 join 쿼리 작성 시 관계 자동 추론.

## 3.4 안전 가드

- **컬럼 정의 변경 0** — 1번째 인자 객체는 1바이트도 안 건드림.
- **다른 테이블 변경 0** — `git diff --name-only`로 `src/db/schema.ts` 단일 파일만 변경됨을 사전 확인.
- **typecheck 통과** — `pnpm typecheck` (tsc --noEmit) 에러 0.
- **런타임 영향 0** — Drizzle 쿼리 빌더는 이 콜백을 마이그레이션/툴체인 단에서만 사용. 런타임 DML/SELECT에 변화 없음.
- **Worker 재배포 불필요** — 배포 #8(`95f9f894...`) 그대로 라이브 정상.

## 3.5 산출물

- `malgn-noti-api: 0475bd2 db(schema): export/flow 4 테이블 인덱스·FK 명시화 (라이브 정합)` (1 file, +22 -4).
- 라이브 DB·Worker — 변경 없음.

## 3.6 다음 단계 / 알려진 한계

- **49 테이블 전체 점검은 별도 작업** — schema.ts의 나머지 46 테이블도 동일하게 인덱스/FK 미선언 가능성 큼. 단 서비스 중이라 한 번에 큰 정합 작업은 위험. 추후 별도 마일스톤에서 테이블별로 점진적 점검.
- **`drizzle-kit introspect` 한 번 돌려보기** — 라이브에서 schema 자동 생성해 우리 수기 정의와 diff를 보면 다른 drift도 발견 가능. Aurora 직결 경로 운영 절차 정착 후 진행.

---

# §4. 사용자단 인증 백엔드 연동 — `/auth/signup`·`/auth/login`·`/me` 실 API 연동 (배포 #49)

## 한 줄

사용자단의 모든 화면이 목업 데이터로 동작하던 상태에서 **인증·계정 영역을 첫 번째로 실 API에 연결**. JWT를 `auth-token` 쿠키에 저장, `useApi()` $fetch 래퍼가 자동으로 `Authorization: Bearer` 주입, 글로벌 미들웨어는 쿠키 존재만으로 1차 가드, 클라이언트 부트스트랩 플러그인이 `/me`로 스토어 풀 컨텍스트 페치. 회원가입은 Step 4(본인 인증) → Step 5(완료) 전이에서 실 API 호출 + 토큰 저장 + 자동 로그인 → `/home` 이동, 로그인은 `companyId` 쿠키(`last-company-id`, 1년) 자동 사용 + 없으면 필드 노출. 5 파일 수정 + 1 파일 신규(`plugins/auth.client.ts`), typecheck 통과, 로컬 + 프로덕션 모두 e2e 검증(쿠키 동봉 시 `/home` 200, 없으면 `/login?redirect=/home` 리다이렉트, `/login`·`/signup` 200). Cloudflare Pages 배포 #49 (alias `9be4ff61.malgn-noti.pages.dev`).

## 4.1 API 계약 사전 확인 (변경 없음)

`malgn-noti-api/src/routes/auth.ts` (배포 #8 `95f9f894...` 그대로):

| 라우트 | 요청 | 응답 |
| --- | --- | --- |
| `POST /auth/signup` | `{ companyName, loginid, password, name?, email?, phone? }` (Zod) | `201 { data: { user: {id, loginid, name, role}, company: {id, name}, token } }` |
| `POST /auth/login` | `{ companyId: number, loginid, password }` (Zod) | `200 { data: { user, company:{id}, token } }` |
| `GET /me` (Bearer) | — | `200 { data: { user, company, ctxRole } }` |

**핵심 제약**: `loginid`는 회사 스코프 내 unique (composite UNIQUE on company_id, loginid) → `/auth/login`이 `companyId`를 필수로 받음. 사용자가 자신의 companyId를 항상 알기 어려우므로 UX 보정 필요.

## 4.2 결정 사항

- **JWT 저장 위치**: `auth-token` 쿠키 (maxAge 7일, sameSite=lax, secure는 PROD에서만). 백엔드가 Set-Cookie를 안 쓰고 응답 본문에 토큰을 담아 보내므로 일반 쿠키(HttpOnly 아님). 향후 백엔드가 Set-Cookie + HttpOnly + SameSite=Strict로 응답하면 그쪽으로 이관.
- **`companyId` 자동 사용**: `last-company-id` 쿠키(1년)에 회원가입/로그인 시 저장 → 다음 로그인 폼에서 자동 사용. 새 브라우저/쿠키 삭제 시에만 "고객사 ID" 필드 노출.
- **SSR 안전성**: 미들웨어는 쿠키 존재만 확인 → 통과/리다이렉트만 결정. `/me` 호출(스토어 페치)은 **클라이언트 플러그인**으로 분리 — Pinia store action 안에서 `useCookie()` 호출이 SSR 미들웨어 컨텍스트를 잃어 `"composable was called outside of …"` 에러를 내는 문제 회피(실제 발생 → 수정 후 통과).
- **회원가입 흐름**: Step 4(본인 인증 완료) → "가입 완료" 클릭 → 실 API 호출 → 성공 시 Step 5(완료) 노출 + 자동 로그인 + 발급 고객사 ID 표시 → "대시보드로 이동" 클릭 시 `/home`. 실패 시 토스트 + 단계 유지.

## 4.3 코드 변경 (6 파일)

| 파일 | 변경 |
| --- | --- |
| `app/composables/useApi.ts` | `useAuthToken()`·`useLastCompanyId()` 쿠키 헬퍼 export. $fetch `onRequest`에서 토큰 자동 `Authorization: Bearer` 주입. 401 응답 시 토큰 클리어 + 스토어 클리어 + `/login` 이동. |
| `app/stores/auth.ts` | `AuthUser`·`AuthCompany` 타입 신규 (`malgn-noti-api/src/routes/auth.ts` 응답 형상 그대로). `signup()` · `login()` · `fetchMe()` · `logout()` 액션. `signup`은 응답을 즉시 store에 hydrate해 isAuthed=true. `login`은 응답 hydrate + `/me`로 풀 컨텍스트 보강. `fetchMe`는 토큰 만료 시 토큰 클리어 후 false 반환. |
| `app/middleware/auth.global.ts` | 토큰 쿠키 존재 여부만 확인 (SSR 안전). 없으면 `/login?redirect=…` 리다이렉트. `meta.auth === false`는 그대로 통과. |
| `app/plugins/auth.client.ts` (신규) | 클라이언트 부트스트랩 1회 — 토큰 쿠키가 있고 store가 비어 있으면 `auth.fetchMe()` 호출. SSR 미들웨어 컨텍스트 손실 문제를 피해 클라이언트 측에서 처리. |
| `app/pages/login/index.vue` | `useAuthStore()`·`useLastCompanyId()` 사용. `last-company-id` 쿠키가 있으면 자동 사용, 없으면 "고객사 ID" 필드(`v-if="needCompanyId"`) 노출. `onLogin()`이 `auth.login()` 호출 → 성공 시 `redirect` 쿼리(`/home` 기본)로 이동. 401 응답은 "아이디 또는 비밀번호가 올바르지 않습니다" 토스트. |
| `app/pages/signup.vue` | `goNext()`가 `step.value === 4`일 때 `submitSignup()` 호출(이전: 단순 step 증가만). `submitSignup()`은 `auth.signup({companyName, loginid: email, password, email, name, phone})` 호출 → 성공 시 `step.value = 5`로 완료 화면 노출, 실패 시 409 응답을 "이미 가입된 이메일입니다" 안내. Step 5는 발급 고객사 ID 표시 + "대시보드로 이동" 버튼이 `finish()` → `/home`. |
| `nuxt.config.ts` | `runtimeConfig.public.apiBaseUrl` 기본값을 `'/api'` → `'https://malgn-noti-api.malgnsoft.workers.dev'`로 변경. `NUXT_PUBLIC_API_BASE_URL`로 그대로 override 가능. |

## 4.4 발견된 SSR 이슈 + 우회 (의미 있는 발견)

첫 시도(`auth.global.ts`에서 `await auth.fetchMe()` 호출)는 500 에러:

```
[nuxt] A composable that requires access to the Nuxt instance was called outside of a plugin,
       Nuxt hook, Nuxt middleware, or Vue setup function.
  at useCookie (...cookie.js:38:19)
  at useAuthToken (.../useApi.ts:15:45)
  at Proxy.fetchMe (.../auth.ts:70:47)
  at .../auth.global.ts:15:104
```

원인 — Pinia store action(`fetchMe`) 내부에서 `useCookie()`(via `useAuthToken()`)를 호출하면, await 경계를 넘으면서 Nuxt instance 컨텍스트가 끊김. 동기 미들웨어 함수 안에서는 통하지만 store action 안에서는 컨텍스트 보장이 약함.

해결 — SSR 미들웨어는 쿠키 존재만 확인하고 통과 결정. `/me` 검증은 클라이언트 부트스트랩 플러그인에서 1회만 호출. 토큰이 위조/만료면 fetchMe가 토큰을 클리어하고 false 반환 → 다음 라우트 가드에서 `/login`으로 리다이렉트. SSR 비용 0 + 안전.

## 4.5 검증 (로컬 + 프로덕션)

API 통한 e2e 4건 × 2환경(로컬 dev + 프로덕션 Pages):

| 호출 | 기대 | 결과 |
| --- | --- | --- |
| `GET /home` (토큰 쿠키 없음) | 302 → `/login?redirect=/home` | ✅ |
| `GET /home` (토큰 쿠키 동봉) | 200 (통과) | ✅ |
| `GET /login` (`meta.auth: false`) | 200 | ✅ |
| `GET /signup` (`meta.auth: false`) | 200 | ✅ |
| `GET /wbs` (`auth: false`) | 200 | ✅ (회귀 없음) |

토큰 자체는 `/auth/signup` 라이브 호출로 발급 → 쿠키 동봉으로 SSR 진입 → 미들웨어 통과 확인. 클라이언트 측 `/me` 호출은 브라우저 환경 필요라 별도 수동 점검 필요(다음 단계).

### 4.5.1 발견된 SSR 컨텍스트 버그(첫 미들웨어 버전) — 우회 후 통과 확인

- 1차 시도: `auth.global.ts`에서 `await auth.fetchMe()` 직접 호출 → 500 (위 §4.4).
- 2차 시도: 미들웨어 단순화 + `plugins/auth.client.ts` 신설 → 500 → 200 회복 확인.

## 4.6 배포 #49

- `pnpm build` → Nitro `cloudflare-pages` 프리셋. login/signup 청크 + auth plugin 청크 새로 생성.
- `npx wrangler@4 pages deploy dist --project-name=malgn-noti --branch=main --commit-dirty=true --commit-message "user-side auth integration"`.
- alias `https://9be4ff61.malgn-noti.pages.dev`. 프로덕션 `https://malgn-noti.pages.dev` 갱신.

## 4.7 산출물

- `malgn-noti: 사용자단 인증 백엔드 연동 (배포 #49)` — 6 파일 수정 + 1 신규.
- 수정: [app/composables/useApi.ts](../../app/composables/useApi.ts) · [app/stores/auth.ts](../../app/stores/auth.ts) · [app/middleware/auth.global.ts](../../app/middleware/auth.global.ts) · [app/pages/login/index.vue](../../app/pages/login/index.vue) · [app/pages/signup.vue](../../app/pages/signup.vue) · [nuxt.config.ts](../../nuxt.config.ts).
- 신규: [app/plugins/auth.client.ts](../../app/plugins/auth.client.ts).
- WBS 갱신: 5-3-15 ⚪ → 🟢 (인증·계정 실 API 연동 완료, 발송·이력 등 나머지 점진 교체).
- 라이브 API/DB — 변경 없음(쓰기는 검증 과정의 임시 계정 4건, 모두 cleanup).

## 4.8 알려진 한계 / 다음 단계

- **`/auth/login`의 `companyId` 요구** — 새 브라우저에서 사용자가 자신의 ID를 외워야 함. 후속에서 `/auth/login-by-email` 등 이메일 → 회사 lookup 라우트 추가 고려.
- **`/me` SSR 검증 분리** — 토큰이 유효한지 라우트 진입 시점에 서버에서 확인하지 않으므로, 만료된 토큰이라도 1회는 페이지가 로드되고 그 뒤 클라이언트 fetchMe에서 401 처리. 보안상 큰 문제는 아니지만 첫 페인트 후 리다이렉트가 깜빡일 수 있음.
- **HttpOnly 미적용** — 토큰이 JS에서 읽힘. XSS 발생 시 토큰 탈취 가능. 백엔드가 Set-Cookie + HttpOnly로 응답하도록 확장 시 클라이언트 코드 단순화 + 보안 강화.
- **OTP 인증(`TB_VERIFICATION`)·약관 동의(`TB_TERMS_AGREEMENT`)·서비스 담당자 초대** — signup 라우트는 이를 적재하지 않음. 프런트에서 입력은 받지만 백엔드는 무시. 후속 라우트(`/auth/verify-email`, `/auth/verify-phone`, `/auth/agree-terms`, `/manager-invites`) 구현 필요.
- **나머지 화면 연동** — 발송 6채널·이력·주소록·발신정보·템플릿·캠페인·크레딧·문의·나의 페이지 — 모두 여전히 목업. 화면별 도메인 API(`/contacts`, `/sender-phones` 등)로 점진 교체.
- **로그아웃 UX** — 현재 `useAuthStore().logout()`만 정의. GNB의 로그아웃 버튼은 `AppGnb.vue`에서 데모용 ref만 토글 중 — 실 호출로 교체 필요.

---

# §5. 이메일 OTP 인증 — `/auth/email-code/send`·`/verify` 신설 + signup.vue 실 API 연동 (배포 #9·#50)

## 한 줄

§4의 알려진 한계 #4(이메일 OTP 미연동, 화면용 토스트만 동작)를 해소. 백엔드에 OTP 발송·검증 라우트 2개 추가(TB_VERIFICATION 적재 + SHA-256 코드 해시 + TTL 10분·재발송 시 직전 코드 만료·5회 시도 제한·소비 후 재사용 차단), Drizzle `schema.ts`에 `verification` 정의(라이브 정본과 인덱스 일치), OpenAPI 4지점 갱신(2 paths + 3 schemas), Workers 배포 #9(Version `83f32a61...`). 프런트 [signup.vue](../../app/pages/signup.vue)의 `sendIdCode`/`confirmIdCode`를 실 API 호출로 교체 + 버튼 로딩 상태(`sendingCode`/`verifyingCode`) + 재발송 라벨 + 에러 메시지 표준화. NHN_MOCK=1 환경에서만 응답에 `mockCode` 노출(개발 편의 — production 자동 차단). Pages 배포 #50 (alias `c2100890.malgn-noti.pages.dev`). 라이브 e2e 6 시나리오 모두 통과 (발송·잘못된 코드 401·올바른 코드 200·소비 후 재시도 401·재발송 신규 코드·DB 행 검증).

## 5.1 결정 사항

- **저장**: `TB_VERIFICATION` (이미 라이브) 활용. `code_hash`로 평문 코드 저장 회피. 해시는 `SHA-256(target|purpose|code)` — Web Crypto API 네이티브.
- **TTL**: 10분. `expires_at = now + 10*60*1000`.
- **재발송**: 같은 `(email, purpose)`의 미소비·미만료 레코드를 즉시 만료 처리(`expires_at = now`) → 직전 코드로 검증 불가.
- **시도 제한**: 5회 초과 시 즉시 만료(`OTP_MAX_ATTEMPTS = 5`).
- **소비**: 검증 성공 시 `consumed_at = now` → 같은 코드 재사용 차단.
- **purpose enum**: `signup` / `reset_password` / `change_email`. signup 외 흐름은 후속 라우트가 활용.
- **`mockCode` 노출**: `c.env.NHN_MOCK === '1'`일 때만 응답에 `mockCode: code` 포함. production은 secret 미설정이면 자동으로 노출 안 됨. real NHN 자격증명 등록 후 secret도 영구 제거.
- **`/auth/signup`에 강제 검증 미추가**: 후속 결정 사항(검증 게이트 도입 시점)이 필요하므로 본 단계에서는 백엔드 호환성 유지 + 프런트가 UX 차원에서 검증 강제. 이전 e2e 테스트·기존 통합 사용처에 영향 없음.

## 5.2 코드 변경 (백엔드 — `malgn-noti-api`)

| 파일 | 변경 |
| --- | --- |
| [src/db/schema.ts](../../../malgn-noti-api/src/db/schema.ts) | `verification` 테이블 신규 정의 (8 컬럼 + `idx_verif_target(target_type, target, purpose, expires_at)` — 라이브 정본과 1:1). |
| [src/lib/errors.ts](../../../malgn-noti-api/src/lib/errors.ts) | `errors.unauthenticated()`에 default 메시지 파라미터 추가 (`(msg = 'Authentication required')`). 호환성 유지 + OTP 라우트에서 한국어 메시지 첨부 가능. |
| [src/routes/auth.ts](../../../malgn-noti-api/src/routes/auth.ts) | 헬퍼 4개 추가: `generateOtpCode()` (Web Crypto getRandomValues 4 bytes → 6 digits), `hashOtpCode()` (SHA-256), `purposeLabel()`, `buildEmailBody()` (HTML 템플릿). 라우트 2개: `POST /auth/email-code/send` + `POST /auth/email-code/verify`. NHN Email 어댑터 호출(`sendEmail(null, ...)`) — 자격증명 미설정 시 어댑터 내부에서 mock fallback. |
| [src/openapi.ts](../../../malgn-noti-api/src/openapi.ts) | 2 paths(`/auth/email-code/send`·`/verify`) + 3 schemas(`EmailCodeSendRequest`·`EmailCodeSendResponse`·`EmailCodeVerifyRequest`). |
| `wrangler.toml` | 변경 없음. |

## 5.3 코드 변경 (프런트 — `malgn-noti`)

| 파일 | 변경 |
| --- | --- |
| [app/pages/signup.vue](../../app/pages/signup.vue) | `sendIdCode()` → `POST /auth/email-code/send` async. 응답 `mockCode` 있으면 토스트에 노출(개발 편의). `sendingCode` 로딩 ref. 버튼 라벨 `발송 중…` / `재발송` / `인증코드 발송` 3-상태. `confirmIdCode()` → `POST /auth/email-code/verify` async. 백엔드 한국어 에러 메시지(`인증코드가 만료되었거나 …`·`시도 횟수를 초과했습니다 …`·`인증코드가 올바르지 않습니다`)를 그대로 토스트에. `verifyingCode` 로딩 + 버튼 라벨 `확인 중…`. |

## 5.4 라이브 e2e 검증 (Production)

`NHN_MOCK=1` secret을 production에 일시 적용 → 6 시나리오 검증 → secret 즉시 제거.

| # | 시나리오 | 결과 |
| --- | --- | --- |
| 1 | `POST /auth/email-code/send` → 200 + `mockCode: "092004"` + `expiresAt` | ✅ |
| 2 | `POST /verify` 잘못된 코드(`"000000"`) → 401 `인증코드가 올바르지 않습니다.` | ✅ |
| 3 | `POST /verify` 올바른 코드 → 200 + `{verified:true}` | ✅ |
| 4 | 같은 코드 재시도 → 401 `인증코드가 만료되었거나 발급된 적이 없습니다.` (consumed) | ✅ |
| 5 | 재발송 → 새 코드(`461872`) + 직전 코드(`092004`) 즉시 만료 | ✅ |
| 6 | DB 행 점검 — id=1 attempts=1+consumed_at, id=2 신규+expires_at 신규 | ✅ |

검증 후 `NHN_MOCK` secret `wrangler secret delete NHN_MOCK` → `wrangler secret list` 응답에 JWT_SECRET만 잔존 확인. 재호출 시 응답에서 `mockCode` 사라짐 확인.

검증 과정에서 생성된 TB_VERIFICATION 임시 행은 즉시 cleanup.

## 5.5 배포 #9·#50

- **API (Workers)**: `pnpm typecheck` 통과 → `pnpm run deploy` → Version `83f32a61-ca2c-4094-ae21-0cfcb174f26c`.
- **사용자단 (Pages)**: `pnpm build` → `npx wrangler@4 pages deploy dist --project-name=malgn-noti --branch=main --commit-dirty=true --commit-message "email OTP integration"` → alias `https://c2100890.malgn-noti.pages.dev`.

## 5.6 산출물

- API: 4 파일 수정 — schema.ts + errors.ts + auth.ts + openapi.ts.
- 사용자단: 1 파일 수정 — signup.vue.
- SIGNUP.md §8 #4 → ✅ (이메일) + #4b 휴대폰 미연동으로 재구성.
- 라이브 DB — TB_VERIFICATION에 라이브 행이 실 사용자 가입 시점부터 적재 시작 (검증용 임시 행은 cleanup).
- 라이브 Worker — 변경 #9 적용. `/health/db` 정상.

## 5.7 알려진 한계 / 다음 단계

- **실제 이메일은 발송되지 않음** — TB_NHN_CREDENTIAL 비어 있어 `sendEmail`이 `(creds=null, mockMode=false)` → 어댑터 내부 mock fallback. 사용자가 가입 시 코드 자체는 발급되지만 메일함에 도착 0. **자격증명 등록은 별도 작업**(NHN Cloud 콘솔에서 채널별 appKey 발급 → TB_NHN_CREDENTIAL 적재 + envelope 암호화). 그 전까지는 NHN_MOCK secret을 운영자가 일시 적용해 mockCode 확인 가능.
- **휴대폰 OTP 미연동** — Step 4(휴대폰 본인 인증)는 여전히 화면 더미. 인증 사업자(PASS·NICE 등) 선정 후 어댑터 + `/auth/phone-code/send`·`/verify` 동일 패턴 신설.
- **`/auth/signup` 강제 검증 미적용** — 정책 결정 후 적용 가능(`emailVerificationToken` 필수화 또는 signup 직전 TB_VERIFICATION 조회).
- **`schema.ts` 인덱스 누락 점검** — 본 단계에서 verification만 인덱스/FK 명시화. 다른 테이블은 §3에서 export/flow 4 테이블만 처리한 상태 그대로.
- **Rate limit** — IP·이메일별 분 단위 발송 제한 미적용. 후속 작업으로 Cloudflare KV 또는 Durable Objects 카운터 도입 검토.

---
