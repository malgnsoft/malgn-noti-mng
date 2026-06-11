# BILLING — 결제 이메일 / 세금계산서(청구) 정보

## ① 개요
- **라우트**: `/account/billing`
- **메인 컴포넌트**: `billing.vue` → `AppMyPageShell` (**전용 패널 없음**)
- **셸/권한**: `AppMyPageShell`. owner/admin(회사 정보 수정 권한).
- **목적**: 결제(청구)용 이메일·세금계산서 정보 확인·수정, 결제 내역 확인.

## ② 진입 경로
- 마이페이지 → "결제 내역".

## ③ 화면 구성 (목표 — 현재 미구현)
- 결제용 이메일(`billingEmail`) 표시·수정.
- 세금계산서/사업자 정보(사업자번호·상호·대표·업태·업종·주소) 확인.
- 결제/청구 내역 + 영수증(크레딧 충전과 연계).

## ④ 사용자 액션
| 액션 | 결과 | API |
| --- | --- | --- |
| 결제 이메일 수정 | billingEmail 갱신 | `PATCH /me/company {billingEmail}` ✅ |
| 회사/청구 정보 조회 | 회사 정보 | `GET /me` (company.*) ✅ |
| 발송 설정(부가) | settings JSON | `GET/PUT /company-settings` ✅ |
| 결제 내역 조회 | 청구·영수증 | **(미구현)** |

## ⑤ 상태 모델
- 현재 FE 상태 없음(빈 셸). 목표: `billingEmail`(편집/저장), 회사 정보 read-only.

## ⑥ 정책 결정 사항
- `billingEmail` 변경은 owner/admin + 회사 승인(approved) 상태에서만(BE 강제).
- 세금계산서 발행 주체/방식(PG 연계 or 수기) 미정 — 결제 게이트웨이 선정과 연동.

## ⑦ API 엔드포인트
- `GET /me` → `company.billingEmail` 외 회사 정보 ✅.
- `PATCH /me/company {companyPhone?, billingEmail?, adReceive?}` — **구현 완료**(`me.ts`).
- `GET/PUT /company-settings` — **구현 완료**(`company-settings.ts`, settings JSON).
- **GAP**: 결제/청구 내역, 세금계산서 발행/조회 엔드포인트 미구현.

## ⑧ DB 테이블
- `company`(billingEmail/bizNo/ceoName/upTae/upJong/address/companyPhone …), `companySettings`(settings JSON).

## ⑨ 현재 구현 상태
- **FE: 미구현(스캐폴드)** — `billing.vue`는 빈 `AppMyPageShell`로 전용 패널 없음. **6페이지 중 FE 완성도 최저**.
- **BE: 부분 구현** — 결제 이메일/회사 정보 수정·조회는 가능, 결제 내역·세금계산서 미구현.

## ⑩ 알려진 한계·후속
- 페이지 명칭/범위 정리 필요: "결제 내역" vs "결제(청구) 정보 설정" — CREDIT(크레딧 내역)·CARDS(카드)와 역할 경계 확정.
- `AppBillingPanel` 신설(결제 이메일 폼 + 세금계산서 정보).
- 결제 내역/영수증 엔드포인트 정의(크레딧 충전 트랜잭션과 연계).
