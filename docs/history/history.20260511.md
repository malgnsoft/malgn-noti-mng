# 2026-05-11 — 프로젝트 착수

## 한 줄 요약

맑은 메시징 SaaS의 세 레포(`malgn-noti` / `malgn-noti-admin` / `malgn-noti-api`)를 부트스트랩하고 첫 배포까지 마쳤다.

---

## 1. 큰 결정

| 영역 | 결정 |
| --- | --- |
| 프로젝트 구조 | 3개 레포(사용자단·운영자단·API) 형제 디렉토리 + GitHub `malgnsoft/*` |
| 프론트 스택 | **Nuxt 3.21 + `compatibilityVersion: 4` (Nuxt 4 호환 모드, `app/` 디렉토리)** + Vue 3.5 + TS 5.9 |
| UI 라이브러리 | **Nuxt UI v3 (MIT)** 단일 — Reka UI + Tailwind v4 통합. `@nuxtjs/tailwindcss` 미설치 |
| 폰트 | Noto Sans KR (Google Fonts) |
| 아이콘 | Iconify — `lucide` / `heroicons` / `bi`(시안 매칭) |
| API 스택 | Cloudflare Workers + **Hono 4** + TypeScript |
| DB | **AWS Aurora MySQL 8.0** (D1 아님) |
| DB 연결 | **Cloudflare Hyperdrive(MySQL)** + `mysql2` 확정 (RDS Data API 미채택) |
| Aurora 노출 | 퍼블릭 엔드포인트 + SG에 Hyperdrive egress IP 화이트리스트 (개발 단계) |
| 지원 채널 | SMS/LMS/MMS · **RCS** · 알림톡/친구톡 · Email · Push (5) + **Flow(복합)** |
| 배포 트리거 | wrangler CLI 직접 배포 (GitHub Actions 자동화는 추후) |

## 2. CLAUDE.md 3개 작성

세 디렉토리에 프로젝트 컨텍스트 문서를 작성.

- `malgn-noti/CLAUDE.md` — 사용자단 (Nuxt 3 + Nuxt UI)
- `malgn-noti-admin/CLAUDE.md` — 운영자단(BackOffice)
- `malgn-noti-api/CLAUDE.md` — API (Workers + Hono + Aurora via Hyperdrive)

각 문서에 공통 원칙 명시:
- NHN/PG/AI 직접 호출은 api 서버만
- 시크릿/AppKey는 envelope 암호화 후 DB 저장, 프론트 노출 금지
- Flow(채널 폴백)는 NHN 콘솔이 아니라 우리 백엔드에서 정의·실행
- 크레딧 차감은 hold → 확정/환불, append-only 원장 + 멱등키
- admin은 사내망/Access로 보호

## 3. NHN Notification Hub 정찰

- 공식 문서 `docs.nhncloud.com/.../Notification%20Hub/ko/overview/`
- 통합 6채널 (SMS · 알림톡 · RCS · Email · Push · 친구톡), 발송량 제한(SMS 월 5,000 / 알림톡 일 1,000), 플로우(폴백) 기능 확인
- 우리 백엔드에서 자체 Flow 엔진 구현하기로 결정 — 멀티 테넌트 한도/감사 통합 위함

## 4. 사용자단 시안 분석 (정본화)

- 외부 시안: <https://malgn-notifications.pages.dev/#/pagelists>
- ViewLogic Router 기반 SPA, 페이지 데이터는 `/src/logic/pagelists.js`
- **263개 페이지/팝업 · 16 카테고리** 추출 → 단일 정본(SoT)으로 채택
- 1급 도메인: 단발 발송 / 캠페인 / 채널별 이력+통계 / 주소록 / 발신 인프라 6종 / 템플릿+카테고리+샘플+AI / 크레딧 / 결제 / 1:1 문의 / 회원가입+OTP+휴대폰 인증 / ExportJob
- 메모리에 `reference_user_console_sitemap.md`로 정본 위치 기록

## 5. 사용자단 Nuxt 부트스트랩

빈 디렉토리에 Nuxt 프로젝트 직접 작성 (`nuxi init` 미사용).

| 영역 | 산출물 |
| --- | --- |
| 기본 설정 | `package.json` · `nuxt.config.ts` · `tsconfig.json` · `.gitignore` · `.editorconfig` · `.env.example` · `.npmrc` · `eslint.config.mjs` |
| 진입 | `app/app.vue` · `app/app.config.ts` (`primary: indigo`, `neutral: slate`) · `app/assets/css/main.css` |
| 레이아웃 3종 | `default`(AppShell) · `auth`(중앙 카드) · `blank`(시스템 페이지) |
| 컴포넌트 3종 | `AppShell.vue`(좌측 사이드바) · `AppPagePlaceholder.vue` · `AppConfirmDialog.vue` |
| 페이지 골격 | 50개 페이지 (16카테고리 전체) |
| composables 3종 | `useApi` · `useExportJob` · `useAiTemplate` |
| middleware | `auth.global.ts` (현재 통과 스텁) |
| store | `stores/auth.ts` (Pinia) |
| types | `domain.ts` (Channel/Tenant/User) · `api.ts` (Paginated/ExportJob) |

- `pnpm install`로 의존성 863개 설치
- `pnpm typecheck` 통과 (5개 초기 타입 에러 수정: `$Fetch` 타입, `titleTemplate`, `process.env`)
- `pnpm dev`로 dev server 시동 성공 (port 3000)

## 6. Git 연결 + GitHub 푸시

세 디렉토리 모두 `git init -b main` + `origin` 추가 + 첫 커밋 + 푸시.

| 레포 | URL | 첫 커밋 |
| --- | --- | --- |
| malgn-noti | <https://github.com/malgnsoft/malgn-noti> | Nuxt 3 + Nuxt UI 사용자단 부트스트랩 |
| malgn-noti-api | <https://github.com/malgnsoft/malgn-noti-api> | CLAUDE.md (Cloudflare Workers + Hono + Aurora MySQL) |
| malgn-noti-admin | <https://github.com/malgnsoft/malgn-noti-admin> | CLAUDE.md (BackOffice 관리자단) |

커밋 메시지에 Claude co-author trailer 포함.

## 7. Cloudflare 첫 배포

`wrangler whoami` 인증 확인 (info@malgnsoft.com, account `d2b8c5524b...`). 필요 권한(workers/pages/d1/queues/hyperdrive) 보유.

### 7.1 사용자단 (malgn-noti)
- `nuxt.config.ts`에 `nitro.preset: 'cloudflare-pages'` 추가
- `pnpm build` → `dist/` 산출 (1.37 MB / 400 KB gzip)
- `wrangler pages project create malgn-noti --production-branch=main`
- `wrangler pages deploy dist --project-name=malgn-noti --branch=main`
- production: <https://malgn-noti.pages.dev>

### 7.2 운영자단 (malgn-noti-admin)
- `public/index.html`로 placeholder 정적 페이지 1개
- production: <https://malgn-noti-admin.pages.dev>

### 7.3 API (malgn-noti-api)
- 최소 Hono Worker (`src/index.ts`: `/`, `/health`)
- `wrangler.toml`: `nodejs_compat`
- `wrangler deploy`
- endpoint: <https://malgn-noti-api.malgnsoft.workers.dev>

응답 검증:
- `/home` HTTP 200 (54 KB)
- `/login` HTTP 200 (auth 레이아웃)
- `/404` HTTP 200 (blank 레이아웃)
- `/api/health` `{"ok":true,"env":"production",...}`

## 8. 시안 디자인 매칭 1차 — GNB 도입

시안 분석 결과 **시안은 사이드바가 아니라 상단 GNB 방식**임을 확인. 우리 `AppShell`(좌측 사이드바)을 폐기하고 `AppGnb`(상단 가로 네비)로 교체.

- `app/assets/css/main.css`에 시안 정본의 CSS 변수 도입
  - `--primary-color: #6366f1`, gray 11단, brand `sky-soft/sky/sky-vivid/indigo`, `--gnb-height: 64px`, `--content-max: 1320px`
- `AppGnb.vue` 작성: 시안 `.gnb-*` 클래스 그대로 차용 (sticky, hover dropdown, 사용자 아바타 드롭다운 + 크레딧 표시)
- `layouts/default.vue`를 GNB 기반으로 갈아끼움
- home 페이지 시안 톤으로 리디자인 (그라데이션 크레딧 카드 + 6채널 빠른 발송 + 2단 콘텐츠)

## 9. 푸터 추가

- 시안 base.css의 `.footer-upper/.footer-lower` 클래스 그대로 차용
- `AppFooter.vue` 신규 컴포넌트, `layouts/default.vue`에 연결
- 상단: 로고 + 슬로건 + 정책 링크 6개
- 하단: (주)맑은소프트 로고 + 사업자 정보 7개 + 카피라이트
- 검정 배경, 시안과 동일한 톤

## 10. GNB 메뉴 매핑

스크린샷 기준 시안의 실제 메뉴 9개 구성으로 갱신:
**서비스 / 메시지 발송 / 발송 조회·통계 / 주소록 / 발신 정보 / 메시지관리 / 캠페인 관리1 / 캠페인 관리2 / 운영가이드**

자식 메뉴는 `pagelists.js` 카테고리 기반으로 구성.

---

## 산출물 (당일 추가)

- **레포** 3개 + 첫 커밋 + 푸시
- **Cloudflare Pages** 프로젝트 2개 + Worker 1개 (모두 운영 URL 활성)
- **메모리** 3종: `project_malgn_noti_overview.md` · `reference_nhn_notification_hub.md` · `reference_user_console_sitemap.md`
- **사용자단 코드**: 약 74개 파일 (페이지 50 + 컴포넌트 3 + composables 3 + 레이아웃 3 + 기본 설정)

## 다음 단계로 남긴 것

- 시안과 정확한 GNB 메뉴 정합성 (캠페인 관리 1/2 등 임시 명칭)
- 콘텐츠 폭 미세 조정
- 인증 페이지 / 발송 페이지 실제 구현
- Aurora 토폴로지(Provisioned vs Serverless v2), 결제 PG/AI 제공자 선정 등 미정 항목
