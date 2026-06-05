# Frontend 개발 가이드 — 맑은 메시징 사용자단

이 문서는 [`malgn-noti`](..) 사용자단(고객 콘솔)의 **디자인 시스템 + HTML/CSS/JS 코딩 컨벤션**을 정리합니다. 운영자 콘솔(`malgn-noti-admin`)도 동일 스택이므로 같은 규칙을 따릅니다.

> 프로젝트 전반의 큰 그림은 [CLAUDE.md](../CLAUDE.md), **디자인 정본(SoT)은 [DESIGN.md](./DESIGN.md)** (Relay-inspired v1.0). 시안 사이트는 **IA(페이지 목록·라우트)** 한정 참조.
>
> ⚠️ 2026-05-18 디자인 전면 피벗 — 이 문서의 §3·§9는 신규 디자인 시스템 기준으로 갱신됨. 구 시안(indigo/Noto Sans KR/1200px) 기술은 폐기.

---

## 1. 기술 스택 한눈에

| 영역 | 선택 | 비고 |
| --- | --- | --- |
| 프레임워크 | Nuxt 3 + `future.compatibilityVersion: 4` | 소스는 `app/` 디렉토리 |
| 언어 | TypeScript (strict) | `any` 금지 |
| UI | **Nuxt UI v3 (MIT)** | Reka UI + Tailwind v4 통합 |
| 스타일 | Tailwind v4 + scoped `<style>` + CSS 변수 | `@nuxtjs/tailwindcss` **설치 금지** |
| 아이콘 | Iconify (`lucide` 기본, `heroicons`, `bi`) | 일반 UI는 `i-lucide-*` |
| 폰트 | Inter · JetBrains Mono · Pretendard | `--font-sans` / `--font-mono`, 한국어 fallback Pretendard |
| 상태 | Pinia (`@pinia/nuxt`) | 인증/크레딧/사용자 |
| 검증 | Zod | 폼/응답 |
| 배포 | Cloudflare Pages | `nitro.preset = 'cloudflare-pages'` |

---

## 2. 디렉토리 구조 (Nuxt 4 호환)

```
app/
├── app.vue                  # 진입 (UApp + NuxtLayout + NuxtPage)
├── app.config.ts            # Nuxt UI 테마(primary/neutral)
├── error.vue                # Nuxt 루트 에러 핸들러
├── assets/
│   └── css/main.css         # Tailwind + 시안 디자인 토큰
├── components/
│   ├── AppGnb.vue           # 상단 GNB
│   ├── AppFooter.vue        # 푸터
│   ├── AppConfirmDialog.vue # 위험 액션 컨펌
│   └── AppPagePlaceholder.vue
├── composables/
│   ├── useApi.ts            # $fetch 래퍼 (인증/에러 표준화)
│   ├── useExportJob.ts      # 비동기 다운로드 요청
│   └── useAiTemplate.ts     # AI 템플릿 생성
├── layouts/
│   ├── default.vue          # GNB + 본문 + Footer
│   ├── auth.vue             # 중앙 카드 (로그인/회원가입)
│   └── blank.vue            # 슬롯만 (단독 시스템 페이지)
├── middleware/
│   └── auth.global.ts
├── pages/                   # 자동 라우팅 (시안 IA 기준 16카테고리)
├── stores/
│   └── auth.ts              # Pinia
└── types/
    ├── domain.ts            # Channel, Tenant, User 등
    └── api.ts               # Paginated, ExportJob 등
```

루트:
- `nuxt.config.ts` — modules / nitro / app / runtimeConfig
- `tsconfig.json` — `extends: ./.nuxt/tsconfig.json`
- `eslint.config.mjs` — `withNuxt()`
- `.env.example` — 환경변수 템플릿

---

## 3. 디자인 시스템

> **정본은 [DESIGN.md](./DESIGN.md)** — Relay-inspired v1.0. 토큰·컴포넌트·발송 아키텍처 전체가 거기 있고, 라이브 카탈로그는 `/guide` 페이지([app/pages/guide.vue](../app/pages/guide.vue)). 아래는 코딩 시 자주 쓰는 핵심만 요약.

### 3.1 색상 토큰 (CSS 변수 — [main.css](../app/assets/css/main.css))

무채색 ink 11단 + 단일 그린 액센트. **Tailwind 임의값(`bg-[#...]`) 금지, 항상 변수 사용.**

```
/* 무채색 ink (≈ Tailwind zinc) */
--ink-900 #0a0a0a … --ink-50 #f4f4f5
--paper   #fafaf9     /* 앱 배경 */
--line    #ececec     /* 1px hairline border */
--white   #ffffff     /* 카드·탑바·입력 표면 */

/* 단일 액센트 — Green */
--accent      #00DC82  /* AI·Live·+delta·Primary CTA */
--accent-soft #e6fbf2  /* pill/배경 */
--accent-ink  #007a48  /* 라이트 위 액센트 텍스트 */

/* 시맨틱: --{success|warning|danger|info}-{soft|line|ink} */
/* 레이아웃 */
--container-max 1400px
```

### 3.2 Nuxt UI 테마 ([app.config.ts](../app/app.config.ts))

```ts
export default defineAppConfig({
  ui: { colors: { primary: 'zinc', neutral: 'zinc' } }
})
```

기본 색은 무채색(zinc). 액센트(그린)는 의미 있는 곳에만 — `.btn-accent` / `.btn-primary`(ink-900) 등 [main.css](../app/assets/css/main.css) 클래스로 표현.

### 3.3 폰트

| 용도 | 폰트 | 변수 |
| --- | --- | --- |
| UI 텍스트 | **Inter** | `--font-sans` |
| 숫자·ID·코드 | **JetBrains Mono** (`tabular-nums`) | `--font-mono` |
| 한국어 fallback | **Pretendard** | (`--font-sans`에 포함) |
| 대형 디스플레이 | Instrument Serif | `--font-serif` |

[nuxt.config.ts](../nuxt.config.ts) `app.head.link`에서 로드.

### 3.4 레이아웃 폭

| 영역 | max-width | 비고 |
| --- | --- | --- |
| Topbar(GNB) | 화면 폭 | 56px 높이, sticky, 단일 행 |
| 본문 (`.app-container`) | **1400px** (`--container-max`) | 좌우·상하 32px |
| 푸터 | 1400px | 본문과 끝 정렬 (다크 배경) |

UI는 100% 네이티브 스케일로 렌더된다. (구 `html { zoom: 1.15 }` 전역 확대 방식은 2026-05-20 폐기 — 좌표계 어긋남으로 팝오버·정렬 버그를 유발해 제거.)

### 3.5 2단 콘텐츠 (`.content-2col`)

`grid-template-columns: minmax(0,1fr) 320px; gap: 24px`. `<= 1024px`에서 1단으로 접힘.

---

## 4. HTML / Vue 작성 규칙

### 4.1 컴포넌트 형식

- **반드시 `<script setup lang="ts">`**. Options API 금지.
- 한 파일에 한 컴포넌트.
- 파일명: PascalCase (`AppGnb.vue`).
- 자체 컴포넌트는 **`App*` 접두사**, Nuxt UI는 자동 `U*` — 두 네임스페이스로 구분.

### 4.2 페이지 컴포넌트 템플릿

placeholder 단계의 표준:

```vue
<script setup lang="ts">
useHead({ title: 'XXX' })
</script>

<template>
  <AppPagePlaceholder
    title="XXX"
    category="대분류 · 소분류"
    description="간단한 설명"
  />
</template>
```

본격 구현 시:

```vue
<script setup lang="ts">
useHead({ title: 'XXX' })

// 1. 타입 / 스키마 (Zod)
// 2. 상태 (ref/computed)
// 3. 데이터 fetch (useFetch / useApi)
// 4. 핸들러
</script>

<template>
  <div class="app-container py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-bold">XXX</h1>
      <p class="text-sm text-gray-500 mt-1">설명</p>
    </header>
    <!-- 본문 -->
  </div>
</template>

<style scoped>
/* 페이지 전용 스타일 */
</style>
```

### 4.3 페이지 메타 (`definePageMeta`)

| 페이지 종류 | 설정 |
| --- | --- |
| 일반 (GNB + Footer) | (기본, 설정 없음) |
| 로그인/회원가입/재설정 | `definePageMeta({ layout: 'auth', auth: false })` |
| 404/시스템 에러/점검 | `definePageMeta({ layout: 'blank', auth: false })` |
| 리다이렉트만 하는 페이지 | `definePageMeta({ layout: false })` |

### 4.4 자동 임포트 (Nuxt 4)

다음 API/유틸은 import 없이 사용 가능:
- Vue: `ref`, `computed`, `watch`, `onMounted`, `defineProps`, `defineEmits`, `defineModel`
- Nuxt: `useHead`, `useState`, `useRoute`, `useRouter`, `useFetch`, `$fetch`, `navigateTo`, `useRuntimeConfig`, `useNuxtApp`, `useToast`
- Components: `app/components/` 아래 전부, Nuxt UI `U*` 전부
- composables: `app/composables/` 아래 전부 (`useApi`, `useExportJob` 등)
- stores: `app/stores/` 아래 전부 (`useAuthStore`)

### 4.5 접근성

- form 요소에 label 또는 `aria-label` 필수
- 키보드 조작 가능 — Nuxt UI(Reka UI)가 대부분 처리해 줍니다
- focus ring 유지 (Tailwind 기본 `focus-visible:ring-*` 또는 Nuxt UI 기본 스타일)
- 한국어 콘텐츠: `<html lang="ko">` (이미 `nuxt.config.ts`에서 설정)

---

## 5. CSS 작성 규칙

### 5.1 우선순위

1. **Nuxt UI 컴포넌트의 색·간격·라운드 기본값** 우선 사용
2. 필요하면 Nuxt UI 컴포넌트의 `class` prop 또는 `:ui` prop으로 미세 조정
3. 자체 CSS는 **`<style scoped>`** + CSS 변수(`var(--line)`·`var(--ink-*)` 등)
4. 마지막 수단으로 Tailwind 임의값 (`text-[#1f2937]`)

### 5.2 디자인 토큰 사용

자체 CSS는 항상 [DESIGN.md](./DESIGN.md)의 ink/accent/semantic 토큰을 CSS 변수로 씁니다. 구 시안 base.css·`--gray-*` 별칭은 2026-05-18 피벗으로 폐기됨(별칭은 main.css에 backward-compat용으로만 남아 있음) — **신규 코드는 `--ink-*`/`--line`/`--accent`를 직접 사용**.

공용 클래스(`.card`·`.btn`·`.table`·`.form-row` 등)는 [main.css](../app/assets/css/main.css)가 정본이며, 컴포넌트는 이 클래스를 그대로 차용하면 유지보수가 쉬워집니다.

예 ([AppGnb.vue](../app/components/AppGnb.vue)):

```vue
<style scoped>
.gnb {
  position: sticky;
  top: 0;
  z-index: 1030;
  background: var(--white);
  border-bottom: 1px solid var(--line);
  height: var(--gnb-height);
}
.gnb-nav-item:hover .gnb-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
</style>
```

### 5.3 절대 하지 말 것

- `@nuxtjs/tailwindcss` 설치 (Nuxt UI 모듈이 Tailwind를 통합 관리)
- 인라인 `style="color: #6366f1"` 같은 하드코딩 (단, 동적 색상은 인라인 OK)
- 전역 `:root` 변수를 컴포넌트 안에서 재정의 (예외적인 경우만)
- `!important` 남용 (Tailwind v4의 우선순위가 충분히 강합니다)

### 5.4 다크 모드

현 단계: 라이트 모드 단일. CSS 변수가 다크 호환 가능한 구조라 추후 `:root[data-theme="dark"]`에서 변수 재정의로 도입.

---

## 6. JS / TS 작성 규칙

### 6.1 타입

- **`any` 금지** (불가피하면 `unknown` 후 narrow)
- 도메인 타입은 [`app/types/domain.ts`](../app/types/domain.ts), API 타입은 [`app/types/api.ts`](../app/types/api.ts)
- props/emits는 제네릭 형태:
  ```ts
  defineProps<{ title: string; count?: number }>()
  defineEmits<{ confirm: []; cancel: [] }>()
  ```
- v-model은 `defineModel`:
  ```ts
  const open = defineModel<boolean>('open', { default: false })
  ```

### 6.2 API 호출

직접 `$fetch` 호출 대신 항상 [`useApi()`](../app/composables/useApi.ts):

```ts
const api = useApi()
const items = await api<Paginated<Item>>('/messages', {
  query: { page: 1, channel: 'sms' }
})
```

장점:
- baseURL / credentials / Accept 자동
- 401 → `/login` 리다이렉트 자동
- 에러 표준화

### 6.3 composable 패턴

- 파일명·함수명 모두 `use*`로 시작
- 한 책임에 집중 (`useApi`, `useExportJob`, `useAiTemplate`)
- 반환은 객체로 (`return { data, refresh }` 같은 형태)

### 6.4 Pinia store

- 파일: `app/stores/{name}.ts` → 자동 import (`useXxxStore`)
- 옵션 API 형식 (Pinia 표준):
  ```ts
  export const useAuthStore = defineStore('auth', {
    state: () => ({ ... }),
    getters: { ... },
    actions: { async logout() { ... } }
  })
  ```

### 6.5 검증 (Zod)

폼·외부 응답은 Zod로 파싱:

```ts
import { z } from 'zod'

const SendSmsSchema = z.object({
  to: z.string().min(1),
  body: z.string().min(1).max(2000)
})
type SendSms = z.infer<typeof SendSmsSchema>
```

### 6.6 시간

UTC ISO 8601 (`2026-05-12T03:04:05Z`)로 주고받고, 표시용 변환은 프론트엔드 책임. 라이브러리 미정 (Day.js / date-fns 검토).

---

## 7. Nuxt UI 컴포넌트 매핑 가이드

시안의 반복 패턴 → Nuxt UI 컴포넌트 매핑.

| 시안 패턴 | Nuxt UI / 자체 컴포넌트 |
| --- | --- |
| 모달 (확인/알림) | `AppConfirmDialog` (자체 `AppModal` 기반) |
| 팝업/다이얼로그(수신자 정보, 발송 컨펌, 템플릿 선택 등) | 자체 `AppModal` 기반 `App*Dialog` — `USlideover`는 모바일 GNB 드로어 전용 |
| 다운로드 요청 완료 토스트 | `useToast()` → 내부에서 `UNotification` 표시 |
| 채널/카테고리 트리 | `UNavigationMenu` (수직) 또는 자체 `AppCategoryTree` |
| 목록 + 정렬 + 페이징 | `UTable` + `UPagination` + 공용 `AppFilterBar` |
| 폼 + 검증 | `UForm` + `UFormField` + Zod 스키마 |
| 드롭다운 메뉴 | `UDropdownMenu`(click) 또는 시안 hover 스타일은 자체 CSS |
| 라디오 카드 / 체크박스 | `URadioGroup`, `UCheckbox` |
| 입력 | `UInput`, `UTextarea`, `USelect`, `UInputNumber` |
| 토글 | `USwitch` |
| 탭 | `UTabs` |
| 아바타 | `UAvatar` |
| 카드 | `UCard` (또는 직접 div + 시안 스타일) |
| 배지 | `UBadge` |
| 알림 박스 | `UAlert` |

`AppConfirmDialog` 사용 예 (위험 액션 컨펌):

```vue
<AppConfirmDialog
  v-model:open="open"
  title="이 캠페인을 삭제할까요?"
  description="이미 발송된 메시지는 영향을 받지 않습니다."
  confirm-color="error"
  confirm-label="삭제"
  @confirm="onDelete"
/>
```

---

## 8. 아이콘

### 8.1 컬렉션 (이미 설치됨)

| 컬렉션 | 용도 | prefix |
| --- | --- | --- |
| `lucide` | 일반 UI 아이콘 (메뉴/버튼/empty state) | `i-lucide-...` |
| `heroicons` | Nuxt UI 기본/대안 | `i-heroicons-...` |
| `bi` (Bootstrap Icons) | 시안 매칭용 (채널 카드 등) | `i-bi-...` |

### 8.2 사용 예

```vue
<UIcon name="i-lucide-send" class="text-xl text-primary-500" />
<UIcon name="i-bi-chat-text" class="text-2xl" />
```

브랜드/페이지 단위로 컬렉션을 일관되게:
- 채널 카드 → `i-bi-*` (시안 톤)
- 일반 액션·메뉴 → `i-lucide-*`

---

## 9. 레이아웃 컴포넌트

### 9.1 AppGnb ([`AppGnb.vue`](../app/components/AppGnb.vue))

- sticky top, **56px 높이**, 단일 행(시안의 2단 GNB 폐기), `rgba(255,255,255,*)` 불투명 배경 + 하단 1px line
- 좌: 로고 (`AppLogoMark` + "맑은" + "message")
- 중: 7개 메뉴 (서비스 / 메시지 발송 / 발송 조회·통계 / 주소록 / 발신 정보 / 메시지 관리 / 캠페인) — hover 드롭다운
- 우: 인증 분기 (비로그인: 문의·로그인·회원가입 / 로그인: 문의·충전·사용자 아바타 드롭다운)
- `< 1024px`: 햄버거 → 좌측 Drawer(280px)

### 9.2 AppFooter ([`AppFooter.vue`](../app/components/AppFooter.vue))

- 검정 배경, 상·하단 2단
- 상단: 로고/슬로건 + 정책 링크 6개
- 하단: 회사명 + 사업자 정보 7개 + 카피라이트

### 9.3 레이아웃별 적용

| layout | GNB | Footer | 용도 |
| --- | :-: | :-: | --- |
| `default` | ✓ | ✓ | 일반 페이지 (홈/발송/조회/관리…) |
| `auth` | — | — | 로그인/회원가입/비밀번호 재설정 |
| `blank` | — | — | 404/시스템 에러/점검/이메일 템플릿 |

---

## 10. 빌드 / 배포

### 10.1 로컬 명령어

```bash
pnpm install
pnpm dev              # http://localhost:3000
pnpm typecheck        # nuxt typecheck
pnpm lint
pnpm build            # nitro cloudflare-pages preset → dist/
pnpm preview          # 로컬 빌드 미리보기
```

### 10.2 Cloudflare Pages 배포

```bash
pnpm build
npx wrangler pages deploy dist \
  --project-name=malgn-noti \
  --branch=main \
  --commit-dirty=true
```

production: <https://malgn-noti.pages.dev>

### 10.3 빌드 산출물 구조 (`dist/`)

```
dist/
├── _fonts/                  # 폰트 자산
├── _nuxt/                   # 클라이언트 JS/CSS 청크
├── _worker.js/              # SSR worker (Nitro)
├── _routes.json             # Pages Functions 라우팅
├── _headers
├── _redirects
└── nitro.json
```

`_routes.json` / `_headers` 등은 Nitro가 자동 생성. 수정 금지.

---

## 11. 코딩 체크리스트 (PR 전)

- [ ] `<script setup lang="ts">` 사용
- [ ] `useHead({ title })` 페이지 제목 설정
- [ ] `any` 없음 (`tsc --noEmit` 통과)
- [ ] Zod로 외부 입력 파싱
- [ ] API 호출은 `useApi()` 경유
- [ ] 위험 액션은 `AppConfirmDialog`
- [ ] 새 아이콘은 기존 3개 컬렉션 중 선택
- [ ] 색상은 CSS 변수 또는 Nuxt UI 토큰 사용 (하드코딩 X)
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm lint` 통과

---

## 12. 참고 자료

### 12.1 디자인 / 디자인 가이드

- **디자인 정본**: [DESIGN.md](./DESIGN.md) (Relay-inspired v1.0)
- **라이브 카탈로그**: `/guide` 페이지 — [app/pages/guide.vue](../app/pages/guide.vue) (17섹션 sticky nav)
- **토큰·클래스 정본**: [app/assets/css/main.css](../app/assets/css/main.css)

### 12.2 시안 (IA 참조 전용)

> 2026-05-18 디자인 피벗 이후 시안의 **디자인(CSS/base.css)은 더 이상 참조하지 않는다**. IA(페이지 목록·라우트 구조)만 정본으로 유지.

- 페이지 목록(IA 정본): <https://malgn-notifications.pages.dev/#/pagelists>
- 사이트맵 + 기능명세: <https://malgn-notifications.pages.dev/#/sitemap>

### 12.3 외부 문서

- [Nuxt 3 docs](https://nuxt.com/docs)
- [Nuxt UI v3](https://ui.nuxt.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Reka UI](https://reka-ui.com/)
- [Iconify](https://iconify.design/)
- [Pinia](https://pinia.vuejs.org/)
- [Zod](https://zod.dev/)
