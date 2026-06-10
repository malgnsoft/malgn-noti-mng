# 회원가입 절차 — 유형별 정리

> **정본 소스**:
> - 시안 정책 표(사용자 제공 이미지) — 신청 서류·결제 방식·승인 흐름의 기획 정본
> - [`app/pages/signup.vue`](../../app/pages/signup.vue) — 5단계 마법사 실제 구현 (사용자단)
> - [`../malgn-noti-api/src/routes/auth.ts`](../../../malgn-noti-api/src/routes/auth.ts) — 백엔드 `/auth/signup`·`/auth/login` 라우트
> - [`./WBS.md`](../WBS.md) §2-4(회원·결제·계약 정책), §2-6-1(계약관리 정책)
> - [`./history/history.20260601.md`](../history/history.20260601.md) §4 — 사용자단 인증 백엔드 연동 (배포 #49)
>
> **마지막 현행화**: 2026-06-01

---

## 1. 5단계 공통 골격 (모든 유형 동일)

```
Step 1  회원 가입 안내 + 유형 선택  →  Step 2  정보 확인
Step 3  아이디 등록 + 약관 동의      →  Step 4  휴대폰 본인 인증
Step 5  가입 완료 (실 API 호출 + 자동 로그인 → /home)
```

분기는 **Step 1 유형 선택** 직후부터 발생 — Step 2 입력 필드 / Step 1·5의 안내 문구 / 가입 후 화면(계약관리·멀티 계정) 노출 여부가 달라집니다.

---

## 2. 핵심 차이 한눈에

| 항목 | 법인사업자 `corp` | 개인사업자 `sole` | 개인 `personal` |
| --- | --- | --- | --- |
| **Step 2 필수 입력** | 사업자 등록번호 + 회사명 + 대표자명 | 사업자 등록번호 + 회사명 + 대표자명 | 이름 + 주소 |
| **API `companyName`** | 회사명 그대로 | 회사명 그대로 | 본인 이름 (개인은 회사 개념 없음) |
| **API `name`** | 대표자명 | 대표자명 | 본인 이름 |
| **카드 충전 가입 서류** | 사업자 등록증 + 대부업등록증(해당) + 가입신청서 | 동일 | 가입신청서만 |
| **후불 정산 가입 서류** | 위 + **지급이행보증보험증권** | 위 + 지급이행보증보험증권 | ❌ 후불 미지원 |
| **가입 후 승인 (정책)** | 카드: 즉시 / 후불: BackOffice 승인 + 통장사본 | 동일 | ❌ 승인 절차 없음 — 즉시 사용 |
| **멀티 계정 (주·보조)** | ✅ `/account/multi` 탭 노출 | ✅ 노출 | ❌ 탭 미노출 |
| **계약관리** | ✅ `/account/contract` 노출 (계약서 + 지급이행보증보험 첨부 UI) | ✅ 노출 | ❌ 없음 |

---

## 3. 법인사업자(`corp`) 절차

### Step 1 — 안내·유형 선택

- 카드 `법인사업자`(아이콘 `i-lucide-building-2`) 클릭 → 다음
- 안내 서류표: **사업자 등록증 + 대부업등록증(해당업체) + 가입신청서(계약서)** [+ 후불 시 **지급이행보증보험증권**]

### Step 2 — 정보 확인

- **사업자 등록번호** 3-2-5 자리 (3개 입력란)
- **회사명**
- **대표자명**
- `canProceed`: 사업자번호 형식 통과 + 회사명·대표자명 비어있지 않음

### Step 3 — 아이디 등록·약관

- **이메일**(=로그인 ID) + OTP 6자리 인증 → `idVerified=true`
- **비밀번호** 8자 이상 + 확인 일치
- **약관 동의** — 필수 항목 전부 체크

### Step 4 — 휴대폰 본인 인증

- 010/011/016/017/018/019 선택 + 3~4자리 + 4자리
- 인증번호 6자리 → `verified=true`

### Step 5 — 가입 완료 클릭 시 (실 API 호출)

```http
POST /auth/signup
Content-Type: application/json

{
  "companyName": "<회사명>",
  "loginid":     "<이메일>",
  "password":    "<비밀번호>",
  "email":       "<이메일>",
  "name":        "<대표자명>",
  "phone":       "010-XXXX-XXXX"
}
```

→ `201` + JWT → 자동 로그인 → 발급 **고객사 ID** 노출 → `/home` 이동

### 가입 후 화면

- **계약관리** ([`/account/contract`](../../app/pages/account/contract.vue)) — 카드 충전: 카드 등록 후 즉시 / 후불: 계약서 전자 서명 + 사업자 등록증·지급이행보증보험증권 업로드 → BackOffice 승인 대기 → 통장사본 제출 (운영자단 미구현)
- **멀티 계정** ([`/account/multi`](../../app/pages/account/multi.vue)) — 주계정/보조계정 추가, 서비스 담당자 초대 메일 발송 흐름
- **결제 카드** ([`/account/cards`](../../app/pages/account/cards.vue))
- **크레딧 충전·내역** ([`/charge`](../../app/pages/charge/index.vue) · [`/account/credit`](../../app/pages/account/credit.vue))

---

## 4. 개인사업자(`sole`) 절차

**법인사업자와 100% 동일.** 코드상 `isBusiness = userType === 'corp' || 'sole'`로 한 갈래로 묶임.

차이점이 있다면:

- Step 1 카드의 라벨·아이콘(`i-lucide-store` 매장 아이콘)
- 시안 정책 메모상 향후 신용 한도·후불 정책에서 차등이 생길 수 있음 — 현 구현은 동일 처리

→ Step 2~5의 입력·검증·API 호출·가입 후 화면(`계약관리`/`멀티 계정`/`계약서 + 지급이행보증보험`) 모두 법인과 같음.

---

## 5. 개인(`personal`) 절차

### Step 1 — 안내·유형 선택

- 카드 `개인`(아이콘 `i-lucide-user`) 클릭 → 다음
- 안내 서류표: **가입신청서(계약서)** 1건만 (카드 충전 한정 — **후불 미지원**)

### Step 2 — 정보 확인 (사업자와 다름)

- **이름**
- **주소**
- 사업자 등록번호·회사명·대표자명 필드 모두 **표시 안 함** (`v-else` 분기)
- `canProceed`: 이름·주소 비어있지 않음

### Step 3·4 — 사업자와 동일 (이메일·OTP·약관·휴대폰 본인 인증)

### Step 5 — 가입 완료 클릭 시 (실 API 호출)

```http
POST /auth/signup
Content-Type: application/json

{
  "companyName": "<본인 이름>",         // ← 회사 개념이 없어 이름으로 대체
  "loginid":     "<이메일>",
  "password":    "<비밀번호>",
  "email":       "<이메일>",
  "name":        "<본인 이름>",
  "phone":       "010-XXXX-XXXX"
}
```

→ `201` + JWT → 자동 로그인 → 발급 고객사 ID 노출 → `/home`

### 가입 후 화면 (사업자와 다름)

- **계약관리 없음** — 시안 정책: "개인은 계약관리 없음 → 바로 사용 로그인 사용 가능"
- **멀티 계정 없음** — 시안 정책: "개인 선택 시는 멀티계정 추가 탭 보이지 않게"
- **결제 카드** 등록만으로 즉시 충전·발송 가능

---

## 6. 가입 직후 BackOffice 승인 워크플로우 (정책 vs 현재 구현)

| 단계 | 시안 정책 | 현재 백엔드(`/auth/signup`) | 비고 |
| --- | --- | --- | --- |
| 법인/개인사업자 카드 충전 | 즉시 사용 가능 | ✅ `joinState='joined'` 즉시 부여 | 정합 |
| 법인/개인사업자 후불 | 온라인 계약 + BackOffice 승인 + 통장사본 후 사용 | ⚠️ 동일하게 즉시 `joined` | **정책 미구현 — 후속** |
| 개인 | 즉시 사용 가능 | ✅ 즉시 `joined` | 정합 |

→ **즉, 현재는 모든 유형이 동일하게 가입 즉시 로그인 가능**. 후불 승인 게이트는 백엔드 + 운영자단 양쪽 후속 작업.

---

## 7. 화면 노출 차등 — 사용자단 라우트별

| 라우트 | 법인 | 개인사업자 | 개인 |
| --- | --- | --- | --- |
| [`/account/settings`](../../app/pages/account/settings.vue) (회원 정보 변경) | ✅ | ✅ | ✅ |
| [`/account/cards`](../../app/pages/account/cards.vue) (결제 카드 관리) | ✅ | ✅ | ✅ |
| [`/account/password`](../../app/pages/account/password.vue) (비밀번호 변경) | ✅ | ✅ | ✅ |
| [`/account/security`](../../app/pages/account/security.vue) (보안 로그인) | ✅ | ✅ | ✅ |
| [`/account/multi`](../../app/pages/account/multi.vue) (멀티 계정 추가) | ✅ | ✅ | ❌ 정책상 미노출 |
| [`/account/contract`](../../app/pages/account/contract.vue) (계약 관리) | ✅ | ✅ | ❌ |
| [`/account/credit`](../../app/pages/account/credit.vue) (크레딧 내역) | ✅ | ✅ | ✅ |
| [`/account/billing`](../../app/pages/account/billing.vue) (결제 이력 등) | ✅ | ✅ | ✅ |
| [`/account/inquiries`](../../app/pages/account/inquiries.vue) (나의 문의) | ✅ | ✅ | ✅ |

> ⚠️ **현재 구현**: `/account/multi`·`/account/contract`는 모든 유형에서 노출됩니다. 사용자 유형을 store/쿠키에 저장하지 않고 있어 분기 로직이 아직 없음 → 후속 작업으로 `auth.user.companyType` 같은 필드 도입 + GNB·LNB·계정 메뉴 조건부 렌더링 필요.

---

## 8. 알려진 한계 / 후속 작업

| # | 한계 | 상태 |
| --- | --- | --- |
| 1 | ~~`userType`이 백엔드로 전달 안 됨~~ | ✅ **완료(6/2 §7)** — `TB_COMPANY.company_type` 추가, signup Zod 확장, 프런트 전달 |
| 2 | ~~승인 게이트 미구현~~ | ✅ **완료(6/2 §7~§10·§12·§13)** — `TB_COMPANY.approval_state` 4단계(pending/reviewing/approved/rejected) + signup 자동 분기 + 18 라우트 `requireApproved` + 프런트 글로벌 띠·라우트 가드 + biz 첨부 시 자동 reviewing 전이 + lazy backfill |
| 3 | **개인의 멀티 계정·계약관리 메뉴 노출 차단** | 🟢 **부분** — `auth.tenant.companyType`은 노출됨. LNB 분기·`AppMyPageShell` 메뉴 숨김은 후속 |
| 4a | ~~이메일 OTP 미연동~~ | ✅ **완료(6/1 §5)** — `POST /auth/email-code/send`·`/verify` + `TB_VERIFICATION` + SHA-256 + TTL 10분·5회 제한·소비 후 재사용 차단. NHN_MOCK 시 mockCode 응답에 노출 |
| 4b | ~~휴대폰 OTP·본인확인 미연동~~ | ✅ **완료(6/2 §4·§5·§15)** — 자체 SMS OTP 4 purpose(signup·reset·change·**contract_sign**) + NICE 통합인증 인프라(현재 mock). 본인확인은 NICE M(휴대폰)으로 일원화 |
| 5 | **약관 동의 미적재** — Step 3 체크박스는 화면용. `TB_TERMS_AGREEMENT` 무적재 | signup 시 동의 항목 적재 또는 별도 라우트 |
| 6 | ~~서류 업로드 미구현~~ | ✅ **완료(6/2 §11~§14)** — `/contracts/*` 5 라우트 + R2 bucket `malgn-noti-files`. signup auto-create로 가입 직후 'initial' 이용계약 1건 자동 생성. 사업자등록증 첨부 시 자동 reviewing 전이 |
| 7 | **사업자등록번호 검증** — 형식(3-2-5) 외 체크섬·국세청 조회 미적용 | 체크섬 lib 또는 외부 API (P1) |
| 8 | **NICE/NHN 자격증명 real 모드 미** (6/2 §16) | NICE: 콘솔 IP 정책 해결 대기 / NHN Notification Hub: User Access Key + 어댑터 재작성 대기 |

오늘(6/2) §7~§15 작업으로 **§1·§2·§4b·§6 완료**. 남은 핵심은 **§5 약관 적재**와 외부 자격증명(§8).
