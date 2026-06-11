# MEMBER_ONBOARDING — 멀티계정 멤버 최초 로그인 온보딩

> 멀티계정 멤버(owner/admin이 `/account/multi`에서 추가한 담당자)가 **임시 비밀번호로 최초 로그인** 후 거치는 강제 온보딩 절차의 정본.
> 멤버 생성·관리(owner/admin 측)는 [`./MULTI_ACCOUNT.md`](./MULTI_ACCOUNT.md) 참조.

## ① 개요
- **목적**: 임시비번으로 들어온 신규 멤버가 ① 약관 동의 ② 회원정보 등록 ③ 비밀번호 변경을 마쳐야 정식 회원(가입 완료)으로 전환.
- **대상**: `user.joinState === 'invited'` 인 멤버(= 온보딩 미완료).
- **완료 표기**: `user.joinState 'invited' → 'joined'` (= 회원가입 절차 완료).

## ② 전체 흐름
```
owner/admin: /account/multi → 담당자 추가
   POST /me/members { name, email, role } → user 생성(joinState='invited') + 임시비번 이메일 발송
       ↓
멤버: 임시 이메일(아이디=email, 임시비번) 수신 → /login 임시비번 로그인 (JWT 발급)
       ↓ (joinState='invited' → 온보딩 게이트가 모든 화면 접근 차단·리다이렉트)
온보딩 화면: ① 이용약관 동의 → ② 회원정보 등록(이름·휴대폰) → ③ 새 비밀번호 설정
   POST /me/onboarding { newPassword, name, phone?, agreedTerms:true }
       ↓ (트랜잭션: passwordHash 교체 + name/phone + termsAgreedAt=now + joinState='joined')
완료 → 가입 완료. 정상 서비스 진입(이후 approval.global 게이트가 회사 승인 흐름 처리)
```

## ③ 온보딩 단계 (강제, 순서)
| 단계 | 내용 | 저장 필드 |
|---|---|---|
| ① 이용약관 동의 | 필수 약관 동의 체크(`agreedTerms` 필수 true) | `user.termsAgreedAt = now` (v1: 타임스탬프만, 별도 약관동의 테이블 없음) |
| ② 회원정보 등록 | 이름(필수)·휴대폰(선택) | `user.name`, `user.phone` |
| ③ 비밀번호 변경 | 임시비번 → 새 비밀번호(8자+·특수문자 1개 이상) | `user.passwordHash` |
- 3단계는 단일 `POST /me/onboarding` 호출로 **원자적(트랜잭션) 처리**. 일부만 저장되는 중간 상태 없음.

## ④ 상태 모델 — joinState
- `user.joinState varchar(20) default 'joined'` (일반 가입자는 처음부터 'joined').
- 멀티계정 멤버: 생성 시 `'invited'` → 온보딩 완료 시 `'joined'`.
- 전이: `invited --POST /me/onboarding--> joined` (단방향, 멱등).
- **게이트 규칙**: `joinState !== 'joined'` 이면 온보딩 화면 외 모든 라우트 접근 차단 → 온보딩으로 리다이렉트.
- 우선순위: **온보딩 게이트 > 회사 승인(approval) 게이트.** (`approval.global.ts`는 `joinState!=='joined'` 멤버를 만나면 즉시 return하여 온보딩 게이트에 양보 — 코드 확인 완료.)

## ⑤ 사용자 액션
| 액션 | 주체 | API |
|---|---|---|
| 담당자 추가(멤버 생성+임시비번) | owner/admin | `POST /me/members` ✅ |
| 임시비번 로그인 | 멤버 | `POST /auth/login` ✅ |
| 온보딩 완료(약관+정보+비번) | 멤버 | `POST /me/onboarding` ✅ |
| 내 상태 조회(joinState) | 멤버 | `GET /me` (user.joinState) ✅ |

## ⑥ 정책 결정 사항
- 임시비번: 12자, 대/소문자+숫자+특수문자 각 1개 이상 보장(프론트 비번 정책 충족). `ops` temp-password 패턴 재사용.
- 임시비번 이메일: 아이디(=email) + 임시비번 안내. `NHN_MOCK=1`이면 응답에 `tempPassword` 노출(개발 편의).
- 약관 동의는 v1 최소 방식 — `termsAgreedAt` 타임스탬프만. (약관 버전·항목별 동의 이력은 후속.)
- `POST /me/onboarding`은 **멱등** — 이미 'joined'여도 재실행 허용(프로필/비번 갱신), joinState는 항상 'joined'로 수렴.
- 비밀번호 규칙은 BE/FE 동일(`min8` + `/[^A-Za-z0-9]/`).

## ⑦ API 계약 (api-dev 확정 — `malgn-noti-api/src/routes/me.ts`)
- **POST /me/members** (owner/admin)
  - body: `{ name: string(1..60), email: string(email,..160), role: 'admin'|'member' }`
  - 동작: company에 user 생성, `joinState='invited'`, `loginid=email`, 임시비번 생성·이메일 발송, 감사로그.
  - 응답 `201 { data: memberView, tempPassword? }` (tempPassword는 mockMode만). 중복 이메일 → `409`.
- **POST /me/onboarding** (멤버, 임시비번 JWT)
  - body: `{ newPassword: string(min8 +특수문자), name: string(1..60), phone?: string(..20), agreedTerms: true(필수) }`
  - 동작(트랜잭션): `passwordHash` 교체 + `name`/`phone` 갱신 + `termsAgreedAt=now` + `joinState='joined'`.
  - 응답 `{ data: { joinState, name, phone, termsAgreedAt } }`.
- **GET /me** → `data.user.joinState` 노출(게이트 판정 소스).

## ⑧ DB 테이블
- `user`: `joinState varchar(20) default 'joined'`, `termsAgreedAt datetime`, `passwordHash`, `name`, `phone`, `loginid`(=email, 전역 UNIQUE), `role`.
- `auditLog`: `member.create` 액션 기록.

## ⑨ 현재 구현 상태
- **BE: 구현 완료** — `POST /me/members`(invited 생성+임시비번), `POST /me/onboarding`(invited→joined, 트랜잭션·멱등) 모두 존재. `GET /me`가 joinState 반환.
- **FE: 부분 구현**
  - ✅ `stores/auth.ts`: `needsOnboarding` getter(`joinState !== 'joined'`), `onboard()` 액션(`POST /me/onboarding`).
  - ✅ `approval.global.ts`: 온보딩 미완 멤버 만나면 승인 게이트 양보(우선순위 정의됨).
  - ⬜ **온보딩 게이트 미들웨어** `onboarding.global.ts` — `approval.global.ts` 주석이 참조하나 파일 미존재. (작업 #11 진행 중)
  - ⬜ **온보딩 화면 페이지** (3단계 UI) — 미존재. (작업 #11 진행 중)

## ⑩ 알려진 한계·후속
- `onboarding.global.ts` 게이트 + 온보딩 페이지(라우트) 신설 필요 — 게이트는 `joinState!=='joined'`면 온보딩 경로 외 전부 차단·리다이렉트, 온보딩 완료 시 해제.
- 온보딩 페이지의 약관 본문 출처(약관 뷰어 재사용) 확정 필요.
- 약관 동의 이력 상세화(버전/항목)는 후속 — 현재 타임스탬프만.
- 임시비번 만료/재발급 정책 미정(현재 만료 없음).
