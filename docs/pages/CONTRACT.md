# `/account/contract` — 계약 관리 기획·로직 정본

> **목적**: 사업자등록증 등록·심사·이용계약 전자체결·가입 서류 첨부를 한 화면에서 관리.
> 회원가입한 사업자(`corp`/`sole`)의 **미승인 상태 메인 진입점** + 승인 후 계약 갱신·서류 관리 화면.
>
> **연관**: [./SIGNUP.md](./SIGNUP.md) §3·§4 / [../MEMBERSHIP.md](../MEMBERSHIP.md) §1.2·§2·§8 /
> [../history/history.20260602.md](../history/history.20260602.md) §7·§10·§11·§12·§13·§14·§15
>
> **마지막 현행화**: 2026-06-02 (§15 반영)

---

## 1. 페이지 개요

| 항목 | 값 |
| --- | --- |
| 라우트 | `/account/contract` |
| 파일 | [`app/pages/account/contract.vue`](../../app/pages/account/contract.vue) |
| 메인 컴포넌트 | [`AppContractPanel`](../../app/components/AppContractPanel.vue) (~770 라인) |
| 보조 컴포넌트 | [`AppContractViewDialog`](../../app/components/AppContractViewDialog.vue) — 계약서 미리보기 / [`AppContractSignDialog`](../../app/components/AppContractSignDialog.vue) — 본인인증 + 전자서명 3-스텝 위저드 (~700 라인) / [`AppUploadGuideDialog`](../../app/components/AppUploadGuideDialog.vue) / [`AppFilePreviewDialog`](../../app/components/AppFilePreviewDialog.vue) |
| 공통 셸 | [`AppMyPageShell`](../../app/components/AppMyPageShell.vue) — 나의 페이지 좌측 메뉴 + 본문 슬롯 |
| 접근 권한 | 인증된 사업자(`corp` / `sole`)만 — 개인(`personal`)은 메뉴 미노출(후속) |

---

## 2. 진입 경로 — 4가지

미승인 상태의 사업자가 이 화면에 도달하는 경로 4가지가 모두 정합되어 있어야 한다.

### 2.1 회원가입 직후 (자동)

```
/signup Step 5 → "계약 관리로 이동" 버튼
  → if isBusiness: navigateTo('/account/contract')
     else: navigateTo('/home')
```

코드: [signup.vue `finish()`](../../app/pages/signup.vue#L456)

### 2.2 로그인 직후 (자동)

```
/login → loginByEmail() → fetchMe()
  → if approvalState !== 'approved': navigateTo('/account/contract')
     else: navigateTo(redirect ?? '/home')
```

코드: [login/index.vue `onLogin()`](../../app/pages/login/index.vue#L44)

### 2.3 미들웨어 리다이렉트 (다른 차단 페이지 시도)

```
/home·/send/*·/contacts·… 진입 시도
  → middleware/approval.global.ts
  → if approvalState !== 'approved' && path ∉ ALLOWED_PREFIXES:
       return navigateTo('/account/contract')
```

허용 경로: `/account/*` · `/help` · `/guide` · `/wbs` · `/inquiry` · `meta.auth: false`
코드: [middleware/approval.global.ts](../../app/middleware/approval.global.ts)

### 2.4 글로벌 띠 CTA (수동)

[`AppApprovalBanner`](../../app/components/AppApprovalBanner.vue) (모든 페이지 layout 최상단) — CTA 클릭 시:
- `pending` → "사업자등록증 등록"
- `reviewing` → "진행 상태 보기"
- `rejected` → "다시 제출하기"

→ 모두 `/account/contract`로 이동.

---

## 3. 화면 구성 — 3 영역

### 3.1 패널 상단 상태 카드 (§12 신규)

미승인 상태(`pending`/`reviewing`/`rejected`)일 때만 노출. 회사 `approval_state`에 따라 톤·아이콘·메시지 분기:

| state | 톤 | 아이콘 | 헤더 | 본문 |
| --- | --- | --- | --- | --- |
| `pending` | warning | `i-lucide-clock` | "사업자등록증을 등록해 주세요" | "가입서류 첨부 영역에서 사업자등록증(PDF, 최대 10MB)을 업로드하시면 심사가 시작됩니다." |
| `reviewing` | info | `i-lucide-loader-circle` | "사업자등록증 심사 중입니다" | "영업일 기준 1~2일 내에 심사 결과를 안내드립니다. 추가 서류 첨부가 필요하면 가입서류 영역에서 진행할 수 있습니다." |
| `rejected` | danger | `i-lucide-circle-x` | "사업자등록증 심사가 반려되었습니다" | "반려 사유: <em>{{ rejectedReason }}</em> · 사업자등록증을 새로 첨부하면 심사가 다시 시작됩니다." |
| `approved` | — | — | 카드 자체 비표시 | — |

### 3.2 이용계약 체결

전자계약 방식의 이용계약서 카드 리스트. 데이터 소스: `GET /contracts` (§11).

**상태 4종** (`TB_CONTRACT.contract_state`):

| state | 라벨 | 아이콘 | `canSign` | 의미 |
| --- | --- | --- | --- | --- |
| `initial` | 최초계약 | `square-pen` | ✅ | 가입 직후 자동 생성된 1건 (signup auto-create §11 + lazy backfill §13) |
| `done` | 체결완료 | `circle-check` | ❌ | 정상 체결 — 서명자·체결일(`signed_at`)·만료일(`expires_at = signed_at + 2y`) 표시 |
| `renew` | 계약갱신 | `circle-alert` | ✅ | 운영자가 신규 계약서 배포, 갱신 필요 (현재 운영자단 미구현) |
| `expired` | 만료 | `archive` | ❌ | 갱신 계약 체결 시 백엔드가 같은 회사의 다른 done 계약을 자동 expired로 전이 |

각 카드 액션:
- **계약서 확인** (모든 상태) → `AppContractViewDialog` 모달 (요약본 — 약관 정본 하드코딩)
- **계약체결하기** (`canSign=true`일 때만) → `AppContractSignDialog` (본인인증 + 3-스텝 위저드, §15)

#### 전자서명 위저드 ([AppContractSignDialog](../../app/components/AppContractSignDialog.vue))

| Step | 라벨 | 내용 |
| --- | --- | --- |
| 1 | 제1장 · 총칙 및 서류 | 제1조~제8조 — 목적·정의·계약 성립·서류 등 (끝까지 스크롤해야 다음 단계) |
| 2 | 제2장 · 이용요금 및 결제 | 단가표·청구주기·연체·환불 등 (끝까지 스크롤) |
| 3 | 제3장 · 전자서명 | **휴대폰 본인인증 sub-step** (§15) → 통과 시 정보 테이블 + 캔버스 노출 |

**STEP 3 본인인증 흐름** (§15):
1. Dialog open watcher에서 `auth.fetchMe()` 호출 → 휴대폰 최신화
2. 회원 휴대폰을 마스킹 표시(`010-****-1111`)
3. "인증번호 받기" → `POST /auth/phone-code/send` (purpose=`contract_sign`, 백엔드 §15.1)
4. 6자리 입력 → `POST /auth/phone-code/verify` → 통과 시 카드 success 톤 + 캔버스 셋업
5. 서명자명(기본값 `auth.user.name`) + 캔버스 ink → "서명 완료"
6. 부모에 `completed` emit → `POST /contracts/:id/sign` (§11)

체결 완료 → 백엔드가 `contractState='done'` + `signer_user_id=ctx.userId` + `signed_at=now` + `expires_at=+2y` UPDATE. `renew`였다면 같은 회사의 다른 `done`은 자동 `expired`.

> **삭제됨 (§15)**: 공인인증서 탭 — STEP 3은 본인인증 → 전자서명 단일 흐름.

### 3.3 가입서류 첨부

PDF만 첨부 가능, 최대 10MB. 데이터 소스: `GET /contracts/files` (§11).

**서류 3종**:

| 라벨 | 배지 | 활성화 조건 | DB `name` 접두사 |
| --- | --- | --- | --- |
| **사업자등록증** | `필수` | 항상 노출 | `사업자등록증_` |
| **대부업등록증** | `해당업체` | 체크박스 "대부업 해당" 활성 시 (첨부 있으면 자동 활성) | `대부업등록증_` |
| **지급이행보증보험증권** | `해당업체` | 체크박스 "후불 정산 해당" 활성 시 (첨부 있으면 자동 활성) | `지급이행보증보험증권_` |

`TB_CONTRACT_FILE`에 `kind` 컬럼이 없어 **`name` 접두사로 종류 구분** (§11 결정).

#### 파일 첨부 흐름

```
[사업자등록증 업로드] 클릭
  → AppUploadGuideDialog ("PDF · 10MB · …")
  → 확인 → input[type=file] 트리거
  → pickFile(): MIME=application/pdf, size ≤ 10MB 검증
  → activeContractId가 없으면 토스트 "활성 계약을 찾을 수 없습니다"
  → FormData 멀티파트 POST /contracts/files
       form: contractId / kind ∈ {biz, loan, insurance} / file
  → loadFiles() 재호출 → 화면 갱신
  → kind=biz면 auth.fetchMe() 호출 → 글로벌 띠·페이지 배너가 즉시 "심사 중"으로 전환 (§12)
  → 토스트 "사업자등록증이 제출되었습니다. 심사가 진행됩니다."
```

#### 파일 행 표시 (§14)

```
[아이콘] [이름·메타]      [심사 상태 배지]   [확인]   [(반려 시) 삭제]
```

**심사 상태 배지** (사업자등록증만, `pending`은 파일 없음이라 미표시):
- `reviewing` → info 톤 + 로딩 아이콘 + "심사 중"
- `approved` → success 톤 + 체크 + "승인"
- `rejected` → danger 톤 + X + "반려"

**삭제 버튼**은 `rejected` 상태에서만 노출 → `DELETE /contracts/files/:id`.
삭제 후에도 회사는 `rejected` 유지(운영자 결정 보존). 새 파일 첨부 시 백엔드(§12)가 자동 `reviewing`으로 전이.

#### 미리보기 (`AppFilePreviewDialog`)

iframe은 Authorization 헤더를 못 싣기 때문에 `useApi<Blob>('/contracts/files/:id/download', { responseType: 'blob' })` 호출 → `URL.createObjectURL()` → iframe src. 모달 닫힐 때 `revokeObjectURL`.

---

## 4. 사용자 액션 매트릭스

| 액션 | 호출 | 결과 |
| --- | --- | --- |
| 계약서 확인 | `viewContract(c)` | `AppContractViewDialog` 모달 — 요약본 |
| 계약체결하기 | `signContract(c)` | `AppContractSignDialog` (본인인증 + 3-스텝) → 완료 시 `POST /contracts/:id/sign` |
| 서류 업로드 클릭 | `requestUpload(target)` | `AppUploadGuideDialog` → 파일 선택 |
| 파일 선택 | `pickFile(target, e)` | MIME·크기 검증 → FormData POST → 목록 갱신 + (biz일 때) fetchMe |
| 서류 확인 | `openPreview(label, f)` | 인증 fetch → blob → object URL → `AppFilePreviewDialog` |
| 서류 삭제 | `removeFile(f.id)` | `DELETE /contracts/files/:id` (rejected 상태에서만 버튼 노출) |
| 대부업/후불 해당 토글 | `loanApplicable`·`insuranceApplicable` | 업로드 인터페이스 활성/비활성 |
| 저장하기 | `save()` | 현재는 토스트만 — 회사 전화번호 등은 별도 `/account/settings`에서 |

---

## 5. 회원 유형별 서류 요구사항

[SIGNUP.md §2](./SIGNUP.md#2-핵심-차이-한눈에) 정책 표 기반:

| 가입 유형 | 카드 충전 시 | 후불 정산 시 |
| --- | --- | --- |
| **법인사업자** (`corp`) | 사업자등록증 + (대부업등록증) | 위 + 지급이행보증보험증권 + 통장사본 |
| **개인사업자** (`sole`) | 사업자등록증 + (대부업등록증) | 위 + 지급이행보증보험증권 + 통장사본 |
| **개인** (`personal`) | (가입신청서만 — 본 화면 미진입) | ❌ 후불 미지원 |

> ⚠️ **회원 유형에 따른 분기는 후속** — 현재는 모든 사업자에게 동일 폼 노출. 대부업·후불 옵션 자동 분기는 P1.

---

## 6. 상태 모델

### 6.1 이용계약 (`TB_CONTRACT.contract_state`)

```
            ┌──────────────┐
            │  initial     │  ← signup auto-create (§11) 또는 lazy backfill (§13)
            └──────┬───────┘
          POST /contracts/:id/sign
                   ▼
            ┌──────────────┐    운영자가 신규 약관 배포(미구현)
            │  done        │ ─────────────────────────┐
            └──────────────┘                          ▼
                                              ┌──────────────┐
                                              │  renew       │
                                              └──────┬───────┘
                                       POST /contracts/:id/sign
                                                     ▼
                                              ┌──────────────┐
        같은 회사의 다른 done ──→ 자동       │  done        │
        expired (sign 핸들러에서 일괄)        └──────────────┘
                                                     │
                                              만료 cron(미구현)
                                                     ▼
                                              ┌──────────────┐
                                              │  expired     │
                                              └──────────────┘
```

### 6.2 회사 승인 상태 (`TB_COMPANY.approval_state`) — 4단계 (§7·§12)

```
  ┌──────────┐  biz 첨부(§12)   ┌────────────┐  운영자 승인     ┌──────────┐
  │ pending  │ ───────────────► │ reviewing  │ ───────────────► │ approved │
  └──────────┘                  └────────────┘                  └──────────┘
                                       │                              ▲
                                       │ 운영자 반려                  │
                                       ▼                              │
                                  ┌──────────┐  biz 재첨부(§12)        │
                                  │ rejected │ ──────────────────────►│ reviewing
                                  └──────────┘                        (자동)
```

코드:
- 첨부 시 자동 전이: [contracts.ts POST /files](../../../malgn-noti-api/src/routes/contracts.ts) §12
- 자동 회복: [GET /files lazy backfill](../../../malgn-noti-api/src/routes/contracts.ts) §13
- 미들웨어 차단: [middleware/approval.ts](../../../malgn-noti-api/src/middleware/approval.ts) `state !== 'approved'`이면 403

---

## 7. 정책 결정 사항

### 7.1 미승인 사용자의 메인 진입점

- 회원가입한 사업자는 **반드시** 본 화면에서 사업자등록증을 등록해야 운영자 심사 → 승인 → 서비스 이용.
- 미승인 상태(`pending`/`reviewing`/`rejected`)에서는 GNB·홈·발송·주소록 등 어떤 페이지에 가도 미들웨어가 본 화면으로 리다이렉트.

### 7.2 카드 충전 vs 후불 정산

- **카드 충전**: 사업자등록증 + (대부업등록증) — 등록 후 운영자 승인 → 즉시 카드 등록·충전·발송 가능.
- **후불 정산**: 위 + **지급이행보증보험증권** + 통장사본 — 운영자가 추가 검수 → 신용 한도 부여.
- 현재 화면은 두 경로의 서류를 모두 표시하고 사용자가 "후불 정산 해당" 체크로 선택.

### 7.3 상태별 안내 메시지 (§7·§12·§14)

| state | 메시지 (글로벌 띠) | 메시지 (이 화면 상단 카드) | 메시지 (파일 행 배지) |
| --- | --- | --- | --- |
| `pending` | 사업자등록증을 등록해 주세요 | 사업자등록증을 등록해 주세요 | (파일 없음 — 미표시) |
| `reviewing` | 사업자등록증 심사 중입니다 | 사업자등록증 심사 중입니다 | "심사 중" (info) |
| `approved` | (배너 미노출) | (배너 미노출) | "승인" (success) |
| `rejected` | 사업자등록증 심사 반려 + 사유 | 사업자등록증 심사가 반려되었습니다 | "반려" (danger) + 삭제 버튼 |

### 7.4 이용계약 자동 생성 (§11)

가입 시점에 백엔드 `POST /auth/signup` 핸들러가 NICE 세션 consume 직후 `companyType ∈ {corp, sole}`이면 `TB_CONTRACT` 1건 자동 INSERT(`title='최초 이용계약 온라인체결'`, `version='신규'`, `contract_state='initial'`). signup 이전에 가입한 사업자는 §13의 lazy backfill로 GET 시점에 자동 생성.

### 7.5 갱신 계약 체결 시 기존 계약 자동 만료 (§11)

`POST /contracts/:id/sign` 핸들러가 `contract_state='renew'`였다면 같은 회사의 다른 `done` 계약을 한 번에 `expired`로 일괄 UPDATE — 이중 유효 계약 방지.

### 7.6 사업자등록증 첨부 시 회사 상태 자동 전이 (§12)

`POST /contracts/files` 핸들러에서 `kind=biz` 업로드 후 회사 상태가 `pending` 또는 `rejected`이면 `reviewing`으로 UPDATE. `rejected_reason`은 그대로 둠(운영자가 새 심사에서 결정). `reviewing`/`approved`는 변동 없음.

### 7.7 파일 제약

- **MIME**: `application/pdf` 만 허용 (백엔드에서 재검증)
- **최대 크기**: 10MB (Cloudflare Workers 요청 크기 제한 내)
- **권한**: 본 회사의 계약·파일만 접근. `companyId` 매칭 안 되면 404.
- **R2 키 패턴**: `contracts/<companyId>/<contractId>/<unix>_<safeName>` — 회사·계약별 prefix 분리.

### 7.8 미승인 사용자의 본 화면 예외 (§11)

`/contracts` 라우트는 `requireApproved` 미들웨어를 **적용하지 않음** — 미승인 사용자가 사업자등록증을 제출하는 화면이 본 화면이므로 의도된 예외. 다른 도메인 라우트는 §8에서 모두 차단.

---

## 8. API 엔드포인트 — 구현됨 (§11)

### 8.1 계약

| 메서드 | 경로 | 역할 | 비고 |
| --- | --- | --- | --- |
| `GET` | `/contracts` | 본 회사 계약 목록 (`status=1` + id 오름차순) | §13 lazy auto-create 포함 |
| `POST` | `/contracts/:id/sign` | 전자서명 완료 → `done`+`signer_user_id`+`signed_at`+`expires_at=+2y`. `renew`였다면 기존 `done` 일괄 `expired` | §11 |

### 8.2 가입 서류 (R2 + DB)

| 메서드 | 경로 | 역할 | 비고 |
| --- | --- | --- | --- |
| `GET` | `/contracts/files` | 본 회사 파일 목록 (contract JOIN으로 회사 단위 좁힘) | §13 자동 회복 포함 |
| `POST` | `/contracts/files` | 멀티파트 업로드 → R2 put + DB insert | §11 — PDF·10MB·접두사 + §12 auto reviewing |
| `GET` | `/contracts/files/:id/download` | R2 stream → `application/pdf` 응답 | inline disposition |
| `DELETE` | `/contracts/files/:id` | R2 delete(swallow) + DB delete | §14 — 반려 상태에서만 호출 |

OpenAPI: `Contract` / `ContractFile` 스키마 + 위 5 path. [openapi.ts](../../../malgn-noti-api/src/openapi.ts)

### 8.3 휴대폰 본인인증 (§15)

기존 phone-code 인프라 재사용 + `contract_sign` purpose 추가:

| 메서드 | 경로 | 역할 |
| --- | --- | --- |
| `POST` | `/auth/phone-code/send` | `{phone, purpose: 'contract_sign'}` → SMS 발송 (mock 모드면 `mockCode` 응답에 노출) |
| `POST` | `/auth/phone-code/verify` | `{phone, purpose: 'contract_sign', code}` → 200 `{verified: true}` |

TTL 10분, 5회 시도 제한, 재발송 시 직전 코드 무효화, 소비 후 재사용 차단. SHA-256(`phone|purpose|code`) 해시 저장.

### 8.4 운영자 검수 (운영자단 — 미구현)

| 경로 | 역할 |
| --- | --- |
| `GET /admin/companies/{id}/contracts` | 운영자가 회사별 계약·서류 조회 |
| `POST /admin/companies/{id}/approve` | 승인 → `approval_state='approved'` |
| `POST /admin/companies/{id}/reject {reason}` | 반려 → `approval_state='rejected'` + `rejected_reason` 적재 |

현재는 라이브 DB UPDATE만 가능.

---

## 9. DB 테이블 (라이브 + schema.ts 정의 §11)

### 9.1 `TB_CONTRACT`

```sql
TB_CONTRACT (
  id              BIGINT UNSIGNED PK AUTO_INCREMENT,
  company_id      BIGINT UNSIGNED NOT NULL,    -- FK → TB_COMPANY
  title           VARCHAR(160)   NOT NULL,
  version         VARCHAR(20)    NOT NULL,     -- '신규' / 'v2.0' 등
  contract_state  VARCHAR(20)    NOT NULL DEFAULT 'initial',  -- initial/done/renew/expired
  status          INT            NOT NULL DEFAULT 1,
  signer_user_id  BIGINT UNSIGNED,             -- FK → TB_USER (서명자)
  signed_at       DATETIME,
  expires_at      DATETIME,                    -- 보통 signed_at + 2y
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_company (company_id, contract_state),
  CONSTRAINT fk_contract_company FOREIGN KEY (company_id) REFERENCES TB_COMPANY(id),
  CONSTRAINT fk_contract_signer  FOREIGN KEY (signer_user_id) REFERENCES TB_USER(id)
)
```

schema.ts 정의: [src/db/schema.ts](../../../malgn-noti-api/src/db/schema.ts) §11.

### 9.2 `TB_CONTRACT_FILE`

```sql
TB_CONTRACT_FILE (
  id            BIGINT UNSIGNED PK AUTO_INCREMENT,
  contract_id   BIGINT UNSIGNED NOT NULL,      -- FK → TB_CONTRACT
  name          VARCHAR(255)    NOT NULL,      -- 한국어 접두사 포함 ('사업자등록증_...')
  size_bytes    BIGINT UNSIGNED NOT NULL,
  r2_key        VARCHAR(255)    NOT NULL,      -- contracts/<co>/<contract>/<ts>_<name>
  uploaded_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contractfile_contract (contract_id),
  CONSTRAINT fk_contractfile_contract FOREIGN KEY (contract_id) REFERENCES TB_CONTRACT(id)
)
```

**`kind` 컬럼 없음** (§11 결정) — 파일 종류는 `name` 접두사로 구분.
R2 메타데이터에는 `kind`·`companyId`·`contractId`를 customMetadata로 함께 저장.

### 9.3 (미구현) `TB_CONTRACT_TEMPLATE`

운영자가 배포하는 약관 정본 + chapter·article JSON. 신규 배포 시 회사별 `TB_CONTRACT.contract_state='renew'`로 자동 마이그레이션. P2.

---

## 10. 현재 구현 상태

| 영역 | 상태 | 비고 |
| --- | --- | --- |
| 이용계약 카드 리스트 | ✅ | `GET /contracts` 실 API (§11) |
| 계약서 확인 모달 (`AppContractViewDialog`) | 🟢 UI | 약관 정본 하드코딩 (백엔드 템플릿 없음) |
| 전자서명 위저드 (3-스텝) | ✅ | 본인인증(§15) + `POST /contracts/:id/sign` (§11) |
| 휴대폰 본인인증 sub-step | ✅ | `phone-code` purpose=`contract_sign` (§15) |
| 갱신 → 기존 만료 자동 전이 | ✅ | 백엔드 sign 핸들러에서 일괄 UPDATE (§11) |
| 가입서류 첨부 (PDF/10MB 검증) | ✅ | 백엔드 R2 + DB 적재 (§11) |
| 사업자등록증 첨부 시 reviewing 자동 전이 | ✅ | 백엔드 `pending|rejected → reviewing` (§12) |
| §11 이전 가입자 / §12 이전 첨부자 lazy 회복 | ✅ | GET 시점 자동 보정 (§13) |
| 파일 행 심사 상태 배지 | ✅ | reviewing/approved/rejected 3분기 (§14) |
| 반려 시 삭제 버튼 + DELETE | ✅ | rejected 상태에서만 노출 (§14) |
| 대부업·후불 체크박스 토글 | 🟢 UI | 첨부 있으면 자동 활성, 정책 분기는 없음 |
| 첨부 서류 미리보기 | ✅ | 인증 fetch → blob → object URL (§11) |
| 패널 상단 상태 카드 (pending/reviewing/rejected) | ✅ | 3분기 톤·메시지 (§12) |
| 저장하기 | 🟢 UI | 토스트만 (회사 전화번호 등은 `/account/settings` 사용) |
| **회원 유형별 서류 분기** | ⚪ | 현재 모든 사업자에게 동일 폼 |
| **운영자 승인 트리거** | ⚪ | 운영자단 미개발 — DB 직접 UPDATE만 가능 |
| **약관 템플릿 정본 관리** | ⚪ | `AppContractViewDialog` 약관 본문 하드코딩 |
| **체결 서명 PDF 보존** | ⚪ | 캔버스 ink 이미지가 백엔드에 저장 안 됨 |
| **계약 갱신 cron** | ⚪ | 만료 1개월 전 `renew` 자동 생성 미구현 |

---

## 11. 알려진 한계 / 후속 작업

### P0 — 가입 후 폐쇄 루프 완성

1. **운영자단 사업자 승인 화면** (§7.7 / §11.10 / §12.6) — 현재 라이브 DB UPDATE로만 승인/반려. 운영자가 본 페이지의 업로드 파일을 보고 승인/반려(사유 입력) 처리 가능해야 함. WBS 5-4-3.
2. **NHN Notification Hub 자격증명 + 어댑터 재작성** (§16) — 승인/반려 결정 시 사용자에게 알림 메일·SMS 자동 발송. User Access Key 수령 대기.

### P1 — UX 정합화

3. **회원 유형별 폼 분기** — `auth.tenant.companyType`에 따라 대부업·후불 옵션 노출 여부 결정.
4. **개인 가입자의 메뉴 숨김** — `/account/contract` 항목 자체를 LNB·`AppMyPageShell`에서 미노출.
5. **`reviewing` 상태에서 잘못 올린 biz 파일 정정** (§14.4) — 현재는 삭제 버튼이 안 보임. 정책상 "심사 중 변경 불가"가 안전하나 사용자가 답답할 수 있음. 운영자단 심사 화면 도입 시 같은 곳에서 정정 가능하도록.

### P2 — 약관·계약 정본 관리

6. **`TB_CONTRACT_TEMPLATE`** — 운영자가 약관 본문 정본 등록·버전 관리·일괄 `renew` 배포.
7. **전자서명 인증 강화 옵션** — 현재 휴대폰 SMS OTP. 법적 강도를 더 높이려면 NICE 본인확인(`/auth/nice/*`) 재호출 또는 공인인증서 연계.
8. **계약서 PDF 생성·보존** — 체결 완료 시 캔버스 ink(PNG) + 서명자·시간·IP·UA 메타가 들어간 PDF 자동 생성 → R2 저장(`TB_CONTRACT.signed_image_r2_key` 컬럼 추가) → 사용자가 다운로드.

### P3 — 위생적 작업

9. **계약 갱신 cron** (§11.10) — 만료 1개월 전 자동 `renew` 계약 row 생성. Workers Cron Trigger.
10. **반려 후 재첨부 시 `rejected_reason` 처리** (§12.6) — 현재는 그대로 둔 채 `reviewing` 전이. 정책상 더 명확히 하려면 재첨부 시 NULL 정리.
11. **갱신 알림** — `renew` 상태가 되면 사용자에게 이메일·SMS·인앱 알림.
12. **체결마감일 임박 경고** — `renew.metas[].danger=true` 외에 GNB 띠로 일주일 전부터 강조.
13. **사업자등록증 OCR 자동 검증** (§11.10) — 운영자 부담 경감. NHN OCR API 또는 외부 서비스.
