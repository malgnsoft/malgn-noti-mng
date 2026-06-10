# 발신 정보 (발신번호·브랜드·도메인·인증서·프로필·080번호)

> **정본 소스**:
> - 시안 IA 및 핸드오프(`design_handoff_malgn_noti` v1.0)
> - [`app/pages/sender/{numbers,brands,domains,push-cert,profiles,optout-080}.vue`](../../app/pages/sender/) — 발신정보 6개 페이지
> - [`../malgn-noti-mng/docs/DESIGN.md`](../DESIGN.md) — 디자인 시스템
>
> **마지막 현행화**: 2026-06-10

---

## 1. 개요

고객사가 **각 채널의 발신 정보(발신 인프라)를 설정·관리하는 도메인**. 발송 전 필수 등록.

**6가지 발신 정보**:
1. **발신번호** (SMS/LMS/MMS) — 가상번호 또는 가입번호
2. **RCS 브랜드** — RCS 업체 인증 정보
3. **이메일 도메인** — 발신 도메인 + DKIM 설정
4. **PUSH 인증서** — FCM(안드로이드) · APNs(iOS)
5. **카카오 발신 프로필** — 알림톡/친구톡 프로필
6. **080 수신거부 번호** — 광고성 SMS 대응 필수

---

## 2. 라우트 구조

| 라우트 | 페이지 | 설명 | 파일 |
| --- | --- | --- | --- |
| `/sender/numbers` | 발신번호 | SMS/LMS/MMS 발신 번호 관리 | [`sender/numbers.vue`](../../app/pages/sender/numbers.vue) |
| `/sender/brands` | RCS 브랜드 | RCS 브랜드 인증 정보 관리 | [`sender/brands.vue`](../../app/pages/sender/brands.vue) |
| `/sender/domains` | 이메일 도메인 | SMTP 도메인 + DKIM 관리 | [`sender/domains.vue`](../../app/pages/sender/domains.vue) |
| `/sender/push-cert` | PUSH 인증서 | FCM · APNs 인증서 관리 | [`sender/push-cert.vue`](../../app/pages/sender/push-cert.vue) |
| `/sender/profiles` | 카카오 프로필 | 알림톡/친구톡 프로필 관리 | [`sender/profiles.vue`](../../app/pages/sender/profiles.vue) |
| `/sender/optout-080` | 080 수신거부 | 광고 거부 대응 번호 관리 | [`sender/optout-080.vue`](../../app/pages/sender/optout-080.vue) |

---

## 3. 권한 · 접근

| 항목 | 내용 |
| --- | --- |
| **권한 요구** | 로그인 필수 |
| **역할 제한** | 없음 — 테넌트 소속 모든 사용자 조회 가능, 편집은 권한자만 (TBD) |
| **데이터 격리** | 자신의 테넌트 발신정보만 조회/편집 가능 |

---

## 4. 공통 구조

모든 발신정보 페이지는 다음 레이아웃으로 통일:

```
┌─────────────────────────────────────┐
│ [GNB]                                │  56px
├─────────────────────────────────────┤
│ 크럼: "발신 정보 · 발신번호"         │
│ h1: "발신번호"                       │  48px
│ 우측: [+ 추가] [도움말]              │
├─────────────────────────────────────┤
│ 필터 바 (검색/상태필터)             │  56px
├─────────────────────────────────────┤
│                                      │
│ [카드 또는 테이블]                   │  flex-1
│ (채널별로 다른 구성)                 │
│                                      │
└─────────────────────────────────────┘
```

---

## 5. 발신번호 페이지 (`/sender/numbers`)

### 5.1 구조

**카드 그리드** (3칼럼, gap-4):

```
┌──────────────────┬──────────────────┬──────────────────┐
│   [발신번호 1]   │   [발신번호 2]   │   [발신번호 3]   │
│  010-XXXX-5678  │  1644-XXXX       │  02-6xxx-5678   │
│  ☐ 기본값        │  ☐ 기본값        │  ☐ 기본값        │
│  [편집] [삭제]  │  [편집] [삭제]  │  [편집] [삭제]  │
└──────────────────┴──────────────────┴──────────────────┘
```

### 5.2 카드 정보

| 항목 | 설명 |
| --- | --- |
| **번호** | 010-XXXX-XXXX / 1644-XXXX / 02-XXXX-XXXX |
| **기본값 체크** | 이 번호를 기본값으로 설정 (발송 시 기본 선택) |
| **상태** | 심사 대기 / 사용 가능 / 차단됨 (배지) |
| **등록일** | YYYY-MM-DD |
| **액션** | [편집] [삭제] |

### 5.3 추가/편집 팝업

```
┌──────────────────────────┐
│ 발신번호 추가              │
├──────────────────────────┤
│ 번호 유형:               │
│  ◎ 가상번호(SKT/KT/LG)  │
│  ◉ 가입번호              │
│                          │
│ 번호: [0xx-xxxx-xxxx]   │
│                          │
│ (선택) 기본값으로 설정   │
│                          │
│  [취소]      [저장]    │
└──────────────────────────┘
```

---

## 6. RCS 브랜드 페이지 (`/sender/brands`)

### 6.1 구조

**테이블**:

| 컬럼 | 설명 |
| --- | --- |
| 브랜드명 | 등록된 RCS 브랜드 이름 |
| 브랜드ID | NHN RCS 브랜드 ID |
| 상태 | 심사 중 / 승인됨 / 거절됨 (배지) |
| 등록일 | YYYY-MM-DD |
| 액션 | [편집] [삭제] [인증 갱신] |

### 6.2 추가/편집 팝업

```
┌──────────────────────────┐
│ RCS 브랜드 추가           │
├──────────────────────────┤
│ 브랜드명: [text]        │
│ 사업자번호: [xxx-xx-xxxxx]│
│ 대표 이메일: [email]    │
│                          │
│ 브랜드 로고: [이미지 업로드]│
│                          │
│  [취소]      [저장]    │
└──────────────────────────┘
```

---

## 7. 이메일 도메인 페이지 (`/sender/domains`)

### 7.1 구조

**테이블**:

| 컬럼 | 설명 |
| --- | --- |
| 도메인 | noreply@example.com |
| 발신자명 | "회사명 (예: 맑은메시징)" |
| DKIM 상태 | ✓ 설정됨 / ✗ 미설정 (배지) |
| MX/SPF 상태 | ✓ / ✗ |
| 등록일 | YYYY-MM-DD |
| 액션 | [편집] [DKIM 재설정] [삭제] |

### 7.2 추가/편집 팝업

```
┌──────────────────────────┐
│ 이메일 도메인 추가        │
├──────────────────────────┤
│ 도메인: [noreply@...]   │
│ 발신자명: [text]        │
│                          │
│ ─ DKIM 설정 ────────────│
│ 공개키 (선택):          │
│ [텍스트 에리어]         │
│ (또는 자동 감지)        │
│                          │
│  [취소]      [저장]    │
└──────────────────────────┘

DKIM 설정 완료 후:
─ TXT 레코드 ─────────────
v=DKIM1; k=rsa; p=MIGfMA0GCS...
(DNS에 추가)
```

---

## 8. PUSH 인증서 페이지 (`/sender/push-cert`)

### 8.1 구조

**탭 네비게이션**: [FCM(Android)] [APNs(iOS)]

#### FCM 탭

**카드**:

```
┌─────────────────────────┐
│ FCM 인증서              │
├─────────────────────────┤
│ 프로젝트 ID: xxxxxxx    │
│ 상태: ✓ 유효            │
│ 등록일: 2026-01-15     │
│                         │
│ [편집] [재등록] [삭제] │
└─────────────────────────┘
```

#### APNs 탭

**카드**:

```
┌─────────────────────────┐
│ APNs 인증서(iOS)       │
├─────────────────────────┤
│ Bundle ID: com.app.... │
│ Team ID: XXXXXXXXXX    │
│ Key ID: XXXXXXXXXX     │
│ 만료일: 2027-06-15     │
│ 상태: ✓ 유효            │
│                         │
│ [편집] [재등록] [삭제] │
└─────────────────────────┘
```

### 8.2 추가/편집 팝업

#### FCM

```
┌──────────────────────────┐
│ FCM 인증서 추가           │
├──────────────────────────┤
│ 프로젝트 ID: [text]    │
│ 비공개키 (JSON):        │
│ [텍스트 에리어 또는     │
│  파일 업로드]           │
│                          │
│  [취소]      [저장]    │
└──────────────────────────┘
```

#### APNs

```
┌──────────────────────────┐
│ APNs 인증서(iOS) 추가    │
├──────────────────────────┤
│ Bundle ID: [text]      │
│ Team ID: [text]        │
│ Key ID: [text]         │
│ P8 파일: [파일 업로드] │
│                          │
│  [취소]      [저장]    │
└──────────────────────────┘
```

---

## 9. 카카오 프로필 페이지 (`/sender/profiles`)

### 9.1 구조

**테이블**:

| 컬럼 | 설명 |
| --- | --- |
| 프로필명 | 등록된 카카오 발신 프로필 이름 |
| 프로필ID | 카카오 비즈메시지 프로필 ID |
| 유형 | 알림톡 / 친구톡 / 둘다 |
| 상태 | 심사 중 / 승인됨 / 거절됨 (배지) |
| 등록일 | YYYY-MM-DD |
| 액션 | [편집] [삭제] [심사 재신청] |

### 9.2 추가/편집 팝업

```
┌──────────────────────────┐
│ 카카오 발신 프로필 추가   │
├──────────────────────────┤
│ 프로필명: [text]       │
│ 프로필ID: [text]       │
│                          │
│ 유형:                    │
│  ☐ 알림톡              │
│  ☐ 친구톡              │
│                          │
│ (선택) 카테고리:       │
│ [드롭다운 선택]        │
│                          │
│  [취소]      [저장]    │
└──────────────────────────┘
```

---

## 10. 080 수신거부 번호 페이지 (`/sender/optout-080`)

### 10.1 구조

**카드**:

```
┌─────────────────────────────────┐
│ 광고 거부 대응 번호              │
├─────────────────────────────────┤
│ 번호: [010-XXXX-XXXX]           │
│ 상태: ✓ 등록됨                  │
│ 등록일: 2026-01-15              │
│                                  │
│ (선택) 문자 수신 여부: [토글]   │
│                                  │
│ [편집] [삭제]                   │
└─────────────────────────────────┘

ⓘ 광고성 SMS 발송 시 필수.
  "수신거부는 [080-XXXX-XXXX]로 연락하세요."
```

### 10.2 추가/편집 팝업

```
┌────────────────────────────┐
│ 080 수신거부 번호 추가      │
├────────────────────────────┤
│ 번호: [010-xxxx-xxxx]     │
│       또는 [1644-xxxx]    │
│                            │
│ (선택) 문자 수신 가능:    │
│  ◎ 가능  ◉ 불가         │
│                            │
│  [취소]      [저장]      │
└────────────────────────────┘
```

---

## 11. API 엔드포인트

| 메서드 | 엔드포인트 | 용도 | 상태 |
| --- | --- | --- | --- |
| `GET` | `/v1/sender/numbers` | 발신번호 목록 | TBD |
| `POST` | `/v1/sender/numbers` | 발신번호 추가 | TBD |
| `PATCH` | `/v1/sender/numbers/:id` | 발신번호 편집 | TBD |
| `DELETE` | `/v1/sender/numbers/:id` | 발신번호 삭제 | TBD |
| `GET` | `/v1/sender/brands` | RCS 브랜드 목록 | TBD |
| `POST` | `/v1/sender/brands` | RCS 브랜드 추가 | TBD |
| `PATCH` | `/v1/sender/brands/:id` | RCS 브랜드 편집 | TBD |
| `DELETE` | `/v1/sender/brands/:id` | RCS 브랜드 삭제 | TBD |
| `GET` | `/v1/sender/domains` | 이메일 도메인 목록 | TBD |
| `POST` | `/v1/sender/domains` | 이메일 도메인 추가 | TBD |
| `PATCH` | `/v1/sender/domains/:id` | 이메일 도메인 편집 | TBD |
| `DELETE` | `/v1/sender/domains/:id` | 이메일 도메인 삭제 | TBD |
| `GET` | `/v1/sender/push-cert` | PUSH 인증서 목록 | TBD |
| `POST` | `/v1/sender/push-cert/fcm` | FCM 인증서 추가 | TBD |
| `POST` | `/v1/sender/push-cert/apns` | APNs 인증서 추가 | TBD |
| `PATCH` | `/v1/sender/push-cert/:id` | PUSH 인증서 편집 | TBD |
| `DELETE` | `/v1/sender/push-cert/:id` | PUSH 인증서 삭제 | TBD |
| `GET` | `/v1/sender/profiles` | 카카오 프로필 목록 | TBD |
| `POST` | `/v1/sender/profiles` | 카카오 프로필 추가 | TBD |
| `PATCH` | `/v1/sender/profiles/:id` | 카카오 프로필 편집 | TBD |
| `DELETE` | `/v1/sender/profiles/:id` | 카카오 프로필 삭제 | TBD |
| `GET` | `/v1/sender/optout-080` | 080 수신거부 목록 | TBD |
| `POST` | `/v1/sender/optout-080` | 080 수신거부 추가 | TBD |
| `PATCH` | `/v1/sender/optout-080/:id` | 080 수신거부 편집 | TBD |
| `DELETE` | `/v1/sender/optout-080/:id` | 080 수신거부 삭제 | TBD |

---

## 12. 데이터 모델

### 발신번호 (SenderNumber)

```typescript
interface SenderNumber {
  id: string
  tenantId: string
  number: string                      // 010-XXXX-XXXX / 1644-XXXX
  type: 'virtual' | 'registered'
  isDefault: boolean
  status: 'pending' | 'active' | 'blocked'
  createdAt: ISO8601
  updatedAt: ISO8601
}
```

### RCS 브랜드 (RcsBrand)

```typescript
interface RcsBrand {
  id: string
  tenantId: string
  name: string
  brandId: string                     // NHN RCS 브랜드 ID
  businessNumber: string
  email: string
  logoUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: ISO8601
  updatedAt: ISO8601
}
```

### 이메일 도메인 (EmailDomain)

```typescript
interface EmailDomain {
  id: string
  tenantId: string
  domain: string                      // noreply@example.com
  senderName: string
  dkimStatus: 'not_set' | 'pending' | 'verified'
  dkimPublicKey?: string
  mxStatus: boolean
  spfStatus: boolean
  createdAt: ISO8601
  updatedAt: ISO8601
}
```

### PUSH 인증서

```typescript
interface PushCert {
  id: string
  tenantId: string
  type: 'fcm' | 'apns'
  fcm?: {
    projectId: string
    privateKey: string                // 암호화된 저장소
  }
  apns?: {
    bundleId: string
    teamId: string
    keyId: string
    p8: string                        // 암호화된 저장소
  }
  status: 'valid' | 'expired'
  expiresAt?: ISO8601
  createdAt: ISO8601
  updatedAt: ISO8601
}
```

### 카카오 프로필 (KakaoProfile)

```typescript
interface KakaoProfile {
  id: string
  tenantId: string
  name: string
  profileId: string                   // 카카오 비즈메시지 프로필 ID
  types: ('alimtalk' | 'friendtalk')[]
  category?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: ISO8601
  updatedAt: ISO8601
}
```

### 080 수신거부 (OptOut080)

```typescript
interface OptOut080 {
  id: string
  tenantId: string
  number: string                      // 010-XXXX-XXXX / 1644-XXXX
  acceptsSms: boolean                 // 문자 수신 여부
  createdAt: ISO8601
  updatedAt: ISO8601
}
```

---

## 13. 발송 페이지 연동

발송 폼에서:
- `[발신정보 선택]` 드롭다운 → 등록된 발신 정보 목록 노출
- `[추가]` → 해당 발신정보 페이지 팝업 또는 새 탭으로 이동
- `[관리]` → 해당 발신정보 페이지로 이동

---

## 14. 검증 · 에러 처리

| 항목 | 검증 | 에러 메시지 |
| --- | --- | --- |
| **발신번호** | 형식 검증 (010/011/1644/02 등) | "올바른 번호 형식을 입력해주세요." |
| **이메일 도메인** | 도메인 형식 · DKIM 필수 | "유효한 도메인을 입력해주세요." |
| **PUSH 인증서** | JSON/P8 유효성 검사 | "유효한 인증서 파일이 아닙니다." |
| **중복** | 번호/도메인 중복 검사 | "이미 등록된 발신정보입니다." |

---

## 15. 위험 액션 · 감사 로그

| 액션 | 위험도 | 감사 | 내용 |
| --- | --- | --- | --- |
| **발신번호 삭제** | 중간 | ✓ 기록 | 삭제된 번호 |
| **도메인 삭제** | 높음 | ✓ 기록 | 삭제된 도메인 |
| **인증서 재등록** | 높음 | ✓ 기록 | 기존 인증서 ID |
| **080 번호 변경** | 중간 | ✓ 기록 | 변경 전/후 번호 |

---

## 16. 구현 상태

| 항목 | 상태 | 비고 |
| --- | --- | --- |
| **발신번호 CRUD** | ✅ 구현 완료 | 목업 데이터 |
| **RCS 브랜드 CRUD** | ✅ 구현 완료 | 목업 데이터 |
| **이메일 도메인 CRUD** | ✅ 구현 완료 | DKIM 설정 안내 |
| **PUSH 인증서 (FCM/APNs)** | ✅ 구현 완료 | 탭 분리 |
| **카카오 프로필 CRUD** | ✅ 구현 완료 | 목업 데이터 |
| **080 수신거부 관리** | ✅ 구현 완료 | 목업 데이터 |
| **필터/검색** | ✅ 구현 완료 | 상태별 필터 |
| **백엔드 API** | ⏳ TBD | `malgn-noti-api` 미정의 |

---

## 17. 알려진 한계 · 후속 작업

| 항목 | 내용 | 우선순위 |
| --- | --- | --- |
| **자동 DKIM 설정** | DNS TXT 자동 삽입 미지원 | P3 |
| **인증서 자동 갱신** | APNs 만료 알림 + 자동 갱신 미지원 | P2 |
| **다중 인증서** | FCM/APNs 여러 개 등록 미지원 | P3 |
| **NHN 콘솔 동기** | NHN 콘솔에서 등록한 정보 자동 동기 미정 | P2 |

---

## 18. 연관 페이지

- [단발 발송(6채널)](./SEND.md) — 발신정보 선택/추가
- [메시지 관리(템플릿)](./MANAGE.md) — 도메인별 템플릿
- [계정 설정](./ACCOUNT.md) — 결제 카드 관리
