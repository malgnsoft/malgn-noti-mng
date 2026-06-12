# 프로젝트 참여자(회원) 시스템

> **대상**: 관리 레포 `malgn-noti-mng`의 **문서/이력 브라우저 앱** 자체의 회원(= 프로젝트 참여자) 시스템.
> (사용자단 `malgn-noti`의 테넌트 회원가입은 별도 정본 [`./SIGNUP.md`](./SIGNUP.md)·[`../MEMBERSHIP.md`](../MEMBERSHIP.md)를 참조. 본 문서와 혼동하지 말 것.)
>
> **정본 소스 (실제 구현)**:
> - 스키마: [`../../server/db/schema.ts`](../../server/db/schema.ts) (`member` 테이블) · 마이그레이션 [`0002_bizarre_korath.sql`](../../server/db/migrations/0002_bizarre_korath.sql)(테이블 생성)·[`0003_slippery_kid_colt.sql`](../../server/db/migrations/0003_slippery_kid_colt.sql)(`agreed_at` 추가)
> - 서버 유틸: [`../../server/utils/auth.ts`](../../server/utils/auth.ts) (PBKDF2 해시 · HMAC 세션 쿠키 · 오피스 시크릿/토큰 검증) · [`../../server/utils/members.ts`](../../server/utils/members.ts) (D1 + dev 인메모리 폴백 저장소)
> - API: [`../../server/api/auth/`](../../server/api/auth/) (`signup.post`·`check-id.get`·`login.post`·`logout.post`·`me.get`·`sso.get`) · [`../../server/api/account/index.patch.ts`](../../server/api/account/index.patch.ts)·[`../../server/api/account/password.post.ts`](../../server/api/account/password.post.ts) · [`../../server/api/members.get.ts`](../../server/api/members.get.ts) · [`../../server/api/integration/office/upsert.post.ts`](../../server/api/integration/office/upsert.post.ts)
> - 프론트: [`../../app/pages/login.vue`](../../app/pages/login.vue)·[`../../app/pages/signup/index.vue`](../../app/pages/signup/index.vue)·[`../../app/pages/signup/complete.vue`](../../app/pages/signup/complete.vue)·[`../../app/pages/account.vue`](../../app/pages/account.vue)·[`../../app/pages/members.vue`](../../app/pages/members.vue) · [`../../app/composables/useAuth.ts`](../../app/composables/useAuth.ts) · [`../../app/plugins/auth.ts`](../../app/plugins/auth.ts) · [`../../app/middleware/auth.ts`](../../app/middleware/auth.ts) · [`../../app/layouts/default.vue`](../../app/layouts/default.vue)
>
> **마지막 현행화**: 2026-06-12 (내 정보/마이페이지 `/account` 추가 — 프로필 수정·비밀번호 변경)

---

## 1. 페이지 개요

관리 앱의 회원은 **"프로젝트 참여자"** 다 — 맑은노티 프로젝트의 문서·WBS·작업 이력을 열람하는 사람. 가입 경로가 둘이다.

| 라우트 | 메인 컴포넌트 | 셸(레이아웃) | 권한 |
| --- | --- | --- | --- |
| `/login` | [`app/pages/login.vue`](../../app/pages/login.vue) | `default` (GNB+푸터) | 게스트 (로그인 시 진입 차단 → redirect) |
| `/signup` | [`app/pages/signup/index.vue`](../../app/pages/signup/index.vue) | `default` | 게스트 (로그인 시 `/` 리다이렉트) |
| `/signup/complete` | [`app/pages/signup/complete.vue`](../../app/pages/signup/complete.vue) | `default` | **로그인 필수** (가입 직후 자동 로그인 상태로 진입, 비로그인 직접진입은 `/login`) |
| `/account` | [`app/pages/account.vue`](../../app/pages/account.vue) | `default` | **로그인 필수** (`middleware: 'auth'`) — 내 정보(마이페이지) |
| `/members` | [`app/pages/members.vue`](../../app/pages/members.vue) | `default` | **로그인 필수** (`middleware: 'auth'`) |
| `/api/auth/sso` | (서버 핸들러, 화면 없음) | — | 공개 (서명 토큰 검증) — 맑은오피스 SSO 진입점 |

- 회원 필드: **아이디(`loginId`)·비밀번호·성명(`name`)·회사명(`company`)·역할(`role`)·이메일(`email`)·휴대전화번호(`phone`)**. 부가: `source`(direct|office)·`officeId`·`status`(active|suspended)·`agreedAt`(개인정보 수집·이용 동의 시각)·타임스탬프.
- 인증 상태는 전역 `useState('auth:member')`로 보관, 앱 시작 시 [`plugins/auth.ts`](../../app/plugins/auth.ts)가 `/api/auth/me`로 1회 하이드레이션(SSR 쿠키 포워딩).
- GNB([`layouts/default.vue`](../../app/layouts/default.vue))는 로그인 시 회원명 + 로그아웃, 비로그인 시 "로그인" 링크를 표시. **회원명 링크는 `/account`(내 정보)** 로 이동(기존 `/members`에서 변경). 참여자 목록(`/members`)은 별도 GNB 메뉴로 유지.

---

## 2. 진입 경로

```
[직접 회원가입]
  GNB "로그인" → /login → "회원가입" 링크 → /signup
    → 아이디 "중복확인"(GET /api/auth/check-id) 통과
    → 개인정보 수집·이용 동의(필수) — 내부 시스템이라 이용약관 동의는 두지 않음
    → 제출: POST /api/auth/signup (검증·중복확인·해시·생성, agreedPrivacy 포함 → agreed_at 기록)
    → 세션 쿠키(mng_session) 발급 = 자동 로그인 → navigateTo('/signup/complete')

[비밀번호 로그인]
  /login → POST /api/auth/login → 세션 발급 → redirect 쿼리(또는 '/')

[내 정보(마이페이지)]
  로그인 → GNB 회원명 클릭 → /account
    → 프로필 수정(PATCH /api/account) / 비밀번호 변경(POST /api/account/password)

[보호 페이지 직접 진입(비로그인)]
  /members 등 → middleware('auth') → /login?redirect=<원래경로> → 로그인 후 복귀

[맑은오피스 연동 — 무가입 진입]
  (A) 서버 간 푸시:  맑은오피스 → POST /api/integration/office/upsert (x-office-secret)
                     → office_id 기준 자동 가입/갱신 (세션 없음, 프로비저닝만)
  (B) SSO 핸드오프:  맑은오피스 → GET /api/auth/sso?token=<HMAC 서명>&redirect=/
                     → 토큰 검증 → upsertByOffice → 세션 발급 → 302 redirect
```

---

## 3. 화면 구성

### 3.1 `/login`
- 단일 카드: 아이디 / 비밀번호 입력 + 로그인 버튼.
- 하단 안내: "회원가입" 링크 + **"맑은오피스 사용자는 별도 가입 없이 맑은오피스에서 바로 접속할 수 있습니다."**
- 에러는 카드 내 인라인 메시지. 이미 로그인 상태면 진입 즉시 `redirect`로 이동.

### 3.2 `/signup`
- 와이드 카드(2열 그리드): 아이디·성명(필수) / 비밀번호·비밀번호 확인(필수) / 회사명·역할 / 이메일·휴대전화번호.
- **아이디 + 중복확인 버튼**: 아이디 입력 후 "중복확인"으로 `GET /api/auth/check-id` 호출 → 사용가능/형식오류/중복을 인라인 표시. **중복확인 통과 전 제출 차단**(아이디 변경 시 재확인 필요).
- **개인정보 수집·이용 동의 박스**: 개인정보 수집·이용 동의(필수 체크). 내부 시스템이라 **이용약관 동의는 두지 않음**. 동의 본문은 현재 **플레이스홀더 텍스트**("추후 확정") — 정식 문안 미확정(§10).
- 클라이언트 1차 검증(아이디 패턴·비밀번호 8자·일치·개인정보 동의) 후 서버 호출. 성공 시 자동 로그인 → `/signup/complete`.

### 3.3 `/signup/complete`
- 가입 완료 안내 화면. 가입 성공 시 자동 로그인 상태로 이 화면에 진입(기존 즉시 `/` 이동에서 변경).
- 비로그인 상태로 직접 진입하면 `/login`으로 리다이렉트(완료 화면은 가입 직후에만 의미가 있음).
- 라우트 구조: 부모/자식 충돌 회피로 `app/pages/signup.vue` → `app/pages/signup/index.vue`로 이동하고 `app/pages/signup/complete.vue`를 신설.

### 3.4 `/account` (내 정보 / 마이페이지)
- 로그인 회원 **본인**의 정보를 보고 수정. 두 블록으로 구성.
- **프로필 수정**: 성명·회사명·역할·이메일·휴대전화 수정 가능. **아이디는 읽기전용 표시**, 비밀번호·`source`는 수정 대상 아님. 저장 시 `PATCH /api/account` → 검증(성명 필수, 이메일/휴대폰 형식) 후 갱신, `updated_at` 기록, 응답으로 전역 auth 상태(`useState('auth:member')`) 갱신.
- **비밀번호 변경**: 현재 비밀번호 확인 → 새 비밀번호(8자↑·확인 일치)로 교체(`POST /api/account/password`). **오피스 연동 회원(`password_hash=null`)은 비밀번호 미사용** → 400 + 안내 문구("비밀번호를 사용할 수 없는 계정입니다(맑은오피스 연동) — 맑은오피스를 통해 로그인").

### 3.5 `/members`
- 프로젝트 참여자 테이블: 성명·아이디·회사명·역할·이메일·휴대전화 + **구분 배지**(`맑은오피스`/`직접가입`).
- 상단에 총 인원 수. 로딩/에러/빈 상태 처리. 읽기 전용(편집·삭제 UI 없음 — 후속).

---

## 4. 사용자 액션 매트릭스

| 액션 | 주체 | 화면/엔드포인트 | 결과 | 인증 |
| --- | --- | --- | --- | --- |
| 아이디 중복확인 | 게스트 | `/signup` → `GET /api/auth/check-id?loginId=` | 형식·사용가능 여부 인라인 표시(제출 게이트) | 불필요 |
| 직접 회원가입 | 게스트 | `/signup` → `POST /api/auth/signup` | `source='direct'` 회원 생성(+`agreed_at`) + 자동 로그인 → `/signup/complete` | 불필요 |
| 비밀번호 로그인 | 게스트 | `/login` → `POST /api/auth/login` | 세션 발급 | 불필요 |
| 로그아웃 | 회원 | GNB → `POST /api/auth/logout` | 세션 쿠키 제거 | 세션 |
| 현재 회원 조회 | 모두 | `GET /api/auth/me` | `data: member|null` (게스트 판별) | 선택 |
| 내 정보 수정 | 회원 | `/account` → `PATCH /api/account` | 성명·회사명·역할·이메일·휴대폰 갱신(+`updated_at`), 전역 auth 갱신 | **필수(401)** |
| 비밀번호 변경 | 회원 | `/account` → `POST /api/account/password` | 현재 비번 확인 후 교체. 오피스 회원·현재 비번 오답·8자 미만 400 | **필수(401)** |
| 참여자 목록 조회 | 회원 | `/members` → `GET /api/members` | 전체 회원 목록(비밀번호 제외) | **필수(401)** |
| 오피스 프로비저닝 | 맑은오피스 서버 | `POST /api/integration/office/upsert` | `office_id` upsert(`source='office'`) | `x-office-secret` |
| 오피스 SSO 진입 | 맑은오피스 → 회원 | `GET /api/auth/sso?token=…` | upsert + 세션 발급 + 리다이렉트 | HMAC 토큰 |

---

## 5. 상태 모델·전이

### 5.1 회원 `source`
```
direct  : 직접 회원가입. password_hash 보유 → 로컬 로그인 가능.
office  : 맑은오피스 연동. password_hash = null → 로컬 로그인 불가, SSO/푸시로만 진입·갱신.
```
- 현재 코드상 전이 없음(한 번 정해진 `source`는 불변). upsertByOffice는 `source`를 다시 쓰지 않으나, **신규 생성 시에만** `office`로 박힌다 → §6 (a)/(e) 정책 미정과 연결.

### 5.2 회원 `status`
```
active     : 정상. 로그인 허용.
suspended  : 정지. 로컬 로그인 시 403("사용이 정지된 계정입니다").
```
- ⚠️ **SSO 경로([`sso.get.ts`](../../server/api/auth/sso.get.ts))·오피스 upsert는 현재 `status`를 검사하지 않는다** → 정지 회원도 SSO로 진입 가능(구멍). §6 (f)·§10 후속.

### 5.3 세션
```
없음 → setSession(memberId) → mng_session 쿠키(HMAC 서명, TTL 7일, HttpOnly·Secure·SameSite=lax)
유효 세션 → getSessionMemberId() → memberId
만료/위조 → null (게스트)
clearAuthSession() → 쿠키 삭제
```

---

## 6. 정책 결정 사항

> 직접 회원가입 부분은 구현이 일관되나, **맑은오피스 연동 규약은 전부 임시값(dev 시크릿·자체 HMAC 포맷)** 이며 맑은오피스 실제 스펙 확정 전까지 미정이다. 아래 (a)~(f)는 맑은오피스 팀과 합의가 필요한 핵심 항목이며, 각 항목 끝에 **기획 권고안**을 1줄로 제시한다.

### (a) 식별 매칭 키 — `office_id` vs 이메일/휴대폰
- 현재: `office_id` 단일 키로 upsert([`members.ts` `upsertByOffice`](../../server/utils/members.ts)). 이메일/휴대폰 변경에는 강하나, **직접가입 회원과 동일인이 오피스로도 들어오면 중복 계정**이 생긴다(병합 로직 없음).
- **권고안**: 1차 키는 `office_id` 고정(불변·재발급 없는 오피스 PK여야 함)을 유지하되, 가입 시 이메일/휴대폰이 기존 direct 회원과 일치하면 **자동 병합하지 말고 운영자 확인 큐로 보류**(오인 병합 리스크 회피).

### (b) SSO 토큰 서명 방식·만료·재생 방지
- 현재: `payloadB64url.sigB64url` (payload=JSON, HMAC-SHA256, 공유 시크릿). `exp` 만료만 검사하며 **nonce/jti 없음 → 만료 전 토큰 재사용(replay) 가능**.
- **권고안**: 만료를 단명(60~120초)으로 두고 **일회용 `jti`를 서버에 단기 캐시(D1/KV)로 기록해 재사용 차단**. 장기적으로는 자체 HMAC 대신 양측 합의된 표준(JWT `exp`+`jti`, 혹은 OIDC)으로 승격.

### (c) 공유 시크릿 운영/로테이션
- 현재: `OFFICE_SHARED_SECRET` 단일값(미설정 시 dev 기본값 폴백 — 운영 배포 시 **반드시 실제 시크릿 주입 필요**). 로테이션 절차·키 식별자(kid) 없음.
- **권고안**: 프로덕션은 Cloudflare 환경변수로 주입하고 dev 폴백 사용 금지를 배포 체크리스트에 추가. 무중단 로테이션 위해 **`kid` 헤더 + 구·신 시크릿 동시 허용 윈도우**를 도입.

### (d) 오피스 회원의 비밀번호 미설정 처리
- 현재: `source='office'` 회원은 `password_hash = null`. 로컬 로그인([`login.post.ts`](../../server/api/auth/login.post.ts))은 `passwordHash` 없으면 **아이디/비번 불일치와 동일 메시지로 거절**(계정 존재 비노출). 일관됨.
- **권고안**: 현행 유지(오피스 회원은 SSO 전용). `/login`·`/signup`에서 "맑은오피스 사용자는 오피스에서 접속" 안내를 계속 노출.

### (e) `source='office'` 회원이 직접 비밀번호를 추가 설정해 로컬 로그인도 가능케 할지
- 현재: **불가**(비밀번호 설정 UI/엔드포인트 없음). 오피스 회원은 영구 SSO 전용.
- **권고안**: **MVP는 불가 유지**(혼합 계정의 보안·동기화 복잡도 회피). 오피스 의존을 줄이려는 요구가 생기면, 별도 "비밀번호 설정" 플로우로 `password_hash`만 추가(=로컬+SSO 병용, `source`는 `office` 유지)하는 방식으로 확장.

### (f) 탈퇴/정지(`status`) 동기화
- 현재: 오피스에서의 탈퇴/정지가 관리 앱으로 전파되지 않음. upsert·SSO 어디서도 `status`를 비활성으로 내리거나 검사하지 않는다(§5.2 구멍).
- **권고안**: upsert 페이로드에 `status`(또는 `active` 불리언)를 받아 반영하고, **SSO·upsert에 `status==='active'` 게이트를 추가**(정지 회원의 신규 세션 발급 차단). 오피스 측 회원 삭제는 소프트 delete(`status='suspended'`)로 매핑.

### (g) 기타 (구현은 됐으나 정책 확정 권장)
- **세션 TTL 7일·SameSite=lax** 고정값 — 관리 앱 보안 요구에 맞는지 확정 필요(권고: 내부 도구이므로 7일 유지, 단 SSO replay 차단(b) 선결).
- **`/members` 전체 공개**: 로그인 회원이면 누구나 전 참여자 연락처(이메일·휴대폰)를 봄. 역할 기반 제한이 필요한지 검토(권고: 내부 참여자 명부 성격이므로 현행 유지, 단 외부 게스트 도입 시 재검토).

---

## 7. API 엔드포인트

| 메서드 | 경로 | 인증 | 요청 | 응답 | 비고 |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/auth/check-id` | 없음 | `?loginId=` | `{ loginId, valid, available, reason }` | 형식 검증(`^[a-zA-Z0-9_.-]{3,32}$`) + 사용가능 여부. 항상 200(불리언 반환) |
| POST | `/api/auth/signup` | 없음 | `loginId,password,name,company,role,email,phone,agreedPrivacy` | `{ data: PublicMember }` + 세션쿠키 | 아이디 `^[a-zA-Z0-9_.-]{3,32}$`, 비번 ≥8, 이메일 형식, 휴대폰 `^[0-9-]{9,20}$`, **개인정보 미동의 400**, 아이디 중복 409. 성공 시 `agreed_at` 기록 |
| POST | `/api/auth/login` | 없음 | `loginId,password` | `{ data: PublicMember }` + 세션쿠키 | 불일치/오피스회원/없음 모두 401 동일 메시지, 정지 403 |
| POST | `/api/auth/logout` | — | — | `{ ok: true }` | 세션 쿠키 삭제 |
| GET | `/api/auth/me` | 선택 | — | `{ data: PublicMember \| null }` | 세션 없으면 `null`(401 아님) |
| PATCH | `/api/account` | 세션 필수 | `name,company,role,email,phone` | `{ data: PublicMember }` | 본인 프로필 수정. 성명 필수·이메일/휴대폰 형식 400, `updated_at` 기록. 아이디·비번·`source` 변경 불가 |
| POST | `/api/account/password` | 세션 필수 | `currentPassword,newPassword` | `{ ok: true }` | 새 비번 ≥8, 현재 비번 오답 400, **오피스 회원(`password_hash` null) 400** |
| GET | `/api/auth/sso` | HMAC 토큰 | `?token=&redirect=` | 302 redirect + 세션쿠키 | `redirect`은 `/` 시작만 허용(오픈 리다이렉트 차단) |
| GET | `/api/members` | 세션 필수 | — | `{ data: PublicMember[] }` | 비로그인 401 |
| POST | `/api/integration/office/upsert` | `x-office-secret` | `officeId,loginId?,name,company,role,email,phone` | `{ data: PublicMember, created }` | `officeId`·`name` 필수, `loginId` 미지정 시 `officeId` 대체 |

- `PublicMember` = 회원 레코드에서 `passwordHash` 제거([`members.ts toPublic`](../../server/utils/members.ts)).

---

## 8. DB 테이블

`member` (D1 / SQLite — Drizzle 정본 [`schema.ts`](../../server/db/schema.ts), 마이그레이션 `0002_bizarre_korath.sql`(생성)·`0003_slippery_kid_colt.sql`(`ALTER TABLE member ADD agreed_at text;`)):

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| `id` | integer | PK, autoincrement | |
| `login_id` | text | NOT NULL, **UNIQUE** | 아이디 |
| `password_hash` | text | nullable | `pbkdf2$iter$salt$hash`. 오피스 회원은 null |
| `name` | text | NOT NULL | 성명 |
| `company` | text | NOT NULL default `''` | 회사명 |
| `role` | text | NOT NULL default `''` | 역할 |
| `email` | text | NOT NULL default `''` | 이메일 |
| `phone` | text | NOT NULL default `''` | 휴대전화번호 |
| `source` | text | NOT NULL default `'direct'` | `direct` \| `office` |
| `office_id` | text | **UNIQUE**(nullable) | 맑은오피스 사용자 식별자 |
| `status` | text | NOT NULL default `'active'` | `active` \| `suspended` |
| `agreed_at` | text | nullable | 개인정보 수집·이용 동의 시각 ISO8601. 직접가입 시 기록, 오피스 회원은 null |
| `created_at` | text | NOT NULL | ISO8601 |
| `updated_at` | text | nullable | ISO8601. 오피스 upsert 갱신·`/account` 프로필 수정 시 기록 |

- 저장소: 프로덕션 D1(Drizzle), dev(바인딩 없음) **인메모리 폴백**(프로세스 살아있는 동안만 유지). [`useMembers`](../../server/utils/members.ts) — `findByLoginId`/`findById`/`findByOfficeId`/`create`/`upsertByOffice`/`updateProfile`/`updatePassword`/`list`. `/account`는 `updateProfile`·`updatePassword`를 사용.
- `/account` 프로필 수정은 기존 컬럼만 사용(스키마 변경 없음).
- 비밀번호 평문 보관 금지(PBKDF2 100k iter, SHA-256, 16B salt). 세션·오피스 토큰 서명은 HMAC-SHA256.

---

## 9. 현재 구현 상태

| 영역 | 상태 |
| --- | --- |
| 직접 회원가입 절차(아이디 중복확인·개인정보 동의·검증 강화·완료 화면) + 자동 로그인 | ✅ 구현 |
| 비밀번호 로그인 / 로그아웃 / me | ✅ 구현 |
| 내 정보(`/account`) — 프로필 수정 + 비밀번호 변경(오피스 회원 비번 변경 차단) | ✅ 구현 |
| 세션(HMAC 쿠키·7일·SSR 하이드레이션·미들웨어 보호) | ✅ 구현 |
| `/members` 목록(구분 배지) | ✅ 구현 (읽기 전용) |
| 오피스 서버 간 upsert | ✅ 구현 (시크릿·필드 매핑은 임시) |
| 오피스 SSO 핸드오프 | ✅ 구현 (토큰 포맷·서명은 임시 자체 HMAC) |
| 회원 편집·삭제·역할 관리 UI | ❌ 없음 |
| SSO replay 차단(jti)·status 동기화·시크릿 로테이션 | ❌ 없음 (§6 미정) |

---

## 10. 알려진 한계·후속 작업

- **개인정보 처리방침 문안 미확정** — `/signup` 개인정보 수집·이용 동의 박스 본문이 플레이스홀더("추후 확정")다. 정식 문안 확정 후 화면 반영 필요. (내부 시스템이라 이용약관 동의는 두지 않음.) → 기획/법무
- **본인인증(OTP) 미구현** — 이메일/휴대폰 형식 검증만 있고 실제 소유 인증(OTP)은 없음. 외부 발송 인프라(SMS/이메일) 필요. → 후속(개발자, 인프라 선결)
- **SSO replay 가능** — `sso.get.ts` 토큰에 nonce/jti 없음. 만료 전 재사용 차단 필요(§6 b). → 개발자
- **status 게이트 누락** — SSO·오피스 upsert가 `suspended`를 무시 → 정지 회원 진입 가능(§6 f). → 개발자
- **dev 시크릿 폴백** — `NUXT_SESSION_SECRET`·`OFFICE_SHARED_SECRET` 미주입 시 하드코딩 기본값 사용. 프로덕션 환경변수 주입을 배포 체크리스트에 명문화(§6 c). → 운영/DBA
- **중복 인물 병합 부재** — direct ↔ office 동일인 중복 계정 가능(§6 a). → 기획 확정 후 개발자
- **오피스 실제 스펙 미확정** — 토큰 서명 방식·필드 매핑·식별자 규약 전부 맑은오피스 팀과 합의 전. 합의 후 [`auth.ts`](../../server/utils/auth.ts) `verifyOfficeToken`/`verifyOfficeSecret`, [`upsert.post.ts`](../../server/api/integration/office/upsert.post.ts) 매핑 조정.
- **QA**: 로그인/가입 검증 경계(아이디 패턴·중복 409·비번 8자·정지 403), 오피스 회원 로컬 로그인 거절 메시지 동일성, SSO `redirect` 오픈 리다이렉트 차단(`/` 외 거부) 회귀 테스트.
- **회원 관리 UI**(편집·정지·삭제)는 미구현 — 필요 시 `/members` 확장.
