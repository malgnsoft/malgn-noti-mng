# 프로젝트 관리 앱 블루프린트 (재사용 가이드)

> 이 문서는 `malgn-noti-mng`로 구현한 **프로젝트 관리 허브 앱**의 일반화된 설계도다.
> 특정 프로젝트의 데이터·문구·도메인 내용은 제외하고, **다른 프로젝트에 그대로 이식·구현**할 수 있는
> 아키텍처 · 메뉴 · 화면 · 스키마 · 디자인 토큰 · 셋업/배포 절차만 담는다.
> Claude Code가 이 문서만 보고 새 프로젝트용 관리 앱을 처음부터 구축할 수 있도록 작성했다.
>
> **치환 토큰**: `{APP}`=앱/Pages 프로젝트명(예: `myproj-mng`) · `{PROJECT}`=대상 프로젝트 표시명 ·
> `{D1_NAME}`=D1 DB명 · `{D1_ID}`=D1 database_id · `{REPO}`=GitHub 레포 URL.
>
> **마지막 갱신**: 2026-06-12 (① 참여자(회원) 시스템 §5.6·§6·§7·§7.1 통합. ② **이슈/정책 게시판** 신설 — GNB 대시보드↔WBS 사이, §5.7 화면·§6 `issue` 테이블·§7 CRUD API·§7.2 정책).

---

## 1. 이 앱은 무엇인가 (목적)

하나의 프로젝트를 운영·조망하는 **단일 관리 허브**. 주요 영역:

| 영역 | 경로 | 한 줄 정의 |
| --- | --- | --- |
| 대시보드 | `/` | 프로젝트 개요(목표·방향) + 진척 요약 + 바로가기 |
| 이슈 | `/issues` | 정책·이슈·공지·논의 게시판(작성/열람/상태 관리) — §5.7 |
| WBS(간트) | `/wbs` | 일 단위 간트 차트 + 작업 **등록/수정/삭제**(CRUD) |
| 문서 | `/docs` | `docs/` 마크다운 트리 뷰어 |
| 작업 이력 | `/history` | 일자별 작업 이력 타임라인 |
| (회원 시스템) | `/login`·`/account`·`/members` | 로그인 게이트 + 참여자 명부 — §5.6 |
| (폐지) 현황판 | `/board` | 진척은 WBS 단일 정본으로 통합 — 신규 앱 미노출 |

**데이터 정본 2종**: ① 구조화 데이터(진척·작업·단계)는 **Cloudflare D1**, ② 문서/이력은 **`docs/` 마크다운**(@nuxt/content).
자체 완결형 — 외부 API 의존 없음(원하면 외부 API도 붙일 수 있으나 기본은 자급).

**참여자(회원) 시스템 (선택 — 이 앱은 적용함)**: 관리 허브를 **로그인 게이트** 뒤에 두고 "프로젝트 참여자"를 관리한다. 직접 회원가입 + **상위 시스템(예: 맑은오피스) 연동(서버 upsert / SSO)**의 2 경로로 가입한다. 회원·세션·내 정보·참여자 명부는 같은 D1 + Pages Function 위에 얹는다(외부 인증 서버 없이 자급). 상세는 §5.6(화면)·§6 `member` 테이블·§7 인증/계정/연동 API·§7.1(상태·정책·한계). **불필요한 프로젝트는 이 절을 통째로 빼면 됨** — 나머지 구조는 그대로 동작.

---

## 2. 기술 스택

- **프레임워크**: Nuxt 3 (`future.compatibilityVersion: 4`, `<script setup lang="ts">`, strict TS)
- **UI**: Nuxt UI v3 (Reka UI + Tailwind CSS v4). `@nuxtjs/tailwindcss`는 설치 금지(Nuxt UI가 통합 관리)
- **상태**: Pinia (`@pinia/nuxt`) — 필요 시
- **콘텐츠**: `@nuxt/content` v3 + `better-sqlite3`(빌드 타임 SQLite 어댑터)
- **DB/ORM**: Cloudflare **D1** + **Drizzle ORM**(`drizzle-orm/d1`) + `drizzle-kit`(마이그레이션)
- **아이콘**: `@iconify-json/lucide`, `@iconify-json/heroicons` (`i-lucide-*`)
- **린트**: `@nuxt/eslint` + ESLint
- **패키지 매니저**: pnpm
- **배포**: Cloudflare Pages (Functions/SSR) — Nitro `cloudflare-pages` 프리셋

`package.json` 핵심:
```jsonc
{
  "scripts": {
    "dev": "nuxt dev", "build": "nuxt build", "preview": "nuxt preview",
    "postinstall": "nuxt prepare", "typecheck": "nuxt typecheck", "lint": "eslint .",
    "db:generate": "drizzle-kit generate",
    "db:apply": "wrangler d1 migrations apply {D1_NAME} --remote",
    "db:seed": "wrangler d1 execute {D1_NAME} --remote --file=server/db/seed.sql"
  },
  "dependencies": [
    "@iconify-json/heroicons","@iconify-json/lucide","@nuxt/content","@nuxt/ui",
    "@pinia/nuxt","better-sqlite3","drizzle-orm","nuxt","pinia","vue","vue-router"
  ],
  "devDependencies": ["@nuxt/eslint","drizzle-kit","eslint","typescript","vue-tsc"],
  // 네이티브 빌드 허용 (pnpm v10 비대화형 설치 필수)
  "pnpm": { "onlyBuiltDependencies":
    ["@parcel/watcher","better-sqlite3","esbuild","unrs-resolver","vue-demi"] }
}
```

---

## 3. 시스템 아키텍처

### 렌더링 전략 (프리렌더 vs SSR) — 핵심 결정
- **문서/이력 페이지(`/docs/**`, `/history`)**: **프리렌더(정적)**. 빌드 타임에 `@nuxt/content`가 마크다운을 HTML로 구워 베이크 → 런타임 DB 불필요.
- **대시보드/현황판/WBS(`/`, `/board`, `/wbs`)**: **SSR(Pages Functions)**. 런타임에 D1을 조회하므로 프리렌더하지 않는다.

### 데이터 흐름
```
브라우저
  ├─ /docs, /history        → (프리렌더 HTML, @nuxt/content 빌드 산출)
  └─ /, /board, /wbs (SSR)  → useFetch('/api/*') → server/api/* (Pages Function)
                                                      └─ useDb(event) → Drizzle → D1({D1_NAME})
```
- **브라우저는 D1에 직접 접근 불가**. 반드시 서버 한 겹(Pages Function + `env.DB` 바인딩) 경유.
- 데이터 편집(CRUD)도 같은 API 경유.

### 디렉터리 구조
```
app/
  app.vue                     # <UApp><NuxtLayout><NuxtPage/>
  app.config.ts               # Nuxt UI 색상 매핑(primary/neutral)
  assets/css/main.css         # 디자인 시스템 토큰(전역)
  assets/css/prose.css        # 마크다운 prose 스타일(전역 — §9 주의)
  layouts/default.vue         # GNB(상단 네비) + 푸터
  components/
    AppLogoMark.vue           # 로고 마크(인라인 SVG)
    AppWbsOverview.vue        # 대시보드/현황판 공용 진척 요약(전체% + 단계 박스/행)
  composables/
    useDocs.ts                # docs/ 콘텐츠 조회 + history 판별·날짜 포맷
    useWbs.ts                 # /api/board 조회 + 파생 통계(가중평균·카운트·상태)
  pages/
    index.vue                 # 대시보드
    board.vue                 # 현황판
    wbs.vue                   # 간트 WBS (+ CRUD UI)
    docs/index.vue            # 문서 목록
    docs/[...slug].vue        # 문서 렌더(ContentRenderer)
    history/index.vue         # 작업 이력 타임라인
  utils/wbsData.ts            # WBS 정적 메타(단계명·가중치) + dev 시드 폴백
server/
  api/board.get.ts            # 현황판 데이터(GET)
  api/wbs.get.ts              # WBS 목록(GET)
  api/wbs.post.ts             # WBS 등록(POST)
  api/wbs/[id].patch.ts       # WBS 수정(PATCH)
  api/wbs/[id].delete.ts      # WBS 삭제(DELETE)
  db/schema.ts                # Drizzle 스키마(정본)
  db/migrations/*             # drizzle-kit 생성 마이그레이션
  db/seed.sql                 # 시드(초기 데이터)
  utils/db.ts                 # useDb(event) → Drizzle/D1
  utils/boardSeed.ts          # dev(D1 없음) 폴백 시드
content.config.ts             # @nuxt/content: 소스를 docs/ 로 매핑
nuxt.config.ts                # 프리렌더 라우트 열거 + cloudflare-pages 프리셋
wrangler.toml                 # D1 바인딩 + migrations_dir
docs/                          # 마크다운 문서 + history/
```

---

## 4. 메뉴 구성도 (IA)

상단 GNB(고정 56px): `[로고]` + 네비 + (우측) 사용자/로그아웃(비로그인 시 로그인).
```
[로고 {PROJECT}]   대시보드 · 이슈 · WBS · 문서 · 작업 이력            사용자 ▾ · 로그아웃
```
- `default.vue`의 `nav` 배열로 정의: `{ to, label, icon }`. **순서: 대시보드 → 이슈 → WBS → 문서 → 작업 이력**.
  - 대시보드 `/` `i-lucide-layout-dashboard`
  - **이슈 `/issues` `i-lucide-message-square-warning`** (대시보드와 WBS 사이 — 정책·이슈 게시판, §5.7)
  - WBS `/wbs` `i-lucide-gantt-chart`
  - 문서 `/docs` `i-lucide-book-text`
  - 작업 이력 `/history` `i-lucide-history`
  - (회원 시스템 적용 시) 참여자 `/members` `i-lucide-users`
  - (현황판 `/board` `i-lucide-gauge` — 폐지됨. 진척은 WBS 단일 정본. 신규 앱은 미노출.)
- 푸터: 한 줄 카피라이트/설명.
- **회원 시스템 적용 시 GNB 우측**: 비로그인이면 "로그인" 링크, 로그인이면 **회원명(→ `/account` 내 정보)** + 로그아웃. `default.vue`가 전역 auth 상태(`useState('auth:member')`)로 분기. 가드(`middleware/auth.ts`)가 보호 라우트(`/account`·`/members` 등)를 `/login?redirect=…`로 보냄.

---

## 5. 화면별 명세 (일반)

### 5.1 대시보드 `/` (SSR)
- **프로젝트 개요**: 목표 카드(한 줄 목표 + 핵심 키워드 칩) + 방향 카드(불릿). 데이터는 페이지 내 배열 또는 별도 doc.
- **프로젝트 현황 요약**: `AppWbsOverview`(전체 진척% + 단계 박스) — `useWbs()`로 `/api/board` 조회.
- **바로가기**: 외부 링크 카드(라벨 + URL). 배열로 관리.
- **문서 / 최근 작업 이력**: `useDocs()`로 doc 목록·최근 history N개 카드.

### 5.2 현황판 `/board` (SSR)
- 상단: 전체 진척률(가중평균) + 완료/진행 중 카운터.
- 단계별 진척률(행 스타일) + 단계 상세(그룹/작업 표: 상태·담당·목표/완료일).
- 데이터: `useWbs()` → `/api/board`(D1 `board_meta`/`stage`/`task`).

### 5.3 WBS 간트 `/wbs` (SSR) — 핵심
- **상단 KPI**: 전체 진척 미터 + 완료/진행중/지연/예정 카운트.
- **툴바**: 담당 칩(다중 필터) · 상태 세그먼트 · 검색 · 모두 접기/펼치기 · 범례 · **＋작업 추가**.
- **3계층 트리**: Step → 구분(Category) → 작업(Task), 셰브론 접기.
- **간트**: 일 단위 헤더(월/일/요일, 주말 음영, 오늘 기준선) + 상태색 **진척 막대**(채움+%) · 1일=마일스톤(다이아몬드) · 구분/Step **롤업 막대** · 막대 **호버 툴팁**.
- **CRUD**: 행 hover 시 수정/삭제, ＋추가 → 등록/수정 모달. `/api/wbs` 호출 후 `refresh()`.
- **상태 규칙**: `done`(progress≥100) · `plan`(시작 없음/미래) · `late`(종료<오늘 & <100%) · `active`(그 외).
- **진척 집계 규칙(중요)**: 전체/단계 진척은 **단계 가중평균**(보드와 일치)으로, 작업 카운트·구분 롤업은 작업 기준. (단순 평균은 화면 단위가 잘게 쪼개진 경우 과소평가됨 — 가중치 권장.)
- **전체 화면 + 스크롤**: WBS는 풀스크린 앱 — 레이아웃 **푸터 숨김 + GNB 비고정**(`/wbs`에서 `position:static`). 스크롤하면 **GNB·상단 KPI(topbar)는 사라지고**, **툴바+간트 헤더는 `.wbs-pane`(`position:sticky; top:0; height:100vh`)로 상단 고정**. (`.wbsx`는 고정 높이 없이 자연 흐름 → 페이지 스크롤로 topbar가 밀려 올라감. 간트 자체는 `.wbs-pane` 안에서 `flex:1; overflow:auto`로 행·가로 스크롤.)
- **실시간 기준일(오늘)**: KST = `new Date(Date.now()+9h).toISOString().slice(0,10)`. `useState`로 SSR 하이드레이트 + `onMounted` 클라이언트 보정(CDN 캐시 대비). 오늘 기준선·상태(plan/late/active) 판정에 사용. 부제 기준일 표기는 `yyyy.MM.dd`.
- **호버/메모**: 담당·작업명이 잘리면(`scrollWidth>clientWidth`) **커스텀 호버 툴팁**으로 전체 표시(네이티브 `title`은 비신뢰 → 커스텀). 메모(note) 있는 작업은 **메모 아이콘 → 클릭 시 팝오버**로 확인.
- **단계 관리**: 단계 가중치 합 100 권장. 미가중 단계(예: QA)는 `weight 0`도 가능(표시만, 전체에 영향 없음)·가중치 부여도 가능. 단계 추가/삭제/번호변경 시 **D1(`stage`/`wbs_item`) + 코드(`wbsSteps`/`wbsStageMeta`)를 함께** 갱신하고, 트리는 번호순 정렬(`steps.sort((a,b)=>a.num-b.num)`).

### 5.4 문서 `/docs`, `/docs/[...slug]` (프리렌더)
- `/docs`: `useDocs()`로 doc 목록. `/docs/[...slug]`: `queryCollection('docs').path('/'+slug)` → `<ContentRenderer>`.
- 링크는 콘텐츠 `path`를 그대로 사용(`/docs${doc.path}`)해 대소문자 일관 유지.

### 5.5 작업 이력 `/history` (프리렌더)
- `docs/history/history.yyyyMMdd.md`를 타임라인으로. 파일명에서 날짜 파싱.

### 5.6 인증·회원·계정 (SSR) — 참여자 시스템 화면

> 회원 시스템을 적용한 앱(이 앱)의 화면. 회원 = 문서·WBS·이력을 열람하는 **프로젝트 참여자**. 모두 SSR(런타임 세션/D1 조회 → 프리렌더 제외).

| 라우트 | 메인 컴포넌트 | 권한 | 화면 |
| --- | --- | --- | --- |
| `/login` | `app/pages/login.vue` | 게스트(로그인 시 `redirect`) | 아이디·비밀번호 카드 + "회원가입" 링크 + "상위 시스템(맑은오피스) 사용자는 별도 가입 없이 접속" 안내. 에러는 카드 내 인라인 |
| `/signup` | `app/pages/signup/index.vue` | 게스트(로그인 시 `/`) | 2열 가입 폼(아이디·성명·비번·비번확인·회사명·역할·이메일·휴대폰) + 아이디 **중복확인 게이트** + **개인정보 수집·이용 동의(필수)** |
| `/signup/complete` | `app/pages/signup/complete.vue` | 로그인 필수 | 가입 완료 안내(가입 직후 자동 로그인 상태로 진입, 비로그인 직접진입은 `/login`) |
| `/account` | `app/pages/account.vue` | 로그인 필수(`middleware:'auth'`) | 내 정보 — **프로필 수정**(성명·회사명·역할·이메일·휴대폰; 아이디 읽기전용) + **비밀번호 변경**(현재 비번 확인 → 새 비번 8자↑) |
| `/members` | `app/pages/members.vue` | 로그인 필수 | 참여자 테이블(성명·아이디·회사명·역할·이메일·휴대폰 + **구분 배지** `연동`/`직접가입`) — 읽기 전용 |
| `/api/auth/sso` | (서버 핸들러, 화면 없음) | HMAC 토큰 | 상위 시스템 SSO 진입점 |

- **회원 필드**: 아이디(`loginId`)·비밀번호·성명·회사명·역할·이메일·휴대전화 + `source`(`direct`|`office`)·`officeId`·`status`(`active`|`suspended`)·`agreedAt`(개인정보 동의 시각)·타임스탬프.
- **세션 하이드레이션**: 전역 `useState('auth:member')`에 보관. `app/plugins/auth.ts`가 앱 시작 시 `/api/auth/me` 1회 호출로 하이드레이트(SSR에서는 쿠키 포워딩). `app/composables/useAuth.ts`가 로그인/로그아웃/현재 회원을 노출, `app/middleware/auth.ts`가 보호 라우트를 게이트.
- **직접 가입 플로우**: 아이디 입력 → "중복확인"(`GET /api/auth/check-id`) 통과(통과 전 제출 차단) → 개인정보 수집·이용 동의(필수 체크; **내부 도구라 이용약관 동의는 두지 않음**) → 클라 1차 검증 → `POST /api/auth/signup`(검증·해시·생성·세션 발급) → 자동 로그인 → `/signup/complete`.
- **내 정보(`/account`)**: 프로필 수정 `PATCH /api/account`(아이디·비번·`source` 불변, `updated_at` 기록, 응답으로 전역 auth 갱신) + 비밀번호 변경 `POST /api/account/password`(현재 비번 확인). **연동(`source='office'`) 회원은 `password_hash=null` → 비밀번호 변경 차단(400 안내)**.
- **상위 시스템 연동 2경로**: (A) **서버 간 프로비저닝** — 상위 시스템 → `POST /api/integration/office/upsert`(`x-office-secret`, `office_id` 키 upsert, 세션 없음). (B) **SSO 핸드오프** — 상위 시스템 → `GET /api/auth/sso?token=<HMAC>&redirect=/`(토큰 검증 → upsert → 세션 발급 → 302). `redirect`은 `/` 시작만 허용(오픈 리다이렉트 차단).
- 일반화: "맑은오피스"는 **이 앱의 상위 시스템 예시**다. 다른 프로젝트는 자체 SSO 발급자(`office`→임의 명칭)로 치환. 연동이 불필요하면 §5.6의 office 경로와 §6 `office_id`/`source` 분기를 빼고 직접 가입만 남기면 된다.

### 5.7 이슈 — 정책·이슈 게시판 (SSR)

> 정책·이슈·공지·논의를 **올리고(작성) 확인(열람)** 하는 게시판. GNB에서 대시보드 ↔ WBS 사이에 위치(§4). **사이트 전체 로그인 게이트**가 걸리므로 모든 화면 로그인 필수. 작성자 = 세션 회원(`member`, §5.6). SSR(런타임 D1 조회 → 프리렌더 제외).

| 라우트 | 메인 컴포넌트 | 권한 | 화면 |
| --- | --- | --- | --- |
| `/issues` | `app/pages/issues/index.vue` | 로그인 필수(`middleware:'auth'`) | 목록 — **타입·상태 필터 + 검색** + 작성 버튼. 행: 타입 배지·제목·상태 배지·작성자·작성일 |
| `/issues/new` | `app/pages/issues/new.vue` | 로그인 필수 | 작성 폼 — 타입(셀렉트)·제목·본문(마크다운)·(선택)우선순위. 상태는 신규 기본값 자동 |
| `/issues/[id]` | `app/pages/issues/[id].vue` | 로그인 필수 | 상세 — 메타(타입·상태·작성자·작성/수정일) + **본문 마크다운 렌더** + (작성자에게) 상태 변경·수정·삭제 액션 |
| `/issues/[id]/edit` | `app/pages/issues/[id]/edit.vue` | 로그인 필수 + **작성자 본인**(+향후 admin) | 수정 폼(작성 폼 재사용). 권한 없으면 상세로 리다이렉트 |

**화면 흐름**
```
/issues (목록·필터·검색)
  ├─ [작성] → /issues/new → POST /api/issues → /issues/:id
  └─ 행 클릭 → /issues/:id (상세)
        ├─ (작성자) 상태 변경  → PATCH /api/issues/:id { status }   → in-place 갱신
        ├─ (작성자) [수정]     → /issues/:id/edit → PATCH /api/issues/:id → /issues/:id
        └─ (작성자) [삭제]     → 컨펌 → DELETE /api/issues/:id → /issues
```

**사용자 액션 매트릭스**
| 액션 | 주체 | 엔드포인트 | 권한 |
| --- | --- | --- | --- |
| 목록·필터·검색 | 로그인 회원 | `GET /api/issues?type=&status=&q=` | 세션 필수 |
| 상세 열람 | 로그인 회원 | `GET /api/issues/:id` | 세션 필수 |
| 작성 | 로그인 회원 | `POST /api/issues` | 세션 필수(작성자=세션 회원) |
| 수정 / 상태 변경 | **작성자 본인**(+향후 admin) | `PATCH /api/issues/:id` | 세션 + 소유권 |
| 삭제 | **작성자 본인**(+향후 admin) | `DELETE /api/issues/:id` | 세션 + 소유권 |

- **목록 필터**: 타입(`type`) 세그먼트/셀렉트 + 상태(`status`) 세그먼트 + 검색어(`q`, 제목 LIKE). 필터는 쿼리스트링 → `useFetch` 재조회. 기본 정렬 `updatedAt DESC`.
- **본문 렌더**: 마크다운(권고 — §7.2 e). 목록은 평문 미리보기(본문 앞부분), 상세에서만 렌더. 렌더러는 경량 마크다운(예: 기존 prose 스타일 재사용) — `@nuxt/content`의 런타임 쿼리는 쓰지 않음(이슈는 D1 데이터지 콘텐츠 파일이 아님).
- **빈/로딩/에러 상태**: 목록·상세 모두 처리. 권한 없는 수정/삭제 시도는 서버 403 + 클라 리다이렉트로 이중 차단.

---

## 6. 데이터 모델 · 테이블 스키마 (D1 / Drizzle)

`server/db/schema.ts` (구조만 — 데이터 내용 제외):
```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 현황판(board) — 프로젝트 메타 + 단계 + 작업
export const boardMeta = sqliteTable('board_meta', {
  id: integer('id').primaryKey(),            // 단일 행 = 1
  projectName: text('project_name').notNull(),
  lastUpdated: text('last_updated').notNull(),// YYYY-MM-DD
})
export const stage = sqliteTable('stage', {
  id: text('id').primaryKey(),               // step-1 …
  no: text('no').notNull(), name: text('name').notNull(),
  emoji: text('emoji'), summary: text('summary'),
  weight: integer('weight').notNull().default(0),     // 가중치(%)
  progress: integer('progress').notNull().default(0), // 진행률(%)
  sort: integer('sort').notNull().default(0),
})
export const task = sqliteTable('task', {
  id: text('id').primaryKey(), stageId: text('stage_id').notNull(),
  grp: text('grp'), title: text('title').notNull(),
  status: text('status').notNull().default('pending'), // done|in_progress|pending|blocked
  owner: text('owner'), note: text('note'),
  targetDate: text('target_date'), completionDate: text('completion_date'),
  href: text('href'), sort: integer('sort').notNull().default(0),
})

// WBS 간트 항목 — 등록/수정/삭제 대상
export const wbsItem = sqliteTable('wbs_item', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  step: integer('step').notNull(), grp: text('grp').notNull(),
  name: text('name').notNull(), owner: text('owner').notNull().default(''),
  start: text('start'), end: text('end'),               // YYYY-MM-DD | null
  progress: integer('progress').notNull().default(0),
  note: text('note'), href: text('href'),
  sort: integer('sort').notNull().default(0),
})

// 참여자(회원) — 회원 시스템 적용 시. login_id·office_id 유니크
export const member = sqliteTable('member', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  loginId: text('login_id').notNull().unique(),          // 아이디
  passwordHash: text('password_hash'),                   // pbkdf2$iter$salt$hash. 연동 회원은 null
  name: text('name').notNull(),
  company: text('company').notNull().default(''),
  role: text('role').notNull().default(''),
  email: text('email').notNull().default(''),
  phone: text('phone').notNull().default(''),
  source: text('source').notNull().default('direct'),    // direct | office
  officeId: text('office_id').unique(),                  // 상위 시스템 사용자 식별자(nullable)
  status: text('status').notNull().default('active'),    // active | suspended
  agreedAt: text('agreed_at'),                           // 개인정보 동의 시각 ISO8601(직접가입만)
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
})

// 이슈 — 정책·이슈 게시판(§5.7). 작성자 = member
export const issue = sqliteTable('issue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull().default('issue'),         // policy | issue | notice | discussion
  title: text('title').notNull(),
  body: text('body').notNull().default(''),              // 마크다운 본문
  status: text('status').notNull().default('open'),      // open | in_progress | resolved | hold (공통 enum, §7.2 b)
  priority: text('priority'),                            // (선택) low | normal | high — null 허용
  authorId: integer('author_id').notNull(),              // member.id 참조(앱 레벨 FK)
  authorName: text('author_name').notNull().default(''), // 비정규화(작성 시점 성명 스냅샷)
  createdAt: text('created_at').notNull(),               // ISO8601
  updatedAt: text('updated_at'),                         // ISO8601
})
```
- 마이그레이션은 `pnpm db:generate`(drizzle-kit) → `server/db/migrations/`.
- 신규 D1엔 `wrangler d1 migrations apply {D1_NAME} --remote`로 적용. (기존 테이블이 있으면 충돌하므로, 처음 구축 시 migrations apply 사용 권장.)
- **날짜는 ISO(`YYYY-MM-DD`)로만 저장** — 간트 타임라인 범위는 날짜 문자열 min/max로 계산하므로 `5/12` 같은 비ISO가 섞이면 범위가 깨져 막대·오늘선이 사라진다(§9-8).
- **CRUD 패턴**: `wbs_item`처럼 `id` autoincrement + `sort`(표시 순서). 등록은 `sort = max(id)+1`로 말미 추가. 컬럼 `grp`↔화면 키 `group`은 API 레이어에서 매핑.
- **`member`(회원 시스템 적용 시)**: 저장소 헬퍼는 `server/utils/members.ts`(`findByLoginId`/`findById`/`findByOfficeId`/`create`/`upsertByOffice`/`updateProfile`/`updatePassword`/`list`) — 프로덕션 D1(Drizzle), dev(바인딩 없음)는 **인메모리 폴백**(프로세스 생존 동안만). 비밀번호는 평문 보관 금지 — **PBKDF2(SHA-256, 100k iter, 16B salt)**; 세션 쿠키·연동 토큰 서명은 **HMAC-SHA256**(`server/utils/auth.ts`). 해시·서명 유틸은 Web Crypto만 사용(외부 의존 없음 → Cloudflare Workers 호환). ⚠️ **PBKDF2 iter는 Workers CPU 한도와 트레이드오프** — 이 앱은 210k에서 가입 시 CPU limit으로 죽어 **100k로 하향**해 GREEN(§7.1 한계).
- **이 앱의 마이그레이션 적용 방식**: 이 레포는 `d1_migrations` 추적을 쓰지 않고(기존 board/wbs와 동일) `member` 테이블을 **원격 D1에 직접 `wrangler d1 execute`로 적용**했다(생성 14컬럼 + `login_id`·`office_id` 유니크 인덱스 2개). `pnpm db:apply`는 0000 CREATE 충돌로 사용 금지. (Drizzle 마이그레이션 `0002`(생성)·`0003`(`agreed_at` 추가)는 스키마 정본 추적용으로 보존.)
- **`issue`(게시판, §5.7)**: `authorId`는 `member.id`를 가리키는 **앱 레벨 참조**(SQLite FK 강제는 board/wbs 관례대로 미사용 — 회원 삭제 시 정합은 앱에서 처리). 목록 조회 부담을 줄이려 `authorName`을 **작성 시점 비정규화**로 함께 저장(회원 성명이 바뀌어도 게시 당시 표기 유지; 최신 표기가 필요하면 조인). `body`는 마크다운 원문 그대로 저장(렌더는 화면에서). 정렬·필터용 인덱스(권장): `idx_issue_status`, `idx_issue_type`, `idx_issue_updated_at`. 적용은 member와 동일하게 원격 D1 직접 execute(또는 drizzle 마이그레이션 생성 후 적용) — mngdev가 결정.

`server/utils/db.ts` (공용 D1 접근):
```ts
import { drizzle } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
import * as schema from '../db/schema'
type D1Client = Parameters<typeof drizzle>[0]
export function useDb(event: H3Event) {
  const env = event.context.cloudflare?.env as { DB?: unknown } | undefined
  const d1 = env?.DB
  return d1 ? drizzle(d1 as D1Client, { schema }) : null   // dev(바인딩 없음) → null → 시드 폴백
}
```

---

## 7. API 엔드포인트

| 메서드/경로 | 설명 | 비고 |
| --- | --- | --- |
| `GET /api/board` | 현황판 문서(meta+stages+tasks) 조립 | dev는 `boardSeed` 폴백 |
| `GET /api/wbs` | WBS 항목 목록 | dev는 정적 시드 폴백 |
| `POST /api/wbs` | 항목 등록 | `readBody` 검증 후 insert·`returning()` |
| `PATCH /api/wbs/:id` | 항목 수정 | 부분 업데이트 |
| `DELETE /api/wbs/:id` | 항목 삭제 | |

**회원 시스템 API (적용 시)** — `PublicMember` = 회원 레코드에서 `passwordHash` 제거(`members.ts toPublic`):

| 메서드/경로 | 인증 | 요청 | 응답 | 비고 |
| --- | --- | --- | --- | --- |
| `GET /api/auth/check-id` | 없음 | `?loginId=` | `{ loginId, valid, available, reason }` | 형식 `^[a-zA-Z0-9_.-]{3,32}$` + 사용가능 여부. 항상 200 |
| `POST /api/auth/signup` | 없음 | `loginId,password,name,company,role,email,phone,agreedPrivacy` | `{ data: PublicMember }` + 세션쿠키 | 비번 ≥8·이메일/휴대폰 형식·**개인정보 미동의 400**·아이디 중복 409. `agreed_at` 기록 |
| `POST /api/auth/login` | 없음 | `loginId,password` | `{ data: PublicMember }` + 세션쿠키 | 불일치/연동회원/없음 모두 **401 동일 메시지**(계정 존재 비노출), 정지 403 |
| `POST /api/auth/logout` | — | — | `{ ok: true }` | 세션 쿠키 삭제 |
| `GET /api/auth/me` | 선택 | — | `{ data: PublicMember \| null }` | 세션 없으면 `null`(401 아님 — 게스트 판별) |
| `PATCH /api/account` | 세션 필수 | `name,company,role,email,phone` | `{ data: PublicMember }` | 본인 프로필. 성명 필수·형식 400, `updated_at` 기록. 아이디·비번·`source` 불변 |
| `POST /api/account/password` | 세션 필수 | `currentPassword,newPassword` | `{ ok: true }` | 새 비번 ≥8, 현재 비번 오답 400, **연동 회원(`password_hash` null) 400** |
| `GET /api/members` | 세션 필수 | — | `{ data: PublicMember[] }` | 비로그인 401 |
| `GET /api/auth/sso` | HMAC 토큰 | `?token=&redirect=` | 302 redirect + 세션쿠키 | `redirect`은 `/` 시작만 허용(오픈 리다이렉트 차단) |
| `POST /api/integration/office/upsert` | `x-office-secret` | `officeId,loginId?,name,company,role,email,phone` | `{ data: PublicMember, created }` | `officeId`·`name` 필수, `loginId` 미지정 시 `officeId` 대체. `source='office'` |

- 세션 쿠키: `mng_session`(HMAC 서명, TTL 7일, HttpOnly·Secure·SameSite=lax). `setSession(memberId)`/`getSessionMemberId()`/`clearAuthSession()`(`server/utils/auth.ts`).

**이슈 게시판 API (§5.7)** — 전부 **세션 필수**(사이트 전체 게이트). 수정/삭제는 **작성자 본인(+향후 admin)** 소유권 검사:

| 메서드/경로 | 인증 | 요청 | 응답 | 비고 |
| --- | --- | --- | --- | --- |
| `GET /api/issues` | 세션 필수 | `?type=&status=&q=&page=` | `{ data: Issue[], total }` | 타입·상태 필터 + 제목 `q` LIKE. 정렬 `updated_at DESC`. 본문은 미리보기로 절단 가능 |
| `POST /api/issues` | 세션 필수 | `type,title,body,priority?` | `{ data: Issue }` | `authorId`=세션 회원, `authorName`=세션 성명 스냅샷. `status` 기본값 서버 설정. `title` 필수·`type` enum 검증(위반 400) |
| `GET /api/issues/:id` | 세션 필수 | — | `{ data: Issue }` | 없으면 404 |
| `PATCH /api/issues/:id` | 세션 + **소유권** | `type?,title?,body?,status?,priority?` | `{ data: Issue }` | 작성자(또는 admin) 아니면 **403**. 부분 업데이트, `updated_at` 기록. 상태만 변경도 동일 엔드포인트 |
| `DELETE /api/issues/:id` | 세션 + **소유권** | — | `{ ok: true }` | 작성자(또는 admin) 아니면 403 |

- 소유권 판정: `issue.authorId === session.memberId` (향후 `member.role`/admin 플래그 도입 시 OR 조건 추가). 권한 위반은 **서버 403 + 클라 리다이렉트** 이중 차단.
- `Issue` = `issue` 레코드 전체(작성자 정보는 `authorId`+`authorName` 비정규화로 포함, 추가 조인 불필요).

패턴(예 — GET):
```ts
export default defineEventHandler(async (event) => {
  const db = useDb(event)
  if (!db) return { data: /* 정적 시드 */ }
  const rows = await db.select().from(wbsItem).orderBy(asc(wbsItem.sort), asc(wbsItem.id))
  return { data: rows.map(/* DB컬럼 grp→group 등 매핑 */) }
})
```
- 페이지는 `useFetch('/api/...')`로 조회, 변경은 `$fetch(..., { method })` 후 `refresh()`.
- 컬럼명(`grp`)과 화면 키(`group`)는 API 레이어에서 매핑.

### 7.1 회원 시스템 — 상태 모델 · 정책 · 한계 (이 앱의 실제 구현)

> 직접 회원가입은 구현이 일관되나, **상위 시스템(맑은오피스) 연동 규약은 전부 임시값**(dev 시크릿·자체 HMAC 포맷)이며 상위 시스템 실제 스펙 확정 전까지 미정. (a)~(g)는 연동 상대 팀과 합의가 필요한 항목으로, 끝에 **기획 권고안**을 1줄로 둔다. 회원 시스템을 적용하지 않는 프로젝트는 본 절 전체를 무시.

**상태 모델**
- `source`: `direct`(직접 가입, `password_hash` 보유 → 로컬 로그인) · `office`(연동, `password_hash=null` → SSO/푸시로만 진입). 현재 전이 없음(생성 시 고정). `upsertByOffice`는 신규 생성 시에만 `office`로 박힘.
- `status`: `active`(정상) · `suspended`(로컬 로그인 시 403). ⚠️ **SSO·오피스 upsert는 현재 `status`를 검사하지 않음** → 정지 회원도 SSO 진입 가능(구멍, (f)·한계).
- 세션: `없음 → setSession(memberId) → mng_session 쿠키(7일) → getSessionMemberId() → memberId`. 만료/위조 → null(게스트). `clearAuthSession()`로 삭제.

**정책 결정 사항(권고안 포함)**
- **(a) 식별 매칭 키** — 현재 `office_id` 단일 키 upsert. direct↔office 동일인은 중복 계정(병합 없음). 권고: `office_id`(불변 PK) 유지, 이메일/휴대폰이 기존 direct와 일치하면 **자동 병합하지 말고 운영자 확인 큐로 보류**.
- **(b) SSO 토큰 서명·만료·재생 방지** — 현재 `payloadB64url.sigB64url`(HMAC-SHA256), `exp`만 검사·**nonce/jti 없음 → replay 가능**. 권고: 만료 단명(60~120초) + **일회용 `jti`를 D1/KV 단기 캐시로 차단**, 장기적으로 JWT(`exp`+`jti`)/OIDC로 승격.
- **(c) 공유 시크릿 운영/로테이션** — `OFFICE_SHARED_SECRET` 단일값(미설정 시 dev 폴백). 권고: 프로덕션은 환경변수 주입·dev 폴백 금지를 배포 체크리스트에 명문화, **`kid` 헤더 + 구·신 시크릿 동시 허용 윈도우**로 무중단 로테이션.
- **(d) 연동 회원 비밀번호 미설정** — `source='office'`는 `password_hash=null`, 로컬 로그인은 불일치와 동일 메시지로 거절(존재 비노출). 권고: 현행 유지(연동 회원은 SSO 전용), 안내 문구 유지.
- **(e) 연동 회원의 로컬 로그인 병용 허용** — 현재 불가(비번 설정 UI/엔드포인트 없음). 권고: **MVP 불가 유지**. 요구 발생 시 별도 "비밀번호 설정" 플로우로 `password_hash`만 추가(`source`는 `office` 유지).
- **(f) 탈퇴/정지 동기화** — 상위 시스템 탈퇴/정지가 전파 안 됨. 권고: upsert 페이로드에 `status`/`active`를 받아 반영하고 **SSO·upsert에 `status==='active'` 게이트 추가**, 상위 삭제는 소프트 delete(`suspended`)로 매핑.
- **(g) 기타** — 세션 TTL 7일·SameSite=lax(권고: 내부 도구라 유지, 단 (b) 선결) · `/members` 전체 공개(로그인 회원이 전 참여자 연락처 열람; 권고: 내부 명부라 현행 유지, 외부 게스트 도입 시 재검토).

**현재 구현 상태**
| 영역 | 상태 |
| --- | --- |
| 직접 회원가입(중복확인·개인정보 동의·검증·완료 화면) + 자동 로그인 | ✅ |
| 로그인 / 로그아웃 / me / 세션(HMAC·7일·SSR 하이드레이션·미들웨어 보호) | ✅ |
| 내 정보(`/account`) 프로필 수정 + 비밀번호 변경(연동 회원 차단) | ✅ |
| `/members` 목록(구분 배지, 읽기 전용) | ✅ |
| 오피스 서버 간 upsert / SSO 핸드오프 | ✅ (시크릿·토큰 포맷 임시) |
| 회원 편집·삭제·역할 관리 UI | ❌ 없음 |
| SSO replay 차단(jti) · status 동기화 · 시크릿 로테이션 | ❌ (a·b·c·f 미정) |

→ **프로덕션 배포 완료**(2026-06-12, <https://malgn-noti-mng.pages.dev>): signup/login/me/account/members 모두 HTTP 200, `member` 테이블 원격 D1 적용, `NUXT_SESSION_SECRET`·`OFFICE_SHARED_SECRET` production secret 설정.

**알려진 한계·후속**
- 개인정보 처리방침 문안 미확정(`/signup` 동의 박스 본문 플레이스홀더) → 기획/법무.
- 본인인증(OTP) 미구현(형식 검증만) — SMS/이메일 발송 인프라 선결 → 후속.
- SSO replay 가능(jti 없음)·status 게이트 누락 → 개발자.
- dev 시크릿 폴백 — 프로덕션 환경변수 주입 체크리스트 명문화 → 운영/DBA.
- direct↔office 중복 인물 병합 부재 → 기획 확정 후 개발자.
- 상위 시스템 실제 스펙 미확정(토큰 서명·필드 매핑·식별자) — 합의 후 `auth.ts`/`upsert.post.ts` 조정.
- QA: 가입/로그인 검증 경계(아이디 패턴·중복 409·비번 8자·정지 403), 연동 회원 로컬 로그인 거절 메시지 동일성, SSO `redirect` 오픈 리다이렉트 차단 회귀.

### 7.2 이슈 게시판 — 정책 결정 사항 (권고안 포함)

> 각 미정 항목 끝에 **기획 권고안**을 1줄로 둔다. MVP는 단순하게, 확장은 후속.

- **(a) `type` 분류 enum** — 권고: **`policy|issue|notice|discussion`(정책·이슈·공지·논의) 4종 고정**. 한글 라벨은 화면에서 매핑(`policy=정책`·`issue=이슈`·`notice=공지`·`discussion=논의`). 소수 고정으로 필터 단순화, 추가는 코드 enum 확장으로.
- **(b) `status` enum** — 권고: **공통 단일 enum `open|in_progress|resolved|hold`** 채택(이슈 중심). 정책/공지는 상태 의미가 약하므로 작성 시 기본 `open`으로 두고 실질 사용은 이슈에 집중(별도 enum 분기보다 단순·일관). 한글 라벨: `open=열림`·`in_progress=진행중`·`resolved=해결`·`hold=보류`. *(대안: 정책/공지는 `active|archived`로 분기 — 화면·쿼리 복잡도 증가로 비권장.)*
- **(c) 수정/삭제 권한** — 권고: **작성자 본인만**(`issue.authorId === session.memberId`). 관리자(admin) 역할은 회원 시스템에 아직 없으므로(§5.6 `role`은 자유 텍스트) **후속**으로 admin OR 조건 추가. 그전까지는 작성자 전용.
- **(d) 댓글** — 권고: **MVP 제외**. 후속으로 별도 `comment` 테이블(`id·issueId·authorId·authorName·body·createdAt`) + `GET/POST /api/issues/:id/comments` 신설. 본 설계에서는 스키마/엔드포인트만 예고하고 구현 안 함.
- **(e) 본문 렌더** — 권고: **마크다운**. 본문 가독성·정책 문서 표현력 우선. 렌더는 기존 prose 스타일 재사용(경량 마크다운 렌더). XSS 방지 위해 렌더 시 sanitize 적용(개발자 확인 항목). *(대안: 평문 — 안전하나 표현력 부족, 비권장.)*
- **(f) 기타(권고)** — `priority`는 **선택 컬럼**(null 허용, `low|normal|high`)으로 두되 MVP UI에서는 입력만 받고 정렬 가중치는 후속. 목록 페이지네이션은 `page` 쿼리(20행/페이지 권장). 회원 삭제 시 이슈는 **`authorName` 스냅샷으로 표기 유지**(고아 레코드 허용, 하드 삭제 안 함).

**상태 전이(이슈)**
```
open ──(착수)──▶ in_progress ──(완료)──▶ resolved
  │                  │                      │
  └──(보류)──▶ hold ◀┘            (재오픈)──┘ → open
```
- 전이는 작성자(또는 후속 admin)가 상세 화면 상태 셀렉트로 자유 변경(엄격 게이트 없음 — 협업 도구 특성). resolved/hold에서 open으로 재오픈 허용.

**알려진 한계·후속**
- admin 역할 부재 → 작성자 외 수정/삭제 불가(운영자 강제 정리 불가). 회원 `role`/admin 플래그 도입 후 보완 → 기획+개발자.
- 댓글·첨부·멘션·알림 없음(MVP 범위 밖) → 후속.
- 마크다운 sanitize·이미지 업로드 정책 미정 → 개발자(보안).
- 전문 검색은 제목 LIKE만(본문 검색·인덱싱 없음) → 규모 커지면 후속.
- QA: 비작성자 PATCH/DELETE 403, 비로그인 전 경로 401/리다이렉트, type/status enum 위반 400, 목록 필터·검색 조합.

---

## 8. 디자인 가이드 (토큰)

두 개의 토큰 세트를 쓴다. **둘 다 전역 CSS**로 둔다(§9 주의).

### 8.1 앱 전반 — `app/assets/css/main.css` (Relay-inspired 저밀도 라이트)
- 무채색 ink 11단(`--ink-900`…`--ink-50`, `--paper`, `--line`) + 단일 그린 액센트(`--accent #00DC82`, `--accent-ink`).
- 폰트: Inter(UI) + JetBrains Mono(숫자/ID) + Pretendard(한국어). `@import "tailwindcss"; @import "@nuxt/ui";` + `@theme`로 토큰 노출.
- `app.config.ts`: `ui.colors.primary/neutral = 'zinc'`.
- 1px hairline, radius 카드 12px, 저밀도.

### 8.2 간트 전용 — 데이터 대시보드 토큰 (컴포넌트 스코프, 라이트)
```
--bg #f4f6f8 · --surface #fff · --surface-2 #f8fafc · --band #eef1f5 · --band-2 #e7ebf0
--line #e3e8ee · --line-2 #eef1f5 · --ink #1b2330 · --ink-2 #5a6675 · --ink-3 #8a93a3 · --accent #2563eb
상태: 완료 #16a34a/#d7f0de · 진행중 #2563eb/#d6e4fd · 예정 #94a3b8/#e6eaf0 · 지연 #e0524d/#fadcd9
주말 #f3f5f8 · 오늘 #f59e0b
레이아웃: --col-name 300 · --col-who 84 · --col-s/e 50 · --col-done 56 · --col-prog 86
--day-w 26 · --row-h 30 · --grp-h 34 · --step-h 38
담당자 아바타 색: 사람별 고정 색 맵(예: #2563eb/#7c3aed/#0d9488/#d97706/#db2777, 미정 #94a3b8)
```
- 막대 = 트랙(연한 상태색) + 채움(진한 상태색, width=progress%). 1일짜리는 다이아몬드. 그룹/Step은 롤업 막대.
- 고정 좌측 정보 패널(`position:sticky; left:0`) + 고정 헤더(`top:0`), 좌상단 코너는 left+top 동시 고정. z-index: 코너>헤더>좌측열>본문.

---

## 9. 환경·구현 주의사항 (실전 함정)

1. **prose 스타일은 전역 CSS로** — 컴포넌트 scoped로 두면 별도 CSS 청크로 분리돼 프리렌더된 문서 페이지가 그 청크를 링크하지 않아 **스타일이 안 먹는다**. `app/assets/css/prose.css`를 `nuxt.config`의 `css`에 등록.
2. **프리렌더 크롤 끄기** — `nitro.prerender.crawlLinks: false` + `routes`를 직접 열거. 마크다운 내부 상대 링크를 크롤하면 404·대문자 디렉터리(케이스 민감 Cloudflare에서 404)를 만든다. 라우트는 `docs/` 트리를 재귀 순회해 **소문자**로 생성.
3. **better-sqlite3 네이티브 빌드** — `pnpm.onlyBuiltDependencies`에 등록해야 비대화형 설치에서 빌드된다. `@nuxt/content`가 SQLite 어댑터로 사용.
4. **@nuxt/content + Cloudflare** — 문서 페이지를 전부 프리렌더하면 런타임 콘텐츠 DB가 필요 없다(런타임 콘텐츠 쿼리를 하지 않도록 유지).
5. **D1 진위 확인** — 배포 후 D1 값 1건을 바꿔 응답에 반영되는지로 "폴백이 아닌 실제 D1" 확인.
6. **로컬 dev 소켓 이슈(특정 샌드박스 한정)** — macOS 기본 `$TMPDIR`가 길어 Nuxt vite-node Unix 소켓이 104자 제한 초과 시 `TMPDIR=/tmp/x pnpm dev`로 우회(일반 환경은 불필요).
7. **진척 집계 일관성** — 현황판/대시보드/WBS의 "전체 진척"은 동일 산식(가중평균) 사용. 화면을 잘게 쪼갠 WBS의 단순 평균과 단계 가중평균은 크게 달라질 수 있음.
8. **날짜 ISO 통일(중요)** — `wbs_item`·`task`의 `start`/`end`/날짜는 전부 `YYYY-MM-DD`. 외부(보드 `M/D` 등)에서 이식할 때 반드시 ISO로 변환. 비ISO가 1건이라도 섞이면 문자열 max 비교가 깨져(예: `"5/12" > "2026-07-03"`) 타임라인 전체가 망가진다.
9. **D1 단계 id 재명명/번호 변경** — `task→stage` FK 때문에 stage `id`를 바꿀 땐 SQL 첫 줄에 `PRAGMA defer_foreign_keys=true;`를 두고 같은 파일에서 stage + task를 함께 UPDATE(커밋 시점에 일관). 단계 삭제/번호변경은 **D1(`stage`·`wbs_item`) + 코드(`wbsSteps`·`wbsStageMeta`)** 를 동시 갱신.
10. **인라인 코드 줄바꿈** — prose의 `:not(pre) > code`는 `white-space: normal; overflow-wrap: anywhere`로(=`nowrap`이면 긴 명령/URL이 본문 폭을 넘어 가로 오버플로). `pre`는 `overflow-x: auto; max-width: 100%`.
11. **풀스크린 페이지 스크롤** — 페이지를 풀스크린(`height` 고정 + 내부 스크롤)으로 만들면 상단 바가 항상 남는다. "상단 바는 사라지고 헤더만 고정"을 원하면 자연 흐름 + `position:sticky; top:0; height:100vh` 패널 패턴을 쓰고, 해당 페이지에서 GNB를 `position:static`으로(레이아웃에서 라우트 조건부) 둔다.

---

## 10. 셋업 절차 (Claude Code 실행 순서)

```bash
# 0) Nuxt 앱 생성 후 의존성(§2) 설치, pnpm.onlyBuiltDependencies 설정
# 1) D1 생성
wrangler d1 create {D1_NAME}     # → database_id 확보 → wrangler.toml 작성
# 2) 설정 파일: nuxt.config.ts(cloudflare-pages 프리셋 + prerender routes),
#    content.config.ts(docs/ 매핑), app.config.ts, wrangler.toml(D1 바인딩 DB),
#    main.css / prose.css 등록
# 3) 스키마 작성(server/db/schema.ts) → 마이그레이션 생성·적용
pnpm db:generate
wrangler d1 migrations apply {D1_NAME} --remote
# 4) 시드 작성(server/db/seed.sql) → 적용
pnpm db:seed
# 5) server/utils/db.ts, server/api/*, app/* (레이아웃·페이지·컴포넌트·컴포저블) 구현
# 6) 빌드·배포(§11)
```
`wrangler.toml`:
```toml
name = "{APP}"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "{D1_NAME}"
database_id = "{D1_ID}"
migrations_dir = "server/db/migrations"
```
`nuxt.config.ts` 핵심:
```ts
export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  modules: ['@nuxt/ui', '@nuxt/content', '@nuxt/eslint', '@pinia/nuxt'],
  css: ['~/assets/css/main.css', '~/assets/css/prose.css'],
  nitro: { preset: 'cloudflare-pages',
    prerender: { crawlLinks: false, failOnError: false, routes: prerenderRoutes } }, // '/docs','/history',+doc 트리
  // '/', '/board', '/wbs' 는 프리렌더 제외(SSR)
})
```
`content.config.ts`:
```ts
export default defineContentConfig({ collections: {
  docs: defineCollection({ type: 'page', source: { cwd: '<doc 절대경로>', include: '**/*.md' } }),
} })
```

---

## 11. 배포 (Cloudflare Pages + D1)

```bash
pnpm build                                  # nitro cloudflare-pages → dist/ (_worker.js + 프리렌더)
wrangler pages project create {APP} --production-branch=main   # 최초 1회
wrangler pages deploy dist --project-name={APP} --branch=main \
  --commit-dirty=true --commit-message "<ascii>"
```
- 인증: wrangler OAuth. `--commit-message`는 ASCII로 명시(한글 커밋이면 wrangler가 UTF-8 에러).
- D1 바인딩은 `wrangler.toml`의 `[[d1_databases]]`로 Pages 배포에 자동 연결.
- 배포 후 검증: 라우트 200 + `/api/*` 응답이 D1 기준인지 + 프리렌더 문서 렌더.

---

## 12. 운영 컨벤션 (선택)

- **작업 이력**: `docs/history/history.yyyyMMdd.md` — 하루 한 파일, ① 한 줄 요약 → ② 번호 섹션 → ③ 산출물 → ④ 다음 단계. `docs/history/README.md` 인덱스 갱신.
- **Git**: 단일 `main`, 커밋·푸시는 요청 시. 무관 파일은 끌어들이지 않기.
- **문서 정본 동기화**: 코드/구조가 바뀌면 관련 `docs/*.md` 현행화.
- **CLAUDE.md**: 레포 루트에 프로젝트 목적·스택·구조·컨벤션 요약(이 블루프린트와 별개).

---

## 13. 새 프로젝트로 가져갈 때 — 치환 체크리스트

이식 시 **내용만** 바꾸면 됨(구조·코드·디자인은 재사용):

- [ ] `{APP}`·`{D1_NAME}`·`{D1_ID}`·`{REPO}` 치환 (`wrangler.toml`, `package.json` db 스크립트, GNB GitHub 링크)
- [ ] 로고/브랜드(`AppLogoMark.vue`, `default.vue` 브랜드 텍스트), 앱 타이틀(`nuxt.config` head)
- [ ] 대시보드 목표·기획 방향·바로가기 링크 배열
- [ ] 단계 정의(`board_meta`/`stage` 시드 + `wbsData.ts`의 단계명·가중치 메타)
- [ ] WBS 초기 작업(`wbs_item` 시드) — 또는 빈 상태로 시작해 화면에서 CRUD
- [ ] 담당자 목록·아바타 색 맵(`/wbs` 페이지 상수)
- [ ] `docs/` 문서 트리(이 프로젝트의 문서로 교체)
- [ ] 디자인 액센트색(필요 시 `main.css`/간트 토큰)
- [ ] **회원 시스템(선택)**: 쓸지 결정 — 쓰면 `member` 스키마·`/api/auth|account|members|integration`·`/login|/signup|/account|/members`·세션 시크릿(`NUXT_SESSION_SECRET`)을 이식하고 상위 시스템 연동(`office_id`/`source`/`OFFICE_SHARED_SECRET`)을 자체 발급자로 치환(불필요하면 office 경로 제거). 안 쓰면 §5.6·§6 `member`·§7 회원 API·§7.1을 통째로 생략.
- [ ] **이슈 게시판(선택)**: 정책·이슈 게시판이 필요하면 `issue` 스키마·`/api/issues` CRUD·`/issues*` 화면을 이식(회원 시스템 의존 — 로그인 게이트·작성자). `type`/`status` enum과 본문 마크다운 여부는 §7.2 권고 따름. 불필요하면 §5.7·§6 `issue`·§7 이슈 API·§7.2 생략 + GNB nav에서 이슈 제거.

> 구조·아키텍처·스키마·API·디자인 토큰·셋업/배포 절차는 그대로 두고, 위 목록의 **데이터·문구·브랜드**만 교체하면 새 프로젝트 관리 앱이 된다.
