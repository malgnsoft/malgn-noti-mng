# 고객사 (테넌트 관리)

> **정본 소스**:
> - 시안 IA 및 핸드오프(`design_handoff_malgn_noti_admin` 준수)
> - [`app/pages/member/company.vue`](../../app/pages/member/company.vue) — 고객사 목록
> - [`app/pages/member/company/[id].vue`](../../app/pages/member/company/[id].vue) — 고객사 상세 (예정)
> - [`../malgn-noti-mng/docs/DESIGN-ADMIN.md`](../DESIGN-ADMIN.md) — admin 디자인 시스템
>
> **마지막 현행화**: 2026-06-10
>
> **메뉴**: 회원/고객사 · 고객사
> **라우트**: `/admin/member/company` (목록) / `/admin/member/company/[id]` (상세)
> **권한**: `super_admin` · `ops_admin` · `support`(조회)

## 목적

서비스의 고객사(테넌트) 전체를 단일 화면에서 관리한다. 가입 승인, 한도/플랜 조정, 발신 인프라 보유 현황 확인, 차단/복구까지 테넌트 라이프사이클의 입구. CLAUDE.md §1.1 / §1.6의 핵심 도메인.

## 주요 사용자

- `super_admin` · `ops_admin` — **일** 단위 (신규 가입 승인, 한도 조정, 차단).
- `support` — 조회만 (고객 문의 답변 시 컨텍스트 확인).

## 주요 액션

- 테넌트 목록 검색 (회사명·사업자번호·이메일·상태).
- 신규 가입 테넌트 승인 / 반려(사유).
- 테넌트 상세 → 플랜·한도·발신 인프라·발송 통계·결제 카드 조회.
- 한도(SMS 월/일·알림톡 일·이메일 일·PUSH 일) 조정.
- 테넌트 차단/복구(`Danger Zone`).
- NHN AppKey/SecretKey 회전(`Danger Zone`).
- CSV 내보내기(전체 테넌트 스냅샷).

## UI 구성

### 목록 페이지 구조

```
┌─────────────────────────────────────┐
│ [GNB]                                │  56px
├─────────────────────────────────────┤
│ 크럼: "회원/고객사 · 고객사"        │
│ h1: "고객사"                         │  48px
│ 우측: [CSV] [+ 테넌트 추가]         │
├─────────────────────────────────────┤
│ [필터 바: Quick Chips · 검색 · 기간] │  56px
├─────────────────────────────────────┤
│ [테이블: 고객사 목록]                │  flex-1
│ [선택: N개] [차단] [한도변경] [CSV]  │
└─────────────────────────────────────┘
```

### 필터 바 (AppAdminFilterBar 패턴)

#### Quick Chips

```
[전체] [심사대기] [활성] [차단] [만료임박]
```

#### 검색

```
[검색] ──────────────────────
```
- 범위: 회사명 · 사업자번호 · 대표 이메일 부분 일치

#### 기간

```
가입일: [YYYY-MM-DD] ─ [YYYY-MM-DD]
[오늘] [7일] [30일] [이번달]
```

#### Advanced (토글)

```
─ Advanced ───────────────────────
플랜: [체크박스 목록] (Free/Pro/Enterprise)
월 발송량 임계: [슬라이더 또는 입력] 건 이상
인증서 만료: [슬라이더] N일 이내
────────────────────────────────────
```

#### Saved View (선택)

```
[저장된 보기] ▾
• [내 관심 테넌트]
• [신규 가입 대기]
• [한도 임박]
+ [새 보기 저장]
```

### 테이블 컬럼

| # | 컬럼 | 타입 | 설명 |
| --- | --- | --- | --- |
| 0 | `☐` | 체크박스 | 다중 선택 |
| 1 | 회사명 | 텍스트(버튼) | 클릭 시 상세 페이지 |
| 2 | 사업자번호 | 텍스트 | 000-00-00000 형식 |
| 3 | 대표자 | 텍스트 | 홍길동 |
| 4 | 가입일 | 텍스트 | YYYY-MM-DD |
| 5 | 플랜 | 배지 | Free · Pro · Enterprise |
| 6 | 상태 | 배지 | 심사대기 · 활성 · 차단 · 만료임박 |
| 7 | 금월 발송 | 숫자 | `123,456건` (tabular-nums) |
| 8 | 잔액 크레딧 | 숫자 | `1,234,567원` |
| 9 | 액션 | 버튼 | [편집] [삭제] |

### Bulk Action Bar (선택 시)

좌측 상단에 표시:

```
[선택: N개] [한도 일괄 변경] [차단(위험)] [CSV] [삭제]
```

- **한도 일괄 변경**: 선택한 테넌트들의 SMS/알림톡/이메일/PUSH 월/일 한도 동일하게 설정
- **차단**: 즉시 차단 (위험 팝업 필수)
- **CSV**: 선택 행만 내보내기
- **삭제**: 데이터 완전 삭제 (위험 팝업 필수)

### 상세 페이지 구조

```
┌─────────────────────────────────────┐
│ [GNB]                                │  56px
├─────────────────────────────────────┤
│ 크럼: "회원/고객사 · 고객사 · [회사명]"│
│ [< 뒤로]  회사명  [상태배지]          │  48px
│ 우측: [수정] [크레딧 발급] [• 메뉴]  │
├─────────────────────────────────────┤
│ ┌─ 좌측 메타 (360px) ──┬─ 우측 탭 ─┐ │
│ │ 식별자 (ID)          │ [개요]   │ │
│ │ 가입일               │ [발송]   │ │
│ │ 플랜 + 한도 바       │ [발신]   │ │
│ │ 발신 인프라 요약      │ [사용자] │ │
│ │ 결제 카드            │ [결제]   │ │
│ │                      │ [로그]   │ │
│ │ [Danger Zone]        │         │ │
│ └────────────────────┴─────────┘ │
│                                    │
└────────────────────────────────────┘
```

### 좌측 메타 카드

| 항목 | 표시 | 값 예 |
| --- | --- | --- |
| **테넌트 ID** | 복사 가능 | `tenant_abc123xyz` |
| **가입일** | 텍스트 | 2026-01-15 |
| **플랜** | 배지 + 업그레이드 버튼 | Enterprise |
| **한도** | 프로그레스 바 4개 | SMS: 1M/월 (80%) |
| **발신 인프라 요약** | 링크 버튼 목록 | 발신번호 3개 · 도메인 2개 · 인증서 2개 |
| **결제 카드** | 마스킹 + 유효기간 | `•••• •••• •••• 1234` (2027-06) |

### 우측 탭 내용

#### 탭 1: 개요

```
┌─────────────────────────────┐
│ 기본 정보                    │
├─────────────────────────────┤
│ 회사명: 테크스타트업         │
│ 사업자번호: 000-00-00000    │
│ 대표자: 홍길동              │
│ 주소: [주소]                │
│ 연락처: 010-XXXX-XXXX      │
│                             │
│ ─ 서비스 상태 ───────────── │
│ 상태: 활성                  │
│ 활성화 일시: 2026-01-20    │
│ 만료일: 2027-01-20 (예정)  │
│                             │
│ ─ 금월 통계 ─────────────── │
│ 총 발송: 567,890건          │
│ 성공: 567,001건 (99.9%)    │
│ 실패: 889건 (0.1%)         │
└─────────────────────────────┘
```

#### 탭 2-6: 발송/발신/사용자/결제/로그

각 탭은 자체 목록/테이블 (세부는 해당 정본 문서 참조)

### Danger Zone

```
┌─ Danger Zone ────────────────────┐
│ 위험한 작업                      │
├──────────────────────────────────┤
│ [테넌트 차단]                    │
│  일시 차단 (복구 가능)           │
│                                  │
│ [AppKey/SecretKey 회전]         │
│  NHN 인증 정보 재발급           │
│                                  │
│ [테넌트 삭제]                    │
│  영구 삭제 (복구 불가, super만) │
└──────────────────────────────────┘
```

## API 엔드포인트

| 메서드 | 엔드포인트 | 용도 | 상태 |
| --- | --- | --- | --- |
| `GET` | `/v1/admin/tenants?q=&status=&plan=&page=1` | 테넌트 목록 (페이징/필터) | TBD |
| `GET` | `/v1/admin/tenants/:id` | 테넌트 상세 + 발송/발신/사용자/결제 탭 데이터 | TBD |
| `POST` | `/v1/admin/tenants` | 테넌트 추가 (수동 생성) | TBD |
| `PATCH` | `/v1/admin/tenants/:id` | 테넌트 기본정보 편집 (회사명·연락처 등) | TBD |
| `PATCH` | `/v1/admin/tenants/:id/quota` | 월/일 한도 변경 (SMS/RCS/Kakao/Email/Push) | TBD |
| `POST` | `/v1/admin/tenants/:id/block` | 테넌트 차단 (사유 필수, 복구 가능) | TBD |
| `POST` | `/v1/admin/tenants/:id/unblock` | 차단 해제 | TBD |
| `POST` | `/v1/admin/tenants/:id/credentials/rotate` | NHN AppKey/SecretKey 재발급 | TBD |
| `DELETE` | `/v1/admin/tenants/:id` | 테넌트 영구 삭제 (super_admin only) | TBD |
| `GET` | `/v1/admin/tenants/:id/stats` | 테넌트별 발송 통계 | TBD |
| `GET` | `/v1/admin/tenants/:id/sender-resources` | 발신 인프라 목록 (번호/브랜드/도메인/인증서) | TBD |
| `GET` | `/v1/admin/tenants/export` | CSV 내보내기 (비동기) | TBD |

## 데이터 모델

### 테넌트 (Tenant)

```typescript
interface Tenant {
  id: string
  companyName: string
  businessNumber: string              // 000-00-00000
  representative: string
  address: string
  phone: string
  email: string
  
  plan: 'free' | 'pro' | 'enterprise'
  status: 'pending' | 'active' | 'blocked' | 'expired'
  statusReason?: string               // 차단 사유 등
  
  createdAt: ISO8601
  activatedAt?: ISO8601
  expiresAt?: ISO8601
  updatedAt: ISO8601
  
  // 외래키
  paymentCardId?: string
}
```

### 테넌트 한도 (TenantQuota)

```typescript
interface TenantQuota {
  id: string
  tenantId: string
  
  sms: { monthly: number, daily: number }
  rcs: { monthly: number, daily: number }
  kakao: { monthly: number, daily: number }
  email: { monthly: number, daily: number }
  push: { monthly: number, daily: number }
  
  createdAt: ISO8601
  updatedAt: ISO8601
}
```

### NHN 인증 정보 (NhnCredential — 암호화)

```typescript
interface NhnCredential {
  id: string
  tenantId: string
  appKey: string                      // 암호화 저장
  secretKey: string                   // 암호화 저장
  rotatedAt?: ISO8601                 // 마지막 회전 일시
  createdAt: ISO8601
}
```

### 발신 인프라 요약 (집계)

```typescript
interface SenderResourceSummary {
  tenantId: string
  senderNumbers: number               // SMS 발신번호 개수
  rcsBrands: number                   // RCS 브랜드 개수
  emailDomains: number                // 이메일 도메인 개수
  pushCerts: { fcm: boolean, apns: boolean }
  kakaoProfiles: number
}
```

## 검증 · 에러 처리

| 항목 | 검증 | 에러 메시지 |
| --- | --- | --- |
| **회사명** | 필수, 1~100자 | "회사명을 입력해주세요." |
| **사업자번호** | 형식 (000-00-00000) | "유효한 사업자번호 형식입니다." |
| **이메일** | 이메일 형식 | "유효한 이메일을 입력해주세요." |
| **한도 변경** | 숫자 ≥ 0, 월 ≥ 일 | "월 한도는 일 한도 이상이어야 합니다." |
| **차단 사유** | 필수, ≥10자 | "차단 사유를 10자 이상 입력해주세요." |
| **AppKey 회전** | 확인 팝업 필수 | "정말 재발급하시겠습니까? (기존 키는 무효화됩니다)" |

## 위험 액션 · 감사 로그

| 액션 | 위험도 | 감사 | 조건 |
| --- | --- | --- | --- |
| **한도 일괄 변경** | 높음 | ✓ 기록 | 선택 테넌트 ≥1, before/after diff |
| **테넌트 차단** | 높음 | ✓ 기록 | 사유 ≥10자 필수 |
| **테넌트 차단 해제** | 중간 | ✓ 기록 | 승인자 확인 필수 |
| **AppKey/SecretKey 회전** | 최고 | ✓ 기록 | 기존 키 ID + 회전 일시 기록 |
| **테넌트 삭제** | 최고 | ✓ 기록 | super_admin only, 회사명 타이핑 확인 |
| **CSV 내보내기** | 낮음 | ✓ 기록(선택) | 내보낸 행 수 + 필터 기준 |

모든 위험 액션은 `AppRiskActionDialog` 사용:
- 위험도 표시
- 사유 입력 필드
- 회사명 타이핑 확인 (테넌트 삭제)
- before/after 미리보기

## 구현 상태

| 항목 | 상태 | 비고 |
| --- | --- | --- |
| **목록 페이지 구조** | ✅ 완료 | [`app/pages/member/company.vue`](../../app/pages/member/company.vue) |
| **필터 바** | ✅ 완료 | Quick chips · 검색 · 기간 · Advanced |
| **테이블** | ✅ 개발 중 | 페이징 · 정렬 · 다중 선택 |
| **상세 페이지** | ⏳ 예정 | [`app/pages/member/company/[id].vue`](../../app/pages/member/company/[id].vue) |
| **메타 카드** | ⏳ 예정 | 식별자 · 한도 바 · 발신 인프라 요약 |
| **탭 콘텐츠** | ⏳ 예정 | 개요/발송/발신/사용자/결제/로그 각각 |
| **위험 액션 팝업** | ✅ 컴포넌트 완료 | `AppRiskActionDialog` 재사용 |
| **CSV 내보내기** | ⏳ 예정 | 비동기 다운로드 처리 |
| **백엔드 API** | ⏳ TBD | `malgn-noti-api` 테넌트 엔드포인트 미정의 |

## 알려진 한계 · 후속 작업

| 항목 | 내용 | 우선순위 |
| --- | --- | --- |
| **대량 테넌트** | 5,000개 이상 조회 시 성능 최적화 필요 | P2 |
| **한도 자동 조정** | 시간대별 자동 제한(피크타임) 미지원 | P3 |
| **발신 인프라 동기** | NHN 콘솔의 인프라 변경 자동 감지 미정 | P2 |
| **Saved View 유지** | 사용자별 저장된 필터 지속성 미정 | P3 |
| **일괄 메일 발송** | 한도 변경 시 테넌트 공지 메일 발송 미정 | P2 |
| **NHN 콘솔 연동** | NHN에서만 변경 가능한 항목 딥링크 미적용 | P3 |

## 연관 페이지

- [대시보드](../dashboard.md) — 운영 중심 KPI 및 알림
- [계정(사용자 관리)](./account.md) — 테넌트 소속 사용자 관리
- [감사로그](./audit.md) · [차단/제재](./block.md) — 행정 이력
- [크레딧 발급](../billing/credit-issue.md) · [사용 내역](../billing/credit-use.md) — 결제 관리
- [발송 관리](../send/sms.md) · [발송 통계](../report/channel.md) — 발송 조회
