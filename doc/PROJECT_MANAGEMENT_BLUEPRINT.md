# 프로젝트 관리 앱 블루프린트 (재사용 가이드)

> 이 문서는 `malgn-noti-mng`로 구현한 **프로젝트 관리 허브 앱**의 일반화된 설계도다.
> 특정 프로젝트의 데이터·문구·도메인 내용은 제외하고, **다른 프로젝트에 그대로 이식·구현**할 수 있는
> 아키텍처 · 메뉴 · 화면 · 스키마 · 디자인 토큰 · 셋업/배포 절차만 담는다.
> Claude Code가 이 문서만 보고 새 프로젝트용 관리 앱을 처음부터 구축할 수 있도록 작성했다.
>
> **치환 토큰**: `{APP}`=앱/Pages 프로젝트명(예: `myproj-mng`) · `{PROJECT}`=대상 프로젝트 표시명 ·
> `{D1_NAME}`=D1 DB명 · `{D1_ID}`=D1 database_id · `{REPO}`=GitHub 레포 URL.
>
> **마지막 갱신**: 2026-06-09 (WBS CRUD·전체화면 스크롤·실시간 기준일·날짜 ISO 함정 반영).

---

## 1. 이 앱은 무엇인가 (목적)

하나의 프로젝트를 운영·조망하는 **단일 관리 허브**. 5개 영역으로 구성:

| 영역 | 경로 | 한 줄 정의 |
| --- | --- | --- |
| 대시보드 | `/` | 프로젝트 개요(목표·방향) + 진척 요약 + 바로가기 |
| 현황판 | `/board` | 단계/작업 진척을 시각 카드·행으로 보는 상태 보드 |
| WBS(간트) | `/wbs` | 일 단위 간트 차트 + 작업 **등록/수정/삭제**(CRUD) |
| 문서 | `/docs` | `doc/` 마크다운 트리 뷰어 |
| 작업 이력 | `/history` | 일자별 작업 이력 타임라인 |

**데이터 정본 2종**: ① 구조화 데이터(진척·작업·단계)는 **Cloudflare D1**, ② 문서/이력은 **`doc/` 마크다운**(@nuxt/content).
자체 완결형 — 외부 API 의존 없음(원하면 외부 API도 붙일 수 있으나 기본은 자급).

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
    useDocs.ts                # doc/ 콘텐츠 조회 + history 판별·날짜 포맷
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
content.config.ts             # @nuxt/content: 소스를 doc/ 로 매핑
nuxt.config.ts                # 프리렌더 라우트 열거 + cloudflare-pages 프리셋
wrangler.toml                 # D1 바인딩 + migrations_dir
doc/                          # 마크다운 문서 + history/
```

---

## 4. 메뉴 구성도 (IA)

상단 GNB(고정 56px): `[로고]` + 네비 + (우측) GitHub 링크.
```
[로고 {PROJECT}]   대시보드 · 현황판 · WBS · 문서 · 작업 이력            GitHub↗
```
- `default.vue`의 `nav` 배열로 정의: `{ to, label, icon }`.
  - 대시보드 `/` `i-lucide-layout-dashboard`
  - 현황판 `/board` `i-lucide-gauge`
  - WBS `/wbs` `i-lucide-gantt-chart`
  - 문서 `/docs` `i-lucide-book-text`
  - 작업 이력 `/history` `i-lucide-history`
- 푸터: 한 줄 카피라이트/설명.

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
- `doc/history/history.yyyyMMdd.md`를 타임라인으로. 파일명에서 날짜 파싱.

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
```
- 마이그레이션은 `pnpm db:generate`(drizzle-kit) → `server/db/migrations/`.
- 신규 D1엔 `wrangler d1 migrations apply {D1_NAME} --remote`로 적용. (기존 테이블이 있으면 충돌하므로, 처음 구축 시 migrations apply 사용 권장.)
- **날짜는 ISO(`YYYY-MM-DD`)로만 저장** — 간트 타임라인 범위는 날짜 문자열 min/max로 계산하므로 `5/12` 같은 비ISO가 섞이면 범위가 깨져 막대·오늘선이 사라진다(§9-8).
- **CRUD 패턴**: `wbs_item`처럼 `id` autoincrement + `sort`(표시 순서). 등록은 `sort = max(id)+1`로 말미 추가. 컬럼 `grp`↔화면 키 `group`은 API 레이어에서 매핑.

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
2. **프리렌더 크롤 끄기** — `nitro.prerender.crawlLinks: false` + `routes`를 직접 열거. 마크다운 내부 상대 링크를 크롤하면 404·대문자 디렉터리(케이스 민감 Cloudflare에서 404)를 만든다. 라우트는 `doc/` 트리를 재귀 순회해 **소문자**로 생성.
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
#    content.config.ts(doc/ 매핑), app.config.ts, wrangler.toml(D1 바인딩 DB),
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

- **작업 이력**: `doc/history/history.yyyyMMdd.md` — 하루 한 파일, ① 한 줄 요약 → ② 번호 섹션 → ③ 산출물 → ④ 다음 단계. `doc/history/README.md` 인덱스 갱신.
- **Git**: 단일 `main`, 커밋·푸시는 요청 시. 무관 파일은 끌어들이지 않기.
- **문서 정본 동기화**: 코드/구조가 바뀌면 관련 `doc/*.md` 현행화.
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
- [ ] `doc/` 문서 트리(이 프로젝트의 문서로 교체)
- [ ] 디자인 액센트색(필요 시 `main.css`/간트 토큰)

> 구조·아키텍처·스키마·API·디자인 토큰·셋업/배포 절차는 그대로 두고, 위 목록의 **데이터·문구·브랜드**만 교체하면 새 프로젝트 관리 앱이 된다.
