# INQUIRIES — 내 문의 내역 (목록 + 상세)

## ① 개요
- **라우트**: `/account/inquiries`(`AppInquiryListPanel`), `/account/inquiries/detail`(`AppInquiryDetailPanel`)
- **셸/권한**: `AppMyPageShell`. 로그인 + 승인(`requireApproved`) 필요. 작성/수정/삭제는 본인 글만.
- **목적**: 1:1 문의 내역 조회·검색, 상세·답변(스레드) 확인, 문의 삭제, 신규 문의 작성 진입.

## ② 진입 경로
- 마이페이지 → "나의 문의". 신규 작성은 `/account/inquiry`.

## ③ 화면 구성
- **목록**: 상태 집계(답변대기/답변중/답변완료) + 키워드 검색 + 카드 리스트(상태 배지·채널·제목·본문·시간·댓글수) + ⋮ 메뉴(삭제) + 더보기.
- **상세**: 문의 본문 + 답변 스레드(`replies`).

## ④ 사용자 액션
| 액션 | 결과 | API |
| --- | --- | --- |
| 목록 조회/필터 | 상태별·커서 | `GET /inquiries?answerState&cursor&limit` ✅ |
| 상세 보기 | 본문 + 답변 | `GET /inquiries/:id` + `GET /inquiries/:id/replies` ✅ |
| 문의 작성 | 등록 | `POST /inquiries {inquiryType, productType?, title, body}` ✅ |
| 문의 수정 | wait 상태+본인만 | `PATCH /inquiries/:id` ✅ |
| 답변 작성(고객) | 스레드 추가 | `POST /inquiries/:id/replies {body}` ✅ |
| 삭제 | soft-delete | `DELETE /inquiries/:id` ✅ |

## ⑤ 상태 모델
- 상태 enum `answerState`: wait / progress / done. `inquiryType`: product/payment/partner/etc. `productType`: all/sms/rcs/kakao/email/push.
- FE: `INQUIRIES[]`, `keyword`, 더보기 페이징. (현재 목업)

## ⑥ 정책 결정 사항
- 답변 시작(answerState≠wait) 시 본인 수정 잠금(BE 강제).
- 답변 작성 시 inquiry.answerState='progress' 자동 갱신.

## ⑦ API 엔드포인트 (BE 구현 완료 — `inquiries.ts`)
- `GET /inquiries`, `POST /inquiries`, `GET /inquiries/:id`, `PATCH /inquiries/:id`, `DELETE /inquiries/:id`
- `GET /inquiries/:id/replies`, `POST /inquiries/:id/replies`

## ⑧ DB 테이블
- `inquiry`(companyId/userId/inquiryType/productType/title/body/answerState/status), `inquiryReply`(inquiryId/authorUserId/authorName/adminYn/body).

## ⑨ 현재 구현 상태
- **FE: 데모(목업)** — 목록/상세 UI 완성, BE 미연동.
- **BE: 구현 완료** — CRUD + 답변 스레드 전부 동작.

## ⑩ 알려진 한계·후속
- **detail.vue가 고정 `/account/inquiries/detail`로 이동** — `:id` 파라미터 기반 라우팅으로 변경 필요(`/account/inquiries/[id]`).
- FE 카테고리(채널 표시)와 BE `inquiryType/productType` 매핑 정리.
- 목록 더보기(page) → cursor 페이징 연결. 첨부파일 정책 미정.
