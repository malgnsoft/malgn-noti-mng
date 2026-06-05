# 2026-06-05 — malgn-noti-mng 관리 레포 신설: 문서 집약 + Nuxt 문서/이력 브라우저 앱 + 현황판 + Cloudflare 배포

**한 줄 요약**: 맑은노티 프로젝트를 관리할 신규 레포 `malgn-noti-mng`를 GitHub에 연결하고, `malgn-noti`의 `doc/` 트리(공통 참조·도메인 정본·작업 이력)를 집약한 뒤, malgn-noti와 **동일 스택**(Nuxt 3 + Tailwind v4 + Nuxt UI v3) + `@nuxt/content` 기반 **문서/이력 브라우저 앱**으로 구현해 Cloudflare Pages에 정적 배포(<https://malgn-noti-mng.pages.dev>). 추가로 malgn-noti `/wbs`를 읽기 전용 **"맑은노티 현황판"(`/board`)**으로 이식하고 대시보드에 WBS 현황 요약을 추가(공개 API `GET /wbs` 조회). 앞으로의 작업 이력은 이 레포에서 작성·갱신한다.

---

## 1. 레포 연결 + 문서 집약

- 빈 `malgn-noti-mng` 폴더를 `git init`(main) 후 원격 <https://github.com/malgnsoft/malgn-noti-mng.git> 연결, 첫 커밋·푸시.
- `malgn-noti/doc/` 트리 전체(24개 md)를 `malgn-noti-mng/doc/`로 복사 — 공통 참조(DESIGN/FRONTEND/STACK/WBS), 도메인 정본(MEMBERSHIP/NICE_AUTH/PAGES/pages/*), 일자별 작업 이력(history/* 14개 + README).
- 세션 중 생성된 `.claude/` 로컬 권한 설정은 문서 레포에 부적합 → `.gitignore` 처리.

## 2. CLAUDE.md 병합·현행화 (양쪽 동일 유지)

- `malgn-noti`의 CLAUDE.md를 기본으로, 관리 레포 설명을 **§11**로 통합. 두 레포의 CLAUDE.md를 **항상 동일**하게 유지하는 규칙 명시.
- **작업 이력 작성처 변경(§7.1·§11)**: 앞으로 history는 `malgn-noti`가 아니라 **`malgn-noti-mng/doc/history/`에서 작성·갱신**하고, 작성 후 이 레포에 커밋·푸시한다. 이에 따라 `malgn-noti/doc/history/` 폴더와 15개 파일은 삭제(사본은 본 레포에 보존).

## 3. Nuxt 문서/이력 브라우저 앱 스캐폴딩

- **스택**: malgn-noti 미러링 — Nuxt 3(compat v4) + Nuxt UI v3(Reka UI + Tailwind v4) + Pinia + ESLint(@nuxt/eslint), pnpm. `@nuxtjs/tailwindcss` 미설치 원칙 동일.
- **+ @nuxt/content v3**: `doc/` 마크다운 렌더링. `content.config.ts`에서 소스 `cwd`를 `doc/`로 매핑(단일 `docs` 컬렉션). SQLite 어댑터 `better-sqlite3`는 `package.json`의 `pnpm.onlyBuiltDependencies`로 네이티브 빌드 허용.
- **디자인 시스템 이식**: `app/assets/css/main.css`(Relay-inspired v1.0, 1911줄) + `app/app.config.ts`(zinc)를 malgn-noti에서 그대로 복사 → 형제 앱과 시각 일관성.
- **화면**: `/`(대시보드 — 문서 바로가기 + 최근 이력), `/docs`(문서 목록) + `/docs/[...slug]`(마크다운 렌더, ContentRenderer), `/history`(작업 이력 타임라인). 공용 훅 `composables/useDocs.ts`(history 판별·날짜 포맷).
- 로컬 검증: 콘텐츠 24개 파싱, `/`·`/docs`·`/history` 200, `/docs/design` 등 렌더 확인, `pnpm lint` 통과.
- 환경 노트: 이 샌드박스에서 macOS 기본 `$TMPDIR`(`/var/folders/...`)가 길어 Nuxt vite-node Unix 소켓이 104자 제한 초과 → `connect EINVAL` 500. `TMPDIR=/tmp/mtmp pnpm dev`로 우회(환경 한정 이슈, 설정엔 미반영).

## 4. Cloudflare Pages 정적 배포

- @nuxt/content(better-sqlite3)는 Cloudflare 런타임 DB가 없으므로 **정적 프리렌더(`nuxt generate`) → Pages** 방식 채택. nitro 프리렌더로 전 페이지 HTML 생성.
- 프리렌더 이슈 2건 해결:
  1. **마크다운 내부 상대 링크 크롤**: 문서의 `./FRONTEND.md`·`../../app/...`·`./CLAUDE.md` 등 원본 레포 기준 링크를 크롤러가 따라가 404 → 빌드 실패. **crawlLinks 끄고** `doc/` 트리를 재귀 순회해 정규 라우트만 직접 열거(`nuxt.config.ts`).
  2. **대소문자 구분**: macOS(케이스 무시)에선 안 보였으나, 크롤이 만든 `docs/DESIGN/` 대문자 디렉터리 때문에 Cloudflare(케이스 구분)에서 소문자 `/docs/design`이 404. 라우트를 **전부 소문자로 정규화**해 해결. 파일명 점(`history.20260604`)으로 크롤러가 라우트를 건너뛰던 문제도 같은 열거 방식으로 회피.
- Pages 프로젝트 `malgn-noti-mng` 생성(production-branch=main) 후 `.output/public` 배포. 재배포로 57개 정규 라우트 전부 라이브 200 확인(`/docs/*` 9개 문서 + `/docs/history/*` 16개 이력 + 인덱스).
- 인증: wrangler OAuth(info@malgnsoft.com).

## 5. 현황판(/board) + 대시보드 WBS 현황 요약

- malgn-noti `/wbs` 페이지를 `malgn-noti-mng/board`에 **"맑은노티 현황판"**으로 이식. mng는 인증/편집이 없는 정적 사이트이므로 **읽기 전용**(편집 모달·auth·toast 제거), 자체 sticky 헤더 대신 mng 기본 레이아웃(GNB) 사용.
- 데이터는 공개 API `GET /wbs`(`malgn-noti-api.malgnsoft.workers.dev`)를 `useFetch`로 조회 — 프리렌더 시 빌드 타임에 베이크 + 클라이언트에서 라이브 갱신. `runtimeConfig.public.apiBaseUrl` 추가.
- 공용화: `composables/useWbs.ts`(조회 + 가중평균·상태 카운트·날짜 포맷·그룹화) + `components/AppWbsOverview.vue`(hero stats 3종 + 단계별 진행률 리스트). 대시보드(`/`)와 현황판(`/board`)이 동일 컴포넌트 공유.
- **대시보드에 "프로젝트 현황" 요약 추가**(첨부 이미지 내용 — 전체 진행률·완료·진행 중·단계별 진행률) + GNB에 "현황판" 링크. 개요 행 클릭 → `/board#stage-<id>` 상세로 이동.
- `/board` 프리렌더 라우트 추가. 라이브 검증: `/board` 200, "맑은노티 현황판"·Step 1~5·47.5%/55%/35% 베이크 확인, 대시보드 현황 요약 노출.
- **WBS 문서 페이지는 별도** — 현황판은 진행률 뷰이고, WBS 정본 문서는 추후 별도 구성.

## 6. BOARD.md 신설 — Step 5 세부 항목 단순화 재정의

- 현황판 Step 5(92개 세부 task)를 **큰 카테고리로 묶어 단순화**한 정본 `doc/BOARD.md` 작성. 문서 뷰어에서 [`/docs/board`](https://malgn-noti-mng.pages.dev/docs/board)로 노출.
- 대상 4개 영역 재정의: **API 서버 + API 엔드포인트 → "API 백엔드"로 통합**(6 카테고리), **사용자단 ↔ API 연동**(6 카테고리), **관리자단 화면**(6 카테고리). 각 카테고리에 종합 상태(✅/🟡/⚪) + 기존 task id 매핑(추적용).
- 그 외 영역(설계·준비, 사용자단 목업 UI, 통합·배포)은 현 상태만 참고 표로 기록.
- **WBS 상세(작업 단위·일정·의존성)는 간트 차트로 별도 구성 예정** — BOARD.md는 카테고리 단위 현황 정본, 세부 진척은 향후 간트 WBS가 정본.
- **현황판(`/board`) 페이지도 BOARD.md 렌더로 전환** — 기존 공개 API `GET /wbs`(옛 92항목 상세) 기반에서 BOARD.md(단순화 카테고리) `ContentRenderer` 렌더로 교체해 정본 일원화. `useWbs`/`AppWbsOverview` 의존 제거(대시보드 현황 요약은 그대로 유지).
- **(후속) `/board`는 원래 시각적 보드로 되돌림** — 사용자가 시각적 현황판을 선호. `/board`는 `GET /wbs` 기반 보드(전체 진행률 + 단계 행 + 상세) 유지, BOARD.md 정본은 `/docs/board`로 분리.
- **(후속) BOARD.md를 현황판 전체 미러로 현행화** — WBS.md처럼 현황판의 **모든 내용**(진행률 스냅샷 + 전체 5단계 155 태스크 상세 표 + Step 5 단순화 카테고리 부록)을 담도록 `GET /wbs` 라이브 데이터에서 생성. 데이터 기준 2026-06-04 / 문서 현행화 2026-06-05.

## 7. 현황판 데이터 자립 — 자체 D1 + `/api/board` (외부 `GET /wbs` 의존 제거)

- 외부 `malgn-noti-api`의 공개 `GET /wbs` 의존을 끊고, **malgn-noti-mng 자체 Cloudflare D1**(`malgn-noti-project`, id `3c8c37e3…`) + 내부 API `/api/board`로 전환.
- **스키마**(`server/db/schema.sql`): `board_meta`(프로젝트·현행화일) + `stage`(단계) + `task`(작업) 3 테이블. **시드**(`server/db/seed.sql`): 5단계 115 태스크(Step 5는 단순화 카테고리 반영) — 원격 D1에 적용.
- **서버 라우트** `server/api/board.get.ts`: D1(`DB` 바인딩) 조회 → `{ data: WbsDocument }` 조립. D1 없는 로컬 dev는 `server/utils/boardSeed.ts` 폴백.
- **배포 전환**: 정적 `nuxt generate` → **Cloudflare Pages Functions(SSR)**. `nitro.preset='cloudflare-pages'`, `wrangler.toml`에 D1 바인딩(`DB`). `/`·`/board`는 런타임 D1 조회(SSR), 문서·이력은 프리렌더 유지.
- `useWbs`는 `/api/board` 조회로 변경(외부 baseURL·클라이언트 단순화 로직 제거 — 단순화는 D1 시드에 반영).
- 검증: `/api/board` 200 + D1 값 변경(`last_updated`)이 즉시 반영됨을 확인(폴백 아님). `/`·`/board`·문서·이력 전부 200.
- **(후속) Drizzle ORM 도입** — 브라우저↔D1 직결은 불가(서버 한 겹 필수)임을 정리하고, raw SQL 대신 **Drizzle**로 D1 직접 쿼리. `server/db/schema.ts`(스키마 정본) + `server/utils/db.ts`(`useDb()` 공용) + `board.get.ts` 리팩터. 마이그레이션은 `drizzle-kit`(`server/db/migrations/`)으로 일원화(수기 `schema.sql` 제거). `db:generate`/`db:apply`/`db:seed` 스크립트 추가.

---

## 산출물

- **신규 레포**: `malgn-noti-mng` (GitHub `malgnsoft/malgn-noti-mng`, branch `main`).
- **프로덕션**: <https://malgn-noti-mng.pages.dev> (배포마다 `https://<id>.malgn-noti-mng.pages.dev` alias).
- **커밋**: 문서 집약 `0db385a` · history 작성처 변경 `bebb5b8` · 앱 스캐폴딩 `5ac81c6` · 프리렌더 대소문자 fix(이번).
- **주요 파일**: `nuxt.config.ts`(프리렌더 라우트 열거 + apiBaseUrl), `content.config.ts`(doc/ 매핑), `app/pages/{index,board,docs/index,docs/[...slug],history/index}.vue`, `app/layouts/default.vue`, `app/composables/{useDocs,useWbs}.ts`, `app/components/AppWbsOverview.vue`, `package.json`(@nuxt/content + better-sqlite3 + pnpm.onlyBuiltDependencies).
- **현황판**: <https://malgn-noti-mng.pages.dev/board> (맑은노티 현황판, 읽기 전용, `GET /wbs` 라이브).
- **현황판 정본 문서**: [`doc/BOARD.md`](../BOARD.md) — Step 5 세부 항목 단순화 재정의 (`/docs/board`).

## 다음 단계 / 알려진 한계

- 문서 마크다운 내부의 원본 레포 상대 링크(`./FRONTEND.md` 등)는 이 앱에서 클릭 시 404 — 앱 라우트(`/docs/...`)로 재작성하거나 무효화 필요.
- 문서 상세에 좌측 TOC/사이드바, 전체 검색 미구현.
- 콘텐츠 현행화는 수동 복사(§11 규칙) — `malgn-noti/doc/` 갱신 시 `malgn-noti-mng/doc/`로 동기화하는 절차 자동화 미정.
- 배포는 로컬 `nuxt generate` 산출물 수동 업로드 — CI(예: GitHub 연동 자동 빌드) 미설정.
