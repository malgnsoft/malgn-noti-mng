# SECURITY — 보안로그인 설정 (+ 비밀번호 변경)

> `/account/security`(보안로그인=2FA)와 `/account/password`(비밀번호 변경)를 함께 다룬다.

## ① 개요
- **라우트**: `/account/security`(`AppSecurityLoginPanel`), `/account/password`(`AppPasswordChangePanel`)
- **셸/권한**: `AppMyPageShell`. 로그인 필요(2FA·비밀번호는 `requireApproved` 불요 — `me` 라우트는 `requireAuth`만).
- **목적**: 로그인 2단계 인증(보안로그인) on/off·방식 선택, 비밀번호 변경.

## ② 진입 경로
- 마이페이지 → "보안로그인 설정" / "비밀번호 변경".

## ③ 화면 구성
**보안로그인**: 사용 여부 세그(사용/사용안함) → 사용 시 인증 방식 카드(이메일 인증 / 휴대전화 인증) → 저장하기(dirty 시 활성).
**비밀번호 변경**: 현재/새/확인 비밀번호 + 보기 토글. 규칙: 8자+ & 특수문자 1개 이상(`/[^A-Za-z0-9]/`, BE와 동일). 재설정 링크 안내.

## ④ 사용자 액션
| 액션 | 결과 | API |
| --- | --- | --- |
| 보안로그인 on/off·방식 저장 | securityLoginYn / method 갱신 | **(미구현)** `PATCH /me/security` 류 필요 |
| 현재 설정 조회 | 토글·방식 초기값 | **(미구현)** `GET /me`에 노출 필요 |
| 비밀번호 변경 | 현재비번 재인증 후 갱신 | `POST /me/password {currentPassword, newPassword}` ✅ |

## ⑤ 상태 모델
- 보안: `savedEnabled/savedMethod` ↔ `enabled/method`(편집), `dirty`. (현재 로컬 목업)
- 비번: `currentPw/newPw/confirmPw`, `canSave`, `auth.changePassword()` 연동됨.

## ⑥ 정책 결정 사항
- **방식 값 통일 필요**: FE는 `'email' | 'phone'`. BE 컬럼 `securityLoginMethod varchar(10)` + 로그인 흐름 `resolve2faChannel`. FE `'phone'` ↔ BE `'sms'` 여부 확인·표준화 필요.
- 로그인 시 2FA: 계정 `securityLoginYn='Y'`면 정식 JWT 대신 pendingToken + OTP 발송 → `/auth/2fa/verify`. (로그인 측 구현 완료)

## ⑦ API 엔드포인트
- 비밀번호: `POST /me/password` — **구현 완료**(`me.ts`).
- 로그인 2FA: `POST /auth/2fa/verify`, `POST /auth/2fa/resend` — **구현 완료**(`auth.ts`).
- **GAP**: 보안로그인 설정 읽기/변경 엔드포인트 부재 — `GET /me`가 `securityLoginYn/Method`를 반환하지 않으며, 설정 변경 PATCH도 없음.

## ⑧ DB 테이블
- `user.securityLoginYn char(1) 'N'`, `user.securityLoginMethod varchar(10)`, `user.passwordHash`.

## ⑨ 현재 구현 상태
- **비밀번호 변경**: **부분 연동 완료**(FE↔`POST /me/password`).
- **보안로그인 설정**: **FE 데모(목업)** + **BE 설정 엔드포인트 미구현**(단, 로그인 2FA 실행부는 완성).

## ⑩ 알려진 한계·후속
1. `GET /me` 응답에 `securityLoginYn/securityLoginMethod` 추가.
2. `PATCH /me/security {enabled, method}` 신설(방식 enum 통일).
3. 보안로그인 ON 전환 시 본인 인증/연락처 검증 정책 정의.
