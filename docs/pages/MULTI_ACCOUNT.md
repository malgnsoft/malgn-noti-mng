# MULTI_ACCOUNT — 멀티 계정 / 서비스 담당자 초대

## ① 개요
- **라우트**: `/account/multi`
- **메인 컴포넌트**: `multi.vue` → `AppMyPageShell` > `AppMultiAccountPanel` (+ `AppManagerInviteDialog`)
- **셸/권한**: `AppMyPageShell`. owner/admin 권한 대상(권한 모델은 `user.role` = owner/admin/member).
- **목적**: 본인 인증 안내, 서비스 담당자(임직원) 초대 → 멀티계정 권한 부여, 인증 내역 확인.

## ② 진입 경로
- 마이페이지 → "멀티 계정 추가".

## ③ 화면 구성
- **본인 인증 안내**: 고시 준수 안내 문구 + 인증 방법 표(사업자 대표/임직원, 필요 서류). `서비스 담당자 초대하기` 버튼.
- **본인 인증 내역 표**: 회원 유형 / 이름(임직원) / 제출 서류 / 상태(승인·승인대기·반려·초대발송) / 인증 요청 일시 / 인증 일시.

## ④ 사용자 액션
| 액션 | 결과 | API(목표) |
| --- | --- | --- |
| 담당자 초대 | 이름·이메일 입력 → 초대 발송 행 추가 | **(미구현)** `POST /manager-invites` 류 |
| 초대 수락/본인인증 | NICE 본인 인증 → 멤버 승격 | **(미구현)** + `nice.ts` 연계 |
| 인증 내역 조회 | 상태 목록 | **(미구현)** `GET /members` / `/manager-invites` |
| 권한 변경·삭제 | role 변경 / 멤버 제거 | **(미구현)** |

## ⑤ 상태 모델
- `records[]`(인증 내역), `inviteOpen`. 상태 enum: 승인 / 승인 대기 / 반려 / 초대 발송. (현재 전부 로컬 목업)

## ⑥ 정책 결정 사항
- 초대 흐름 미정 — `auth.ts` 주석: "동료 추가는 `/manager-invites` 흐름 (추후)".
- 본인 인증: NICE 휴대폰 인증(`adapters/nice/auth.ts`, `routes/nice.ts`) 연계. 초대 계정은 본인 인증 승인 시 회원 유형이 "사업자"로 전환.
- 권한 모델(owner/admin/member) ↔ "멀티계정" 회원 유형 매핑 정의 필요.

## ⑦ API 엔드포인트
- **전무(미구현)**. 신설 후보: `POST /manager-invites`(초대), `GET /manager-invites`(내역), `POST /manager-invites/:id/accept`, `GET /members`, `PATCH /members/:id`(권한), `DELETE /members/:id`. 본인 인증은 기존 `nice.ts` 재사용.

## ⑧ DB 테이블
- `user`(role/memberType/companyId) 존재. **초대(membership/invite) 전용 테이블 미존재 — 신설 필요**.

## ⑨ 현재 구현 상태
- **FE: 데모(목업)** — 안내·내역·초대 모달 UI만.
- **BE: 미구현** — 매니저 초대/멤버 관리 라우트·테이블 없음. 본인 인증(NICE)만 별도 존재.

## ⑩ 알려진 한계·후속
- 6페이지 중 **백엔드 구현도 가장 낮음**. 데이터모델(초대 테이블·상태 전이)부터 설계 필요.
- 초대 메일/링크, 만료, 재발송, 권한 RBAC 정책 미정.
