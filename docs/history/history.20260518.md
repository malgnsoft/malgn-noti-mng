# 2026-05-18 — 디자인 시스템 전면 피벗 (Relay-inspired)

## 한 줄 요약

malgn-notifications 시안 기반 디자인(indigo/sky/Noto Sans KR, 1200px)을 폐기하고, `design_handoff_malgn_noti` 핸드오프의 **Relay-inspired Design System v1.0**(ink 무채색 + 단일 그린 액센트 `#00DC82`, Inter/JetBrains Mono/Pretendard, 1px hairline, 저밀도)로 **전면 교체**. 토큰→셸→발송 전 채널까지 적용하고 `design-system-pivot` 브랜치로 푸시.

---

## 1. 결정 — 디자인 정본 전환

- 사용자가 `design_handoff_malgn_noti` 핸드오프(README/DESIGN_GUIDE/main.css/components/pages, 13화면 hifi) 제공.
- **핵심 충돌**: 핸드오프가 CLAUDE.md의 "시안 = 단일 정본(SoT)" 규정과 정면 충돌. 비가역·대규모 변경이라 방향 확인.
- 사용자 결정: **전면 피벗 — 신규를 정본으로** + **토큰 먼저 → 체크포인트** 단계 진행.
- 시안은 이제 **IA(페이지 목록/라우트)만** 참조, 디자인 언어 정본은 `doc/DESIGN.md`.

## 2. Phase 1 — 토큰 · 폰트 · 문서

- `app/assets/css/main.css`: ink 11단 + accent + semantic 토큰, `@theme`(폰트·accent), 핸드오프 컴포넌트 CSS 이식, 구 토큰 backward-compat 별칭(`--gray-*`→ink로 미적용 화면 색 자동 이행), `prefers-reduced-motion`. **Tailwind v4 / Nuxt UI v3 통합 유지**(`@nuxtjs/tailwindcss` 미설치 원칙 준수).
- `app/app.config.ts`: Nuxt UI `primary`/`neutral` = `zinc`. 그린은 절제 사용 원칙상 `.btn-accent`/`bg-accent`로 명시 적용.
- `nuxt.config.ts`: Noto Sans KR → Inter + JetBrains Mono + Instrument Serif + Pretendard.
- `doc/DESIGN.md`: 909줄 시안 가이드 → Relay v1.0 정본으로 전면 재작성.
- `CLAUDE.md`: 시안=SoT 서술 수정(IA 한정), §2 폰트·디자인시스템 갱신.
- 사고: CSS 주석 내 `*/` 시퀀스(`--gray-*/--primary-*`)가 주석 조기 종료 → PostCSS 파싱 깨짐, 즉시 수정.

## 3. Phase 2a — 셸 + 홈

- `AppGnb.vue`: 2단 GNB → **56px 단일 토pbar**(zap 로고 박스, 호버 드롭다운, `.pill-*` 우측 액션, 모바일 `.drawer-*` USlideover). 프로젝트 실 라우트 메뉴 유지.
- `AppFooter.vue`: 검정 풀블리드 → 화이트 1px hairline.
- `layouts/default.vue`·`auth.vue` 신규 구조.
- `pages/home.vue`: KPI 4-stat, AI 일일 요약 카드(ink-900+그린 Sparkles), 6채널 row, 다크 크레딧 카드, 최근 발송 테이블. 아이콘 lucide 매핑.
- 제품명은 핸드오프 "맑은 노티" 대신 **프로젝트 정본 "맑은 메시징"** 유지(시각만 채택).

## 4. Phase 2b-1 — 발송 공용 컴포넌트 + SMS 레퍼런스

- 공용 프리미티브 신규: `AppModal`/`AppBadge`/`AppFormRow`/`AppRadioGroup`/`AppByteCounter`/`AppEmptyState`, `app/utils/byteLen.ts`.
- 발송 도메인 재작업: `AppSendFormCard`/`AppSendActionsBar`/`AppSendOptionsCard`/`AppConfirmDialog`/`AppSendConfirmDialog`/`AppPhonePreview`/`AppRecipientCard`(신규)/`AppAddressBookDialog`/`AppRecipientFormDialog`/`AppSmsTemplateDialog`(신규)/`AppAdNoticeSms080Dialog`/`AppAIRewriteDialog`.
- `pages/send/sms.vue`: 5-카드 골격(발신→수신자→메시지+iMessage 프리뷰→발송옵션) + 7종 다이얼로그 + 템플릿 잠금/광고 080/AI/예약/비용계산. 토스트는 Nuxt UI `useToast()`.
- `app/types/recipient.ts` 분리 — SFC `<script setup>`은 `export` 불가 → 타입 별도 모듈.

## 5. Phase 2b-2 — 알림톡/RCS/이메일/PUSH/Flow

- 채널 프리뷰 신규: `AppKakaoPreview`(변수 pill)/`AppRcsPreview`/`AppEmailPreview`/`AppPushPreview`, `AppSegmented`, `AppKakaoTemplateDialog`, `AppTemplateVariableTextarea`(변수 영역만 편집).
- `AppRecipientCard`에 `locked`/`lockedHint` prop 추가(알림톡 점진적 disclosure).
- 페이지 재작업: `kakao`(disclosure)/`rcs`(3-단 select+버튼빌더)/`email`(HTML+첨부)/`push`(segmented+토큰)/`flow`(노드 시퀀스).
- `app/types/template.ts` 분리(KakaoTpl).

## 6. Git 푸시

- `main`이 기본 브랜치 → `design-system-pivot` 브랜치 분기 후 푸시.
- 커밋 `a1b4993` — 44개 파일, +5547 / -4393.
- 범위: `app/`·`CLAUDE.md`·`doc/DESIGN.md`·`nuxt.config.ts`. **`doc/history/`는 무관·기존 untracked이라 제외.**
- PR 링크: https://github.com/malgnsoft/malgn-noti/pull/new/design-system-pivot

---

## 산출물 (당일)

- 토큰/설정: `app/assets/css/main.css`, `app/app.config.ts`, `nuxt.config.ts`
- 문서: `doc/DESIGN.md`(재작성), `CLAUDE.md`(SoT 수정), 이 history 파일
- 신규 컴포넌트 14: `AppModal`/`AppBadge`/`AppFormRow`/`AppRadioGroup`/`AppByteCounter`/`AppEmptyState`/`AppRecipientCard`/`AppSmsTemplateDialog`/`AppKakaoPreview`/`AppRcsPreview`/`AppEmailPreview`/`AppPushPreview`/`AppSegmented`/`AppKakaoTemplateDialog`
- 재작업: `AppGnb`/`AppFooter`/`AppSendFormCard`/`AppSendActionsBar`/`AppSendOptionsCard`/`AppConfirmDialog`/`AppSendConfirmDialog`/`AppPhonePreview`/`AppAddressBookDialog`/`AppRecipientFormDialog`/`AppAdNoticeSms080Dialog`/`AppAIRewriteDialog`/`AppTemplateVariableTextarea`
- 페이지: `home`, `send/{sms,kakao,rcs,email,push,flow}`, `layouts/{default,auth}`
- 타입/유틸: `app/types/{recipient,template}.ts`, `app/utils/byteLen.ts`
- 브랜치 `design-system-pivot` (`origin` 푸시 완료)
- 검증: 전 단계 `pnpm dev` 체크포인트 통과 — 컴파일/하이드레이션/Vue 경고 0

## 다음 단계 / 알려진 한계

- **Phase 2b-3 남음**: 이력·통계·주소록·발신정보·메시지관리·캠페인·충전·인증 페이지.
  - 핸드오프 `other-pages.jsx`에 발송조회/통계/주소록/충전/로그인/회원가입 시안 존재.
  - 발신정보·메시지관리·캠페인 등은 **핸드오프에 시안 없음** → 별도 협의 필요.
- 미적용 화면은 backward-compat 별칭으로 **색만** 이행된 상태(간격·폰트·형태는 구 시안).
- `design-system-pivot` → `main` 머지/PR 미생성 (사용자 결정 대기).
- 형제 레포(`malgn-noti-admin`)는 별도 디자인 가이드 필요(공용 코어/사용자단 분리 논의 보류 — 핸드오프가 사용자단 한정).
