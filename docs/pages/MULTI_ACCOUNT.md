# MULTI_ACCOUNT — 멀티 계정 / 서비스 담당자 관리

> 멤버 측 **최초 로그인 온보딩** 절차는 [`./MEMBER_ONBOARDING.md`](./MEMBER_ONBOARDING.md) 참조.

## ① 개요
- **라우트**: `/account/multi`
- **메인 컴포넌트**: `multi.vue` → `AppMyPageShell` > `AppMultiAccountPanel` (+ 초대/추가 다이얼로그)
- **셸/권한**: `AppMyPageShell`. **owner/admin만** 추가·변경·삭제 가능(`user.role` = owner/admin/member). 멤버는 조회만.
- **목적**: 같은 고객사(company)에 하위 담당자 계정을 **즉시 생성**하고 권한 부여·상태 변경·삭제.

## ② 진입 경로
- 마이페이지 → "멀티 계정 추가".

## ③ 화면 구성
- **안내 영역**: 본인 인증/이용 안내 문구 + 인증 방법 표(정적 UI 카피).
- **담당자 추가 버튼** → 이름·이메일·권한 입력.
- **멤버 목록 표**: 이름 / 아이디(email) / 권한(role) / 상태 / 최근 로그인 / 생성일 + 행별 권한 변경·정지·삭제.

## ④ 사용자 액션 (owner/admin)
| 액션 | 결과 | API |
|---|---|---|
| 담당자 추가 | user 즉시 생성(joinState='invited') + 임시비번 이메일 발송 | `POST /me/members {name,email,role:'admin'\|'member'}` ✅ |
| 멤버 목록 조회 | 같은 company 활성 사용자(삭제 제외) | `GET /me/members` ✅ |
| 권한 변경 | role 변경(본인/마지막 owner 강등 금지) | `PATCH /me/members/:id {role}` ✅ |
| 정지/해제 | status 0/1 토글(본인/마지막 owner 정지 금지) | `PATCH /me/members/:id {status}` ✅ |
| 삭제 | soft-delete(status=-1, 본인·마지막 owner 삭제 금지) | `DELETE /me/members/:id` ✅ |

## ⑤ 상태 모델
- `members[]` (실데이터, `GET /me/members`). 안내 문구·인증방법표는 정적 UI 상수.
- 권한 `role`: owner / admin / member. 계정 `status`: 1(정상)·0(정지)·-1(삭제).
- 멤버 가입 진행: `joinState` invited → joined (온보딩으로 전환 — [MEMBER_ONBOARDING](./MEMBER_ONBOARDING.md)).

## ⑥ 정책 결정 사항
- **즉시 생성 단순판** 채택 — 별도 초대 수락/만료 흐름·NICE 본인인증 승격은 **이번 버전 미사용**. owner/admin이 만들면 곧바로 `invited` 멤버가 생성되고 임시비번이 메일로 발송됨.
- `loginid=email` 전역 UNIQUE — 중복 시 `409`.
- 마지막 owner 보호: 강등·정지·삭제 모두 차단. 본인 계정 자기 변경/삭제 차단.
- `member.create` 등 변경은 `auditLog` 기록.

## ⑦ API 엔드포인트 (구현 완료 — `me.ts`)
- `GET /me/members`
- `POST /me/members {name, email, role}` → `201 {data, tempPassword?}` (tempPassword는 NHN_MOCK=1 시)
- `PATCH /me/members/:id {role?, status?}`
- `DELETE /me/members/:id`

## ⑧ DB 테이블
- `user` (companyId, loginid=email, role, status, joinState, name, phone, lastLoginAt …)
- `auditLog` (member.create 등)
- ※ 별도 초대(invite) 테이블 없음 — 즉시 생성 방식이라 불필요.

## ⑨ 현재 구현 상태
- **FE: ✅ 실 API 연동** — `AppMultiAccountPanel`이 `GET/POST/PATCH/DELETE /me/members` 호출. owner/admin 권한 가드(`canManage`) 포함.
- **BE: ✅ 구현 완료** — CRUD + 마지막 owner/본인 보호 + 임시비번 이메일 + 감사로그.

> 정정: 이전 문서의 "초대(NICE 승격) 미구현 / 백엔드 전무" 서술은 폐기. 실제로는 **즉시 생성 단순판 `/me/members`로 FE·BE 모두 구현 완료** 상태다.

## ⑩ 알려진 한계·후속
- 신규 멤버의 **최초 로그인 온보딩 게이트·페이지**는 별도 작업(작업 #11, [MEMBER_ONBOARDING](./MEMBER_ONBOARDING.md) ⑨~⑩ 참조).
- 임시비번 만료/재발급, 멤버 재초대(이메일 재발송) UI 미정.
- NICE 본인인증 기반 사업자 승격은 향후 별도 도메인(현 버전 범위 외).
