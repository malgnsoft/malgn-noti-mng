# 디자인 가이드 — 맑은 메시징 (사용자단)

> **정본(SoT)**: `design_handoff_malgn_noti` 핸드오프 — Relay-inspired Design System **v1.0**.
> **"Less chrome, more clarity."** — Linear · Vercel · Nuxt UI 영감의 저밀도 라이트 모드. 색은 의미가 있을 때만, 라인은 1px, 숫자는 모노스페이스.
>
> 코딩 컨벤션 → [FRONTEND.md](./FRONTEND.md) · 기술 스택 → [STACK.md](./STACK.md)
>
> ⚠️ 2026-05-18: 기존 malgn-notifications 시안 기반 디자인(indigo/sky/Noto Sans KR)에서 **이 핸드오프 디자인으로 전면 피벗**. 시안은 IA(페이지 목록/라우트)에 한해 참조하되, 디자인 언어의 정본은 이 문서다.

---

## 0. 적용 현황

| 레이어 | 상태 | 위치 |
| --- | --- | --- |
| 디자인 토큰 (`:root` + `@theme`) | ✅ 적용 | [app/assets/css/main.css](../app/assets/css/main.css) |
| 컴포넌트 CSS (`.card`/`.btn`/`.table`…) | ✅ 적용 | [app/assets/css/main.css](../app/assets/css/main.css) |
| Nuxt UI 색상 매핑 (`zinc`/`zinc`) | ✅ 적용 | [app/app.config.ts](../app/app.config.ts) |
| 폰트 (Inter/JetBrains Mono/Pretendard) | ✅ 적용 | [nuxt.config.ts](../nuxt.config.ts) |
| 셸 (AppGnb/AppFooter/layouts) | ✅ Phase 2a 적용 | [components/AppGnb.vue](../app/components/AppGnb.vue) · [AppFooter.vue](../app/components/AppFooter.vue) · [layouts/](../app/layouts/) |
| 홈 대시보드 (레퍼런스) | ✅ Phase 2a 적용 | [pages/home.vue](../app/pages/home.vue) |
| 디자인 가이드 페이지 (라이브 카탈로그) | ✅ 적용 | [pages/guide.vue](../app/pages/guide.vue) — `/guide`, 18섹션 sticky nav |
| 발송 공용 컴포넌트군 + SMS 발송 (레퍼런스) | ✅ Phase 2b-1 적용 | [pages/send/sms.vue](../app/pages/send/sms.vue), `AppModal`/`AppSendFormCard`/`AppRecipientCard`/`AppSmsTemplateDialog` 등 |
| 알림톡·RCS·이메일·PUSH·Flow 발송 + 채널 프리뷰 | ✅ Phase 2b-2 적용 | [app/pages/send/](../app/pages/send/), `AppKakaoPreview`/`AppRcsPreview`/`AppEmailPreview`/`AppPushPreview`/`AppSegmented`/`AppKakaoTemplateDialog`/`AppTemplateVariableTextarea` |
| 발송조회(5채널)·통계·주소록·충전·로그인·회원가입 | ✅ Phase 2b-3 적용 | [pages/history/](../app/pages/history/)·[contacts/list](../app/pages/contacts/list.vue)·[charge/](../app/pages/charge/)·[login/](../app/pages/login/)·[signup](../app/pages/signup.vue), `AppHistoryView` |
| 발송 6채널 UX 2차 폴리시 — 3-카드 재배치·채널 템플릿/부가 다이얼로그·플로우 관리 | ✅ 적용 (2026-05-20) | [app/pages/send/](../app/pages/send/), `AppPush*Dialog`·`AppFlow*Dialog`·`AppEmailPreview` 등 |
| 발신정보·메시지관리·캠페인·계정/문의 등 잔여 | ⏳ 핸드오프 시안 없음 — 별도 협의 | [app/pages/](../app/pages/) |

> Phase 1(토큰·폰트·문서)·Phase 2(셸·홈·발송 6채널·조회/통계/주소록/충전/인증)는 모두 적용 완료. 모든 `App*` 컴포넌트가 ink/accent 신규 팔레트와 `.card`/`.btn`/`.table` 클래스를 직접 사용한다(구 `--gray-*` 별칭 의존 없음).

---

## 1. 디자인 원칙 (7)

| # | 원칙 | 의미 |
|---|---|---|
| 1 | **Calm by default** | 채도 높은 색은 상태(error/success)에만. 평상시 화면은 무채색. |
| 2 | **Information first, decoration last** | 카드 그라데이션·아이콘 장식 금지. 데이터에 시선이 먼저. |
| 3 | **Single accent, used sparingly** | `#00DC82` 한 가지 액센트. 페이지당 4–6회 이내. |
| 4 | **Typographic hierarchy over boxes** | 박스를 여러 겹 쌓기보다 폰트로 위계. |
| 5 | **Tabular numbers everywhere** | 모든 수치는 JetBrains Mono + `tabular-nums`. |
| 6 | **Hairline borders > shadows** | `1px solid #ececec`가 기본. 그림자는 floating UI에만. |
| 7 | **AI is a quiet partner** | AI 요소는 ✨ + 그린 한 가지로만. 보라색·무지개 절대 금지. |

### Do / Don't

**✅ Do** — 1px hairline으로 카드 분리 · 숫자는 모노+`tabular-nums` · 액센트는 의미 있는 한 곳에만(AI/Live/+delta/Primary CTA) · AI 표식엔 항상 `Sparkles`+그린 · 빈 공간을 두려워하지 않기 · 텍스트 톤 한 화면 3단계만(Primary/Secondary/Muted).

**❌ Don't** — 카드에 drop shadow · 컬러풀(다색) 아이콘 · 보라/무지개 AI · 12px 미만 본문 · `ink-300` 본문 텍스트(축 라벨 한정) · 화면당 액센트 6회 초과 · 컨테이너 radius 12px 이상 · 단순 강조 텍스트에 액센트 · 헤더 등 큰 영역에 액센트 채움.

---

## 2. 컬러 시스템

토큰 정본 = [main.css](../app/assets/css/main.css) `:root`. 색은 **항상 CSS 변수**로. `bg-[#xxxxxx]` 임의값 금지.

### 2.1 Ink Scale (무채색 11단 ≈ Tailwind `zinc`)

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--ink-900` | `#0a0a0a` | Primary 텍스트, Primary 버튼 BG |
| `--ink-800` | `#18181b` | Hover(primary), 강조 텍스트 |
| `--ink-700` | `#27272a` | 라이트 표면 본문 |
| `--ink-600` | `#3f3f46` | 보조 텍스트 |
| `--ink-500` | `#52525b` | 3차 텍스트, 라벨 |
| `--ink-400` | `#71717a` | muted, placeholder, 아이콘 기본 |
| `--ink-300` | `#a1a1aa` | disabled 텍스트, 축 라벨 |
| `--ink-200` | `#d4d4d8` | disabled BG, hover border |
| `--ink-100` | `#e4e4e7` | progress track, 옅은 divider |
| `--ink-50` | `#f4f4f5` | subtle BG (segmented/hover) |
| `--paper` | `#fafaf9` | 앱 배경 |
| `--line` | `#ececec` | **hairline border (1px)** |
| `--white` | `#ffffff` | 표면 (카드·탑바·입력) |

### 2.2 Single Accent — Green

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--accent` | `#00DC82` | AI 표식 · Live · +delta · Primary CTA |
| `--accent-soft` | `#e6fbf2` | pill/배경 |
| `--accent-ink` | `#007a48` | 라이트 위 액센트 텍스트(대비 보강) |

`@theme`에 `--color-accent`로도 노출되어 `bg-accent`/`text-accent` 유틸 사용 가능.

> **액센트 사용**: ✅ AI UI · open/online/live 상태 · 긍정 변동률 · Primary CTA(페이지당 ≤1). ❌ 단순 강조 텍스트 색 · 큰 영역 채움(헤더 배경 등).

### 2.3 Semantic / Status (`*-soft BG + *-line border + *-ink text`)

| Status | soft | line | ink |
| --- | --- | --- | --- |
| Success | `#e6fbf2` | `rgba(0,220,130,.3)` | `#007a48` |
| Warning | `#fffbeb` | `#fde68a` | `#b45309` |
| Danger | `#fff1f2` | `#fecdd3` | `#be123c` |
| Info | `#eff6ff` | `#bfdbfe` | `#1d4ed8` |
| Neutral | `#f4f4f5` | `#e4e4e7` | `#3f3f46` |

### 2.4 Channel Colors (점 표시 전용)

SMS `#3b82f6` · Kakao `#fbbf24` · RCS `#8b5cf6` · Email `#f59e0b` · Push `#00DC82` · Flow `#0a0a0a`. 채널은 **도트로만** 구분, 큰 색 채움 금지.

---

## 3. 타이포그래피

```
--font-sans:  "Inter", "Pretendard Variable", "Pretendard", -apple-system, "Noto Sans KR", sans-serif;
--font-mono:  "JetBrains Mono", ui-monospace, monospace;
--font-serif: "Instrument Serif", Georgia, serif;
--font-base:  13px;
```

- **Inter** — 모든 UI 텍스트. `font-feature-settings: "cv11","ss01","ss03"`.
- **JetBrains Mono** — 모든 숫자·ID·kbd. `tabular-nums` 필수.
- **Pretendard** — 한국어 fallback (Inter 다음).
- **Instrument Serif** — 대형 디스플레이 한정 (어드민에서 거의 미사용).

### Type Scale

| Role | Size / LH | Weight | Tracking |
| --- | --- | --- | --- |
| Display (page H1) | 22 / 28 | 600 | -0.01em |
| Section H3 / 카드 타이틀 | 13 / 20 | 600 | -0.005em |
| Body | 13 / 20 | 400 | 0 |
| Body large (AI 헤드라인) | 15 / 24 | 400 | 0 |
| Label / Caption | 12 / 16 | 400 | 0 |
| Micro (eyebrow) | 10–11 / 14 | 600 | 0.06em, UPPERCASE, mono |
| KPI Number | 28 / 28 | 500 (mono) | -0.02em |
| Inline mono (ID/%/kbd) | 11–12 | 500 (mono) | 0 |

**Color × Type**: Heading→`ink-900` · Body→`ink-700/800` · Secondary→`ink-400~500` · Muted→`ink-300~400`. **한 화면 3단계 톤 초과 금지.**

---

## 4. 간격 · 라운드 · 그림자

### 4.1 Spacing (Tailwind 4px base)

`1=4 · 1.5=6 · 2=8 · 2.5=10 · 3=12 · 4=16 · 5=20 · 6=24 · 8=32` (px). 카드 패딩 16~20, 카드 간 24, Shell 패딩 32.

### 4.2 Radius

| 요소 | radius |
| --- | --- |
| Pill / Badge / Button / Input | `--r-md` 6px |
| Card / Section / Modal | `--r-lg` 8px |
| kbd / 작은 요소 | `--r-sm` 4px |
| Avatar | `--r-full` 9999px |

### 4.3 Elevation — **카드에 그림자 금지**

```
--shadow-soft:    0 1px 2px rgba(0,0,0,.04)    /* tooltip, segmented thumb */
--shadow-popover: 0 4px 12px rgba(0,0,0,.08)   /* dropdown, popover, toast */
--shadow-modal:   0 12px 32px rgba(0,0,0,.12)  /* modal */
```

카드·섹션은 항상 `1px solid var(--line)` hairline으로 분리. 그림자는 floating UI 전용.

---

## 5. 레이아웃

### 5.1 App Shell

```
┌────────────────────────────────────────────────────┐
│ Topbar (56px, sticky, bg-white/80 backdrop-blur, ─b)│
├────────────────────────────────────────────────────┤
│ Content  (max-w 1400px · px-32 · py-32)            │
└────────────────────────────────────────────────────┘
```

- Topbar: 56px, sticky, `rgba(255,255,255,.8)` + `backdrop-blur(8px)`, 하단 1px line. **단일 행** GNB(유틸바 없음, 시안의 2단 GNB 폐기).
- Content: max 1400px, 좌우 32px, 상하 32px.
- 모바일(<1024px): GNB 메뉴 숨김 → 햄버거 + 좌측 Drawer(280px).

### 5.2 2-Column (`.content-2col`)

`minmax(0,1fr) / 320px`, gap 24px. <1024px에서 1단 (aside가 위로).

### 5.3 Density (Spacious — Linear/Vercel)

테이블 row ~52px(`py-3`) · Nav item 32px · Button 28/32/36 (sm/md/lg) · Input 36px(`h-9`).

### 5.4 페이지 레이아웃 타입 (A · B · C)

화면의 골격(헤더 · 내비게이션 · 콘텐츠 구성)을 **3가지 페이지 레이아웃 타입**으로 정의한다. 새 화면은 셋 중 하나를 따른다. (§6.5의 "테이블 스타일 A/B/C"와는 **별개 축** — 이쪽은 페이지 전체 골격, 그쪽은 목록 테이블 패턴.)

#### A 페이지 — 표준 페이지

전체 GNB + `.page-header`(크럼 + `<h1>` + 선택 설명) + **단일 콘텐츠 열**. 앱 화면 대부분이 이 타입. `default` 레이아웃.

```
┌────────────────────────────────────┐
│ GNB (전체 메뉴 · 문의 · 충전 · 계정)│
├────────────────────────────────────┤
│ crumb / h1 / desc                  │
│ ┌────────────────────────────────┐ │
│ │ 콘텐츠 (단일 열)               │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

- 콘텐츠: `.app-container .page-body` 단일 열.
- 레퍼런스: 발송 · 조회 · 메시지 관리 · 사이트맵 등 대부분.

#### B 페이지 — 좌측 메뉴 페이지 (LNB)

전체 GNB + **2단 구성**(좌측 sticky 서브메뉴 + 우측 콘텐츠 패널). 하위 항목이 여러 개인 페이지 그룹에 쓴다. `default` 레이아웃 + 공용 셸 컴포넌트.

```
┌────────────────────────────────────┐
│ GNB (전체 메뉴 · 문의 · 충전 · 계정)│
├────────────────────────────────────┤
│ crumb / h1 (그룹명)                │
│ ┌────────┬───────────────────────┐ │
│ │ 서브   │ 콘텐츠 패널           │ │
│ │ 메뉴   │ (흰 카드 · 1px 보더)  │ │
│ │(220px) │                       │ │
│ └────────┴───────────────────────┘ │
└────────────────────────────────────┘
```

- 좌측: sticky 서브메뉴(220px), 각 항목은 **독립 라우트**.
- 레퍼런스: 나의 페이지 ([AppMyPageShell.vue](../app/components/AppMyPageShell.vue) — `/account/*`).

#### C 페이지 — 독립 페이지 (Standalone)

앱 GNB 없이 **로고만 있는 sticky 상단 바** + 콘텐츠 + 간단 푸터. 새 창으로 띄워 단독으로 보는 참고 · 문서 화면. `blank` 레이아웃.

```
┌────────────────────────────────────┐
│ 로고만 (56px, sticky · GNB 없음)    │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │ 콘텐츠 (자체 헤더 · 푸터)       │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

- 상단: 로고 전용 바, GNB · 계정 메뉴 없음. 헤더 · 푸터를 페이지가 직접 구성.
- **단일 루트로 감싸** sticky 요소가 페이지 끝까지 고정되게 한다(`#__nuxt` 높이 100% 제약 회피).
- 레퍼런스: 운영 가이드 ([help.vue](../app/pages/help.vue) — `/help`).

#### A · B · C 비교

| | A 페이지 | B 페이지 | C 페이지 |
| --- | :-: | :-: | :-: |
| 전체 GNB | ✅ | ✅ | ❌ (로고만) |
| 좌측 서브메뉴 | ❌ | ✅ | ❌ |
| 레이아웃 | `default` | `default` + 셸 | `blank` |
| 용도 | 일반 화면 | 하위 메뉴가 많은 그룹 | 단독 참고 · 문서 |
| 레퍼런스 | 대부분 화면 | `AppMyPageShell` | `/help` |

> 인증(로그인 · 회원가입 · 서비스 담당자 등록)과 비로그인 랜딩(`/`)은 별도 — 중앙 정렬 카드 / 마케팅 레이아웃으로, A · B · C 분류에 포함하지 않는다.

---

## 6. 컴포넌트 패턴

> `App*` 컴포넌트는 아래 클래스/토큰을 직접 사용한다(적용 완료). 클래스 정본 = [main.css](../app/assets/css/main.css).

### 6.1 버튼 (`.btn`)

| 변형 | 용도 | 시각 |
| --- | --- | --- |
| `.btn-primary` | 기본 액션(저장/발송) | `ink-900` BG / 흰 텍스트 |
| `.btn-accent` | AI / Primary CTA (페이지 ≤1) | `accent` BG / `ink-900` 텍스트 |
| `.btn-soft`·`.btn-outline`·`.btn-neutral` | 보조/취소 | 흰 BG / `line` 보더 |
| `.btn-error` | 위험(삭제) | 흰 BG / `danger-line` 보더 / `danger-ink` |
| `.btn-error-solid` | 강한 위험 확정 | `danger` BG / 흰 텍스트 |
| `.btn-ghost` | 아이콘·메뉴 진입 | 투명 → hover `ink-50` |

크기 `.btn-sm`(28) / 기본(32) / `.btn-lg`(36) · `.btn-icon` 정사각.
Nuxt UI 대응: `UButton color="neutral"`(기본=ink), AI/CTA만 별도 accent 처리.

### 6.2 카드 (`.card`)

흰 BG + `1px line` + `r-lg`. `.card-header`(step + title + required + hint) / `.card-body`(20px). 잠금 시 `.card-body.locked`(중앙 안내). **그림자·그라데이션 없음.**

### 6.3 폼 (`.form-row`)

`label 120px / field 1fr` 그리드, row 사이 1px line. 입력은 `.input/.select/.textarea` — `paper` BG, focus 시 `white` BG + `ink-300` border(outline 없음). 필수 `*`는 `danger`. 에러는 인풋 아래 빨간 텍스트. Nuxt UI: `UForm`+`UFormField`+`UInput`+Zod.

### 6.4 모달 / Drawer

`.modal`(r-lg, shadow-modal, slideUp 180ms) — header/body/footer. footer 확인 버튼은 **`.btn-primary`**(`ink-900`) — 구 `.btn-sky` 별칭은 폐기·제거됨. 모바일 메뉴는 좌측 `.drawer`(280px, slideRight). 팝업·다이얼로그는 모두 자체 `AppModal` 기반(`AppConfirmDialog`/`App*Dialog`) — `USlideover`는 사용하지 않으며 모바일 GNB 드로어에만 한정.

### 6.5 테이블 (`.table`)

헤더: 투명 BG, `10px mono UPPERCASE ink-400`, 하단 1px line. row: `td 14px`, row 사이 1px line, hover `paper`, 선택 `accent-soft`. 숫자 셀 `.cell-mono`.

#### A 테이블 스타일 — 조회·관리 목록 표준

발송 조회·이력·관리 등 **목록 화면의 정본 테이블 패턴**. 레퍼런스 구현 = [AppHistoryView.vue](../app/components/AppHistoryView.vue)(발송 조회 5채널 공용), 테이블 요소에 `data-table-style="a"`로 명시. 화면은 항상 **3개 영역**으로 구성된다 — ⓐ 검색(필터) 영역 → ⓑ 액션 영역 → ⓒ 테이블 본체.

```
ⓐ .filter-bar              검색(필터) 영역 — 독립 카드, 테이블 카드 "위"
─────────────────────────────────────────────────────────
ⓑⓒ .list-card              흰 카드 · 1px line · r-lg · overflow hidden
   ├─ ⓑ .list-toolbar       액션 영역 — 카드 "안" 최상단 (border-bottom 1px)
   ├─ ⓒ .list-table-scroll  table.table.list-table (가로 스크롤)
   └─    페이지네이션         카드 하단
```

##### ⓐ 상단 검색(필터) 영역 — `.filter-bar`

목록 화면 최상단의 **독립 카드**(흰 BG · 1px line · `r-lg` · padding 12 · `margin-bottom 16`). 테이블 카드와 분리된 별개 블록이다.

- 레이아웃: `display:flex; gap:8; flex-wrap:wrap; align-items:center`.
- 좌 → 우 순서: **필터 셀렉트들** → **날짜 범위** → **액션 버튼**.
  - 필터 셀렉트(`.select.fb-select`, 폭 120px) — 채널/상태/시점/목적 등. 첫 옵션은 항목명 placeholder.
  - 날짜 범위(`.fb-daterange`) — `AppDateTimePicker`(시·분 표시, width 190) + `~`(`.fb-tilde`) + `AppDateTimePicker`.
  - 액션(`.fb-actions`, `margin-left:auto`로 우측 정렬) — `초기화`(`.btn-neutral .btn-sm`) + `검색하기`(`.btn-primary .btn-sm` + `i-lucide-search` 아이콘).
- 검색 버튼 라벨은 **"검색하기"**(아이콘 포함)로 통일. "조회" 금지.

##### ⓑ 테이블 상단 액션 영역 — `.list-toolbar`

`.list-card` **내부 최상단** 행(`border-bottom: 1px`, padding `10 12`, `display:flex; justify-content:space-between`). 좌·우 2그룹.

- **좌측**: `총 N건`(`.toolbar-count`).
- **우측**: `목록 다운로드 요청` · `다운로드 요청 목록` · `조회 필드 추가`(다중선택 드롭다운) · `일괄 취소` · `선택 취소` 순. 모두 `.btn-outline .btn-sm`.
- 필터 영역(ⓐ)과 액션 영역(ⓑ)은 **반드시 분리** — 검색 조건은 카드 위, 목록 조작은 카드 안.

##### ⓒ 테이블 본체

`.list-table-scroll`(`overflow-x:auto`) > `table.table.list-table`(기본 `.table` + 셀 `nowrap`). 1열 체크박스 · ID는 mono `accent-ink` 링크 · 상태는 dot 배지 · 채널은 `.ch-pill`. 페이지네이션은 카드 하단.

> 검색 조건이 필요한 목록 화면은 ⓐⓑⓒ 3영역 구조를 그대로 따른다.

#### B 테이블 스타일 — 검색 없는 단순 목록

**검색(필터) 영역이 없는** 가장 단순한 목록 패턴. A 테이블에서 ⓐ `.filter-bar`를 뺀 형태 — ⓑ 액션 영역 + ⓒ 테이블 본체만. 항목 수가 적고 검색이 불필요한 관리 화면(발신 번호·발신 프로필 등)에 쓴다. 레퍼런스 = [sender/numbers.vue](../app/pages/sender/numbers.vue), 테이블 요소에 `data-table-style="b"`로 명시.

```
ⓑⓒ .list-card              흰 카드 · 1px line · r-lg · overflow hidden
   ├─ ⓑ .list-toolbar       액션 영역 — 카드 "안" 최상단 (border-bottom 1px)
   │     좌: 총 N개   /   우: 페이지별 액션 버튼
   └─ ⓒ table.table         테이블 본체 (가로 스크롤 필요 시 .list-table)
```

- ⓑ 액션 영역 구성·문구는 A와 동일.
- 우측 버튼은 화면 목적에 따라 다름(예: `발신 번호 등록 안내`·`선택 삭제`). 페이지 상단 우측에는 별도 등록 CTA(`발신 번호 등록` 등)를 둘 수 있다.
- 검색이 필요하면 → 단일 검색어면 **C 테이블**(액션 영역에 검색란), 다중 조건이면 **A 테이블**(`.filter-bar`)로 승격한다.

#### C 테이블 스타일 — 액션 영역 인라인 검색

별도 필터 영역 없이, **ⓑ 액션 영역 안에 검색란 하나**를 둔 패턴. B 테이블에 단일 검색 입력을 더한 형태 — 다중 조건 필터까지는 필요 없지만 이름·도메인 등 한 가지로 찾고 싶을 때 쓴다. 레퍼런스 = [sender/domains.vue](../app/pages/sender/domains.vue), 테이블 요소에 `data-table-style="c"`로 명시.

```
ⓑⓒ .list-card              흰 카드 · 1px line · r-lg · overflow hidden
   ├─ ⓑ .list-toolbar       액션 영역 — 카드 "안" 최상단 (border-bottom 1px)
   │     좌: 총 N개 · 검색란   /   우: 페이지별 액션 버튼
   └─ ⓒ table.table         테이블 본체 (가로 스크롤 필요 시 .list-table)
```

- 검색란은 좌측 그룹의 `총 N개` 다음에 둔다. **너비 260px 고정**, 돋보기 아이콘은 입력칸 오른쪽, 높이는 `.btn-sm`과 동일한 **28px**.
- 액션 영역 좌/우 구성·문구는 A·B와 동일.

#### A · B · C 비교

| | A 테이블 | B 테이블 | C 테이블 |
| --- | :-: | :-: | :-: |
| ⓐ 별도 검색(필터) 영역 (`.filter-bar`) | ✅ | ❌ | ❌ |
| ⓑ 액션 영역 (`.list-toolbar`) | ✅ | ✅ | ✅ |
| 액션 영역 내 검색란 | — | ❌ | ✅ |
| ⓒ 테이블 본체 | ✅ | ✅ | ✅ |
| 용도 | 다중 조건 검색 필수 목록(조회·이력) | 검색 불필요 소규모 목록 | 단일 검색어 목록 |
| 레퍼런스 | `AppHistoryView` | `sender/numbers` | `sender/domains` |

### 6.6 Badge / Channel pill

`.badge-*` 6톤(success/warning/error/primary=info/sky=info/neutral), h-20, soft BG + line border. 채널은 `.ch-pill`(mono 코드 + 6px 컬러 도트) — 색에만 의존 금지, 항상 라벨 동반.

### 6.7 Empty / Toast

`.empty` — 40px 아이콘 박스(line border) + h3(ink-900) + p(ink-500) + 1차 액션. `.toast` — 우측 하단 stack, 흰 BG + line + shadow-popover, 4톤 아이콘색, `aria-live`. Nuxt UI: `useToast()`.

### 6.8 채널 미리보기

`.imsg`(iMessage) · `.kakao`(노란 리본+변수 pill) · `.rcs`(ink-900 verified+이미지+버튼) · `.email-preview`(subject/meta/body) · `.push-lock`(다크 잠금화면+frosted notif). 폰 셸 280×520, `r-20`, shadow-soft.

---

## 7. AI UX 패턴 (이 시스템의 차별점)

다음 4가지만 사용:

1. **AI 라벨링** — 텍스트 좌측 `Sparkles size=12` (`accent-ink`). 별도 컬러 박스 없음.
2. **AI 요약 카드** — `ink-900` BG + accent Sparkles 박스 + "생성시간·모델·데이터범위" 메타 + 재생성 버튼 상시.
3. **AI 추천 액션** — 칩(라벨 + 작은 hint + hover 화살표 translate). 클릭 시 즉시 적용/미리보기(블랙박스 금지).
4. **AI 생성 중** — `.ai-shimmer`(그린 좌→우 그라데이션 클립)만. 스피너는 `animate-spin`만. **무지개·보라 금지.**

---

## 8. 모션

| 위치 | 속성 | 시간 | easing |
| --- | --- | --- | --- |
| 사이드바 접기 | width | 300ms | ease-out |
| hover (bg/color/border) | — | 150ms | default |
| 상태 도트(live) | opacity/scale | 1.6s ∞ | ease-in-out |
| AI shimmer | background-position | 3.5s linear ∞ | — |
| Modal in | translateY(6px)→0 + opacity | 180ms | ease |

**금지** — 카드 scale hover, 그림자 점프, fade-in 진입. 모션은 항상 *상태 변화의 결과*. 무한 애니메이션은 `prefers-reduced-motion`에서 비활성(main.css에 반영됨).

---

## 9. 접근성

- 최소 대비: `ink-500 on white`(4.5:1) 이상. `ink-400`은 14px+ / `ink-300`은 16px+(축 라벨)에서만.
- 모든 interactive: `outline:none` + border-color 변경 또는 ring. focus 항상 가시.
- 색에만 의존한 상태 전달 금지 — 라벨 + 도트 동반.
- 아이콘 단독 버튼 `aria-label` 필수. 이미지 `alt` 필수.
- 키보드: Tab/Esc/Enter 동작. (`⌘K` 검색 등 단축키는 도입 시 정의)

---

## 10. 톤 & 마이크로카피 (한국어)

| 항목 | 가이드 | 예 |
| --- | --- | --- |
| 인칭 | 사용자 시점, 존댓말 | "다시 생성", "내보내기" |
| 버튼 길이 | 6자 이내 권장 | "내보내기" ✅ / "리포트를 내보내기" ❌ |
| 시간 | 상대 시간 우선 | "방금 전", "3분 전" |
| 숫자 | 천단위 콤마, 단위는 작게(`ink-400`) | `128,472` · `94.6%` |
| AI 호칭 | "AI"로 통일 | "AI 일일 요약" (봇/에이전트 ✗) |
| 빈 상태 | 짧은 안내 + 1차 액션 | "아직 발송 이력이 없습니다 · 첫 발송 시작" |
| 위험 액션 | 사유/한번 더 확인 | "정말 삭제하시겠습니까? 되돌릴 수 없습니다." |

---

## 11. 데이터 시각화

- 시리즈 색: 1차 `ink-900` / 2차(AI 등) `accent` / 3차+ `ink-500`,`ink-300`. **새 색 금지.**
- 음수/감소 `rose-600`. 단 `inverse:true` KPI(감소가 긍정)는 `accent`.
- Gridline `#ececec`, y축 0라인만 실선 나머지 `2 3` dash. 축 라벨 `mono 10px ink-300`.
- Tooltip `border-line` + `shadow-sm` + 11px, 시리즈 도트 1.5×1.5 + tabular 숫자.
- Area fill = 색 22% → 0% 수직 그라데이션.
- 차트 라이브러리: Chart.js (STACK 참조).

---

## 12. 발송 페이지 아키텍처 (도메인 — 디자인 전환에도 유지)

> 단발 발송 6종(SMS/알림톡/RCS/이메일/PUSH/Flow)의 공통 구조. 2026-05-19~20 작업에서 **3+1 카드 골격**으로 재배치했다(구 5-카드의 발신/메시지 카드를 통합·재구성).

### 12.1 발송 카드 골격 (3+1 카드)

```
① 템플릿 선택  (템플릿 사용유무 + 샘플 템플릿 선택)        ← Flow는 "플로우 선택"
② 수신자 설정  (직접 입력·주소록·별칭 클릭 수정·삭제 + 치환자 입력 + 표)
③ 메시지 설정  (좌: 발신 정보 · 발송 목적/유형 · 본문 / 우: 채널별 폰 미리보기 · AI)
④ 발송 설정    (즉시 / 예약 발송 + datetime)
   ──────────  AppSendActionsBar: 초기화 · 발송하기(.btn-primary)
```

각 카드는 `.card`(header `title`+`required`). `AppSendFormCard`는 `collapsible`(닫기/열기 토글)·`:locked`(점진적 disclosure)를 옵션으로 지원한다. 현재 게이팅은 **Flow의 메시지 설정**(플로우 미선택 시)에만 적용 — SMS/알림톡 등 다른 채널의 수신자·메시지 카드는 항상 사용 가능. 광고용 발송 선택 시 제목에 `(광고)`가 자동 부착된다(SMS/이메일/PUSH).

### 12.2 채널 차이 매트릭스 (요약)

| | SMS | 알림톡 | RCS | 이메일 | PUSH | Flow |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Sender | 발신번호 | 발신프로필 | 브랜드+번호 | 이메일 | 없음 | 플로우 |
| Template | optional | **필수** | optional | optional | optional | 플로우=템플릿 |
| 본문 | textarea | 변수영역만 | textarea | HTML | input+textarea | readonly/노드 |
| AI 다듬기 | ✓ | — | ✓ | ✓ | — | — |
| 치환자 | 템플릿시 | 개별/공통 | 개별/공통 | 템플릿시 | — | 개별/공통 |
| 미리보기 | iMessage | 카카오 | RCS | 이메일카드 | 잠금화면 | 선택노드 |
| 단가 | 9.9 | 8.0 | 12.0 | 0.65 | 0.0 | 노드 합산 |

채널 차이는 단일 `ChannelMeta`(`types/channel.ts`) 객체로 표현하고 페이지/컴포넌트가 분기 — 상세 타입 정의는 git 이력의 이전 DESIGN.md(커밋 ae40b0b 이전) 참조, 신규 컴포넌트 작업 시 재정리한다.

### 12.3 핵심 컴포넌트

**공용 골격** — `AppSendFormCard`(=`.card` 래퍼, `collapsible`/`:locked`) · `AppRecipientCard`(직접/주소록/별칭클릭 수정/삭제 + 치환자 + 표, `keyColumns` 다중 키 지원) · `AppSendOptionsCard`(즉시/예약) · `AppSendActionsBar` · `AppSendConfirmDialog`(비용 3셀).

**수신자 입력** — `AppRecipientFormDialog`(휴대폰/이메일 다중 `keyColumns`) · `AppAddressBookDialog`(개별/그룹, 다중 키 컬럼) · `AppPushRecipientDialog`(PUSH 전용, 별칭+토큰 다중+푸시 유형).

**미리보기** — `AppPhonePreview`(iMessage, 첨부 이미지) · `AppKakaoPreview` · `AppRcsPreview` · `AppEmailPreview`(다이얼로그·발송 페이지 공용) · `AppPushPreview`(`platform: 'android'|'ios'`).

**템플릿 다이얼로그** — `AppSmsTemplateDialog`(카드 그리드) · `AppKakaoTemplateDialog` · `AppRcsTemplateDialog` · `AppEmailTemplateDialog` · `AppPushTemplateDialog`.

**PUSH 부가 항목** — `AppPushButtonDialog` · `AppPushMediaDialog`(미디어/Android 미디어/iOS 미디어/Android 큰 아이콘을 `title`/`showType`/`showExpand`/`types` prop으로 분기) · `AppPushGroupDialog`.

**복합 플로우** — `AppFlowManageDialog`(목록·이름 클릭 수정) · `AppFlowCreateDialog`(등록·수정 겸용, 드래그 순서) · `AppFlowTemplatePickerDialog`(채널별 템플릿).

**기타** — `AppAIRewriteDialog`(AI 문장 다듬기) · `AppModal`(`utils/scrollLock` 카운터 기반 본 페이지 스크롤 잠금, 중첩 모달 안전) · `AppAdNoticeSms080Dialog`.

---

## 13. 디자인 변경 / 추가 절차

1. **핸드오프(`design_handoff_malgn_noti`)에 패턴이 있나?** → 있으면 토큰·클래스 그대로 차용.
2. **Nuxt UI에 있나?** → 있으면 `U*` 우선, app.config 토큰으로 스타일.
3. **공통 패턴인가?** → `App*` 컴포넌트로 추출.
4. **새 색이 필요한가?** → 만들지 말 것. 거의 모든 경우 ink/accent/semantic으로 해결. 정말 필요하면 `:root`에 추가 후 §2 등록.
5. **점검** — 1px hairline / 액센트 ≤6회 / tabular 숫자 / 그림자=floating만 / 1024px 반응형 / focus·`aria-label` / `prefers-reduced-motion`.

---

## 14. 변경 이력

| 날짜 | 변경 |
| --- | --- |
| ~2026-05-13 | (구) malgn-notifications 시안 기반 디자인 시스템 — indigo/sky/Noto Sans KR, 1200px, 909줄 가이드. git 이력 보존. |
| **2026-05-18** | **전면 피벗** — `design_handoff_malgn_noti` Relay-inspired v1.0를 디자인 정본으로 채택. ink 무채색+그린 액센트, Inter/JetBrains Mono/Pretendard, 1400px. Phase 1: 토큰·폰트·Nuxt UI 매핑·문서 적용. Phase 2(컴포넌트/페이지)는 체크포인트 후 진행. |
| 2026-05-19 | Phase 2 마무리 — `/guide` 라이브 카탈로그(17섹션) 추가, 셸·홈·발송 6채널·조회/통계/주소록/충전/인증 적용, Cloudflare Pages 프로덕션 배포. UI 스케일 115%·1400px·푸터 다크·헤더 불투명 등 페이지 설정 확정. |
| 2026-05-20 | 발송 6채널 UX 2차 폴리시 — 3+1 카드 골격 재배치, 채널 템플릿/PUSH 부가 항목 다이얼로그, 복합 플로우 등록·수정 통합 관리, `AppEmailPreview`/다중 키 컬럼/`scrollLock` 등 공용 컴포넌트 정리. 발송 옵션→발송 설정 등 문구 통일. |
</content>
