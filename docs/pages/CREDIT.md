# CREDIT — 크레딧 내역 · 영수증

## ① 개요
- **라우트**: `/account/credit`
- **메인 컴포넌트**: `credit.vue` → `AppMyPageShell` > `AppCreditPanel` (+ `AppReceiptDialog`)
- **셸/권한**: `AppMyPageShell`. 로그인 필요(`credit-ledger`는 `requireAuth`).
- **목적**: 보유 크레딧·통계 확인, 충전/사용 내역 조회·필터, 영수증 보기, 충전 진입.

## ② 진입 경로
- 마이페이지 → "크레딧 관리". GNB 크레딧 위젯에서도 진입.

## ③ 화면 구성
- 보유 크레딧 카드 + `크레딧 충전`(→`/charge`) + 통계(총 충전/보너스/이번 달 사용).
- 필터 바: 기간 프리셋(오늘/1주일/이번달/3개월) + 날짜범위 + 구분 셀렉트 + 키워드 + 검색/초기화.
- 내역 테이블(일시/구분/내용/크레딧 ±/소멸일시) + 페이지 크기(30/50/100) + 페이지네이션.
- 영수증 버튼 → `AppReceiptDialog`.

## ④ 사용자 액션
| 액션 | 결과 | API |
| --- | --- | --- |
| 내역 조회/필터 | 기간·구분 필터 | `GET /credit-ledger?entryType&from&to&cursor&limit` ✅ |
| 보유 잔액 표시 | company.creditBalance | `GET /me` (company.creditBalance) ✅ |
| 영수증 보기 | 충전 건 영수증 | **(미구현)** 영수증 엔드포인트 필요 |
| 충전 이동 | `/charge` | — |

## ⑤ 상태 모델
- `balance`, `STATS`, 필터(`preset/fromDate/toDate/typeFilter/keyword`), `applied`, 페이지네이션. (현재 목업)

## ⑥ 정책 결정 사항
- **구분 enum 매핑**: BE `entryType` = charge/consume/refund/cancel/admin_grant/expire/hold/hold_release. FE 표시 = 충전/관리자 지급/취소/사용/소멸. → FE 라벨 매핑표 정의 필요(hold/hold_release는 사용자 비노출 검토).
- 원장은 append-only(읽기 전용). 충전/차감/환불은 별도 도메인 흐름(크레딧 차감 생명주기: hold→consume/refund).
- 페이징은 cursor 기반(FE의 page 번호식 → cursor 전환 필요).

## ⑦ API 엔드포인트
- `GET /credit-ledger` — **구현 완료**(`credit-ledger.ts`, cursor/entryType/from/to).
- 잔액: `GET /me` → `company.creditBalance` ✅.
- **GAP**: 영수증 발급/조회, 통계(총충전/보너스/월사용) 집계 엔드포인트 미구현.

## ⑧ DB 테이블
- `creditLedger`(파티션, append-only, companyId/entryType/amount/createdAt), `company.creditBalance`.

## ⑨ 현재 구현 상태
- **FE: 데모(목업)**.
- **BE: 부분 구현** — 원장 조회 완료, 잔액 제공. 영수증·통계 미구현.

## ⑩ 알려진 한계·후속
- entryType↔라벨 매핑, cursor 페이징 연결.
- 영수증(세금계산서/카드 영수증) 발급 흐름 — BILLING과 연계.
- 통계 카드 집계 API 정의.
