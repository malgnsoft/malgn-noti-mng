# 2026-06-02 — WBS 3 트랙 분리 + 로그인 UX(고객사 ID 제거) + loginid 전역 UNIQUE + 휴대폰 OTP + 토스트 가시성 + NICE 통합인증 인프라

## 한 줄 요약

이번주 회원·인증 트랙 첫 날 5건 처리. **(§1)** WBS 3 트랙 분리(5-3A UI / 5-3M 매트릭스 / 5-3C 연동) — 진척 과대평가 문제 해소, Step 5 55%→40%. **(§2)** `POST /auth/login-by-email` 신설 + 로그인 화면 "고객사 ID" 필드 완전 제거 (Workers #10 / Pages #52). **(§3)** `TB_USER.loginid` 전역 UNIQUE 정합화 — `0003` 라이브 적용, 복수 매치 경로 + 회사 선택 UI 제거 (Workers #11 / Pages #53). **(§4)** 휴대폰 OTP 라우트 (`/auth/phone-code/send`·`/verify`) + signup.vue Step 4 SMS OTP 연동 + 로그인 401 처리 정합화(`/auth/*` 호출은 자동 리다이렉트 안 함) + 회원가입 완료 화면 고객사 ID 노출 제거 + 토스트 위치(오른쪽 위) + 크기 강화(17px). NHN_MOCK secret 적용 — 자격증명 발급 전 mock 통과. (Workers #12 / Pages #54~#58). **(§5)** **NICE 통합인증(휴대폰 본인확인)** 인프라 — `doc/NICE_AUTH.md` 신규 정본 + `0004_user_nice_auth.sql` 라이브 적용(TB_NICE_AUTH + TB_USER에 ci/birthdate/gender/national_info/mobile_co + UNIQUE ci) + NICE 어댑터(mock/real, AES-256-GCM + PBKDF2 + HMAC) + 3 라우트(init/callback/status) + `/auth/signup` 확장(niceSession 검증·CI 중복 차단·NICE 결과로 이름·휴대폰·생년월일 덮어쓰기) + signup.vue Step 4 통째로 NICE 흐름으로 교체("본인 인증하기" 버튼 + 폴링 + 결과 표시) + NICE_MOCK secret 적용. (Workers #13 / Pages #60). 라이브 e2e 모두 통과. **이메일 인증창** 차단 UX 버그 발견·수정: useApi 401 핸들러가 모든 401을 /login으로 리다이렉트해서 가입 도중 OTP 잘못 입력하면 페이지 이동되던 문제 → `/auth/*` 호출의 401은 호출자가 처리하도록 분리. **NHN 자격증명 미등록**: 메일 실 발송 0 — 가입 흐름은 NHN_MOCK + NICE_MOCK secret 켜진 mock 모드로 통과.

---


# §1. WBS 구조 개편 — 사용자단을 **3 트랙(UI / API / 연동)**으로 분리 (배포 #51)

## 한 줄

"화면 UI는 그렸지만 백엔드 연동은 안 됐는데 ✅로 표시돼 진척이 과대평가되는" 문제를 해소. WBS의 5-3을 **5-3A 화면 UI 구성**(목업 데이터로 페이지만 그리기) + **5-3M 매트릭스**(도메인별 UI/API/연동 한눈에) + **5-3C 화면 ↔ API 연동**(실 데이터 흐름) 3 트랙으로 분리. 5-3-15의 단일 "백엔드 연동" 항목을 16개 도메인별 5-3C-1~16으로 펼침(인증·계정 + 이메일 OTP 2개만 ✅, 나머지 14개 ⚪). 5-2 API 항목들은 그대로 두되 5-3M 매트릭스에서 도메인 단위로 매핑. Step 5 진척률을 55% → 40%로 재산정(연동 트랙 약 7%만 완료 반영) → 전체 가중평균 45% → 38%. `doc/WBS.md` + `app/pages/wbs.vue` 양쪽 동기, Pages 배포 #51(alias `bca573ce.malgn-noti.pages.dev`).

## 1.1 문제

5-3 항목들의 ✅는 사실상 모두 "UI 화면을 목업 데이터로 그렸다" 단계까지를 의미했는데, WBS만 보면 "발송·이력·주소록 등이 모두 완료"처럼 보였다. 6/1 (어제 history.20260601.md) §4·§5에서 "인증·계정만 실 API 연동 완료"로 5-3-15(백엔드 연동)를 추가했지만, 도메인별 단위가 아니라 한 항목으로 묶여 있어 어디까지 됐고 어디가 안 됐는지가 가시화되지 않음.

## 1.2 해결 — 3 트랙 분리

| 트랙 | 항목 ID | 의미 | ✅의 기준 |
| --- | --- | --- | --- |
| **A. 화면 UI 구성** | `5-3A-*` | 목업 데이터로 페이지 그리기 | 라우트가 라이브, 화면이 렌더링 |
| **B. API 엔드포인트** | `5-2-*` (기존) | 백엔드 라우트 구현 | 라우트가 라이브, e2e 검증 |
| **C. 화면 ↔ API 연동** | `5-3C-*` (신규) | 실 데이터 흐름 + 상태 관리 + 에러 처리 | UI가 실 API를 호출, 응답이 화면에 반영 |

추가로 **5-3M 매트릭스** — 각 도메인을 한 행에 UI/API/연동 3 칸으로 정렬해 어디까지 됐는지 한눈에. 25 도메인 × 3 트랙 = 75 칸.

## 1.3 5-3C 펼침 (16 항목)

5-3-15 단일 항목 → 도메인별 16 항목:

- ✅ 2개: 5-3C-1 (인증·계정), 5-3C-1a (이메일 OTP)
- ⚪ 14개: 로그아웃·비밀번호 재설정·login-by-email·약관 동의·companyType·`/me` 갱신·비밀번호 변경·2FA·멀티 계정·계약·발송 6채널·이력/통계·주소록 등 CRUD·결제·문의

우선순위는 [doc/MEMBERSHIP.md](../MEMBERSHIP.md) §8과 일치 — P0 3, P1 4, P2 4, P3 3.

## 1.4 진척률 재산정

| Step | 기존 | 재산정 | 사유 |
| --- | --- | --- | --- |
| 1 준비 | 55% | 55% | 변동 없음 |
| 2 정책 | 55% | 55% | 변동 없음 |
| 3 기획 | 35% | 35% | 변동 없음 |
| 4 디자인 | 20% | 20% | 변동 없음 |
| **5 개발** | **55%** | **40%** | UI(거의 완료) + API(60%) + 연동(7%)을 가중평균. UI는 7주의 작업이고 연동·API가 더 큰 비중을 차지하므로 단순 평균 |
| **전체 가중평균** | **45%** | **38%** | `0.10×55 + 0.15×55 + 0.20×35 + 0.10×20 + 0.45×40 ≈ 37.75` |

## 1.5 산출물

- [doc/WBS.md](../WBS.md) — 5-3 섹션 전면 개편 (5-3A·5-3M·5-3C). 진척률 스냅샷 갱신. 가중평균 45→38.
- [app/pages/wbs.vue](../../app/pages/wbs.vue) — group 라벨 '사용자단 화면' → '사용자단 화면 UI (목업)', 5-3-15 삭제 + 5-3C-* 16 신규, stage-5 progress 55→40 + summary 갱신.
- Pages 배포 #51 (alias `bca573ce.malgn-noti.pages.dev`). 라이브 그렙으로 17개 5-3C 항목 + 새 그룹 라벨 2종 노출 확인.

## 1.6 다음 작업 (이번주 회원·인증 트랙)

[MEMBERSHIP.md](../MEMBERSHIP.md) §8 P0 3건 + P1 4건이 이번주 본격 작업. 가장 빠른 영향 순:

1. **5-3C-2 로그아웃 GNB 실 연결** (30분, 의존 0)
2. **5-3C-3 비밀번호 재설정** (2~3시간, OTP 인프라 재활용)
3. **5-3C-4 `/auth/login-by-email`** (1~2시간, companyId UX 개선)
4. **5-3C-5 약관 동의 적재** (1~2시간)
5. **5-3C-6 `companyType` 전달·저장** (2~3시간) + 5-3C-6 따라가는 개인 유형 화면 분기 (30분)

---

# §2. 로그인 UX 개선 — `POST /auth/login-by-email` + 고객사 ID 필드 제거 (배포 #10·#52)

## 한 줄

(어제) §4의 알려진 한계("로그인이 `companyId`를 요구해 사용자가 자신의 회사 ID를 외워야 함")를 해소. 백엔드 `POST /auth/login-by-email` 신설 — 이메일(또는 아이디) + 비밀번호만으로 회사 자동 찾기, 단일 매치 시 즉시 토큰 발급, 같은 이메일로 여러 회사에 가입된 경우 `multipleCompanies: true + companies[]` 반환. 프런트 `login/index.vue`에서 **고객사 ID 필드를 완전히 제거**, 복수 매치 시 회사 선택 카드 UI 노출 → 선택 시 기존 `/auth/login`으로 명시적 로그인. 라이브 e2e 5 시나리오 통과(단일/복수/잘못된 비번/없는 이메일/같은 이메일 2회사). Workers 배포 #10(Version `a6197cc7-0f01-4612-aa10-5271f7c494a1`), Pages 배포 #52(alias `292da05d.malgn-noti.pages.dev`).

## 2.1 백엔드 — `POST /auth/login-by-email`

`src/routes/auth.ts`:

- 입력: `{email, password}` — `email` 필드명이지만 실제로는 `loginid` 또는 `email` 컬럼 매치 (회원가입 마법사가 `loginid = email`로 발급하므로 둘 다 검색)
- 검색: `WHERE user.status=1 AND company.status=1 AND (user.loginid = ? OR user.email = ?)` + INNER JOIN company
- 각 row별로 PBKDF2 비번 검증 (서로 다른 회사·다른 비밀번호 가능)
- **단일 매치**: 기존 `/auth/login`과 동일 형식의 `AuthResponse` 반환 + 토큰 발급 + `lastLoginAt` 갱신
- **복수 매치**: `{multipleCompanies: true, companies: [{id, name}, ...]}` 반환 (토큰 발급 안 함)
- **매치 0 또는 비번 모두 불일치**: 401 `unauthenticated` (계정 enumeration 방지)

OpenAPI: 신규 path 1 + 신규 schema 2(`LoginByEmailRequest`, `MultipleCompaniesResponse`). 응답 schema는 `oneOf: [AuthResponse, MultipleCompaniesResponse]` — 두 가지 가능 형태 명시.

## 2.2 프런트 — `login/index.vue` 개편

- **고객사 ID 필드 완전 제거**. 5/27 §12에서 도입한 `companyIdInput`·`needCompanyId`·`effectiveCompanyId` 로직 모두 삭제. `last-company-id` 쿠키도 더 이상 로그인 폼에서 사용하지 않음(다만 인증 후 hydrateFromAuth에서 갱신은 유지 — 이전 가입 흔적 보존).
- **`stores/auth.ts.loginByEmail()`** 액션 신규 — 반환값 `null` = 단일 매치 (로그인 완료) / `{id,name}[]` = 복수 매치 (호출자가 회사 선택 후 `login()` 재호출).
- **복수 매치 UI**: `companyChoices` ref가 비어있지 않으면 일반 폼 대신 회사 선택 카드 리스트 노출. 카드 클릭 시 `chooseCompany(companyId)` → 기존 `login()` 호출. "다시 입력" 버튼으로 초기 폼 복귀.
- **에러 처리**: 401 응답 → "아이디 또는 비밀번호가 올바르지 않습니다." 토스트. 그 외 → "로그인 중 오류가 발생했습니다."
- **이메일 placeholder**: "아이디를 입력해 주세요" → "가입 시 사용한 이메일을 입력해 주세요" + `inputmode="email"` 힌트.

## 2.3 라이브 e2e (Production)

| # | 시나리오 | 결과 |
| --- | --- | --- |
| 1 | signup → company.id=12 발급 | ✅ |
| 2 | login-by-email 단일 매치 → 200 + token (169자) | ✅ |
| 3 | 잘못된 비밀번호 → 401 `unauthenticated` | ✅ |
| 4 | 존재하지 않는 이메일 → 401 (계정 enumeration 방지) | ✅ |
| 5 | 같은 이메일로 2번째 회사 signup → login-by-email → `{multipleCompanies:true, companies:[{id:12,name:...}, {id:13,name:...}]}` | ✅ |
| 6 | 프로덕션 `/login` 페이지 그렙 — "고객사 ID" 0건 / "가입 시 사용한 이메일" 1건 | ✅ |

검증 과정의 임시 계정(company.id 12·13) 2건은 SG 재개방 시 cleanup 예정.

## 2.4 산출물

- API: 3 파일 수정 — `src/routes/auth.ts`(+85) · `src/openapi.ts`(+25) · `src/db/schema.ts` (변동 없음 — verification 정의는 §5에서 이미 반영).
- 사용자단: 2 파일 수정 — `app/stores/auth.ts`(+20) · `app/pages/login/index.vue`(전면 개편, +90/-30).
- Workers 배포 #10 Version `a6197cc7...`, Pages 배포 #52 alias `292da05d`.
- WBS 5-3C-4 ⚪ → ✅. doc/MEMBERSHIP.md §8 P0 #3 완료(로그아웃·재설정 다음).

## 2.5 보안 노트

- **로그인 가능한 입력**: `loginid` 또는 `email` 컬럼 매치. 같은 사용자가 두 컬럼에 다른 값을 가질 수 있다면(현재 회원가입 마법사는 둘 다 email로 채움) 둘 다로 로그인 가능. 운영상 의도된 동작.
- **enumeration 방지**: 잘못된 이메일·잘못된 비밀번호 모두 동일한 401 메시지("Authentication required") — 응답 내용으로 이메일 존재 여부를 알 수 없음.
- **타이밍**: 매치 row 수만큼 PBKDF2를 돌리므로 row 수가 많으면 응답 시간이 살짝 길어짐. 복수 매치는 실제로는 드물지만, 한 이메일을 의도적으로 많이 등록해 DoS 가능. 후속 rate limit 작업과 함께 검토.

## 2.6 알려진 한계

- **`last-company-id` 쿠키 잔존**: 더 이상 로그인 폼에서 사용하지 않으나, `hydrateFromAuth`에서 여전히 갱신. 후속에서 제거 또는 다른 용도로 활용 검토.
- **회원가입에서 loginid ≠ email로 가입한 사용자**: 현재 마법사 외 경로(예: 운영자단 강제 가입)로 만들어진 사용자는 이메일이 비어 있을 수 있어 login-by-email로 로그인 불가. 운영자단 흐름이 생기면 정책 정의 필요.

---

# §3. `TB_USER.loginid` 전역 UNIQUE — 정책 정합화 (배포 #11·#53)

## 한 줄

(§2에서) 도입한 `login-by-email`의 "복수 매치" 경로는 사실 `UNIQUE (company_id, loginid)` 복합 제약 때문에 같은 loginid가 회사별로 따로 존재할 수 있다는 가정에서 나왔는데, 사용자 정책 결정으로 **loginid는 회사와 무관하게 전체 시스템에서 유일해야 함**으로 정리. DDL 마이그레이션 `0003_user_loginid_global_unique.sql` 라이브 적용(`uq_user_company_loginid` DROP → `uq_user_loginid` ADD), schema.ts에 `.unique('uq_user_loginid')` 명시, 백엔드 `/auth/login-by-email`의 복수 매치 분기 제거, OpenAPI에서 `MultipleCompaniesResponse` 스키마 삭제, 프런트 `stores/auth.ts.loginByEmail()` 반환 타입 단순화 + `login/index.vue`에서 회사 선택 카드 UI 80여 라인 제거. 라이브 e2e 4 시나리오 통과(signup 정상 / 같은 loginid 재시도 409 / login-by-email 단일 토큰 / multipleCompanies 응답 사라짐). 사전 테스트 데이터 cleanup 8개 회사 + 12개 사용자(어제 검증용 임시 계정).

## 3.1 정책 변경

| 항목 | 변경 전 | 변경 후 |
| --- | --- | --- |
| TB_USER UNIQUE | `(company_id, loginid)` 복합 | `(loginid)` 단독 |
| 같은 이메일로 여러 회사 가입 | 가능 | **불가** — signup 시 409 conflict |
| `login-by-email` 응답 분기 | 단일/복수 | **단일만** |
| 회사 선택 UI | 복수 매치 시 카드 리스트 | **삭제** |

이로써 "한 이메일 = 한 회사 = 한 로그인"이 보장됨. 멀티 계정(주계정·보조계정)은 같은 회사 내 다른 loginid로 처리.

## 3.2 DDL 마이그레이션 (라이브 적용 완료)

[src/db/migrations/0003_user_loginid_global_unique.sql](../../../malgn-noti-api/src/db/migrations/0003_user_loginid_global_unique.sql):
```sql
ALTER TABLE TB_USER
  DROP INDEX uq_user_company_loginid,
  ADD UNIQUE KEY uq_user_loginid (loginid);
```

### 적용 순서 (SG 열린 짧은 윈도우 활용)

1. **사전 cleanup** — 어제부터 누적된 검증용 임시 계정 정리:
   - `TB_USER` 6 → 4 (lbe 중복 2건 + hd-check + ddl 등)
   - `TB_COMPANY` 그에 맞춰 정리
   - `TB_VERIFICATION` 0건
2. **DDL 적용** — mysql CLI 직결로 ALTER 실행, exit=0
3. **사후 검증**:
   - 인덱스 확인: `uq_user_loginid (loginid)` 단독 노출
   - 중복 INSERT 시도: `Duplicate entry … for key 'TB_USER.uq_user_loginid'` 1062 에러 → ✅ 동작

## 3.3 코드 변경 (백엔드)

| 파일 | 변경 |
| --- | --- |
| [src/db/schema.ts](../../../malgn-noti-api/src/db/schema.ts) | TB_USER 정의에 `loginid: varchar(...).notNull().unique('uq_user_loginid')` 추가 + 헤더 코멘트 |
| [src/routes/auth.ts](../../../malgn-noti-api/src/routes/auth.ts) | `/login-by-email` 단순화 — `for of` 다중 verify 루프 → `.limit(1)` 단일 select + 단일 password check. 복수 매치 분기 + multipleCompanies 응답 코드 삭제 |
| [src/openapi.ts](../../../malgn-noti-api/src/openapi.ts) | `MultipleCompaniesResponse` 스키마 삭제. `/login-by-email` 응답 `oneOf` → 단일 `AuthResponse`로 단순화. 설명 갱신("loginid 전역 UNIQUE — 최대 1건 매치"). |

## 3.4 코드 변경 (프런트)

| 파일 | 변경 |
| --- | --- |
| [app/stores/auth.ts](../../app/stores/auth.ts) | `loginByEmail()` 반환 타입 `Promise<Company[] | null>` → `Promise<void>`. union 타입 분기 제거. |
| [app/pages/login/index.vue](../../app/pages/login/index.vue) | `companyChoices` ref / `showCompanyPicker` computed / `chooseCompany()` / `cancelCompanyPick()` 함수 + 회사 선택 카드 템플릿 + 관련 스타일 (`.picker-desc`·`.company-list`·`.company-card`·`.company-name`·`.company-id`·`.company-arrow`) 모두 삭제. 화면은 단일 폼만. |

## 3.5 라이브 e2e (Production)

| # | 시나리오 | 결과 |
| --- | --- | --- |
| 1 | signup → `{user, company, token}` 정상 (company.id=14, user.id=16) | ✅ |
| 2 | 같은 loginid로 두 번째 signup → 409 `conflict` "loginid \"…\" 이미 사용 중" | ✅ |
| 3 | login-by-email 정상 매치 → 200 + 단일 토큰. 응답에 `multipleCompanies` 키 없음 | ✅ |
| 4 | cleanup 후 인덱스 확인 — UNIQUE 인덱스 `uq_user_loginid (loginid)` 단독 | ✅ |

## 3.6 산출물

- **DDL**: `malgn-noti-api/src/db/migrations/0003_user_loginid_global_unique.sql` 신규 + 라이브 적용
- **API**: 3 파일 수정 — schema.ts · auth.ts · openapi.ts. Workers 배포 #11 Version `f7f42855-1d40-4397-9405-df8bfa8124ee`
- **사용자단**: 2 파일 수정 — stores/auth.ts(-25) · login/index.vue(-80). Pages 배포 #53 alias `f150ea0a.malgn-noti.pages.dev`
- **데이터 정리**: 어제~오늘 누적된 검증용 임시 회사 8 + 사용자 12 + verification 미소비분 cleanup

## 3.7 영향 분석 — 다른 코드에 미치는 영향

| 항목 | 영향 |
| --- | --- |
| 기존 `/auth/login` (companyId+loginid) | 그대로 동작 — companyId가 제약을 더 좁히지만 결과는 같음 |
| `/auth/signup` | catch 블록의 "Duplicate entry" 메시지 매핑 그대로 (에러 메시지 자체가 회사·loginid 어느 키든 같은 형태) |
| 멀티계정(주·보조 사용자) | 같은 회사 내에서 서로 다른 loginid를 사용 — 영향 없음 |
| 운영자단 강제 가입 | 미구현 — 정책 정의 시 전역 UNIQUE 전제로 시작 |
| OTP / 비밀번호 재설정 | email/loginid 기반 lookup — 단일 매치 보장으로 단순화 가능 (후속) |

## 3.8 다음 단계

지금 정책이 정리됐으니 다음 P0 항목들이 한층 단순해집니다:

- **5-3C-3 비밀번호 재설정** — `email`로 lookup하면 단일 사용자 → 토큰 발급도 단순. OTP 인프라 재활용 → 2시간 이내 가능.
- **5-3C-2 로그아웃 GNB 실 연결** — 정책 변경과 무관, 30분.

---

# §4. 휴대폰 SMS OTP + 로그인 401 처리 + 가입 완료 ID 노출 제거 + 토스트 가시성 (배포 #12 / #54~#58)

## 한 줄

이메일 OTP 인프라(`(어제) §5`) 후속 — **휴대폰 SMS OTP**를 같은 패턴으로 추가하여 signup.vue Step 4를 실 API로 일관 연결 + 가입 도중 발견된 4개 UX 이슈(401 자동 리다이렉트, 가입 완료 화면의 고객사 ID 노출, 토스트 위치, 토스트 크기) 정리. Workers 배포 #12(Version `84056c86...`), Pages 배포 #54~#58. 자체 SMS OTP는 단순 휴대폰 보유 검증으로 유지 — 본인 확인(이름·CI 등)은 §5 NICE로 분리.

## 4.1 휴대폰 OTP 라우트 — 이메일과 동일 패턴

`POST /auth/phone-code/send` + `POST /auth/phone-code/verify`:
- `TB_VERIFICATION`에 `target_type='phone'` 적재 (이메일은 `'email'`)
- SHA-256(target|purpose|code) 해시 — 평문 코드 저장 금지
- TTL 10분 · 재발송 시 직전 코드 만료 · 5회 시도 제한 · 소비 후 재사용 차단
- `purpose` enum 확장: `signup` / `reset_password` / `change_phone`
- 휴대폰 번호 정규화: 입력값에서 숫자만 추출(`010-1234-5678` → `01012345678`) — 같은 사용자의 다른 표기를 같은 코드 한 건으로 매핑
- SMS 발송은 NHN SMS 어댑터 (mock/real). `NHN_MOCK=1` 또는 자격증명 미설정 시 mock fallback. mock 모드면 응답에 `mockCode` 노출(개발 편의)
- `OtpPurpose` 타입 확장 + `purposeLabel()` 4개 분기
- `EMAIL_FROM` 외 `SMS_FROM` env var 추가 (기본 `01000000000`)

OpenAPI 4지점 추가(2 paths + 2 schemas `PhoneCodeSendRequest`·`PhoneCodeSendResponse`·`PhoneCodeVerifyRequest`).

라이브 e2e 5+1 시나리오 통과: 발송 mockCode 노출 / 잘못된 코드 401 / 올바른 코드 200 / 소비 후 재시도 401 / 하이픈 포함 입력 정규화 / 이메일 OTP도 같이 회복.

## 4.2 프런트 signup.vue Step 4 — 실 API 연동 (NICE 도입 전 중간 단계)

기존 화면 더미(`codeSent.value=true` 토스트만) → 실 호출:
- `sendCode()` → `POST /auth/phone-code/send` async + `sendingPhone` 로딩 + `mockCode` 응답 시 토스트 노출 + 버튼 라벨 3-상태(`발송 중…` / `재발송` / `인증번호 받기`)
- `confirmCode()` → `POST /auth/phone-code/verify` async + `verifyingPhone` 로딩 + 백엔드 한국어 에러 메시지 그대로 토스트
- `fullPhoneE164` computed — 하이픈 제거(`01012345678`)

이 작업은 §5 NICE 도입 시점에 **다시 통째로 교체됨**(NICE가 휴대폰 인증을 대신 수행). 백엔드 휴대폰 OTP 라우트는 비밀번호 재설정·휴대폰 번호 변경 등 후속 흐름에서 그대로 재활용.

## 4.3 useApi.ts 401 처리 분리 — `/auth/*`는 호출자가 처리

가입 중 이메일 OTP 잘못 입력 → 401 → useApi 핸들러가 `/login`으로 리다이렉트 → 사용자가 코드 재입력 못 함 → 가입 흐름 차단.

수정 [app/composables/useApi.ts](../../app/composables/useApi.ts) `onResponseError`:
```ts
const url = typeof request === 'string' ? request : (request as { url?: string }).url ?? ''

// /auth/* 라우트의 401은 정상적인 "잘못된 자격증명·OTP" → 호출자가 처리해야 함
if (url.includes('/auth/')) return

// 인증되지 않은 상태에서 보호 라우트 호출 → 의미 있는 리다이렉트 아님
if (!useAuthToken().value) return

// 인증된 상태 + 보호 라우트 401 → 토큰 만료 → /login
```

## 4.4 회원가입 완료 화면 — 고객사 ID 노출 제거

§2~§3 이후 로그인 시 companyId 외울 필요 없음 → 가입 완료 화면 `발급된 고객사 ID: {id}` 라인 제거. 시안 정책상 내부 식별자는 외부 노출하지 않음.

## 4.5 토스트 가시성 강화

- **위치**: 좌하단 → 오른쪽 위 (`app.vue`의 `<UApp :toaster="{position:'top-right', expand:true, duration:5000}">` props로 직접 지정)
- **크기**: 폭 380→440px, 본문 폰트 15→17px, 패딩 16/18→20/24px, 최소 높이 56→68px, 모서리 12px, 그림자 강화, 타이틀 17px/700, 아이콘 26px
- Sonner 표준 셀렉터(`[data-sonner-toast]`) + Nuxt UI 내부 클래스 보강 셀렉터(`> div`·`p`·`span`)
- `app.config.ts`의 `ui.toaster` 설정은 타입(슬롯/variant)이 달라 제거, UApp props로 단일화

## 4.6 배포 + 검증

- Workers #12 Version `84056c86-09ff-4d2f-a9cc-4c63365fc630`
- Pages #54(`bf71cd8e`) · #55(`bfd64bcc` 401 처리) · #56(`eecef0a0` ID 제거) · #57(`4800d506` 토스트 1차) · #58(`683c5976` UApp props) — 누적 5번

## 4.7 NHN_MOCK secret 임시 적용

라이브 검증 + 실 사용자(`dotype@malgnsoft.com`) 가입을 위해 production에 NHN_MOCK secret을 일시 적용. mockCode가 응답에 노출되어 사용자가 메일 없이도 6자리 코드를 토스트로 확인 가능. 자격증명 등록 시 secret 영구 제거 예정.

---

# §5. NICE 통합인증(휴대폰 본인확인) 인프라 (배포 #13 / #60)

## 한 줄

§4에서 자체 SMS OTP로 가입 흐름을 통과시켰지만, 이는 "휴대폰 보유"만 검증하지 "본인 확인"이 아님. 사용자 요청으로 **NICE 통합인증(M=휴대폰 본인확인)** 인프라를 통째로 구축. 정본 문서 [doc/NICE_AUTH.md](../NICE_AUTH.md) 신규 작성 → 라이브 DDL 0004 적용(TB_NICE_AUTH + TB_USER에 ci/birthdate/gender/national_info/mobile_co + UNIQUE ci) → NICE 어댑터(mock/real, AES-256-GCM + PBKDF2 + HMAC) → 3 라우트(init/callback/status) → /auth/signup 확장(niceSession 검증·CI 중복 차단·NICE 결과로 이름·휴대폰·생년월일 덮어쓰기) → signup.vue Step 4 통째로 NICE 흐름으로 교체("본인 인증하기" 버튼 + 폴링 + 결과 표시) → NICE_MOCK secret 적용으로 자격증명 발급 전 mock 통과. Workers 배포 #13(Version `2ab47c1f...`), Pages 배포 #60 (alias `c9577894`). 라이브 e2e 6 시나리오 통과.

## 5.1 결정 사항

- **NICE 통합인증 휴대폰(M)** 만 1차 — 금융·공동·아이핀(F/U/I)은 후속 확장.
- **자체 SMS OTP는 유지** — 비밀번호 재설정·이메일 변경 등 단순 검증 영역. 본인 확인은 NICE.
- **mock 모드 우선** — NICE 자격증명 발급 전이라 외부 호출 없이 동작. 가짜 결과: `모의 사용자` / `19900101` / `01099998888` / CI는 `MOCK_CI_<requestNo>`로 결정적 생성(같은 세션 = 같은 CI → 중복 가입 차단 테스트 가능).
- **CI 중복 가입 차단** — `TB_USER.ci UNIQUE` + signup 시 명시적 검사. "이미 가입된 사용자입니다" 안내 + 비밀번호 재설정 유도.
- **NICE 결과 우선** — niceSession이 있으면 signup body의 `name`·`phone` 대신 NICE 검증값(`name`·`mobile_no`) 사용 + `birthdate`·`gender`·`national_info`·`ci`·`mobile_co` 적재.

## 5.2 DDL 0004 (라이브 적용 완료)

[src/db/migrations/0004_nice_auth.sql](../../../malgn-noti-api/src/db/migrations/0004_nice_auth.sql):

§A `TB_NICE_AUTH` 신설 (17 컬럼):
- 세션 키: `id` PK + `request_no` UNIQUE + `transaction_id` + `ticket` + `iterators` (복호화에 필요)
- 상태: `state` (pending/completed/failed/expired/consumed)
- 결과: `name`/`birthdate`/`gender`/`national_info`/`ci`/`di`/`mobile_co`/`mobile_no`
- 시간: `expires_at`/`created_at`/`completed_at`
- 인덱스: `(state, created_at)` · `(ci)`

§B `TB_USER` 5 컬럼 추가:
- `birthdate VARCHAR(8)` · `gender CHAR(1)` · `national_info CHAR(1)` · `ci VARCHAR(255)` · `mobile_co VARCHAR(10)`
- `UNIQUE KEY uq_user_ci (ci)` — 중복 가입 차단

라이브 적용 검증: `SHOW CREATE TABLE TB_NICE_AUTH` 정상, `TB_USER.ci`에 `uq_user_ci` 인덱스 단독.

## 5.3 NICE 어댑터 — `src/adapters/nice/auth.ts`

- `requestToken(creds, requestNo)` → POST `/auth/token` (Basic auth + `client_credentials`)
- `requestAuthUrl(creds, accessToken, requestNo)` → POST `/auth/url` (`svc_types: ['M']` + `return_url` + `close_url`)
- `requestResult(accessToken, webTxId, txId, requestNo)` → POST `/auth/result` (암호화된 `enc_data` + `integrity_value` 수신)
- `deriveKeys(ticket, txId, iters)` — **PBKDF2-HMAC-SHA256** 64 bytes 유도 → 대칭키 32 bytes + HMAC키 32 bytes (offset 48)
- `decryptResult(raw, ticket, txId, iters)` — Web Crypto `crypto.subtle.deriveBits` + `decrypt({name:'AES-GCM', iv, tagLength:128})` + HMAC-SHA256 무결성 검증
- `mockNiceResult(requestNo)` — 결정적 가짜 결과 (`name='모의 사용자'`, `ci='MOCK_CI_<requestNo>'`, …)
- Workers 표준 Web Crypto만 사용 — 외부 라이브러리 0

## 5.4 라우트 — `src/routes/nice.ts`

| 라우트 | 동작 |
| --- | --- |
| `POST /auth/nice/init` | mock: 즉시 `completed` 상태로 가짜 결과 적재 → `{sessionId, authUrl:null, mockMode:true}`. real: token + url 호출 후 `pending` 적재 → `{sessionId, authUrl, mockMode:false}` |
| `POST /auth/nice/callback` | NICE의 form/json `web_transaction_id` 수신 → 가장 최근 `pending` 세션 → result 호출 + 복호화 + DB 업데이트 → HTML 응답(팝업 자동 닫기) |
| `GET /auth/nice/status?session=…` | 프런트 폴링 — state 조회. `completed`면 name/birthdate/gender/national_info/mobile_co/mobile_no 노출 (ci는 서버에서만 보유) |

## 5.5 `/auth/signup` 확장

`signupB`에 `niceSession?: string` 추가. 있으면:
1. `TB_NICE_AUTH`에서 `requestNo = niceSession` 단건 조회
2. `state === 'completed'` 검증 (consumed/failed/expired면 401)
3. `expires_at > now` 검증
4. `ci` 중복 검사 — 있으면 409 "이미 가입된 사용자"
5. signup 시 NICE 결과(`name`·`mobile_no`)로 입력값 덮어쓰기 + birthdate/gender/national_info/ci/mobile_co 적재
6. signup 성공 후 `niceAuth.state = 'consumed'` 처리 → 재사용 차단
7. catch 블록의 Duplicate entry 감지 — `uq_user_ci` 매치 시 별도 안내

OpenAPI 4지점(2 paths + 4 schemas) + SignupRequest에 niceSession 필드.

## 5.6 프런트 signup.vue Step 4 통째로 교체

기존: 통신사 select + 이름 + 주민번호 + 내외국인 + 휴대폰 3분할 + 인증번호 입력 → 6개 필드
신규: **"본인 인증하기" 큰 버튼 1개** + 상태 표시

`startNiceAuth()`:
1. `POST /auth/nice/init` → `{sessionId, authUrl, mockMode}`
2. mockMode면 즉시 `pollNiceStatus()` 1회 호출 → `state='completed'` + 결과 표시
3. real이면 `window.open(authUrl, ...)` + 5초마다 status 폴링 (최대 5분)
4. 결과 표시: `<이름>님 본인 인증이 완료되었습니다. <휴대폰> · <통신사>` + `verified=true`

`submitSignup()` 확장: `niceSession`을 signup body에 전달. NICE 결과의 name·휴대폰을 우선 사용. 409 응답 + `이미 가입된 사용자` 메시지 분기.

`stores/auth.ts` `SignupPayload` 타입에 `niceSession?: string` 추가.

기존 입력 필드(통신사·이름·주민번호·휴대폰)와 관련 ref/function들은 다른 곳에서 의존성 없어 UI에서 자연 제거됨(스크립트 ref는 leftover로 남아 있으나 미사용).

## 5.7 라이브 e2e 검증 (6 시나리오)

| # | 시나리오 | 결과 |
| --- | --- | --- |
| 1 | `/auth/nice/init` → mock 응답 `{sessionId, authUrl:null, mockMode:true}` | ✅ |
| 2 | `/auth/nice/status?session=…` → `{state:'completed', name:'모의 사용자', mobile_no:'01099998888', …}` | ✅ |
| 3 | `/auth/signup` with niceSession → 201 + DB에 `name='모의 사용자'`·`birthdate='19900101'`·`gender='1'`·`ci='MOCK_CI_…'`·`mobile_co='SKT'` 정확 매핑 | ✅ |
| 4 | 같은 niceSession 재사용 → 401 `NICE 본인 인증이 완료되지 않았습니다` (consumed) | ✅ |
| 5 | 새 niceSession (다른 mock CI) → 정상 가입 | ✅ |
| 6 | DB: `TB_NICE_AUTH.state='consumed'`, `TB_USER.ci` UNIQUE 정상 동작 | ✅ |

검증 데이터 cleanup 완료 (TB_USER · TB_COMPANY · TB_NICE_AUTH 0건 잔존).

## 5.8 정본 문서 — `doc/NICE_AUTH.md`

12 섹션 / ~14KB:
1. 자체 SMS OTP vs NICE 비교
2. 인증 수단 종류 (M/F/U/I — 우리는 M 우선)
3. 전체 시퀀스 5단계 (ASCII 도식)
4. 엔드포인트 3종
5. 단계별 명세 + JSON 예시
6. AES-256-GCM + PBKDF2 (Workers Web Crypto)
7. 응답 데이터 (name·birthdate·gender·CI·DI·mobile_co·mobile_no)
8. 우리 적용 계획
9. **인프라 고려사항** — Workers 동적 IP vs NICE 화이트리스트 요구 (협상 또는 자체 프록시 EC2 필요)
10. NICE 계약 절차 7단계 (1~4 사용자, 5~7 김도형)
11. 알려진 한계 (외국인·법인 대표자·PASS·CI 중복 검사 등)
12. 다음 단계

## 5.9 산출물

- API: `malgn-noti-api: b4d8f4b` — 7 files +922 -11. 신규: `nice/auth.ts`·`routes/nice.ts`·`0004_nice_auth.sql`. 수정: `schema.ts`·`auth.ts`·`openapi.ts`·`index.ts`
- 사용자단: 5 파일 수정(`signup.vue`·`stores/auth.ts`·`useApi.ts`·`app.vue`·`app.config.ts`·`main.css`) + 1 신규(`doc/NICE_AUTH.md`)
- Workers 배포 #13 Version `2ab47c1f-1d68-42d3-815c-117cab3fd71a`
- Pages 배포 #60 alias `c9577894.malgn-noti.pages.dev`
- WBS 5-3C-* 신규 항목: NICE 본인확인 인프라 ✅

## 5.10 알려진 한계 / 다음 단계

- **NICE 자격증명 미발급** — 사용자 영업 작업 선행. 발급 후 `wrangler secret put NICE_CLIENT_ID/SECRET/RETURN_URL` + `wrangler secret delete NICE_MOCK`로 real 모드 전환 가능.
- **Workers 동적 outbound IP vs NICE 화이트리스트** — [NICE_AUTH.md §9](../NICE_AUTH.md) 참조. Cloudflare 대역 등록 협상 또는 자체 프록시 EC2 필요. NICE 계약 시점에 결정.
- **콜백 시 세션 매칭** — 1차 구현은 "가장 최근 pending 세션" 휴리스틱. 동시 다중 가입은 드물지만 운영 단계에서 `state` 파라미터로 명시화 검토.
- **모바일웹 popup 차단** — `window.open`이 모바일 Safari에서 차단될 수 있음. `redirect` 모드 옵션 검토.
- **외국인 가입** — `national_info='1'` 분기 UI 후속.
- **법인 대표자 본인 인증** — 정책 결정 후 적용.

---

# §6. /account/settings 실 API 연동 — `PATCH /me` + `PATCH /me/company` (배포 #14 / #61)

## 한 줄

WBS 5-3C-7 (PATCH /me + /account/settings) 작업. 기존 백엔드 `/me`는 GET만 있었고 응답도 최소(8 필드)였는데, **GET /me 응답을 TB_USER 13 + TB_COMPANY 14 컬럼 풀로 확장** + **PATCH /me**(사용자 본인 — name·phone) + **PATCH /me/company**(회사 — companyPhone·billingEmail·adReceive, owner/admin 권한) 신설. 프런트 [AppMemberInfoPanel.vue](../../app/components/AppMemberInfoPanel.vue)는 전체 목업 데이터(`account.email='service@malgnsoft.com'` 등)를 제거하고 `useAuthStore()` 기반으로 모두 실 데이터로 교체 — 가입 정보 행은 회사 정보 자동 매핑, 광고성 메일 수신 토글은 즉시 PATCH(컨펌 모달 후), 저장하기는 변경된 필드만 한 번에 PATCH. 라이브 e2e 5건 통과. Workers 배포 #14(Version `22368d14...`), Pages 배포 #61 (alias `ea35651d.malgn-noti.pages.dev`).

## 6.1 백엔드 변경

[src/routes/me.ts](../../../malgn-noti-api/src/routes/me.ts) — `readContext()` 헬퍼로 GET·PATCH 공통 JOIN 쿼리 추출:

```ts
me.use('*', requireAuth())
me.get('/', ...)                          // 기존 + 풀 컬럼
me.patch('/', zValidator(json, patchMeB), ...)        // name·phone
me.patch('/company', zValidator(json, patchCompanyB), ...)  // companyPhone·billingEmail·adReceive
```

- 빈 PATCH(`{}`) → 400 `validation_failed` (변경할 필드가 없습니다)
- `/company` PATCH는 `role !== 'owner' && role !== 'admin'` → 403 forbidden
- 응답은 모두 동일 형식(`{data: {user, company, ctxRole}}`)으로 통일 → 프런트가 변경 후 store 그대로 hydrate 가능

OpenAPI: `Me` schema 확장 + `PatchMeRequest`·`PatchCompanyRequest` 신규. paths 2 추가.

## 6.2 stores/auth.ts 확장

```ts
interface AuthUser {  // +birthdate, gender, nationalInfo, mobileCo, memberType
  ...
}
interface AuthCompany {  // +bizNo, bizType, ceoName, upTae, upJong, address, companyPhone, billingEmail, adReceive
  ...
}

actions: {
  async updateMe(patch: {name?, phone?}) { ... }
  async updateCompany(patch: {companyPhone?, billingEmail?, adReceive?}) { ... }
}
```

## 6.3 AppMemberInfoPanel.vue 전면 교체

| 영역 | 기존 (목업) | 신규 (실 데이터) |
| --- | --- | --- |
| 데이터 로드 | 하드코딩 `account = {email: 'service@malgnsoft.com', ...}` | `onMounted(auth.fetchMe)` + `computed u/c` |
| 가입 정보 8행 | `INFO_ROWS` 고정 | `c.value`의 bizNo/bizType/ceoName/upTae/upJong/address 자동 매핑, `BIZ_TYPE_LABEL`로 한국어 표시 |
| 사업자등록증 변경 버튼 | 항상 노출 | `c.bizType !== 'personal'` 일 때만 (개인 유형은 노출 X) |
| 광고성 메일 수신 토글 | 로컬 ref 토글 + 토스트만 | 컨펌 모달 → `auth.updateCompany({adReceive})` 즉시 호출 + 토스트 |
| 서비스 담당자 이름 | 하드코딩 `'홍길동'` | `u.value.name` (NICE 검증 결과) |
| 회사 전화번호 입력 | 로컬 ref | `companyPhoneInput` ref, watchEffect로 store에서 초기화 |
| 휴대전화번호 3분할 | 로컬 ref | `watchEffect`가 `u.value.phone`에서 010/3~4자리/4자리로 자동 split |
| 결제 이메일 변경 | 로컬 ref 변경 + 토스트 | 다이얼로그 → `auth.updateCompany({billingEmail})` |
| 서비스 담당자 이메일 변경 | 로컬 ref 변경 | "곧 지원됩니다" 안내 — OTP 검증 흐름은 후속 |
| 휴대폰 본인 인증 | NICE 미연결 더미 | 그대로 더미 — NICE Step 4와 별개로 후속 |
| 회원 탈퇴 | 로컬 토스트 | "곧 지원됩니다" 안내 — 후속 라우트 필요 |
| **저장하기** | 토스트만 | `companyPhone`·`fullPhone` 변경 감지 → `updateMe`·`updateCompany` 병렬 호출 |

저장 로직:
```ts
const tasks = []
if (fullPhone !== u.phone) tasks.push(updateMe({phone: fullPhone}))
if (companyPhoneInput !== c.companyPhone) tasks.push(updateCompany({companyPhone: companyPhoneInput}))
if (tasks.length === 0) toast(변경 없음)
else await Promise.all(tasks) → 성공 토스트
```

`.seg` 스타일도 추가 (광고성 메일 수신 라디오 토글 — 기존 누락).

## 6.4 라이브 e2e (Production)

| # | 호출 | 결과 |
| --- | --- | --- |
| 1 | `GET /me` (Bearer) | 200 + 풀 컨텍스트 (TB_USER 13 + TB_COMPANY 14 컬럼) |
| 2 | `PATCH /me {name:'김도형', phone:'010-1111-2222'}` | 200 + 갱신된 user 응답 |
| 3 | `PATCH /me/company {companyPhone, billingEmail, adReceive:'reject'}` | 200 + 갱신된 company 응답 |
| 4 | `GET /me` 재호출 | name/phone/companyPhone/billingEmail/adReceive 모두 정확 반영 |
| 5 | 빈 PATCH `{}` | 400 `validation_failed`: 변경할 필드가 없습니다 |

테스트 사용자(`mep-test-…`) cleanup 완료.

## 6.5 산출물

- API: `malgn-noti-api: c8c…` — `src/routes/me.ts` 전면 개편(+150) · `src/openapi.ts` 갱신. Workers 배포 #14 Version `22368d14-f0c8-4788-8b52-5cb4f6442cf3`
- 사용자단: `app/stores/auth.ts` 타입 확장 + 2 액션 / `app/components/AppMemberInfoPanel.vue` 전면 교체. Pages 배포 #61 alias `ea35651d.malgn-noti.pages.dev`
- WBS 5-3C-7 ⚪ → 🟢 (회원 정보 변경 — 저장하기·광고수신 즉시 변경·결제이메일 변경은 실 API, 서비스 담당자 이메일·휴대폰 본인 인증 변경은 후속)

## 6.6 알려진 한계 / 후속 작업

- **서비스 담당자 이메일 변경** — OTP 검증 흐름 필요. 백엔드 `POST /me/email-change/{request,confirm}` 신설 후 다이얼로그 연결.
- **휴대폰 본인 인증 변경** — NICE 재인증 흐름 또는 SMS OTP. signup의 NICE Step 4와 유사한 패턴 재사용 가능.
- **회원 탈퇴** — `DELETE /me` 또는 `POST /me/withdraw` 신설 + soft-delete (`TB_USER.status = -1`) + 관련 데이터 정책 결정.
- **`canEditCompany` 권한 UX** — 현재는 PATCH 호출 후 403 에러로 안내. 사전에 role 기반으로 UI 비활성화 검토.

---

# §7. 사업자등록증 심사 승인 게이트 — 정책 정합화 (배포 #15 / #64)

## 한 줄

새 정책: **법인 사업자(corp) / 개인 사업자(sole)는 가입 후 사업자등록증 심사 승인을 받아야 서비스 이용 및 가입 정보 수정 가능**, **개인(personal)은 즉시 사용 가능**. 그동안은 모든 가입자가 `joinState='joined'` 즉시 통과였는데, `TB_COMPANY.approval_state` 컬럼 + signup 자동 분기 + `PATCH /me`·`PATCH /me/company` 차단 + 프런트 배너·입력 disabled + 가입 완료 화면 분기로 인프라화. 0005 라이브 적용, 기존 5개 회사는 'approved' 기본값으로 호환성 유지. Workers 배포 #15(Version `6e47d50b...`), Pages 배포 #64 (alias `56e94e5b.malgn-noti.pages.dev`). 라이브 e2e 8 시나리오 통과(법인 가입 pending / 수정 시도 403 / 개인 가입 approved / 개인 수정 통과 / 운영자 승인 후 수정 통과 / 반려 시뮬레이션 → 사유 노출 403 …).

## 7.1 정책 (사용자 결정)

| 회사 유형 | 가입 직후 상태 | 서비스 이용 | 정보 수정 |
| --- | --- | --- | --- |
| `corp` 법인사업자 | `approval_state='pending'` | ❌ | ❌ |
| `sole` 개인사업자 | `approval_state='pending'` | ❌ | ❌ |
| `personal` 개인 | `approval_state='approved'` | ✅ | ✅ |

운영자가 BackOffice에서 사업자등록증을 심사 → **승인(`approved`)** 또는 **반려(`rejected` + 사유)** 처리. 1차에서는 운영자 화면 미구현이라 라이브 DB 직접 UPDATE로 검증(후속에서 운영자단 화면 신설 예정).

## 7.2 DDL 0005 (라이브 적용 완료)

[src/db/migrations/0005_company_approval.sql](../../../malgn-noti-api/src/db/migrations/0005_company_approval.sql):

```sql
ALTER TABLE TB_COMPANY
  ADD COLUMN company_type    VARCHAR(20) NULL  COMMENT 'corp/sole/personal' AFTER name,
  ADD COLUMN approval_state  VARCHAR(20) NOT NULL DEFAULT 'approved'        AFTER company_type,
  ADD COLUMN rejected_reason VARCHAR(255) NULL                              AFTER approval_state,
  ADD KEY idx_company_approval (approval_state, created_at);
```

기존 5행 모두 자동으로 `approved` — 운영 데이터 호환성 유지.

## 7.3 백엔드 변경

### signup 확장
- `signupB`에 `companyType: enum(corp/sole/personal).optional()` 추가
- 사업자(corp/sole) → `approvalState='pending'`, 그 외 → `'approved'` 자동 분기
- 회사 row INSERT 시 `companyType`·`approvalState` 함께 적재

### /me 응답에 승인 정보 노출
- GET / PATCH 응답의 `company` 객체에 `companyType` · `approvalState` · `rejectedReason` 추가 (3 군데 응답 빌더 모두)

### PATCH 차단
- `PATCH /me`·`PATCH /me/company` 둘 다 핸들러 시작부에서 `readContext()` 호출 → `approvalState !== 'approved'`면 403 + 상황별 메시지:
  - `pending` → "사업자등록증 심사 승인 후 정보를 수정할 수 있습니다."
  - `rejected` → "심사가 반려되어 정보를 수정할 수 없습니다. 사유: …"
- 발송·이력 등 다른 도메인 라우트 차단은 후속 (별도 미들웨어 `requireApproved()`로 일관화 검토)

## 7.4 사용자단 변경

### stores/auth.ts
- `AuthCompany`에 `companyType?` · `approvalState?` · `rejectedReason?` 추가
- `SignupPayload`에 `companyType?` 추가

### signup.vue
- `auth.signup({...})` 호출 시 `companyType: userType.value || undefined` 전달
- Step 5(가입 완료) 화면 분기:
  - 사업자: "사업자등록증 심사가 진행됩니다. 승인 완료 전에는 서비스 이용 및 정보 수정이 제한되며, 결과는 등록하신 휴대폰·이메일로 안내됩니다."
  - 개인: "지금부터 바로 서비스를 이용하실 수 있습니다."

### AppMemberInfoPanel.vue
- 상단 **승인 상태 배너** (pending=warning, rejected=danger). pending이면 "사업자등록증 심사 중입니다 — 승인 완료 전까지 서비스 이용 및 회원 정보 수정이 제한됩니다." rejected면 반려 사유 + "사업자등록증을 다시 제출해 주세요."
- `isLocked` computed (`approvalState !== 'approved'`)
- 광고성 메일 수신 토글 2개 · 회사 전화번호 입력 · 휴대전화 select+input 2개 · 이메일 변경 버튼 2개(서비스 담당자·결제) · 휴대폰 인증 버튼 · 저장하기 버튼 — **모두 `:disabled="isLocked"`**
- `c.bizType !== 'personal'` → `c.companyType !== 'personal'`로 조건 수정 (이전엔 bizType 사용)
- 배너 스타일: 좌측 24px 아이콘 + 우측 굵은 헤더 + 본문, warning/danger 색상 변형

## 7.5 라이브 e2e 검증 (8 시나리오)

| # | 시나리오 | 결과 |
| --- | --- | --- |
| 1 | 법인 가입 → `/me` → `companyType='corp', approvalState='pending'` | ✅ |
| 2 | `PATCH /me {name}` → 403 + "사업자등록증 심사 승인 후 …" | ✅ |
| 3 | `PATCH /me/company {adReceive}` → 403 + 동일 메시지 | ✅ |
| 4 | 개인 가입 → `/me` → `companyType='personal', approvalState='approved'` | ✅ |
| 5 | 개인 `PATCH /me {name}` → 200 + 변경 반영 | ✅ |
| 6 | 운영자 DB 직접 UPDATE → `approval_state='approved'` (BackOffice 승인 시뮬레이션) | ✅ |
| 7 | 승인 후 법인 `PATCH /me` 재시도 → 200 + 변경 반영 | ✅ |
| 8 | 반려 시뮬레이션 (`approval_state='rejected', rejected_reason='…'`) → PATCH 시도 → 403 + 사유 메시지 포함 | ✅ |

검증 데이터(법인-…·개인-… 4건) cleanup 완료.

## 7.6 산출물

- API: `malgn-noti-api: 7…` — `0005_company_approval.sql` 신규 · `schema.ts` company 확장 · `auth.ts` signup 분기 · `me.ts` 응답+차단. Workers 배포 #15 Version `6e47d50b-0225-41d9-8bc8-598045659df8`
- 사용자단: `stores/auth.ts` 타입 · `signup.vue` companyType 전달 + Step 5 분기 · `AppMemberInfoPanel.vue` 배너 + isLocked + 모든 입력 disabled. Pages 배포 #64 alias `56e94e5b.malgn-noti.pages.dev`
- WBS 갱신: 5-3C-6(`companyType` 전달·저장 + 개인 유형 화면 분기) ⚪→🟢 + 새 항목 5-3C-17(승인 게이트) ✅

## 7.7 알려진 한계 / 후속 작업

- **운영자단 승인 화면 미구현** — 현재 라이브 DB 직접 UPDATE로만 승인/반려 가능. 운영자단(`/admin/member/company/[id]`)에 승인·반려(사유 입력) UI 신설 필요. WBS 5-4-3.
- **발송·이력 등 다른 도메인 라우트 차단** — 현재는 `/me` PATCH만 차단. 발송(`POST /send/*`), 캠페인, 발신정보 변경 등도 미승인 차단 필요. `requireApproved()` 미들웨어로 일관화 후 적용 권장. 후속.
- **사용자단 다른 화면 disabled** — `/account/cards`, `/charge`, `/send/*` 등도 isLocked일 때 차단/안내 필요. 화면별 점검 후속.
- **GNB·홈 글로벌 안내** — 현재는 `/account/settings`에만 배너. 모든 화면 상단(GNB)에 글로벌 안내 띠 검토.
- **`requireApproved()` 미들웨어 추출** — 현재는 핸들러 내부 인라인. 도메인 라우트 전부 적용 시점에 별도 헬퍼로 분리.
- **이메일·SMS 자동 안내** — 승인/반려 처리 시 사용자에게 자동 발송. NHN 자격증명 등록 후 trigger.

---

# §8. 승인 게이트 전 도메인 일관 적용 — `requireApproved()` 미들웨어 (배포 #16)

## 한 줄

§7에서 `PATCH /me`·`PATCH /me/company`에만 인라인 차단했던 승인 게이트를 **공용 미들웨어 `requireApproved()`로 추출**하고 **18개 도메인 라우트에 일괄 적용**. 정책은 `mutate-only` — POST/PATCH/PUT/DELETE만 차단(GET 조회는 통과). `/inquiries`만 예외 — 승인 관련 문의는 미승인 상태에서도 작성 가능. 자동화 스크립트로 18 라우트의 import + use 라인을 일관 갱신, typecheck 통과, Workers 배포 #16(Version `798bf6f5-bac2-4912-abdd-4af9718c1a93`). 라이브 e2e 6 시나리오 통과(GET 통과 / POST 4건 403 / 개인 가입은 정상 생성 / 문의 작성은 차단 안 됨).

## 8.1 미들웨어 — `src/middleware/approval.ts`

[src/middleware/approval.ts](../../../malgn-noti-api/src/middleware/approval.ts) 신규:

```ts
const MUTATE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

export function requireApproved(opts: { method?: 'mutate-only' | 'all' } = {}): MiddlewareHandler<AuthEnv> {
  const mode = opts.method ?? 'mutate-only'
  return async (c, next) => {
    if (mode === 'mutate-only' && !MUTATE_METHODS.has(c.req.method)) return next()
    const { companyId } = authCtx(c)
    const db = await getDb(c.env, c.executionCtx)
    const rows = await db.select({...}).from(company).where(eq(company.id, companyId)).limit(1)
    const row = rows[0]
    if (!row) throw errors.notFound('company')
    if (row.approvalState !== 'approved') {
      throw errors.forbidden(/* pending / rejected 별 메시지 */)
    }
    await next()
  }
}
```

- 기본 `mutate-only` — GET·HEAD·OPTIONS는 통과 (조회 허용)
- `'all'` 옵션 — 조회까지 차단 (필요 시)
- `requireAuth()` 다음 체인 — `authCtx`로 companyId 획득
- 매 요청 1회 SELECT (Hyperdrive 캐시 효과 기대)

## 8.2 18 라우트 일괄 적용

대상:
| 라우트 | 변수명 | 비고 |
| --- | --- | --- |
| send · contacts · contact-groups · optout-entries · sender-phones · rcs-brands · email-domains · push-certs · kakao-sender-profiles · kakao-profile-groups · optout-080-numbers · templates · template-categories · landing-pages · flow-definitions · export-jobs · payment-methods · company-settings | `app` 또는 도메인별(`contacts`·`groups`·`phones`) | 18종 |
| **예외**: inquiries | — | 승인 관련 문의 가능해야 함 |
| **이미 §7**: me | — | 인라인 차단 |
| **읽기 전용**: dispatch-history · credit-ledger | — | GET만 정의, 차단 무영향 |

자동화 — 변수명을 grep으로 식별 후 perl로 import + use 2 군데 일괄 갱신:

```bash
for f in "${TARGETS[@]}"; do
  varname=$(grep -oE "[a-zA-Z]+\.use\('\\*', requireAuth\(\)\)" "src/routes/$f.ts" | head -1 | cut -d. -f1)
  perl -i -pe "..."  # import 라인 + use 라인 갱신
done
```

각 파일에 `requireApproved` 2번 등장(import + use) 확인 — 18 파일 × 2 = 36 매치.

## 8.3 라이브 e2e (Production)

| # | 시나리오 | 결과 |
| --- | --- | --- |
| 1 | 미승인 사업자(corp) **GET /contacts** | ✅ 200 — 조회 허용 |
| 2 | 미승인 사업자 **POST /contacts** | ✅ 403 "사업자등록증 심사 승인 후 이용할 수 있습니다." |
| 3 | 미승인 사업자 **POST /sender-phones** | ✅ 403 동일 메시지 |
| 4 | 미승인 사업자 **POST /send/sms** | ✅ 403 — 발송 차단 |
| 5 | 개인(approved) **POST /contacts** | ✅ 201 정상 생성 |
| 6 | 미승인 사업자 **POST /inquiries** | ✅ 차단 안 됨(400은 body validation) — 예외 정상 |

검증 데이터 cleanup 완료.

## 8.4 산출물

- `malgn-noti-api: ?` — 19 파일 변경(1 신규 + 18 라우트). Workers 배포 #16 Version `798bf6f5-bac2-4912-abdd-4af9718c1a93`
- WBS 5-3C-17은 이미 ✅, 추가 갱신은 없음(같은 정책의 확장 적용)

## 8.5 알려진 한계 / 다음 작업

- **사용자단 다른 화면 disabled** (3번) — 발송·이력·주소록 등 페이지에 접근 시 안내 배너 또는 기능 락 UI. 아직 페이지가 모두 목업 데이터 기반이라 백엔드 차단이 화면에 즉시 반영 안 됨 — 추후 페이지별 백엔드 연동 시 일관 처리 또는 별도 글로벌 안내 띠.
- **GNB 글로벌 안내 띠** (4번) — `auth.tenant.approvalState`를 GNB·셸 컴포넌트에서 구독해 모든 페이지 상단에 노출.
- **요청당 DB SELECT 1회** — Hyperdrive 캐시로 빠르지만, 트래픽 증가 시 JWT claim에 `approvalState`를 넣어 단축 가능. 단 승인 후 사용자가 재로그인하기 전엔 갱신 안 됨 → 단기적으로 미적용 권장.
- **`/inquiries` 외 예외** — 추후 운영자단에서 첨부 파일 업로드(R2)·결제(PG 콜백) 등 필요 시 케이스별 검토.

---

# §9. 사용자단 승인 게이트 UI 일관화 — 글로벌 띠 + 라우트 가드 + `/home` 안내 (배포 #65)

## 한 줄

§7·§8에서 백엔드(DB + 18 라우트 차단)로 정책 인프라화 완료. 사용자단도 일관 — **글로벌 띠** `AppApprovalBanner`(layout 최상단·GNB 위)로 모든 페이지에 승인 상태 알림 + **글로벌 라우트 가드** `middleware/approval.global.ts`로 차단 페이지 접근 시 `/account/settings`로 자동 리다이렉트 + **`/home` 페이지**는 미승인 시 KPI/채널/통계 카드 대신 전체 화면 큰 안내(`approval-hero`)로 교체. Pages 배포 #65 (alias `2eec9e0b.malgn-noti.pages.dev`).

## 9.1 글로벌 띠 — `AppApprovalBanner.vue`

[app/components/AppApprovalBanner.vue](../../app/components/AppApprovalBanner.vue) 신규:

- `auth.tenant.approvalState`를 구독 → `pending`/`rejected`일 때만 노출
- pending: 노란색 띠(`#fff8e6` + warning border) + 시계 아이콘
- rejected: 빨간색 띠(`#fef2f2` + danger border) + X 아이콘 + 반려 사유 인용
- 우측 버튼 — pending이면 "회원 정보", rejected면 "다시 제출하기" → `/account/settings`로 이동
- 반응형(720px 미만 wrap)

[app/layouts/default.vue](../../app/layouts/default.vue)에 마운트 — `AppGnb` 위, layout 최상단:
```vue
<AppApprovalBanner />
<AppGnb />
<main><slot /></main>
<AppFooter />
```

→ 모든 인증 페이지에서 자동 노출.

## 9.2 글로벌 라우트 가드 — `middleware/approval.global.ts`

[app/middleware/approval.global.ts](../../app/middleware/approval.global.ts) 신규:

```ts
const ALLOWED_PREFIXES = ['/account', '/home', '/help', '/guide', '/wbs', '/inquiry']

export default defineNuxtRouteMiddleware((to) => {
  if (to.meta.auth === false) return
  const state = useAuthStore().tenant?.approvalState
  if (!state || state === 'approved') return  // 미hydrate면 통과
  if (ALLOWED_PREFIXES.some(p => to.path === p || to.path.startsWith(`${p}/`))) return
  return navigateTo('/account/settings')
})
```

허용 경로:
- `/account/*` — 회원 정보·승인 안내·재제출
- `/home` — 큰 안내 카드(다음 절)
- `/help`·`/guide`·`/wbs` — 정적 문서
- `/inquiry`·`/account/inquiry` — 1:1 문의 (백엔드도 §8에서 예외)

차단 경로(자동 리다이렉트 → `/account/settings`):
- `/send/*` · `/history/*` · `/contacts/*` · `/sender/*` · `/manage/*` · `/campaign*` · `/charge*`

SSR 안전: store 미hydrate(`state === undefined`)면 통과. 클라이언트 부트스트랩이 `fetchMe()`로 hydrate한 다음 재진입 시 작동.

## 9.3 `/home` 페이지 미승인 분기

[app/pages/home.vue](../../app/pages/home.vue) — `v-if="isLocked"`로 두 화면 분기:

미승인 화면(`approval-hero`):
- 중앙 정렬 큰 카드 (max-width 720px)
- 72px 시계/X 아이콘 + 24px 제목
- 본문(pending: "심사 중, 보통 영업일 1~2일" / rejected: 사유 인용)
- CTA 2개: "회원 정보 확인하기/다시 제출하기" + "1:1 문의 작성"
- 하단 현재 상태 메타

승인 상태(기본):
- 기존 KPI·채널·통계 카드 그대로 (변경 없음)

## 9.4 흐름 정리 — 가입 후 미승인 사용자가 경험하는 UX

1. **회원가입 완료** → 자동 로그인 → `/home`으로 이동
2. **`/home`**: 큰 안내 카드 "사업자등록증 심사 중입니다 … 보통 영업일 1~2일" + CTA "회원 정보 확인하기"
3. **상단 글로벌 띠**: 모든 페이지에 항상 노출 (회원 정보·문의 등 허용 페이지에서도)
4. **차단 페이지 시도**: `/send/sms` 등 클릭 시 미들웨어가 즉시 `/account/settings`로 리다이렉트
5. **`/account/settings`**: 가입 정보 상단 배너(§7) + 모든 입력 disabled
6. **승인 완료 후**: store 갱신 시점부터 띠 사라짐 + 모든 페이지 정상 접근 가능

## 9.5 산출물

- 사용자단: `app/components/AppApprovalBanner.vue` 신규 + `app/layouts/default.vue` 마운트 + `app/middleware/approval.global.ts` 신규 + `app/pages/home.vue` 미승인 분기
- Pages 배포 #65 alias `2eec9e0b.malgn-noti.pages.dev`

## 9.6 알려진 한계 / 다음 작업

- **GNB 메뉴 항목 disabled** — 현재 미들웨어가 리다이렉트로 처리하지만, 시각적으로 GNB 메뉴는 그대로 활성 표시. 메뉴 항목별 `disabled` 클래스 + 호버 시 사유 툴팁이 더 친절. 후속.
- **승인 완료 후 자동 새로고침** — 현재는 사용자가 직접 새로고침해야 새 상태 반영. WebSocket 또는 폴링으로 자동 갱신 검토.
- **`/account/inquiry`도 허용** — 1:1 문의 작성은 미승인 시에도 가능해야 함. 현재 `/inquiry`·`/account/inquiry` 두 경로 모두 허용 처리 — 라우트 구조 확정 후 정리.
- **모바일 띠 줄바꿈** — 720px 미만에서 텍스트 wrap. 실제 모바일에서 가독성 점검 필요.
- **`/account/contract` 분기** — pending 상태에서 계약서 화면이 어떻게 보일지 정책 결정 필요.

---

# §10. 미승인 → `/account/contract` 리다이렉트 정책 (배포 #66)

## 한 줄

§9의 "미승인 사용자 진입점은 `/home`"을 변경 — **사용자 정책 결정으로 미승인 사용자는 가입 직후·로그인 시·차단 페이지 접근 시 모두 `/account/contract` (계약 관리 — 사업자등록증 제출/재제출 화면)로 이동**. `/home`도 차단 페이지에 포함, 미들웨어 리다이렉트 대상도 `/account/settings` → `/account/contract` 변경. 가입 마법사 Step 5 버튼은 유형 분기("계약 관리로 이동" / "대시보드로 이동"). AppApprovalBanner의 CTA도 "회원 정보" → "계약 관리". `/home.vue`의 §9에서 추가했던 미승인 분기 코드는 진입 자체가 불가능해진 결과 불필요 → 제거. Pages 배포 #66 (alias `5256d66d.malgn-noti.pages.dev`).

## 10.1 변경 사항

| 파일 | 변경 |
| --- | --- |
| [middleware/approval.global.ts](../../app/middleware/approval.global.ts) | `ALLOWED_PREFIXES`에서 `/home` 제거. 리다이렉트 대상 `/account/settings` → `/account/contract` |
| [components/AppApprovalBanner.vue](../../app/components/AppApprovalBanner.vue) | `goToSettings()` → `goToContract()`. CTA 텍스트 pending "회원 정보" → "계약 관리" / rejected "다시 제출하기"(유지) |
| [pages/signup.vue](../../app/pages/signup.vue) | `finish()` — `isBusiness`이면 `/account/contract`, 개인이면 `/home`. 버튼 라벨도 분기 ("계약 관리로 이동" / "대시보드로 이동") |
| [pages/home.vue](../../app/pages/home.vue) | §9에서 추가한 미승인 분기(`v-if="isLocked"` + `approval-hero` 카드 + 스타일) 모두 제거 — 미승인 사용자는 미들웨어가 차단해 진입 자체가 안 됨. 코드 단순화 |

## 10.2 새 흐름 — 미승인 사용자가 경험하는 UX (정리)

1. **회원가입 완료** → Step 5 → 클릭 시 자동으로 `/account/contract` (사업자) / `/home` (개인)
2. **로그인** → fetchMe → store에 approvalState='pending' → /home 진입 시도 → 미들웨어가 `/account/contract`로 리다이렉트
3. **상단 글로벌 띠**: 모든 페이지에 항상 노출 ("사업자등록증 심사 중 …") + CTA "계약 관리" → `/account/contract`
4. **다른 페이지 시도** (`/send/sms`, `/contacts/list` 등): 미들웨어가 즉시 `/account/contract`로 자동 리다이렉트
5. **`/account/contract`**: 사용자가 사업자등록증 제출/재제출 가능 (`AppContractPanel`)
6. **승인 완료 후**: store 갱신 시점부터 모든 페이지 정상 접근 + `/home`도 진입 가능

## 10.3 허용 페이지 (변경 후)

| 경로 | 의미 |
| --- | --- |
| `/account/*` | 회원 정보·**계약 관리(메인 진입점)**·문의 등 |
| `/help`·`/guide`·`/wbs` | 정적 문서 |
| `/inquiry`·`/account/inquiry` | 1:1 문의 |
| `meta.auth === false` | 로그인·가입·재설정 등 |

차단 (자동 리다이렉트 → `/account/contract`):
- `/home` (NEW — §9에서는 허용이었음)
- `/send/*`·`/history/*`·`/contacts/*`·`/sender/*`·`/manage/*`·`/campaign*`·`/charge*` 등 모든 변경 페이지

## 10.4 산출물

- 사용자단: 4 파일 수정 — middleware/approval.global.ts · components/AppApprovalBanner.vue · pages/signup.vue · pages/home.vue(미승인 분기 + 스타일 ~80줄 제거)
- Pages 배포 #66 alias `5256d66d.malgn-noti.pages.dev`

## 10.5 알려진 한계 / 다음 작업

- **`AppContractPanel`의 미승인 UX 최적화** — 현재 컴포넌트는 가입 후 일반 흐름(승인된 사용자의 계약 갱신 등) 기준으로 디자인됨. 미승인(처음 제출) / 반려(재제출) 상태에 따라 화면 헤더·CTA를 더 명확히 분기할 여지. 후속.
- **사업자등록증 업로드 실 API** — `AppContractPanel`의 업로드 모달은 현재 UI만. R2 업로드 + `TB_CONTRACT_FILE` 적재 라우트 필요.
- **계약 재제출 후 상태 전이** — 운영자가 다시 'pending'으로 돌리는 흐름 + 사용자에게 알림 필요.
- **개인 가입자의 `/account/contract` 비노출** — 메뉴에서 숨김 처리 검토(현재 모두 노출).

---

# §11. `/account/contract` 실 API + R2 첨부 인프라 (배포 #17 / #69)

## 한 줄

§10에서 정책 정합화한 `/account/contract`의 실 백엔드 연동. **(a)** R2 bucket `malgn-noti-files` 생성 + `wrangler.toml` `FILES` 바인딩 + `schema.ts`에 `TB_CONTRACT`·`TB_CONTRACT_FILE` 정의(라이브 DDL과 일치) + Hono `AuthBindings`에 `FILES?: R2Bucket` 옵셔널 추가. **(b)** `POST /auth/signup` 확장 — 사업자(corp/sole) 가입 시 NICE 소비 직후 `TB_CONTRACT` 'initial' 자동 1건 생성(`title='최초 이용계약 온라인체결'`, `version='신규'`). **(c)** `/contracts` 라우트 신설 5 엔드포인트 — list / sign / files list / files upload(multipart) / files download(stream) / files delete. PDF·10MB 제한, name 접두사(`사업자등록증_…`·`대부업등록증_…`·`지급이행보증보험증권_…`)로 종류 구분(`TB_CONTRACT_FILE`에 kind 컬럼 없음). 회사 단위 권한 — companyId 매칭 안 되면 404. renew 체결 시 같은 회사의 다른 done 계약은 자동 expired. **(d)** OpenAPI 5 paths + 2 schemas 추가. **(e)** 프런트 `AppContractPanel.vue` 전면 교체 — 목업 contracts/bizFiles/loanFiles/insuranceFiles 제거, `await Promise.all([loadContracts(), loadFiles()])` SSR, FormData multipart POST, 미리보기는 인증 fetch → blob → object URL(iframe은 Authorization 헤더 못 실음). Workers 배포 #17(Version `7213946f-42c4-4772-bfbe-e8d271167a01`), Pages 배포 alias `9808fe42.malgn-noti.pages.dev`. 라이브 e2e 4 시나리오 통과(corp signup auto-contract / 파일 업로드 R2 / 파일 목록 / 체결 → done+expires).

## 11.1 결정 — `TB_CONTRACT_FILE.kind` 컬럼 없음 → `name` 접두사 사용

라이브 `TB_CONTRACT_FILE` 스키마는 `id / contract_id / name / size_bytes / r2_key / uploaded_at` 6 컬럼. 파일 종류(사업자등록증·대부업등록증·보험증권)를 구분할 컬럼이 없음. 새 DDL을 발행하기보다는 **업로드 시 `name`에 한국어 라벨 접두사를 붙여 저장**, 프런트에서 `startsWith('사업자등록증_')` 등으로 분류. 라이브 DDL 추가 없이 정책 흡수.

| kind 폼 필드 | name 접두사 |
| --- | --- |
| `biz` | `사업자등록증_<원본파일명>` |
| `loan` | `대부업등록증_<원본파일명>` |
| `insurance` | `지급이행보증보험증권_<원본파일명>` |

R2 customMetadata에는 `kind`·`companyId`·`contractId` 모두 기록 — 라이브 운영 중 별도 보고서/감사에 활용 가능.

## 11.2 R2 bucket + 바인딩

- `npx wrangler@4 r2 bucket create malgn-noti-files --remote` → 신규 버킷
- `wrangler.toml`에 `[[r2_buckets]] binding = "FILES" / bucket_name = "malgn-noti-files"` 추가
- `src/middleware/auth.ts`의 `AuthBindings`에 `FILES?: R2Bucket` 옵셔널 추가 — 기존 라우트가 모두 `Hono<AuthEnv>()` 패턴이라 한 곳에서 형 변경하면 자동 전파
- 사용처에서 `if (!c.env.FILES) throw errors.internal(...)` 가드 — 로컬 dev에서 바인딩 누락 시 503 응답으로 빠르게 실패

## 11.3 schema.ts — 라이브 DDL과 정합

[src/db/schema.ts](../../../malgn-noti-api/src/db/schema.ts) — 라이브에 이미 존재하던 `TB_CONTRACT`·`TB_CONTRACT_FILE` 정의 추가:

- `contract` — `id` PK auto / `company_id` FK→`TB_COMPANY` / `title` / `version` / `contract_state` ('initial'/'renew'/'done'/'expired', 기본 'initial') / `status` / `signer_user_id` FK→`TB_USER` / `signed_at` / `expires_at` / `created_at` / `updated_at`. 인덱스 `(company_id, contract_state)`
- `contractFile` — `id` PK auto / `contract_id` FK→`TB_CONTRACT` / `name` (한국어 접두사 포함) / `size_bytes` / `r2_key` / `uploaded_at`. 인덱스 `(contract_id)`

## 11.4 signup 자동 'initial' 계약 생성

[src/routes/auth.ts](../../../malgn-noti-api/src/routes/auth.ts) — NICE 세션 consume 직후 분기:

```ts
if (body.companyType === 'corp' || body.companyType === 'sole') {
  await db.insert(contract).values({
    companyId,
    title: '최초 이용계약 온라인체결',
    version: '신규',
    contractState: 'initial',
    status: 1,
  })
}
```

`personal`은 자동 생성 안 함 — `/account/contract`에 진입할 일이 없음(§10 정책).

## 11.5 `/contracts` 라우트 — 5 엔드포인트

[src/routes/contracts.ts](../../../malgn-noti-api/src/routes/contracts.ts) 신규(244 줄):

| 라우트 | 동작 |
| --- | --- |
| `GET /contracts` | 본 회사 계약 목록 (status=1 한정, id 오름차순) |
| `POST /contracts/:id/sign` | 'initial' 또는 'renew' → `'done'` + `signer_user_id=ctx.userId` + `signed_at=now` + `expires_at=+2y`. renew였다면 같은 회사의 다른 done 계약 모두 'expired'로 일괄 전이 |
| `GET /contracts/files` | 본 회사 파일 목록 (`contract` JOIN으로 회사 단위 좁힘) |
| `POST /contracts/files` | multipart (contractId / kind / file). PDF·10MB 검증 + 회사 소유 검증 → R2 put + DB insert |
| `GET /contracts/files/:id/download` | R2 stream → `application/pdf` 응답 (`Content-Disposition: inline; filename*=UTF-8''…`) |
| `DELETE /contracts/files/:id` | R2 delete(실패 swallow) + DB delete |

라우트는 `app.use('*', requireAuth())`만 — 승인 게이트(`requireApproved`)는 **적용 안 함** (미승인 사용자가 사업자등록증을 업로드해야 하기 때문).

R2 key 패턴: `contracts/<companyId>/<contractId>/<unix>_<safeName>` — 회사·계약별로 prefix 분리 + 안전한 ASCII 파일명으로 escape.

## 11.6 OpenAPI

- 5 paths 추가 (`/contracts` GET, `/contracts/{id}/sign` POST, `/contracts/files` GET·POST, `/contracts/files/{id}/download` GET, `/contracts/files/{id}` DELETE)
- 2 schemas 추가 (`Contract`, `ContractFile`)
- 목록은 `cursorList()` 헬퍼 재사용(실제로는 cursor 없음, 응답 형식은 `{data:[...]}` 동일)

## 11.7 프런트 — `AppContractPanel.vue` 실 API 연동

목업 데이터(`contracts[3건]`·`bizFiles[2건]`·`nowStamp()`·`expiryStamp()`) 모두 제거. 핵심 변경:

- **로딩**: `await Promise.all([loadContracts(), loadFiles()])` — top-level await (Nuxt SSR 호환)
- **상태 매핑**: 백엔드 `contractState`를 STATE_META 테이블로 `statusLabel`·`icon` 매핑 + `metas` 자동 구성(`initial`은 가입 안내·요청일, `done`은 체결·만료, `renew`는 요청일, `expired`는 만료)
- **파일 분류**: 목록은 단일 호출 → `classify(name)` 으로 biz/loan/insurance 그룹 분배 → 표시명은 접두사 제거
- **첨부 활성화**: 파일이 이미 있으면 `loanApplicable`·`insuranceApplicable` 자동 true
- **활성 계약 결정**: `activeContractId = initial || renew || 가장 오래된` — 새 첨부는 이쪽으로 묶음
- **업로드**: `FormData` POST `/contracts/files`. 실패 시 토스트 + input.value 초기화
- **체결**: `POST /contracts/:id/sign` → `loadContracts()` 재호출 → 토스트(`renew`였다면 "기존 계약 만료 처리" 메시지)
- **미리보기**: iframe은 Authorization 헤더를 못 싣기 때문에 `api<Blob>('/contracts/files/:id/download', { responseType: 'blob' })` → `URL.createObjectURL` → `AppFilePreviewDialog`에 `file.url` 전달. modal 닫힐 때 `revokeObjectURL`

## 11.8 라이브 e2e 검증 (4 시나리오)

| # | 호출 | 결과 |
| --- | --- | --- |
| 1 | corp signup (mock NICE) | ✅ 자동 `TB_CONTRACT` 1건 'initial' 생성 (`/contracts` 응답 정상) |
| 2 | `POST /contracts/files` (105B PDF, kind=biz) | ✅ 201 + `name='사업자등록증_test.pdf'` |
| 3 | `GET /contracts/files` | ✅ 1건 목록 |
| 4 | `POST /contracts/:id/sign` | ✅ `data.ok:true` → `GET /contracts` → `contractState='done'`, `signedAt`/`expiresAt`(+2y) 정확 |

E2E 데이터 cleanup 완료 (TB_CONTRACT_FILE 0 / TB_CONTRACT 0 / TB_USER e2e_% 0 / TB_COMPANY E2E% 0 / R2 객체 1건 삭제).

## 11.9 산출물

- API: `malgn-noti-api` — 신규 `src/routes/contracts.ts`(244) · 수정 `wrangler.toml`·`src/middleware/auth.ts`·`src/db/schema.ts`·`src/routes/auth.ts`·`src/openapi.ts`·`src/index.ts`. Workers 배포 #17 Version `7213946f-42c4-4772-bfbe-e8d271167a01`. R2 bucket `malgn-noti-files` 신규.
- 사용자단: `app/components/AppContractPanel.vue` 전면 교체. Pages 배포 alias `9808fe42.malgn-noti.pages.dev`.
- WBS: 5-3C-* 신규 항목 "계약 관리 (`/account/contract`) 실 API 연동" — 사업자등록증 업로드 + 계약 체결 ✅

## 11.10 알려진 한계 / 다음 작업

- **`AppContractPanel` 헤더의 안내문구**가 §10에서 지적된 "미승인 / 반려에 따른 분기"는 아직 미반영. 모달 UX(`AppUploadGuideDialog`·`AppContractSignDialog`)도 현 상태 유지.
- **운영자단 사업자 승인 화면 미구현** (P0 §7.7) — 현재 라이브 DB UPDATE만으로 승인/반려. 운영자단 라우트(`/admin/...`) 신설 필요.
- **이메일·SMS 자동 안내** (승인/반려/계약 만료) — NHN 자격증명 등록 후 trigger.
- **사업자등록증 OCR 자동 검증** — 향후 운영자 부담 경감 검토. 현재는 운영자 수동 심사.
- **계약 갱신 트리거** — 만료 1개월 전 자동 'renew' 계약 row 생성 cron 필요(아직 없음). signed_at + 2y가 가까워지면 `expiresAt`만으로 판단해 화면에서 경고는 가능.

---

# §12. 사업자등록증 첨부 시 회사 승인 상태 'reviewing' 자동 전이 (배포 #18·#19 / Pages alias d9a82bfa)

## 한 줄

§11의 후속 — 사용자가 "사업자등록증을 첨부하면 심사 중으로 변경해 달라"고 요청. `approval_state` enum에 **`reviewing`** 추가(`pending → reviewing → approved | rejected` 4단계). DDL 변경은 없음(`VARCHAR(20)`이라 자동 흡수). **(a)** 백엔드 `POST /contracts/files`에서 `kind=biz` 업로드 후 회사 상태가 `pending` 또는 `rejected`이면 `reviewing`으로 UPDATE. `rejected_reason`은 그대로 둠(운영자가 결정). **(b)** `requireApproved` 미들웨어 + `me.ts` PATCH 차단 메시지에 `reviewing` 분기 추가("사업자등록증 심사가 진행 중입니다. 승인 완료 후 …"). **(c)** 사용자단 `AuthCompany.approvalState` 타입 확장(`'reviewing'` 추가) + `AppApprovalBanner`·`AppMemberInfoPanel` 안내문구 3분기 + `AppContractPanel` 패널 상단에 승인 상태 카드(pending=warning · reviewing=info · rejected=danger) 신규. **(d)** `pickFile` 성공 후 `kind=biz`면 `auth.fetchMe()` 호출 → store 즉시 갱신 → 글로벌 띠·페이지 배너가 즉시 "심사 중"으로 전환(새로고침 불필요). Workers 배포 #19(Version `f6877b91-4b2c-429e-951f-9185bcf69c4a`), Pages 배포 alias `d9a82bfa.malgn-noti.pages.dev`. 라이브 e2e 통과(corp 가입 직후 pending → biz 업로드 → reviewing 자동 전이 + PATCH /me 시도 시 새 메시지 노출).

## 12.1 정책 — `approval_state` 4단계로 확장

| 상태 | 의미 | 진입 트리거 | 사용자 액션 |
| --- | --- | --- | --- |
| `pending` | 사업자등록증 미제출 | corp/sole signup | 계약 관리에서 사업자등록증 업로드 |
| `reviewing` | 운영자 심사 대기 | biz 첨부 완료 시 자동(pending/rejected에서만) | 대기 — 결과 안내 메일/SMS |
| `approved` | 승인 | 운영자(BackOffice) | 모든 기능 이용 |
| `rejected` | 반려 | 운영자(BackOffice) — 사유 입력 | 사업자등록증 재첨부 → reviewing으로 자동 전이 |

- `personal`은 처음부터 `approved` — 영향 없음
- `requireApproved` 미들웨어는 여전히 `state !== 'approved'` 차단 — `reviewing`도 차단 대상(메시지만 분기)
- DDL 변경 없음 (`approval_state VARCHAR(20)`). 추후 `idx_company_approval`은 4 상태 모두 같은 컬럼이라 그대로 효율적

## 12.2 백엔드 — 상태 전이 + 메시지

### POST /contracts/files (`kind=biz`만 발동)

```ts
if (kind === 'biz') {
  const cs = await db.select({ state: company.approvalState })...
  if (cs[0]?.state === 'pending' || cs[0]?.state === 'rejected') {
    await db.update(company).set({ approvalState: 'reviewing' })
      .where(eq(company.id, companyId))
  }
}
```

- 첫 첨부 시: `pending → reviewing`
- 반려 후 재첨부 시: `rejected → reviewing` (사유는 그대로 둠 → 운영자가 새 심사에서 덮어쓰거나 NULL로 설정)
- 이미 `reviewing`이거나 `approved`면 변동 없음(idempotent)
- `kind=loan` / `kind=insurance`는 트리거 안 함 — 보조 서류

### 메시지 분기 — 2 곳

[src/middleware/approval.ts](../../../malgn-noti-api/src/middleware/approval.ts):
```ts
state === 'rejected' ? '심사가 반려되어 이용할 수 없습니다. 사유: …'
: state === 'reviewing' ? '사업자등록증 심사가 진행 중입니다. 승인 완료 후 이용할 수 있습니다.'
: '사업자등록증을 등록한 후 이용할 수 있습니다.'
```

[src/routes/me.ts](../../../malgn-noti-api/src/routes/me.ts) — `PATCH /me`·`PATCH /me/company` 두 핸들러 모두 동일 분기 추가("정보를 수정할 수 있습니다" 변형).

## 12.3 사용자단 — 타입·배너·카드·store 갱신

### 타입 확장
[app/stores/auth.ts](../../app/stores/auth.ts) — `AuthCompany.approvalState` 에 `'reviewing'` 추가. 타입 좁힘이 풀려 모든 화면의 컴파일 에러가 한 번에 해소됨.

### AppApprovalBanner — 글로벌 띠
[app/components/AppApprovalBanner.vue](../../app/components/AppApprovalBanner.vue) — `visible`을 `state !== 'approved'`로 단순화(이전엔 pending/rejected만 명시). 본문 3분기:
- pending: "사업자등록증을 등록해 주세요"
- reviewing: "사업자등록증 심사 중입니다 — 영업일 1~2일 내 안내"
- rejected: "사업자등록증 심사 반려 — 사유: …"

CTA 라벨: rejected="다시 제출하기" / reviewing="진행 상태 보기" / pending="사업자등록증 등록". 클래스는 `:class="state"`로 단순화(`approval-banner.reviewing`은 별도 톤 없이 pending과 같은 warning 톤 유지).

### AppMemberInfoPanel — 페이지 배너
[app/components/AppMemberInfoPanel.vue](../../app/components/AppMemberInfoPanel.vue) — 같은 패턴(3분기 strong + p). 클래스는 `:class="approvalState"`.

### AppContractPanel — 패널 상단 상태 카드
[app/components/AppContractPanel.vue](../../app/components/AppContractPanel.vue) — `<div class="state-card" :class="approvalState">` 신규(`isLocked` 화면에서만 노출):
- pending: warning 톤 + 시계 아이콘 + "사업자등록증을 등록해 주세요" + "PDF, 최대 10MB" 안내
- reviewing: info 톤 + 로딩 아이콘 + "사업자등록증 심사 중입니다" + 영업일 안내
- rejected: danger 톤 + X 아이콘 + 반려 사유 + "다시 첨부 시 재심사" 안내

CSS 토큰만 사용(`--warning-line`·`--info-soft`·`--danger`).

### pickFile 성공 후 store 즉시 갱신
```ts
await api('/contracts/files', { method: 'POST', body: form })
await loadFiles()
if (target === 'biz') await auth.fetchMe()
toast.add({ title: target === 'biz' && approvalState.value === 'reviewing'
  ? '사업자등록증이 제출되었습니다. 심사가 진행됩니다.'
  : '서류가 첨부되었습니다.', ... })
```

`fetchMe()`로 store가 갱신되면 — 글로벌 띠(`AppApprovalBanner`)·페이지 배너(`AppMemberInfoPanel` 진입 시)·이 패널 상태 카드(`approvalState` computed) 모두 같은 store를 구독하므로 즉시 "심사 중"으로 전환됨.

## 12.4 라이브 e2e 검증

| # | 호출 | 결과 |
| --- | --- | --- |
| 1 | corp signup (mock NICE) | ✅ `/me` → `approvalState='pending'` |
| 2 | `GET /contracts` | ✅ `'initial'` 1건 자동 생성됨 |
| 3 | `POST /contracts/files` (kind=biz) | ✅ 201 |
| 4 | `GET /me` 재호출 | ✅ `approvalState='reviewing'` |
| 5 | `PATCH /me {name}` | ✅ 403 "사업자등록증 심사가 진행 중입니다. 승인 완료 후 정보를 수정할 수 있습니다." |

테스트 데이터 cleanup(R2 객체 1 + DB rows) 완료.

## 12.5 산출물

- API: `malgn-noti-api: 66dab21` — 3 파일 수정(`routes/contracts.ts`·`middleware/approval.ts`·`routes/me.ts`). Workers 배포 Version `f6877b91-4b2c-429e-951f-9185bcf69c4a`
- 사용자단: `malgn-noti: 5d530d9` — 4 파일 수정(`AppApprovalBanner.vue`·`AppMemberInfoPanel.vue`·`AppContractPanel.vue`·`stores/auth.ts`). Pages 배포 alias `d9a82bfa.malgn-noti.pages.dev`

## 12.6 알려진 한계 / 후속 작업

- **운영자단 심사 화면 미구현** (§7.7부터 누적) — `reviewing`까지 자동 진행되지만 승인/반려는 여전히 DB 직접 UPDATE. 운영자단 BackOffice 화면(`/admin/...`) 필요.
- **알림 미발송** — `pending → reviewing` 전이 시 사용자에게 알림 메일/SMS 없음. NHN 자격증명 발급 후 trigger.
- **반려 후 재첨부 시 사유 처리** — 현재는 `rejected_reason`을 그대로 둔 채 `reviewing`으로 전이. 운영자가 새 심사에서 결정하도록 위임. 정책상 더 명확히 하려면 재첨부 시 `rejected_reason=NULL`로 정리도 가능 — 향후 결정.
- **사업자등록증 외 보조 서류 정책** — 대부업등록증·보험증권은 첨부해도 상태 전이 없음. 운영자가 별도로 확인. 후속 정책 검토 시 변경 가능.

---

# §13. /account/contract 첫 진입 회복 — lazy auto-create + reviewing 자동 회복 (배포 #18 / Pages 6a7a7d2·ca657b2)

## 한 줄

§11/§12 배포 직후 사용자(`bubin@malgnsoft.com`, 회사 16)에게서 두 가지 잔존 문제 보고: **(a)** "파일 선택해도 아무 액션이 없다" — §11 배포 이전에 가입한 사업자라서 signup auto-create가 안 일어났고, `TB_CONTRACT` 0건 → `activeContractId=undefined` → 업로드 분기 무력화. **(b)** "사업자등록증을 업로드한 상태인데 화면이 '등록해 주세요'(pending)로 나온다" — §12 배포(17:18 UTC) **이전인 17:10에 첨부**한 상태라 reviewing 전이가 안 일어나고 `approval_state=pending` 그대로. 두 케이스 모두 **타이밍 race**로 §11/§12 신규 코드가 기존 데이터에는 미적용. 백엔드 두 군데에 **lazy backfill** 추가 — `GET /contracts`는 회사 corp/sole + 계약 0건이면 `'initial'` 자동 INSERT, `GET /contracts/files`는 회사 pending + biz 파일 1건 이상이면 `reviewing`으로 자동 UPDATE. 사용자가 새로고침 한 번이면 자동 복구. 회사 16은 즉시 DB UPDATE로 backfill 완료. Workers 배포 #18(`35e2ec85...`) 및 추가 패치 (`456b73c2...`). 프런트 SSR 안전성도 함께 보강 — `await Promise.all`을 try/catch로 감싸고 `onMounted` 재시도.

## 13.1 두 가지 문제와 원인

| # | 증상 | 회사 16 DB 상태 | 원인 |
| --- | --- | --- | --- |
| (a) | "파일 선택 후 아무 액션 없음" | `TB_CONTRACT` 0건 | §11 signup auto-create가 적용된 시점 이전 가입 |
| (b) | "업로드 후에도 'pending'으로 노출" | biz 파일 1건 + `approval_state='pending'` | 첨부 시점이 §12 배포(17:18) 이전(17:10) |

(a)는 `activeContractId` computed가 첫 계약을 선택하는데 contracts 빈 배열이면 `undefined` → `pickFile`이 "활성 계약을 찾을 수 없습니다" 토스트만 떨궈서 사용자에겐 "아무 일도 안 일어난" 것처럼 보임. 토스트는 떴지만 짧고 우측 상단이라 놓치기 쉬움.

(b)는 §12의 `pending → reviewing` 전이가 `POST /contracts/files` 시점에만 발동하는 설계라서, 그 코드가 라이브에 올라가기 **이전**에 이미 첨부한 사용자는 이벤트가 사라진 셈.

## 13.2 백엔드 두 군데 lazy backfill

### GET /contracts (커밋 6a7a7d2)

```ts
let rows = await select()
if (rows.length === 0) {
  const cs = await db.select({ companyType: company.companyType })
    .from(company).where(eq(company.id, companyId)).limit(1)
  const ct = cs[0]?.companyType
  if (ct === 'corp' || ct === 'sole') {
    await db.insert(contract).values({
      companyId,
      title: '최초 이용계약 온라인체결',
      version: '신규',
      contractState: 'initial',
      status: 1,
    })
    rows = await select()
  }
}
```

`personal`은 trigger 안 함 — 승인 게이트 대상이 아니라서.

### GET /contracts/files (커밋 ca657b2)

```ts
const hasBiz = rows.some(r => r.name.startsWith('사업자등록증_'))
if (hasBiz) {
  const cs = await db.select({ state: company.approvalState })
    .from(company).where(eq(company.id, companyId)).limit(1)
  if (cs[0]?.state === 'pending') {
    await db.update(company)
      .set({ approvalState: 'reviewing' })
      .where(eq(company.id, companyId))
  }
}
```

`reviewing`/`approved`/`rejected`인 회사는 손대지 않음 — pending만 보정.

다음 `/me` hydrate(또는 `fetchMe()` 호출)부터 글로벌 띠·페이지 배너 모두 정상.

## 13.3 즉시 backfill (회사 16)

```sql
INSERT INTO TB_CONTRACT (company_id, title, version, contract_state, status)
VALUES (16, '최초 이용계약 온라인체결', '신규', 'initial', 1);

UPDATE TB_COMPANY
SET approval_state='reviewing'
WHERE id=16;
```

사용자에게 새로고침 안내. 같은 조건의 다른 회사가 있어도 이번 1회로 모두 보정(전체 1건만 해당).

## 13.4 프런트 SSR 안전성 보강 (커밋 b7e8a21)

`AppContractPanel.vue`의 top-level await가 SSR에서 401·네트워크 실패 시 페이지 전체가 죽었다. try/catch로 감싸고 `onMounted`에서 한 번 더 시도하도록 변경 — 백엔드 lazy auto-create와 함께 새로고침 한 번으로 정상 복구된다.

```ts
try { await Promise.all([loadContracts(), loadFiles()]) }
catch { /* ignore — onMounted에서 재시도 */ }
onMounted(async () => {
  if (contracts.value.length === 0 && bizFiles.value.length === 0) {
    try { await Promise.all([loadContracts(), loadFiles()]) }
    catch { /* ignore */ }
  }
})
```

## 13.5 산출물

- API: `malgn-noti-api: 6a7a7d2, ca657b2` — 2 파일 수정(`routes/contracts.ts`). Workers 배포 #18 Version `35e2ec85-3e89-4986-b120-d9cf5bbf877b`, 후속 `456b73c2-c5de-4a99-aece-b4457c0bcd8d`
- 사용자단: `malgn-noti: b7e8a21` — `AppContractPanel.vue` SSR fallback
- DB: 회사 16에 `TB_CONTRACT` id=3 backfill + `approval_state='reviewing'` UPDATE

## 13.6 교훈

이번 같은 "신규 코드 + 기존 데이터" race는 회원·인증처럼 **사용자 라이프사이클 이벤트 트리거**가 정책에 묶일 때 흔하다. 두 가지 패턴으로 방어:

1. **조회 시점 lazy backfill** — 이번 §13에서 채택. GET 응답을 떠올릴 때 현재 코드가 보장해야 할 상태를 함께 확인·보정. 데이터마이그레이션 미수행 가능.
2. **명시적 backfill 마이그레이션** — DDL이나 SQL 스크립트로 일괄 보정. 정합성은 더 명확하지만 운영 절차 필요.

규칙은 신규 데이터가 적고 정책 trigger가 단순한 경우 1번이 비용 대비 효과 좋음. 향후 같은 패턴(사업자등록증 외 다른 본인확인·서류 흐름)에서도 1번을 default로 두는 것을 권장.

---

# §14. 사업자등록증 파일 행에 심사 상태 배지 + 반려 시 삭제 (Pages 7675ce8f)

## 한 줄

§12까지의 안내는 패널 상단 카드와 글로벌 띠에 집중되어 있었는데, **파일 행 자체**에서 상태가 한눈에 안 보였다. 사용자 요청으로 사업자등록증 행 우측에 **회사 승인 상태 배지**(reviewing/approved/rejected) 표시 + **반려 시에만 삭제 버튼** 노출. 같은 묶음의 모든 biz 파일이 같은 회사 상태를 공유하므로 모든 행에 동일 배지. 삭제 후에도 회사는 `rejected` 유지(운영자 결정 보존) → 새 파일 첨부 시 백엔드(§12)가 자동 `reviewing`으로 전이.

## 14.1 화면 변경

- 파일 행 = `[아이콘] [이름·메타] [심사 상태 배지] [확인] [(반려 시) 삭제]`
- 배지 색상 매핑:
  - `reviewing` → info 톤 + 로딩 아이콘 + "심사 중"
  - `approved` → success 톤 + 체크 + "승인"
  - `rejected` → danger 톤 + X + "반려"
  - `pending` → 파일 자체가 없으므로 배지 미표시
- 삭제 버튼은 빨간 outline (`.df-remove` 자체 클래스 — 글로벌 `btn-outline-danger`가 없어 인라인 정의)
- `pickFile`이 안정적인 키를 쓰도록 `:key="f.id"`(이전엔 `name + at` 조합)

## 14.2 삭제 후 상태 정책

| 상황 | 변동 |
| --- | --- |
| `rejected` 상태에서 biz 파일 삭제 | 회사 `approval_state`는 **그대로 rejected** (사유도 유지) |
| 그 뒤 새 파일 첨부 | §12 코드가 `rejected → reviewing` 자동 전이 |
| `reviewing`/`approved` 중에는 | 삭제 버튼이 안 보여 사용자 실수 방지 |

## 14.3 산출물

- 사용자단: `malgn-noti: 79e51af` — `AppContractPanel.vue` 단일 파일 수정. Pages 배포 alias `7675ce8f.malgn-noti.pages.dev`

## 14.4 알려진 한계

- `reviewing` 중 잘못 올린 파일을 사용자가 스스로 정정 못함. 정책상 "심사 중에는 변경 불가"가 안전하지만, UX적으로 답답할 수 있음. 운영자단 심사 화면이 생기면 같은 곳에서 처리 가능.

---

# §15. 계약서 서명 다이얼로그 — 휴대폰 본인인증 sub-step + 공인인증서 탭 제거 (배포 Workers 85de422a / Pages 38d4e40e·573a6200)

## 한 줄

`AppContractSignDialog`의 STEP 3 "전자서명/공인인증" 화면에 **휴대폰 본인인증 sub-step**을 선행으로 추가. 인증 통과 전엔 서명·정보 테이블 자체가 노출되지 않음. 가입 시 NICE로 검증한 본인 휴대폰(`TB_USER.phone`)으로 SMS OTP를 발송 → 6자리 확인 → 통과 시 success 톤으로 전환되며 서명 캔버스 자동 셋업. 백엔드는 기존 `POST /auth/phone-code/{send,verify}`에 `purpose='contract_sign'`을 새 enum 값으로 추가(기존 인프라 그대로 재활용). 후속 사용자 피드백 두 가지("등록 정보 없음으로 노출됨" / "공인인증서 삭제") 반영해 — (a) 다이얼로그 open 시 `auth.fetchMe()` 강제 hydrate로 stale 휴대폰 회복, (b) 공인인증서 탭/영역/관련 CSS·상태 전부 제거해 단일 전자서명 흐름으로 단순화.

## 15.1 백엔드 — 'contract_sign' purpose 추가 (Workers 85de422a)

`OtpPurpose` enum + `purposeLabel()` + `sendPhoneCodeB`/`verifyPhoneCodeB` zod enum에 `contract_sign` 추가. 별도 라우트는 만들지 않고 기존 phone-code 인프라(SHA-256 해시·TTL 10분·5회 시도 제한·재발송 시 직전 코드 무효화·소비 후 재사용 차단) 그대로 재사용. OpenAPI 두 path의 schema enum 동기화. SMS 본문은 `[맑은 메시징] 계약서 전자서명 인증코드: NNNNNN (10분 유효)` 형태.

라이브 e2e: 발송 → mockCode 수신 → verify 200 → 소비 후 재시도 401(`인증코드가 만료되었거나 발급된 적이 없습니다`) 모두 정상.

## 15.2 다이얼로그 본인인증 sub-step (Pages 38d4e40e)

`AppContractSignDialog.vue`:

- STEP 3 상단에 본인인증 카드(info 톤 → 통과 후 success 톤 전환)
- 카드 구조: 헤더(strong + p) → 휴대폰 마스킹 표시(`010-****-1111`) + "인증번호 받기" → 발송 후 6자리 입력 + "확인"
- `phoneVerified === false` 동안은 서명·정보 테이블·캔버스 모두 미노출
- 통과 시 `setupCanvas()` 직접 호출 (탭 watcher 제거)
- `canComplete` computed에 `phoneVerified.value` 추가 → "서명 완료" 버튼 게이팅
- `finish()`에 본인인증 가드 추가(방어적)
- `reset()`에 인증 상태 초기화 추가 — 같은 다이얼로그를 닫고 다시 열면 처음부터

부가 정합화:
- 사업자명/대표자 정보가 하드코딩(`(주)맑은소프트` / `하근호`)이었던 것을 `auth.tenant.name`/`bizNo`/`ceoName`로 동적 바인딩
- 서명자명 기본값을 `auth.user.name`으로 자동 채움

## 15.3 사용자 피드백 후속 (Pages 573a6200)

1. **"등록 정보 없음으로 표시됨"** — 회사 16 user는 phone=`010-1111-1111`이 있는데 다이얼로그가 stale state로 빈 값을 표시. 다이얼로그 open watcher에 `auth.fetchMe()` 강제 호출 추가. 회원정보 수정 직후나 어떤 경로로든 다이얼로그 열릴 때마다 최신 데이터로 hydrate.
   - 미등록 케이스 안내문구도 강화 — `회원 정보에 휴대폰 번호가 등록되어 있지 않습니다.` (danger 톤)
2. **"공인인증서 삭제"** — `signTab`/`certLoaded` 상태, `<button>공인인증서</button>` 탭, `.cd-cert-*` CSS 100여 줄 모두 제거. STEP 3은 본인인증 → 전자서명 단일 흐름.

## 15.4 라이브 e2e (Production)

| # | 호출 | 결과 |
| --- | --- | --- |
| 1 | `POST /auth/phone-code/send` (`purpose=contract_sign`, mock 모드) | ✅ 200 + `mockCode` |
| 2 | `POST /auth/phone-code/verify` (올바른 코드) | ✅ `{verified: true}` |
| 3 | 같은 코드 재시도 | ✅ 401 — 소비 후 재사용 차단 정상 |
| 4 | 잘못된 코드 | ✅ 401 — `인증코드가 만료되었거나 발급된 적이 없습니다` |

E2E 잔존 데이터 cleanup 완료.

## 15.5 산출물

- API: `malgn-noti-api: cd75d0c` — 2 파일 수정(`routes/auth.ts`·`openapi.ts`). Workers 배포 Version `85de422a-2ad7-4ce6-929c-8f2b29f03a6e`
- 사용자단: `malgn-noti: 40979f6, 0054bfc` — `AppContractSignDialog.vue` 단일 파일(235 lines 추가 + 인증서 영역 107 lines 제거). Pages 배포 alias `38d4e40e` → `573a6200`

## 15.6 알려진 한계 / 후속

- **NICE 자격증명은 §16 참조** — 현재 NHN_MOCK + NICE_MOCK 둘 다 켜진 mock 모드라서 사용자가 받는 SMS는 실제 발송 안 됨. 토스트에 `mockCode`가 노출되어 본인 검증.
- **서명 데이터 보존** — 현재 캔버스 ink 데이터를 PNG로 저장하지 않음. `POST /contracts/:id/sign` 호출만 백엔드에 보내고 상태만 전이. 법적 효력을 강화하려면 캔버스 이미지를 R2 또는 `TB_CONTRACT.signed_image_r2_key` 컬럼에 저장 검토.
- **본인인증 결과 영속화** — 인증 통과는 다이얼로그 메모리에만 존재. 같은 사용자가 같은 계약 서명을 다시 시작하면 재인증 필요. 정책상 적절 (전자서명법 등본인 동의 강도).

---

# §16. 운영 노트 — NICE / NHN Notification Hub 자격증명 시도와 보류 (라이브 운영 변경)

## 한 줄

오늘 두 외부 서비스의 production 자격증명 등록을 시도 — 둘 다 **외부 측 제약**으로 mock 모드 유지 결정. **NICE**는 자격증명 등록 성공했으나 NICE 콘솔의 **IP 화이트리스트(에러 1007)** 미해결로 즉시 mock 복귀. **NHN Notification Hub**는 사용자가 준 자격이 `AppKey`만이었는데 공식 문서 확인 결과 **기존 채널별 SDK와 완전히 다른 인증 모델**(OAuth2 client_credentials → Bearer 토큰)이라 어댑터 재작성 + User Access Key + Secret Access Key 발급 필요. 둘 다 영업·콘솔 작업 대기.

## 16.1 NICE 본인인증

### 시도

`wrangler secret put`으로 3개 등록:
- `NICE_CLIENT_ID` = `NIed76e1a1-236a-4cfc-b3b3-4c3586b3dfcf`
- `NICE_CLIENT_SECRET` = `NzY0...` (전문 보안 사유 생략)
- `NICE_RETURN_URL` = `https://malgn-noti-api.malgnsoft.workers.dev/auth/nice/callback`

`NICE_MOCK` 삭제 후 `POST /auth/nice/init` 호출 → 500 응답.

### 진단

`wrangler tail`로 캡처한 에러 로그:
```
(error) [onError] Error: NICE token failed: 1007 허용되지 않은 IP 접근
```

NICE 콘솔의 API 보안 정책에 **호출 출발지 IP 화이트리스트**가 활성화된 상태. Cloudflare Workers는 outbound IP가 동적이라 단일 IP 등록 불가. `doc/NICE_AUTH.md §9`에서 사전 예측한 한계 그대로.

### 결정

- `NICE_MOCK=1` 다시 등록 → 가입 흐름 mock 모드 복귀(정상 동작 확인)
- `NICE_CLIENT_ID` / `NICE_CLIENT_SECRET` / `NICE_RETURN_URL` 3 secret은 **유지** — IP 정책 해결 시 `wrangler secret delete NICE_MOCK` 한 번이면 real 전환

### 해결 옵션 (사용자 결정 대기)

| 옵션 | 작업 | 비고 |
| --- | --- | --- |
| A. NICE 콘솔에서 Cloudflare egress IP 등록 | NICE 영업담당에게 IP 목록 송부 후 콘솔 반영 | 통상 거절될 가능성 |
| B. NICE 콘솔에서 IP 검사 OFF | 콘솔 → API 설정 토글 해제 | 가장 단순, 보안 등급은 다소 낮아짐 |
| C. 고정 IP 프록시 EC2 | AWS EC2 nano, Workers → EC2 → NICE | 가장 안정, 월 비용 발생 |

사용자 의사로 IP 정책은 일단 **보류**, 자격증명만 보관 상태.

### 보안 메모

`CLIENT_SECRET`이 채팅 평문에 노출됐다. IP 정책 해결 시점에 NICE 콘솔에서 한 번 회전 권장. 회전 후 `wrangler secret put NICE_CLIENT_SECRET` 재등록.

## 16.2 NHN Notification Hub

### 사용자 제공

- AppKey: `JhgDNGyD9dyYQqH5`
- BaseURL: `https://notification-hub.api.nhncloudservice.com`
- Secret Key: **제공되지 않음**

### 1차 진단 — 기존 채널별 SDK 가정

현재 어댑터(`src/adapters/nhn/{sms,email,push,kakao}.ts`)는 채널별 분리 API(`https://api-sms.cloud.toast.com` 등)에 대해 작성됨. 인증은 `X-Secret-Key` 헤더. 사용자에게 SecretKey 요청.

### 2차 진단 — 공식 문서 확인

[NHN Cloud Notification Hub 공통 정보](https://docs.nhncloud.com/ko/Notification/Notification%20Hub/ko/api-guide-v1x0/common-info/) 확인 결과:

**Notification Hub는 기존 NHN 채널별 API와 완전히 다른 신규 통합 서비스.**

| 항목 | 기존 채널별 NHN | **Notification Hub** |
| --- | --- | --- |
| 인증 헤더 | `X-Secret-Key: <키>` | `Authorization: Bearer <토큰>` |
| 자격 종류 | AppKey + SecretKey (정적) | **User Access Key ID + Secret Access Key** (OAuth2) |
| 토큰 발급 | 불필요 | `POST https://oauth.api.nhncloudservice.com/oauth2/token/create` (Bearer, TTL 24h) |
| AppKey 역할 | 경로 + 인증 | JWT 토큰 발급 시 scope(`scope=appKey:<AppKey>`)에만 사용 |

토큰 발급 cURL:
```bash
curl -X POST 'https://oauth.api.nhncloudservice.com/oauth2/token/create' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -u 'UserAccessKeyID:SecretAccessKey' \
  -d 'grant_type=client_credentials' \
  -d 'scope=appKey:<AppKey>'
```

### 결정

User Access Key ID + Secret Access Key를 받으면 다음을 한 번에 진행:

1. **NHN 어댑터 재작성** — 채널별 SDK → Notification Hub 통합 API. 경로 구조와 페이로드 모두 변경. OAuth 토큰 발급 + KV 캐싱(24h) 헬퍼 추가.
2. `wrangler secret put NHN_OAUTH_USER_KEY` / `NHN_OAUTH_SECRET_KEY` / `NHN_APP_KEY` / `NHN_BASE_URL` 4개 등록.
3. `wrangler secret delete NHN_MOCK`.
4. e2e — SMS 1건 + Email 1건 실 발송.

지금은 자격 미수령 + 어댑터 재작성 미진행 → 사용자단·관리자단의 모든 발송 호출은 `NHN_MOCK=1` 그대로 mock 모드 유지(가입 OTP 토스트의 `mockCode`로 검증 정상).

### 코드 변경 없음

이 §16은 운영 시도 + 외부 제약 확인 + 보류 결정의 기록. **코드/배포 변경은 없음**(자격 secret put/delete + `NICE_MOCK` 재등록만). 어댑터 재작성은 키 수령 시점에 §17 이후로 별도.

## 16.3 산출물

- 코드: 없음
- secret 변경(production Workers):
  - `+NICE_CLIENT_ID` / `+NICE_CLIENT_SECRET` / `+NICE_RETURN_URL` — 등록 후 유지
  - `-NICE_MOCK` 일시 삭제 → `+NICE_MOCK=1` 복원
- 외부 미해결:
  - NICE: 1007 IP 화이트리스트 (사용자 콘솔 작업)
  - NHN: User Access Key 발급 (사용자 콘솔 작업)

## 16.4 다음 단계

| 항목 | 트리거 | 작업 |
| --- | --- | --- |
| NICE real 전환 | 사용자가 IP 정책 해결 (옵션 B 권장) | `wrangler secret delete NICE_MOCK` + e2e 1건 |
| NHN real 전환 | 사용자가 User Access Key 발급 | 어댑터 재작성 + secret 등록 + e2e SMS·Email |
| 사용자 안내 자동화 | 위 두 trigger 발생 시 | 메일 발송 + SMS 통지 인프라가 정확히 위 두 secret에 의존하므로 동시에 enable |

