# 회원·인증 통합 인덱스

> **목적**: 회원가입·로그인·계정관리·인증·승인 게이트의 **모든 페이지·API·DB 테이블·정책**을 한 곳에서 조망.
> 가입 절차 단계별 상세는 [./pages/SIGNUP.md](./pages/SIGNUP.md), 계약 관리 페이지는 [./pages/CONTRACT.md](./pages/CONTRACT.md),
> NICE 본인확인 인프라는 [./NICE_AUTH.md](./NICE_AUTH.md), 일자별 작업 이력은
> [./history/history.20260601.md](./history/history.20260601.md) §4·§5 / [./history/history.20260602.md](./history/history.20260602.md) §4~§16 참조.
>
> **마지막 현행화**: 2026-06-02 (§11~§16 반영 — 계약·서류 R2 라우트, reviewing 상태 추가, 계약 서명 본인인증, NICE/NHN 운영 상태)

---

## 1. 사용자단 페이지 (`malgn-noti`)

### 1.1 가입·로그인·재설정 (인증 게이트 — `meta.auth: false`)

| 라우트 | 파일 | 목적 | 백엔드 연동 |
| --- | --- | --- | --- |
| `/signup` | [signup.vue](../app/pages/signup.vue) | 5단계 마법사. Step 3 이메일 OTP · Step 4 NICE 본인확인 · Step 5 가입 + 자동 로그인 + 유형 분기 | ✅ `/auth/email-code/*` · `/auth/nice/*` · `/auth/signup` |
| `/login` | [login/index.vue](../app/pages/login/index.vue) | 이메일/아이디 + 비밀번호 (회사 자동 매칭) | ✅ `POST /auth/login-by-email` |
| `/login/security` | [login/security.vue](../app/pages/login/security.vue) | 보안로그인 추가 인증(OTP/이메일) | ⚪ 백엔드 미구현 |
| `/reset-password` | [reset-password/index.vue](../app/pages/reset-password/index.vue) | 비밀번호 재설정 요청 | ⚪ OTP 인프라 재활용 가능 |
| `/reset-password/new` | [reset-password/new.vue](../app/pages/reset-password/new.vue) | 새 비밀번호 입력 | ⚪ |
| `/invite` | [invite.vue](../app/pages/invite.vue) | 초대 메일 링크 → 멀티계정 등록 | ⚪ `TB_MANAGER_INVITE` 라우트 미구현 |

### 1.2 계정 관리 (`/account/*`, 인증 필요)

| 라우트 | 파일 | 목적 | 백엔드 연동 |
| --- | --- | --- | --- |
| `/account/settings` | [settings.vue](../app/pages/account/settings.vue) | 회원 정보 변경 (이름·휴대폰·회사 전화·결제 이메일·광고 수신) | ✅ `GET /me` · `PATCH /me` · `PATCH /me/company`. 이메일·휴대폰 변경 다이얼로그는 OTP 미연결(후속) |
| `/account/contract` | [contract.vue](../app/pages/account/contract.vue) | 계약서·전자서명·**사업자등록증 제출/재제출** (미승인 사용자 메인 진입점). 상세는 [pages/CONTRACT.md](./pages/CONTRACT.md) | ✅ `/contracts/*` 5 라우트 + R2 업로드 + 휴대폰 본인인증 서명 — 운영자 승인 화면만 미구현 |
| `/account/password` | [password.vue](../app/pages/account/password.vue) | 비밀번호 변경 | ⚪ `POST /auth/password` 미구현 |
| `/account/security` | [security.vue](../app/pages/account/security.vue) | 보안로그인 토글 (2FA: OTP/이메일) | ⚪ `PATCH /me/security` 미구현 |
| `/account/multi` | [multi.vue](../app/pages/account/multi.vue) | 서비스 담당자 초대 (사업자만) | ⚪ `/manager-invites` 미구현 |
| `/account/cards` | [cards.vue](../app/pages/account/cards.vue) | 결제 카드 관리 | ⚪ `/payment-methods` 부분 |
| `/account/billing` | [billing.vue](../app/pages/account/billing.vue) | 결제 이력 | ⚪ |
| `/account/credit` | [credit.vue](../app/pages/account/credit.vue) | 크레딧 내역·영수증 | ⚪ `/credit-ledger` 부분 |
| `/account/inquiries` · `/detail` | [inquiries/](../app/pages/account/inquiries/) | 나의 문의 목록·상세 | ⚪ `/inquiries` 부분 |
| `/account/inquiry` · `/complete` | [inquiry/](../app/pages/account/inquiry/) | 문의 작성·완료 | ⚪ |

공통 셸: [`AppMyPageShell`](../app/components/AppMyPageShell.vue) — 좌측 메뉴 + 본문 슬롯.

### 1.3 회원·인증 관련 공용 컴포넌트

| 컴포넌트 | 용도 |
| --- | --- |
| [AppApprovalBanner](../app/components/AppApprovalBanner.vue) | **사업자등록증 심사 상태 글로벌 띠** — layout 최상단, pending/reviewing=warning · rejected=danger+사유. CTA(pending="등록"·reviewing="진행 상태 보기"·rejected="다시 제출하기") |
| [AppSignupTermsDialog](../app/components/AppSignupTermsDialog.vue) | 약관 동의 모달 |
| [AppMemberInfoPanel](../app/components/AppMemberInfoPanel.vue) | 회원 정보 표시·편집 패널 — 승인 배너 + isLocked 입력 disabled |
| [AppEmailChangeDialog](../app/components/AppEmailChangeDialog.vue) | 이메일 변경 + OTP (실 API 미연결) |
| [AppPhoneVerifyDialog](../app/components/AppPhoneVerifyDialog.vue) | 휴대폰 본인 인증 (실 API 미연결) |
| [AppCardListPanel](../app/components/AppCardListPanel.vue) · [AppCardAddDialog](../app/components/AppCardAddDialog.vue) | 결제 카드 |
| [AppManagerInviteDialog](../app/components/AppManagerInviteDialog.vue) | 서비스 담당자 초대 |
| [AppContractPanel](../app/components/AppContractPanel.vue) · [AppContractSignDialog](../app/components/AppContractSignDialog.vue) · [AppContractViewDialog](../app/components/AppContractViewDialog.vue) | 계약 관리 — 사업자등록증 제출 + 전자서명. **실 API 연동 완료** (§11~§15). 서명 다이얼로그에 휴대폰 본인인증 sub-step 포함 |

### 1.4 인프라 (인증 글루)

| 파일 | 역할 |
| --- | --- |
| [composables/useApi.ts](../app/composables/useApi.ts) | `$fetch` 래퍼 + `auth-token` 쿠키 + Bearer 자동 주입 + 401 처리 (`/auth/*` 호출은 호출자 처리, 그 외 만료 시 `/login` 리다이렉트) |
| [stores/auth.ts](../app/stores/auth.ts) | Pinia: `signup`/`login`/`loginByEmail`/`fetchMe`/`updateMe`/`updateCompany`/`logout` 액션 + AuthUser/AuthCompany 풀 타입 |
| [middleware/auth.global.ts](../app/middleware/auth.global.ts) | 토큰 쿠키 가드 (SSR 안전) |
| [middleware/approval.global.ts](../app/middleware/approval.global.ts) | **사업자등록증 승인 게이트** — 미승인이면 차단 페이지 접근 시 `/account/contract`로 리다이렉트 |
| [plugins/auth.client.ts](../app/plugins/auth.client.ts) | 클라이언트 부트스트랩 — 토큰 쿠키 있으면 `/me`로 스토어 hydrate |
| [layouts/default.vue](../app/layouts/default.vue) | `AppApprovalBanner` → `AppGnb` → main → `AppFooter` |
| `auth-token` 쿠키 | JWT 7일·SameSite=Lax·secure-in-prod (HttpOnly 아님 — 후속에서 백엔드 Set-Cookie로 강화) |

### 1.5 시스템 페이지 (인증 관련 안내)

| 라우트 | 파일 | 비고 |
| --- | --- | --- |
| `/templete/email/reset-password` | [reset-password.vue](../app/pages/templete/email/reset-password.vue) | 이메일 인증 메일 템플릿(미연동) |
| `/templete/email/verify` | (시안에 있으나 미작성) | 가입 인증 메일 템플릿 |

---

## 2. 사업자등록증 심사 승인 게이트 (NEW — 2026-06-02)

> 정책: 법인사업자(corp) / 개인사업자(sole)는 가입 후 사업자등록증 심사 승인을 받아야
> 서비스 이용 및 가입 정보 수정 가능. 개인(personal)은 즉시 사용 가능.

### 2.1 승인 상태 (`approval_state`) — 4단계 (§7·§12)

| 상태 | 의미 | 진입 트리거 | 가능한 동작 |
| --- | --- | --- | --- |
| `pending` | 사업자가 가입 직후 — 사업자등록증 미제출 | corp/sole signup | 조회·계약 관리·1:1 문의만 |
| `reviewing` | 사업자등록증 제출 후 — 운영자 심사 대기 | `POST /contracts/files` kind=biz 시 자동(§12) | 조회·계약 관리·1:1 문의만 |
| `approved` | 운영자가 승인 또는 개인 가입자 | 운영자(BackOffice, 미구현) / personal signup | 모든 서비스 |
| `rejected` | 운영자가 반려 (`rejected_reason` 함께) | 운영자(BackOffice, 미구현) | 조회·계약 관리(재제출)·1:1 문의만. **재첨부 시 자동 `reviewing`으로 전이** (§12) |

상세 분기는 [./pages/CONTRACT.md §3.1·§6.2·§7.3](./pages/CONTRACT.md).

### 2.2 미승인 사용자 UX 흐름

1. **가입 완료** → Step 5 → 사업자: `/account/contract` / 개인: `/home`
2. **로그인** → `fetchMe` → `approval_state !== 'approved'` → 어떤 경로로 가도 미들웨어가 `/account/contract`로 자동 이동
3. **글로벌 띠** (모든 페이지 상단) — `AppApprovalBanner` 3분기 안내 + CTA
4. **다른 페이지 시도** (`/home`·`/send/*`·`/contacts` 등) → 즉시 `/account/contract`로 리다이렉트
5. **사업자등록증 업로드** → 백엔드가 자동 `pending → reviewing` 전이 + `auth.fetchMe()`로 store 갱신 → 글로벌 띠·페이지 배너 즉시 "심사 중"으로 전환 (§12)
6. **승인 완료** → 모든 페이지 정상 접근 + `/home` 진입 가능
7. **§11 배포 이전 가입자 / §12 배포 이전 첨부자** — GET 시점 lazy backfill로 자동 복구 (§13)

### 2.3 백엔드 가드

`src/middleware/approval.ts` — `requireApproved()` 미들웨어를 18 라우트(`send`·`contacts`·`sender-phones` 등)에 일괄 적용. **`mutate-only` 모드 — POST/PATCH/PUT/DELETE만 차단**, GET 조회는 허용. `/me`의 PATCH도 §7에서 인라인으로 차단.

예외:
- `/inquiries` — 승인 관련 문의 가능해야 함 → 미적용
- `/dispatch-history` · `/credit-ledger` — GET 전용이라 자동 통과

### 2.4 프런트 가드

`middleware/approval.global.ts` — 허용 경로 외 접근 시 자동 리다이렉트:

**허용**:
- `/account/*` (계약·회원 정보·문의)
- `/help` · `/guide` · `/wbs` (정적 문서)
- `/inquiry` (1:1 문의)
- `meta.auth: false` (로그인·가입 등)

**차단 → `/account/contract`**:
- `/home` · `/send/*` · `/history/*` · `/contacts/*` · `/sender/*` · `/manage/*` · `/campaign*` · `/charge*`

---

## 3. 운영자단 페이지 (`malgn-noti-admin`, 기획 MD만 존재)

| 기획 MD | 라우트(예정) | 역할 |
| --- | --- | --- |
| [member/company.md](../../malgn-noti-admin/doc/pages/member/company.md) | `/admin/member/company` · `/[id]` | 고객사 목록·**승인/반려**·한도·차단 |
| [member/account.md](../../malgn-noti-admin/doc/pages/member/account.md) | `/admin/member/account` · `/[id]` | 개별 사용자 계정·OTP 진단·임시 비번·2FA 초기화 |
| [member/audit.md](../../malgn-noti-admin/doc/pages/member/audit.md) | `/admin/member/audit` | 감사 로그 |
| [member/block.md](../../malgn-noti-admin/doc/pages/member/block.md) | `/admin/member/block` | 강제 차단·복구 |

→ **운영자단 화면은 모두 미개발**(셸 + 기획만). 사업자 승인은 현재 라이브 DB 직접 UPDATE로만 처리 가능. **승인 화면은 P0 1순위**.

---

## 4. API 엔드포인트 (`malgn-noti-api`)

### 4.1 인증 (`src/routes/auth.ts`)

| 라우트 | 요청 | 응답 | 상태 |
| --- | --- | --- | --- |
| `POST /auth/signup` | `{companyName, companyType?, loginid, password, name?, email?, phone?, niceSession?}` | `201 {data:{user, company, token}}`. companyType='corp'/'sole'면 `approval_state='pending'` 자동, 그 외 'approved' | ✅ |
| `POST /auth/login` | `{companyId, loginid, password}` | `200 {data:{user, company, token}}` (legacy — 사용 안 함) | ✅ |
| `POST /auth/login-by-email` | `{email, password}` | `200 {data:{user, company, token}}` — loginid 전역 UNIQUE 기반 단일 매치 | ✅ |
| `POST /auth/email-code/send` | `{email, purpose:'signup'/'reset_password'/'change_email'}` | `200 {data:{sent, expiresAt, mockCode?}}` | ✅ (NHN 자격증명 등록 전까지 mock fallback) |
| `POST /auth/email-code/verify` | `{email, purpose, code}` | `200 {data:{verified}}` | ✅ |
| `POST /auth/phone-code/send` | `{phone, purpose:'signup'/'reset_password'/'change_phone'/'contract_sign'}` | `200 {data:{sent, expiresAt, mockCode?}}` | ✅ (자체 SMS OTP — NICE와 별개. §15에서 `contract_sign` 추가) |
| `POST /auth/phone-code/verify` | `{phone, purpose, code}` | `200 {data:{verified}}` | ✅ |
| `POST /auth/nice/init` | `{purpose:'signup'/'change_phone'}` | `200 {data:{sessionId, authUrl, mockMode}}` | ✅ |
| `POST /auth/nice/callback` | NICE form `web_transaction_id` | HTML (자동 팝업 닫기) | ✅ |
| `GET /auth/nice/status?session=…` | — | `200 {data:{state, name?, birthdate?, ...}}` | ✅ |
| `POST /auth/password` | `{currentPassword, newPassword}` | TBD | ⚪ |
| `POST /auth/password/reset` | `{email, code, newPassword}` | TBD | ⚪ |
| `POST /auth/agree-terms` | `{terms:[{id, version, requiredYn}]}` | TBD | ⚪ |
| `POST /auth/logout` | (Bearer) | TBD | ⚪ — 클라이언트 쿠키 삭제만 |

### 4.2 현재 사용자 (`src/routes/me.ts`)

| 라우트 | 요청 | 응답 | 상태 |
| --- | --- | --- | --- |
| `GET /me` | Bearer | `200 {data:{user, company, ctxRole}}` — TB_USER 13 + TB_COMPANY 17 컬럼 풀 노출(approvalState 포함) | ✅ |
| `PATCH /me` | `{name?, phone?}` | `200 {data:...}` — `approval_state !== 'approved'`면 403 | ✅ |
| `PATCH /me/company` | `{companyPhone?, billingEmail?, adReceive?}` | `200 {data:...}` — owner/admin만 + 승인 게이트 | ✅ |
| `PATCH /me/security` | `{securityLoginYn, securityLoginMethod}` | TBD | ⚪ |

### 4.3 승인 게이트 미들웨어 (`src/middleware/approval.ts`)

`requireApproved({method?: 'mutate-only' | 'all'})` — 적용 라우트 18종:
- `/send/*` · `/contacts` · `/contact-groups` · `/optout-entries`
- `/sender-phones` · `/rcs-brands` · `/email-domains` · `/push-certs` · `/kakao-sender-profiles` · `/kakao-profile-groups` · `/optout-080-numbers`
- `/templates` · `/template-categories` · `/landing-pages`
- `/flow-definitions` · `/export-jobs`
- `/payment-methods` · `/company-settings`

미승인이면 변경(POST/PATCH/PUT/DELETE) 차단 → 403 + 상황별 메시지(pending: 심사 후 가능, rejected: 사유 안내).

### 4.4 서비스 담당자 초대 (미구현)

| 라우트 | 상태 |
| --- | --- |
| `GET/POST /manager-invites` · `POST /{token}/accept` · `DELETE /{id}` | ⚪ |

### 4.5 계약·서류 (`src/routes/contracts.ts`, §11)

| 라우트 | 상태 | 비고 |
| --- | --- | --- |
| `GET /contracts` | ✅ | 본 회사 계약 목록. §13 lazy auto-create (corp/sole + 0건 → 'initial' 자동) |
| `POST /contracts/:id/sign` | ✅ | 전자서명 완료 → done + signed_at + expires_at=+2y. renew면 다른 done 자동 expired |
| `GET /contracts/files` | ✅ | 본 회사 파일 목록. §13 자동 회복 (pending + biz 파일 ≥1 → reviewing) |
| `POST /contracts/files` | ✅ | 멀티파트 PDF·10MB R2 적재 + DB insert. §12 kind=biz면 자동 `pending|rejected → reviewing` |
| `GET /contracts/files/:id/download` | ✅ | R2 stream → application/pdf |
| `DELETE /contracts/files/:id` | ✅ | R2 + DB 삭제 (사용자단은 rejected 상태에서만 호출 §14) |

상세는 [./pages/CONTRACT.md §8](./pages/CONTRACT.md#8-api-엔드포인트--구현됨-11).

### 4.6 R2 bucket

| 바인딩 | bucket | 용도 |
| --- | --- | --- |
| `FILES` | `malgn-noti-files` | 사업자등록증·대부업등록증·보험증권 등 계약 첨부 (§11) |

### 4.7 운영자단 (미구현, `/admin/*`)

| 라우트 | 상태 |
| --- | --- |
| `GET /admin/companies` · 목록 + 필터 | ⚪ |
| `POST /admin/companies/{id}/approve` · `POST /reject {reason}` | ⚪ — 현재 라이브 DB 직접 UPDATE |
| `GET /admin/users` · 강제 비활성·2FA 초기화·임시 비번 | ⚪ |

---

## 5. DB 테이블 (회원·인증 관련)

### 5.1 핵심 (라이브 + schema.ts)

| 테이블 | 핵심 컬럼 | schema.ts | 라이브 |
| --- | --- | --- | --- |
| `TB_COMPANY` | name, **company_type**, **approval_state**, **rejected_reason**, biz_no, biz_type, ceo_name, up_tae, up_jong, address, company_phone, billing_email, credit_balance, ad_receive, status | ✅ | ✅ |
| `TB_USER` | company_id, **loginid(UNIQUE 전역)**, email, password_hash, name, phone, **birthdate**, **gender**, **national_info**, **ci(UNIQUE)**, **mobile_co**, role, member_type, security_login_yn, security_login_method, join_state, status, last_login_at | ✅ | ✅ |
| `TB_COMPANY_SETTINGS` | 테넌트별 발송 설정 | ✅ | ✅ |
| `TB_VERIFICATION` | target_type(email/phone), target, code_hash, purpose, attempts, expires_at, consumed_at | ✅ | ✅ |
| `TB_NICE_AUTH` | request_no, transaction_id, ticket, iterators, state(pending/completed/failed/expired/consumed), name, birthdate, gender, ci, di, mobile_no, mobile_co, expires_at, consumed 후 재사용 차단 | ✅ | ✅ |
| `TB_SESSION` | 발급 JWT 추적용 (logout revoke 시) | ⚪ | ✅ |

### 5.2 멀티 계정·초대 (라이브 있음, schema.ts 미정의)

| 테이블 | 역할 |
| --- | --- |
| `TB_MEMBER_VERIFICATION` | 멀티계정 본인 확인 |
| `TB_MANAGER_INVITE` | 서비스 담당자 초대 토큰 |

### 5.3 약관 (라이브 미확정)

| 테이블 | 역할 |
| --- | --- |
| `TB_TERMS` | 약관 정본 (추정) |
| `TB_TERMS_AGREEMENT` | 동의 기록 (추정) |

→ schema.ts 미정의. 후속 작업에서 확정.

### 5.4 계약 (라이브 + schema.ts §11)

| 테이블 | 핵심 컬럼 | schema.ts | 라이브 |
| --- | --- | --- | --- |
| `TB_CONTRACT` | company_id, title, version, **contract_state**(initial/done/renew/expired), status, signer_user_id, signed_at, expires_at | ✅ | ✅ |
| `TB_CONTRACT_FILE` | contract_id, **name**(한국어 접두사로 종류 구분 — `사업자등록증_`/`대부업등록증_`/`지급이행보증보험증권_`), size_bytes, **r2_key**, uploaded_at | ✅ | ✅ |

상세 스키마 + 정책: [./pages/CONTRACT.md §9](./pages/CONTRACT.md#9-db-테이블-라이브--schemats-정의-11).

### 5.5 결제 / DDL 이력

| 테이블 / 마이그레이션 | 상태 |
| --- | --- |
| `TB_PAYMENT_METHOD` | ✅ |
| `0001_idempotency.sql` · `0002_export_flow.sql` · `0003_user_loginid_global_unique.sql` · `0004_nice_auth.sql` · `0005_company_approval.sql` | 모두 라이브 적용 완료 |

---

## 6. 정책 결정 사항

> 상세: [./pages/SIGNUP.md](./pages/SIGNUP.md), [./NICE_AUTH.md](./NICE_AUTH.md), [./WBS.md](./WBS.md) §2-4·§2-6

### 6.1 회원 유형 (`company_type`)

`corp` (법인사업자) · `sole` (개인사업자) · `personal` (개인) 3종. signup 시 전달, TB_COMPANY 적재.

### 6.2 결제 방식

- 법인·개인사업자: **카드 충전** 또는 **후불 결제** 선택
- 개인: **카드 충전만**

### 6.3 가입 직후 승인 (구현 완료)

| 회사 유형 | `approval_state` 초기값 | 서비스 이용 | 정보 수정 |
| --- | --- | --- | --- |
| 법인사업자 `corp` | `pending` → biz 첨부 시 `reviewing` (§12) | ❌ | ❌ |
| 개인사업자 `sole` | `pending` → biz 첨부 시 `reviewing` (§12) | ❌ | ❌ |
| 개인 `personal` | `approved` | ✅ | ✅ |

운영자 승인 → `approved` 또는 반려 → `rejected` + `rejected_reason`. 반려 후 재첨부 시 자동 `reviewing`으로 재진입. 사용자단·백엔드 둘 다 게이트 적용 완료. 운영자단 승인 화면은 미구현(P0).

### 6.4 loginid 전역 UNIQUE

`TB_USER.loginid` 전역 UNIQUE (0003). "한 이메일 = 한 회사 = 한 로그인". 회원가입 마법사는 `loginid = email`로 발급.

### 6.5 멀티 계정

법인·개인사업자만 주계정 + 보조계정 추가 가능. 개인은 `/account/multi` 탭 미노출(현재 코드 모두 노출 — 후속).

### 6.6 비밀번호 정책

`min 8자` (현 검증). 영문·숫자·특수문자 조합 8자 이상은 표시 문구만, 검증은 없음.

### 6.7 본인 확인 / OTP

| 채널 | 단순 OTP (소유 검증) | 본인 확인 (NICE) |
| --- | --- | --- |
| 이메일 | ✅ `/auth/email-code/*` (signup·reset·change) | — |
| 휴대폰 | ✅ `/auth/phone-code/*` (signup·reset·change·**contract_sign**) | ✅ `/auth/nice/*` (signup의 Step 4 메인) |

자체 SMS OTP는 단순 휴대폰 보유 확인 — 비밀번호 재설정·**계약서 전자서명 직전 본인 확인**(§15) 등에 활용. **회원가입 본인 확인은 NICE M(휴대폰)으로 일원화** (NICE 자격증명 발급 후 real 모드 전환 — 현재 mock. §16 참조).

### 6.8 외부 자격증명 운영 상태 (§16)

| 서비스 | 현재 | 보류 사유 |
| --- | --- | --- |
| **NICE 본인확인** | mock (`NICE_MOCK=1`). CLIENT_ID/SECRET/RETURN_URL 3 secret은 등록 후 보관 | 콘솔 IP 화이트리스트(에러 1007). 사용자 콘솔 작업 대기 |
| **NHN Notification Hub** | mock (`NHN_MOCK=1`). AppKey만 수령 | User Access Key + Secret Access Key 미수령 + Bearer 토큰 인증으로 어댑터 재작성 필요 |

키 수령·정책 해결 시 mock 제거 + 어댑터 교체 + e2e — 상세는 [history.20260602.md §16](./history/history.20260602.md#16-운영-노트--nice--nhn-notification-hub-자격증명-시도와-보류-라이브-운영-변경).

### 6.9 NICE 본인확인 + CI 중복 가입 차단

NICE 응답의 `ci`는 사이트 간 동일인 식별자. `TB_USER.ci UNIQUE`로 한 사람이 두 회사에 가입 불가. signup 시 사전 검사 — 중복이면 409 "이미 가입된 사용자입니다. 비밀번호 재설정으로 진행해 주세요."

---

## 7. 보안 모델

| 항목 | 현재 | 비고 |
| --- | --- | --- |
| **비밀번호 저장** | PBKDF2-SHA256 (`src/lib/password.ts`) | OK |
| **JWT** | HS256, 만료 7일, sub=userId, cid=companyId, role | OK |
| **JWT 저장** | `auth-token` 쿠키, SameSite=Lax, secure-in-prod, HttpOnly **아님** | 백엔드 Set-Cookie 미사용 — 후속 강화 |
| **OTP 코드 저장** | SHA-256(target\|purpose\|code) 해시만 (평문 금지) | OK |
| **NICE 본인 확인** | AES-256-GCM + PBKDF2 + HMAC 무결성 검증 (Web Crypto) | OK |
| **승인 게이트** | DB `approval_state` + 백엔드 미들웨어 + 프런트 미들웨어 | OK (운영자단 승인 UI 미) |
| **세션 revoke** | 클라이언트 쿠키 삭제만 (`TB_SESSION` 미구현) | ⚪ |
| **CORS 화이트리스트** | 백엔드 미설정 → 모두 허용 | 후속 |
| **Rate limit** | 발송·검증·로그인 모두 없음 | 후속 (Cloudflare KV·Durable Objects 검토) |
| **감사 로그** | mutating 액션 미적재 (`TB_AUDIT_LOG`) | 후속 |

---

## 8. 현 구현 상태 한눈에

| 항목 | 백엔드 | 프런트 | 비고 |
| --- | --- | --- | --- |
| 회원가입 (signup) | ✅ | ✅ | companyType 전달, Step 5 유형 분기 |
| 이메일 OTP | ✅ | ✅ | NHN 자격증명 발급 후 실 메일 발송 |
| 휴대폰 SMS OTP | ✅ | ✅ | signup Step 4는 NICE로 대체 |
| NICE 본인확인 | ✅ | ✅ | mock 모드 — NICE 자격증명 발급 후 real |
| 로그인 (이메일 + 비번) | ✅ | ✅ | login-by-email 단일 매치 |
| /me 조회 | ✅ | ✅ | 풀 컬럼(승인 정보 포함) |
| 사용자 정보 변경 (PATCH /me) | ✅ | ✅ | name·phone — 승인 게이트 |
| 회사 정보 변경 (PATCH /me/company) | ✅ | ✅ | companyPhone·billingEmail·adReceive — owner/admin + 승인 게이트 |
| **승인 게이트 (DB + 18 라우트 + 프런트)** | ✅ | ✅ | 운영자단 승인 UI 미 — DB 직접 UPDATE로 임시 |
| **reviewing 자동 전이** (biz 첨부 시) | ✅ | ✅ | §12 + §13 lazy 회복 |
| **계약·서류 R2 업로드 + DB** | ✅ | ✅ | §11 — `/contracts/*` 5 라우트 + FILES R2 bucket |
| **이용계약 자동 'initial' 생성** | ✅ | — | signup auto-create (§11) + lazy backfill (§13) |
| **계약 서명 다이얼로그 휴대폰 본인인증** | ✅ | ✅ | §15 — `contract_sign` purpose + 공인인증서 탭 제거 |
| **사업자등록증 행 상태 배지 + 반려 시 삭제** | ✅ | ✅ | §14 |
| 로그아웃 | 클라이언트 쿠키 삭제 | ⚪ GNB 미연동 | 30분 작업 |
| 비밀번호 재설정 | ⚪ | ⚪ | OTP 인프라 재활용 — 다음 작업 후보 |
| 비밀번호 변경 | ⚪ | ⚪ | |
| 보안로그인 (2FA) | ⚪ | ⚪ | OTP 인프라 재활용 |
| 약관 동의 적재 | ⚪ | 화면용 토스트 | `TB_TERMS_AGREEMENT` |
| 이메일 변경 (OTP) | ⚪ | 다이얼로그만 | `POST /me/email-change/*` |
| 서비스 담당자 초대 | ⚪ | 화면 더미 | `/manager-invites` |
| 회원 탈퇴 | ⚪ | "곧 지원" 안내 | `DELETE /me` |
| 운영자단 승인 화면 | ⚪ | ⚪ | 운영자단 화면 전체 미개발 — **P0 1순위** |
| 실 메일 발송 (NHN) | mock | — | NHN Notification Hub 자격증명 + 어댑터 재작성 (§16) |
| 실 SMS 발송 (NHN) | mock | — | 동일 |
| 실 NICE 호출 | mock | — | NICE 콘솔 IP 정책 해결 + secret 보관 중 (§16) |

---

## 9. 알려진 한계 / 다음 작업

### P0 — 인증 폐쇄 루프

1. **운영자단 사업자 승인 화면** (P0 1순위) — 현재 라이브 DB 직접 UPDATE로만 처리. `/admin/companies/:id/{approve,reject}` 라우트 + UI. 승인 시 `reviewing → approved`, 반려 시 `reviewing → rejected + rejected_reason`. WBS 5-4-3.
2. **NHN Notification Hub 자격증명 + 어댑터 재작성** — User Access Key 수령 시 어댑터 OAuth/Bearer로 교체 + e2e (§16).
3. **로그아웃 GNB 실 액션** — `useAuthStore().logout()` 연결 (30분).
4. **비밀번호 재설정** — OTP 인프라 재활용, `purpose='reset_password'` (2~3시간).
5. ~~**계약·서류 업로드 라우트 + R2**~~ — ✅ §11에서 완료. `/contracts/*` 5 라우트 + R2 bucket + 사용자단 연동.

### P1 — 정책 통합

5. **약관 동의 적재** — `TB_TERMS` + `TB_TERMS_AGREEMENT` 라우트 + signup 통합
6. **개인 유형 LNB/메뉴 분기** — `/account/multi`·`/account/contract` 등 사업자 전용 메뉴 숨김
7. **사업자등록번호 체크섬** — 프런트 검증
8. **승인 완료 자동 알림** — 이메일·SMS trigger
9. **GNB 메뉴 항목 disabled (미승인)** — 시각적으로 비활성화 (현재는 미들웨어 리다이렉트만)
10. **승인 완료 후 자동 새로고침** — WebSocket 또는 폴링

### P2 — 계정 관리

11. **`POST /auth/password` + `/account/password`** — 비밀번호 변경
12. **이메일 변경 OTP** — `POST /me/email-change/{request,confirm}`
13. **`PATCH /me/security` + `/account/security`** — 2FA
14. **`/manager-invites` + `/account/multi`** — 서비스 담당자 초대
15. **`DELETE /me` (회원 탈퇴)** — soft-delete + 데이터 정책

### P3 — 외부 의존

16. **NICE 통합인증 계약 + Outbound IP 협상** — [./NICE_AUTH.md §9·§10](./NICE_AUTH.md) 참조
17. **NHN 이메일 자격증명 등록** — 실 메일 발송 활성화
18. **NHN SMS 자격증명 등록** — 비밀번호 재설정·휴대폰 변경 OTP 실 발송

### 위생적 작업

19. **`schema.ts`에 누락된 회원·인증 테이블 정의** — `TB_SESSION`·`TB_TERMS`·`TB_TERMS_AGREEMENT`·`TB_MEMBER_VERIFICATION`·`TB_MANAGER_INVITE` (`TB_CONTRACT`·`TB_CONTRACT_FILE`은 §11에서 추가 완료)
20. **운영 절차 다중화** — Aurora SG 접근 다중화 (Cloudflare Tunnel·RDS Proxy 등)
21. **NICE secret 회전** (§16.1) — IP 정책 해결 시점에 CLIENT_SECRET 회전 권장 (오늘 채팅에 평문 노출)
