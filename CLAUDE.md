# malgn-noti (사용자단)

맑은소프트의 NHN Cloud Notification Hub 기반 통합 알림 서비스 "**맑은 메시징**" — **고객(테넌트) 사용자가 사용하는 웹 콘솔**.

> 형제 프로젝트: [`malgn-noti-admin`](../malgn-noti-admin) (운영자 콘솔) · [`malgn-noti-api`](../malgn-noti-api) (백엔드 API)
>
> **IA 참조 시안**: https://malgn-notifications.pages.dev/#/pagelists (총 263 페이지/팝업, 16 카테고리. **IA(페이지 목록·라우트 구조)** 한정 정본.)
>
> **디자인 정본(SoT)**: [`doc/DESIGN.md`](./doc/DESIGN.md) — `design_handoff_malgn_noti` Relay-inspired Design System v1.0. (2026-05-18 시안 기반 디자인에서 전면 피벗. 시안의 디자인 언어는 더 이상 적용하지 않음 — IA만 참조.)

---

## 1. 프로젝트 목적

맑은소프트가 NHN Cloud Notification Hub를 래핑하여 고객사가 자체 브랜드로 다음 채널의 메시지를 발송·관리할 수 있게 하는 **멀티 테넌트 SaaS "맑은 메시징"** 의 사용자단(테넌트 콘솔).

### 지원 채널 (5 + Flow)

| 채널 | 비고 |
| --- | --- |
| SMS / LMS / MMS | 단문/장문/멀티미디어 |
| **RCS** | 1급 채널 — 별도 발송, 이력, 템플릿, 브랜드 |
| 알림톡 / 친구톡 | KakaoTalk Bizmessage |
| Email | 트랜잭션 + 마케팅 |
| Push | iOS / Android / Web |
| **복합 (Flow)** | 위 채널을 노드로 묶은 폴백/순서 발송 (예: 알림톡 → 친구톡 → LMS) |

### 1급 도메인 (시안에서 추출)

- **단발 발송** — 채널별 발송 폼 (수신자 입력/주소록/광고수신/컨펌/초기화 팝업 풀세트)
- **캠페인** — 수신자 그룹 + 채널/메시지 + 발송 시점 + 시뮬레이션 + 테스트 발송 + 복제/중지
- **이력/통계** — 채널별 이력 + 일괄 취소(예약) + 비동기 다운로드 요청 + 통계 대시보드
- **주소록** — 연락처/그룹/수신거부
- **발신 정보** — 발신번호(SMS) / RCS 브랜드 / 이메일 도메인(+DKIM) / PUSH 인증서(FCM·APNs) / 카카오 발신 프로필 / **080 수신거부 번호**
- **메시지(템플릿) 관리** — 채널별 카테고리/템플릿 + **샘플 템플릿** + **AI 템플릿 생성** + 상세 설정(대체문자 등)
- **크레딧** — 충전(카드)·내역·영수증·취소·결제 카드 관리
- **계정/인증** — 회원가입(OTP·휴대폰·약관) / 로그인(이메일+비번, OTP/이메일 보안인증) / 비밀번호 재설정 / 전자 서명 / 약관 뷰어
- **문의** — 1:1 문의 작성 + 내 문의 내역
- **시스템 페이지** — 404 / 시스템 에러 / 네트워크 에러 / 점검(긴급·정기) / 인증 메일 템플릿

---

## 2. 기술 스택

- **프레임워크**: Nuxt 3 (Vue 3, `<script setup>`, TypeScript)
- **상태 관리**: Pinia
- **UI / 스타일**: **Nuxt UI v3** (MIT, Reka UI + Tailwind CSS v4 기반). `@nuxtjs/tailwindcss`는 **설치하지 않는다** — Nuxt UI 모듈이 Tailwind를 통합 관리.
- **디자인 시스템**: Relay-inspired v1.0 ([`doc/DESIGN.md`](./doc/DESIGN.md) 정본) — ink 무채색 11단 + 단일 그린 액센트 `#00DC82`, 1px hairline, 저밀도. 토큰은 [`app/assets/css/main.css`](./app/assets/css/main.css), Nuxt UI 색상은 `app.config.ts`(`primary`/`neutral` = `zinc`).
- **아이콘**: Iconify — 기본 `lucide`(핸드오프 기준)/`heroicons`, `@iconify-json/bi` 보유
- **폰트**: **Inter**(UI) + **JetBrains Mono**(숫자/ID) + **Pretendard**(한국어 fallback) + Instrument Serif(대형 디스플레이). `nuxt.config.ts` head 주입.
- **API 통신**: `$fetch` / `useFetch` — 항상 [`malgn-noti-api`](../malgn-noti-api) 경유
- **인증**: 백엔드 발급 JWT를 HttpOnly 쿠키에 저장, OTP/2FA 보조
- **차트**: Chart.js (통계 화면 — Nuxt UI에 차트 컴포넌트 없음)
- **에디터**: 템플릿 작성용 리치/슬롯 변수 에디터 (선정 미정)
- **테스트**: Vitest + @nuxt/test-utils
- **린트/포맷**: ESLint + Prettier
- **패키지 매니저**: pnpm (확정 — `pnpm-lock.yaml` 기준)

---

## 3. 라우트/페이지 트리 (시안 기준)

> 정확한 263개 페이지 목록은 시안 `pagelists` 페이지가 정본. 여기서는 라우트 그룹만 정리.

```
/login                       # 로그인
/login/security              # OTP/이메일 보안인증
/reset-password              # 재설정 요청
/reset-password/new          # 새 비밀번호 입력
/signup                      # 회원가입 (OTP/휴대폰/약관)

/home                        # 대시보드(랜딩)

/send/sms                    # SMS/LMS/MMS 발송
/send/rcs                    # RCS 발송
/send/kakao                  # 알림톡/친구톡 발송
/send/email                  # 이메일 발송
/send/push                   # PUSH 발송
/send/flow                   # 복합(플로우) 발송

/history/sms                 # 채널별 발송 이력
/history/rcs
/history/kakao
/history/email
/history/push
/history/stats               # 통계 대시보드

/contacts/list               # 연락처
/contacts/groups             # 그룹
/contacts/optout             # 수신거부

/sender/numbers              # 발신번호(SMS)
/sender/brands               # RCS 브랜드
/sender/domains              # 이메일 도메인 + DKIM
/sender/push-cert            # FCM/APNs 인증서
/sender/profiles             # 카카오 발신 프로필
/sender/optout-080           # 080 수신거부 번호

/manage/sms                  # 채널별 템플릿
/manage/rcs
/manage/kakao
/manage/email
/manage/push
/manage/settings             # 메시지 발송 상세 설정(대체문자 등)

/campaign                    # 캠페인 목록/생성/수정
/campaign3                   # 변형 디자인 (검토용)

/charge                      # 크레딧 충전
/charge/result               # 충전 결과
/account/credit              # 크레딧 내역/영수증

/account/settings            # 계정 설정 / 결제 이메일 / 전자서명 / 약관 뷰어
/account/inquiries           # 내 문의 내역
/account/inquiries/detail    # 문의 상세

/inquiry                     # 1:1 문의 작성
/inquiry/complete

/templete/error/system       # (시안 철자 유지)
/templete/error/not-found
/templete/error/network
/templete/inspection/emergency
/templete/inspection/scheduled
/templete/email/verify       # 이메일 인증 메일 템플릿
/templete/email/reset-password
/404                         # 단독 404 (layout 없음)
/error                       # 단독 시스템 에러 (layout 없음)
```

> 시안에 "쏠쏠 브랜드"로 표기된 단독 404/에러 페이지는 **맑은 메시징 브랜드로 재작업** 필요.

---

## 4. UI 패턴 (시안에서 반복) → Nuxt UI 매핑

거의 모든 화면이 다음 패턴 조합이므로, 일찍 표준화하면 263 페이지를 빠르게 흡수할 수 있다.

> 적용 현황(2026-05): 발송 6채널 + 조회/통계/주소록/충전/인증까지 아래 패턴이 공용 컴포넌트로 구현됨. 모든 팝업은 자체 **`AppModal`**(Teleport + `utils/scrollLock`)로 통일 — `USlideover`는 사용하지 않음.

- **PU(팝업) 풀세트**: 발송 화면의 `수신자 정보 / 수신자 선택 / 광고 수신 알림 / 발송 컨펌 / 초기화 확인` → 모두 **`AppModal`** 기반 공용 컴포넌트(`AppRecipientFormDialog`·`AppAddressBookDialog`·`AppAdNoticeSms080Dialog`·`AppSendConfirmDialog`·`AppConfirmDialog`).
- **다운로드 요청 패턴**: `다운로드 요청 PU` + `목록 PU` 짝 → `useExportJob()` composable + `useToast()` 완료 알림.
- **AI 템플릿/문장 PU**: → `useAiTemplate()` 훅 + `AppAIRewriteDialog`(AppModal 기반).
- **샘플/채널 템플릿 PU**: 채널별 `App{Sms,Kakao,Rcs,Email,Push}TemplateDialog` — 카드 그리드/리스트 + 미리보기.
- **위험 액션 컨펌**: `삭제 / 취소 / 일괄 취소 / 중지` → 단일 `AppConfirmDialog`(내부 `AppModal`)로 통일.
- **목록/필터/정렬/페이징**: 이력·관리 화면 → `AppHistoryView` 등 공용 뷰 + 자체 `.table`/페이지네이션.
- **폼 + 검증**: 발송 폼은 `AppSendFormCard`+`AppFormRow`+`AppRadioGroup` 조합. 검증은 인라인(토스트). Zod 도입은 백엔드 연동 시 검토.
- **사이드바/탑바 레이아웃**: 상단 단일 행 GNB(`AppGnb`, 56px) + `AppFooter`. 좌측 사이드바 없음(시안 무료판 기준).

---

## 5. NHN Notification Hub 통합

이 프론트엔드는 NHN API를 **직접 호출하지 않는다.** 모든 요청은 `malgn-noti-api`를 경유. 이유:

1. NHN AppKey / SecretKey가 브라우저에 노출되면 안 됨
2. 테넌트별 발송 한도·**크레딧 차감**·과금·감사 로그를 백엔드에서 통제
3. 채널 폴백 Flow는 백엔드에서 실행 (이력/감사 통합)
4. AI 템플릿 호출도 백엔드 게이트웨이를 통해 통제 (비용·남용·로그)

따라서 이 레포는 **NHN SDK 의존성을 갖지 않는다.** 공개 API 타입은 `malgn-noti-api`가 정의해 제공.

---

## 6. 환경 변수

```
NUXT_PUBLIC_API_BASE_URL=https://api.noti.malgn.example
NUXT_SESSION_SECRET=...          # 세션 쿠키 서명
```

> NHN/AWS/카드사 키 등 시크릿은 절대 이 레포에 두지 말 것.

---

## 7. 개발 명령어

```bash
pnpm install
pnpm dev              # http://localhost:3000
pnpm build
pnpm preview
pnpm typecheck
pnpm lint
pnpm test
```

### 7.1 Git · 배포 · 작업 이력 (운영 컨벤션)

**Git**

- **단일 브랜치 운영**: `main` 하나만 사용. 피처 브랜치를 만들었다면 작업 후 `main`에 FF 머지하고 로컬·원격 브랜치 삭제.
- 커밋·푸시는 **사용자가 명시적으로 요청할 때만**.
- 커밋 메시지: 한국어 제목 + 본문 불릿. 끝에 반드시 trailer:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- 무관·기존 untracked 파일은 끌어들이지 말고 작업 범위 경로만 stage.

**배포 (Cloudflare Pages — 프로덕션)**

- 빌드: `pnpm build` (Nitro `cloudflare-pages` 프리셋 → `dist/`).
- 배포: `npx wrangler@4 pages deploy dist --project-name=malgn-noti --branch=main --commit-dirty=true --commit-message "<ascii>"`
  (프로젝트 production-branch=main → `--branch=main`이 프로덕션 배포).
  - **`--commit-message`는 ASCII로 명시 필수.** 생략 시 wrangler가 git HEAD의 한글 커밋 메시지를 배포 메타로 읽다 `Invalid commit message, must be valid UTF-8` 에러로 실패함. `--commit-dirty=true`로 미커밋 상태 경고도 억제.
- 인증: wrangler OAuth(info@malgnsoft.com). 네트워크 필요 — 샌드박스 비활성 환경에서 실행.
- URL: 프로덕션 <https://malgn-noti.pages.dev>, 배포마다 `https://<id>.malgn-noti.pages.dev` alias.
- 사용자가 "배포"라고 하면 **빌드 → 배포 → 검증(프로덕션 HTTP 200 + 빌드 CSS/마커 확인) → 커밋·푸시·history**까지 한 흐름으로 처리.
- 배포는 **working tree 기준**이므로 배포 후 반드시 git 커밋으로 라이브 ↔ `main` 일치시킬 것.

**작업 이력 (앞으로 [`malgn-noti-mng`](../malgn-noti-mng)에서 작성·갱신)**

- ⚠️ **작성처 변경(2026-06-05~)**: 작업 이력(history)은 이제 **관리 레포 `malgn-noti-mng`의 `doc/history/`에서 작성하고 갱신한다.** `malgn-noti`의 `doc/history/`에는 더 이상 신규 작성하지 않는다(기존 파일은 이관 완료분).
- `../malgn-noti-mng/doc/history/history.yyyyMMdd.md` — **하루 한 파일**, 작업이 있는 날만 생성.
- 구조: ① 한 줄 요약 → ② 번호별 섹션(결정/코드/배포) → ③ 산출물 → ④ 다음 단계·한계.
- **같은 날 추가 작업은 그날 파일에 `§N` 추가**(새 파일 만들지 않음), 한 줄 요약·산출물 갱신, `../malgn-noti-mng/doc/history/README.md` 인덱스 표 갱신.
- 큰 마일스톤·배포 직후 기록. 형식 상세는 [`../malgn-noti-mng/doc/history/README.md`](../malgn-noti-mng/doc/history/README.md).
- 작성·갱신 후 **`malgn-noti-mng` 레포에 커밋·푸시**한다(코드 레포와 분리 관리).

**페이지 정본 (`doc/pages/`)**

- 사용자단 페이지의 **기획·로직·플로우 정본**은 `doc/pages/<UPPER_CASE>.md` (한 페이지/도메인 한 파일).
- 파일명: 페이지의 핵심 도메인을 대문자 ASCII로 (예: `SIGNUP.md`·`CONTRACT.md`). 라우트 그대로 옮기지 말 것 (`account/contract.md` ❌).
- 권장 구조: ① 페이지 개요 (라우트·메인 컴포넌트·셸·권한) → ② 진입 경로 → ③ 화면 구성 → ④ 사용자 액션 매트릭스 → ⑤ 상태 모델·전이 → ⑥ 정책 결정 사항 → ⑦ API 엔드포인트 → ⑧ DB 테이블 → ⑨ 현재 구현 상태 → ⑩ 알려진 한계·후속 작업.
- **링크 위생**: 같은 폴더의 다른 페이지 정본은 `./PAGE.md`, 상위는 `../MEMBERSHIP.md`·`../WBS.md`, 코드는 `../../app/...` / `../../../malgn-noti-api/...`.
- 도메인 통합 인덱스([`doc/MEMBERSHIP.md`](./doc/MEMBERSHIP.md) 등)는 `doc/` 루트에 두고, 그 안에서 페이지 정본을 `./pages/<NAME>.md`로 링크.
- 새 페이지를 본격 개발하거나 큰 정책 변경이 있을 때 함께 갱신.

---

## 8. 코드 규칙

- **Vue**: `<script setup lang="ts">`. Options API 금지.
- **컴포넌트**: PascalCase 파일명, 한 파일에 한 컴포넌트.
- **컴포넌트 네이밍 규칙**: Nuxt UI 컴포넌트는 `U*` 접두사(자동), **자체 컴포넌트는 `App*`** 접두사로 구분 (`AppGnb`, `AppModal`, `AppConfirmDialog`, `AppSendFormCard`, `AppRecipientCard` 등 — 전체 목록은 [`app/components/`](./app/components/)).
- **Nuxt UI 우선 사용**: 새 UI는 먼저 Nuxt UI에 동등 컴포넌트가 있는지 확인. 없을 때만 자체 작성. 스타일은 Nuxt UI 테마 토큰(`primary`/`neutral`/`success` 등) 사용, 커스텀 색상 하드코딩 지양.
- **Tailwind 사용**: 임의 클래스 OK. 단 `@nuxtjs/tailwindcss`는 절대 추가 설치 금지(중복 구성으로 충돌). 전역 토큰/플러그인은 `app.config.ts` 또는 `assets/css/main.css`의 `@theme`에서 관리.
- **API 호출**: 직접 `$fetch` 호출 대신 `composables/useApi.ts` 래퍼 사용 (인증·에러 표준화).
- **타입**: `any` 금지. 도메인 응답 타입은 `types/`에 정의 (백엔드와 형상 일치).
- **i18n**: 한국어 우선, 추후 다국어 대비 키 기반 텍스트로 작성. Nuxt UI 내장 컴포넌트 문구는 `app.config.ts`의 `ui.locale`로 한국어 적용.
- **접근성**: Nuxt UI(Reka UI) 컴포넌트의 ARIA 동작 유지. label·focus ring·키보드 조작 검증.

---

## 9. 다른 프로젝트와의 관계

| 항목 | 이 레포 | malgn-noti-admin | malgn-noti-api |
| --- | --- | --- | --- |
| 대상 사용자 | 고객사 테넌트 사용자 | 맑은소프트 운영자 | (서버 간 통신) |
| 권한 모델 | 테넌트 스코프 | 글로벌 어드민 + RBAC | 토큰별 검증 |
| NHN/외부 API 호출 | ❌ | ❌ | ✅ |
| 인증 | 테넌트 JWT | 어드민 JWT (별도) | 토큰 검증 |

UI 컴포넌트와 도메인 타입은 admin과 상당 부분 공유 가능 — 추후 공용 패키지 추출 검토.

---

## 10. 미정 / TODO

- [x] ~~패키지 매니저 확정~~ → pnpm 확정
- [x] ~~디자인 시스템~~ → Relay-inspired v1.0 채택([`doc/DESIGN.md`](./doc/DESIGN.md)), Phase 1·2 적용 완료
- [ ] 발신정보·메시지 관리·캠페인·계정/문의·시스템 페이지 — 핸드오프 디자인 미반영(IA만 존재), 별도 협의 필요
- [ ] 백엔드(`malgn-noti-api`) 연동 — 현재 모든 발송/관리 화면은 목업 데이터로 동작
- [ ] 멀티 테넌트 라우팅 방식 (서브도메인 vs. 경로 prefix)
- [ ] 다국어 지원 시점
- [ ] 캠페인 변형 v3 (`#/campaign3`)와 본 캠페인 화면의 최종 결정
- [ ] 결제 게이트웨이 선정 (토스/포트원/나이스 등)
- [ ] AI 템플릿 백엔드 모델/프롬프트 정책
- [ ] 시안의 "쏠쏠 브랜드" 단독 404/에러를 맑은 브랜드로 재작업
- [ ] 공용 컴포넌트/타입을 별도 패키지로 추출할지 결정

---

## 11. 프로젝트 문서 관리 레포 (malgn-noti-mng)

[`malgn-noti-mng`](../malgn-noti-mng)는 맑은노티(맑은 메시징) 프로젝트를 **관리**하는 별도 레포다. 프로젝트 운영에 필요한 문서·기록을 집약하고, 이를 웹에서 조망하는 **문서/이력 브라우저 앱**으로 구현한다.

- **목적**: 프로젝트 관련 각종 파일을 보관하고, **프로젝트 문서·기록·진행 사항**을 한곳에서 조망·확인한다.
- **원격 저장소**: <https://github.com/malgnsoft/malgn-noti-mng.git>
- **구현 스택**: `malgn-noti`와 **동일 스택**(Nuxt 3 + Tailwind v4 + Nuxt UI v3, pnpm, Pinia, ESLint) + **@nuxt/content**(`doc/` 마크다운 렌더링). 디자인 시스템(`app/assets/css/main.css`·`app/app.config.ts`)도 그대로 이식해 형제 앱과 시각 일관성 유지. `@nuxtjs/tailwindcss` 미설치 원칙 동일.
  - 화면: `/`(대시보드) · `/docs`(문서 목록·렌더) · `/history`(작업 이력 타임라인). 콘텐츠 소스는 `content.config.ts`에서 `doc/` 트리로 매핑.
  - 개발: `pnpm install` → `pnpm dev`. `better-sqlite3`는 `@nuxt/content`의 SQLite 어댑터 — `package.json`의 `pnpm.onlyBuiltDependencies`로 네이티브 빌드 허용 설정됨.
- **보관 내용**: 여러 레포에 공통 적용되는 핵심 참조 문서(디자인·스택·코딩 컨벤션·WBS), 도메인 기획 정본(회원·인증·계약 등), 일자별 작업 이력 등 `malgn-noti`의 `doc/` 트리 전체를 복사·집약한다.
- **작업 이력 작성처**: 앞으로 일자별 작업 이력(`doc/history/`)은 **이 레포에서 직접 작성·갱신**한다. `malgn-noti`에는 더 이상 신규 history를 만들지 않는다. 상세 규칙은 §7.1 "작업 이력" 참조.
- **현행화 규칙**: 이 `CLAUDE.md`는 `malgn-noti`의 것과 **항상 동일하게** 유지한다 — `malgn-noti`의 내용을 기본으로 하고 관리 레포 보강(본 절)을 더한 형태. 한쪽을 고치면 다른 쪽도 동일하게 반영한다. 정본 문서가 갱신되면 `malgn-noti-mng/doc/`로도 복사해 현행화한다.

### 관련 프로젝트

| 레포 | 역할 |
| --- | --- |
| [`malgn-noti`](../malgn-noti) | 사용자단(테넌트 콘솔) |
| [`malgn-noti-admin`](../malgn-noti-admin) | 운영자 콘솔 |
| [`malgn-noti-api`](../malgn-noti-api) | 백엔드 API |
| [`malgn-noti-mng`](../malgn-noti-mng) | 프로젝트 문서·기록 관리 (본 레포) |
