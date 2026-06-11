# CARDS — 결제 카드 관리

## ① 개요
- **라우트**: `/account/cards`
- **메인 컴포넌트**: `app/pages/account/cards.vue` → `AppMyPageShell` > `AppCardListPanel`
- **셸/권한**: 마이페이지 셸(`AppMyPageShell`) 좌측 네비. 로그인 + 승인(`requireApproved`) 필요.
- **목적**: 크레딧 충전에 사용할 결제 카드 등록·삭제·기본 카드 지정.

## ② 진입 경로
- GNB 마이페이지 → "결제 카드 관리", 또는 크레딧 충전(`/charge`) 흐름에서 카드 선택.

## ③ 화면 구성
- 등록 카드 리스트(라디오 = 기본 카드 선택, 카드 비주얼/브랜드/`**********last4`/별칭, "기본 카드" 배지).
- `카드 추가` 버튼 → `AppCardAddDialog`.
- `저장하기`(기본 카드 변경 dirty 시 활성).
- 삭제 → `AppConfirmDialog`(danger).

## ④ 사용자 액션
| 액션 | 결과 | API(목표) |
| --- | --- | --- |
| 카드 추가 | 다이얼로그에서 등록 | `POST /payment-methods` |
| 기본 카드 선택+저장 | defaultYn 갱신(타 카드 N) | `PATCH /payment-methods/:id {defaultYn:'Y'}` |
| 별칭 변경 | alias 갱신 | `PATCH /payment-methods/:id {alias}` |
| 삭제 | soft-delete(status=-1) | `DELETE /payment-methods/:id` |
| 목록 조회 | 기본카드 우선·최신순 | `GET /payment-methods` |

## ⑤ 상태 모델
- `cards[]`, `defaultCard`(편집), `savedDefault`(저장), `dirty`. (현재 전부 로컬 ref 목업)

## ⑥ 정책 결정 사항
- **PG 토큰화 미정**: BE는 1차 골격으로 `billingKeyBase64`(base64) 입력 + 응답 마스킹. 실제 운영은 PG 빌링키 발급(`/payment-methods/register` 류) 분리 필요 — 결제 게이트웨이 선정(토스/포트원/나이스) 후 확정.
- `billingKeyEnc`는 응답에서 항상 제외.

## ⑦ API 엔드포인트 (BE 구현 완료 — `payment-methods.ts`)
- `GET /payment-methods?cursor&limit`
- `POST /payment-methods {pgProvider, billingKeyBase64, brand?, last4?, alias?}`
- `PATCH /payment-methods/:id {alias?, defaultYn?}`
- `DELETE /payment-methods/:id`

## ⑧ DB 테이블
- `paymentMethod` (companyId, pgProvider, billingKeyEnc, brand, last4, alias, defaultYn, status).

## ⑨ 현재 구현 상태
- **FE: 데모(목업)** — 로컬 ref CRUD, BE 미연동.
- **BE: 구현 완료** — CRUD + 기본카드 단일화 로직 동작.

## ⑩ 알려진 한계·후속
- PG 실연동(빌링키 토큰화) 미구현 — 카드 추가 다이얼로그 입력값 → 빌링키 변환 흐름 정의 필요.
- `useApi` 래퍼로 BE 연동, 페이지네이션(cursor) 연결.
