# 2026-06-11 작업 이력

> **한 줄 요약**: **3차 멀티에이전트팀(`account-pages-dev`, 6역 tmux 분할)** 로 계정 6페이지(cards·security·multi·credit·inquiries·billing)를 **데모 → 실 API 풀스택 연동**. 백엔드 3엔드포인트 신설(2FA 토글·멤버 관리·영수증, 무스키마), 기획 정본 6종 작성, QA 회귀 게이트 GREEN. 2레포 커밋·푸시 + 프로덕션 배포(api `2b7f9fcf`·frontend `87da3ace`). **(§7 후속)** admin-dev 합류(7역) + 크레딧 충전(`/charge`)·관리자 발신번호 심사(`/senders/numbers`)·**문의 작성 저장 버그픽스**(사용자 보고: `onSubmit`이 POST 미호출이라 미저장) — 3레포 커밋·배포(api `34da178d`·admin `fdf96728`·frontend `71b85e64`). "나의 페이지" 전 메뉴 ✅ 실연동 검수 확인. **(§8)** 보안 재인증 422 버그픽스 + **멤버 최초로그인 온보딩**(joinState·약관·비번변경) + **막혔던 DB 마이그레이션 5종 적용**(직접 mysql 직결로 진단·해결, MEDIUMTEXT 행크기 수정) + 관리자 **Wave 1**(운영자 1:1문의·accounts PII 마스킹/보기) + **Wave 2**(운영자 계정·권한그룹·FAQ·공지, Figma 기반, 신규 테이블 4종). QA GREEN, 전부 커밋·배포.

---

## 1. 팀 구성 — account-pages-dev (6역, 모델 혼합)

사용자 요청으로 역할별 모델을 섞어 tmux 분할 패널로 구성: **planner**(opus)·**api-dev**(opus)·**frontend-dev**(opus)·**designer**(sonnet)·**publisher**(sonnet)·**qa**(haiku, 저비용). 팀리드가 계약 선제 확정·조율. 모든 선택은 추천/1번 기본으로 자체 결정(사용자 "모든 물음에 1번" 지시 — [[prefer-recommended-default]]).

## 2. 백엔드 (api-dev) — malgn-noti-api

데모→실연동에 필요한 API를 **무스키마(기존 컬럼·테이블 재사용)** 로 신설. `src/routes/me.ts`·`credit-ledger.ts`, tsc 0.
- **GET/PUT /me/security** — 2FA on/off·방식(email/sms), 비밀번호 재인증(불일치 401). 기존 `security_login_yn/method` 컬럼 사용.
- **/me/members CRUD** — GET 목록 / POST 즉시생성(같은 company user 생성 + 임시비번 이메일 발송, 초대메일·신규테이블 없음) / PATCH·DELETE(soft-delete). 본인·마지막 활성 owner 가드(403/409), 감사로그 적재.
- **GET /credit-ledger/:id/receipt** — entryType='charge' 행 기반 영수증(신규 테이블 없음).
- 보류(정책/PG 미정): 세금계산서(TB_TAX_INVOICE), PG 카드 등록(billingKeyBase64 목업 유지), 집계 엔드포인트.

## 3. 사용자단 (frontend-dev) — malgn-noti

account 6페이지 전부 `useApi` 경유 실연동(전부 얇은 셸 + `App*Panel` 구조). tsc/eslint green.
- **inquiries** — 동적 라우트 `[id].vue` 신설(구 `detail.vue` 제거) + 답변 컴포저(POST /:id/replies), 목록 커서 페이징·삭제.
- **credit** — `/credit-ledger` 서버 필터·커서 페이징 + 영수증(`/:id/receipt`)→`AppReceiptDialog`(서버값 리팩터, 목업 카드번호 제거). 잔액=auth store 실값.
- **cards** — `/payment-methods` CRUD.
- **security** — `/me/security` 토글 + 비밀번호 재인증 모달. FE `'phone'`→`'sms'` enum 통일.
- **multi** — `/me/members` 멤버 목록·담당자 추가(즉시생성, `AppManagerInviteDialog` "초대"→"담당자 추가" 개조)·권한/상태/삭제.
- **billing** — `AppBillingPanel`(publisher 신규) + `/credit-ledger?entryType=charge` 결제 내역 + 결제 이메일 변경(`PATCH /me/company`).
- 공통 한계: 집계 타일(문의 상태별 카운트·크레딧 요약)은 count 엔드포인트 부재로 로드분 best-effort.

## 4. 디자인·퍼블 (designer·publisher)

- **publisher**: `AppBillingPanel.vue` 신규(결제 내역 테이블 + 결제 이메일 행 + 영수증→기존 `AppReceiptDialog` 재사용), 기존 패널 디자인 패턴 인라인 복제. 제안한 표준화 4건(ms-head 글로벌화·AppListCard 추출·AppReceiptDialog→AppModal·.seg 통일)은 충돌·범위 이유로 **후속 보류**.
- **designer**: 계정 영역 디자인 패턴(섹션 카드·폼 행·배지·테이블·모달) 검토·권장. 신규 색 추가 없음(기존 ink/accent/semantic 토큰 커버).

## 5. QA (haiku) — 회귀 게이트 + 체인 검증

- 회귀 게이트(실제 실행): malgn-noti `typecheck` PASS / `lint` 14 errors(baseline 15 이하·계정 파일 신규 0) / malgn-noti-api `tsc` PASS.
- 6페이지 엔드포인트 코드 spot-check: FE 호출 경로 == BE 라우트 전부 일치, `'sms'` enum 동기화 확인. **최종 GREEN**.
- 검증 상한: 정적 cross-check(라이브 런타임 스모크는 외부 Aurora 필요 — 이전 세션과 동일).

## 6. 기획 정본 (planner) — mng docs/pages

6종 작성: `CARDS.md`·`SECURITY.md`·`MULTI_ACCOUNT.md`·`CREDIT.md`·`INQUIRIES.md`·`BILLING.md`(개요/진입/화면/액션/상태/정책/API/DB/구현상태/한계).

---

## 7. 후속 라운드 — 충전·발신번호 심사·문의 작성 버그픽스 + admin-dev 합류

같은 팀에 **admin-dev(opus, 7번째 역)** 합류. 추가 작업 3건을 병렬 처리 후 3레포 커밋·푸시·배포.

- **문의 작성 저장 버그픽스**(사용자 보고) — `/account/inquiry`의 `onSubmit`이 `router.push`만 하고 **`POST /inquiries`를 호출하지 않아** 등록이 저장되지 않던 버그. async POST(`inquiryType/productType?/title/body`) + 중복 제출 guard로 수정. 목록·상세는 정상이었고 작성 페이지만 목업으로 남아있던 케이스(git/코드 대조로 보고≠실제 두 번 확인 후 적용).
- **크레딧 충전 `/charge`**(frontend-dev) — 금액 프리셋·직접입력 + 결제수단(`/payment-methods`) + `POST /me/charge`(Idempotency-Key 이중충전 차단) + `/charge/result` 결과·영수증. 백엔드(api-dev) `POST /me/charge` mock 결제(트랜잭션 잔액 적립·감사로그, 스키마 무변경). PG 빌링키는 mock 스텁(후속).
- **관리자 발신번호 심사 `/senders/numbers`**(admin-dev) — 백엔드(api-dev) `GET /ops/sender-phones`·`PATCH /:id`(승인/반려·사유·감사로그, accounts 패턴, 실 스키마 한글 enum `대기/심사중/승인/반려`). admin Nitro 프록시 2종 + `types/senderPhone` + 드로어 심사 UX. 공용 컴포넌트 동결계약 준수(개명 없음, `AppStatusBadge` '심사중' 톤 1줄 additive).
- **검수(planner)** — "나의 페이지" 좌측 부메뉴 전수 점검: settings·cards·password·security·multi·contract·credit·billing·inquiries(목록/상세)·문의작성·충전 **전부 ✅ 실 API 연동** 확인(코드 기준). 한계 2: billing은 charge 원장 한정, PG 빌링키 mock.

---

## 8. 보안 재인증·멤버 온보딩·DB 마이그레이션 해결·관리자 배치(Wave 1·2)

같은 7역 팀으로 사용자 보고 버그·신규 도메인을 연속 처리. 핵심은 **막혀 있던 DB 마이그레이션 적용 경로를 뚫은 것.**

- **보안 재인증 버그픽스** — `/account/security` 등에서 비번 틀리면 로그인으로 튕기던 문제. 재인증 비번 오류를 `errors.unauthenticated`(401, 전역 핸들러가 자동 로그아웃) → **`errors.unprocessable`(422)**로 분리(`/me/security·/me/password·/me/email-change·/me/withdraw` 4곳). FE catch 422 인식·모달 유지. (noti `95cb158`·api `52ffad2` → Pages `45d266da`·Workers `95360a59`.)
- **멤버 최초 로그인 온보딩** — owner가 `/me/members`로 추가한 멤버는 `joinState='invited'`(임시비번). 최초 로그인 시 미들웨어 게이트(`onboarding.global.ts`)가 `/onboarding`로 강제 → [약관 동의·회원정보·비밀번호 변경] 단일 `POST /me/onboarding` → `joinState='joined'`(가입완료). 약관은 v1 최소(`user.terms_agreed_at`). (noti `9722dd8`·api `f5e8990`·mng `80d3b19`.)
- **🔓 DB 마이그레이션 블로커 해결** — 대기하던 5종(`0007`~`0011`)을 Aurora에 적용. **막혔던 경로 진단**: 배포 워커는 `/admin/migrate`를 `APP_ENV!=='local'`로 404 차단 / 로컬 `wrangler dev --remote`(4.94·4.99)는 Hyperdrive→Aurora 원격 브릿지 503 / `APP_ENV=local` 배포는 `auth.ts` X-Dev-* **인증 우회**라 불가. → **해결: 사용자 제공 직접 접속(`db.malgn.co.kr`, DB `noti`)으로 mysql CLI 직결**(동일 프로덕션 Aurora 8.0.42 확인). 적용 중 `0010/0011`의 `VARCHAR(16383)×utf8mb4` 행크기(65535) 초과 → **MEDIUMTEXT로 수정** 후 통과. 방법은 [[db-migration-apply-method]]에 기록.
- **Wave 1 (관리자, 배포가능)** — 운영자 1:1 문의(`/ops/inquiries` 교차테넌트 조회·운영자 답변·answerState) + **accounts PII 마스킹/보기**: `/ops/accounts` 응답을 email·loginid·phone 마스킹 + `POST /ops/accounts/:id/reveal {reason}`(원본 + 감사로그). admin은 상세에서만 "가려진 정보 보기"(사유 모달→원본). (api `076b5e9` → Workers `081a27dd`, admin `30bec99` → Pages `ee2a120c`, noti onboarding → Pages `e97a1c4f`.)
- **Wave 2 (관리자, Figma 12_시스템·9_고객지원)** — 운영자 계정(`/ops/operators` CRUD·임시비번·마지막 운영자 가드), 권한 그룹(`/ops/roles` + 권한 매트릭스 `/ops/permissions` 11키), FAQ(`/ops/faqs`), 공지(`/ops/notices`). 신규 테이블 `TB_OPERATOR·TB_OPERATOR_ROLE·TB_FAQ·TB_NOTICE`(마이그레이션 `0008`~`0011`). admin 28파일(페이지4+프록시19+타입5). (api 백엔드 `076b5e9`→`081a27dd`, admin 프론트 `bc2bb7a` → Pages `adaf06cc`.)
- **QA** — Wave 1 사후 회귀 검증(noti/admin/api 게이트 + 체인) GREEN, Wave 2 4체인(operators/roles/faq/notices FE↔Nitro↔/ops) GREEN. roles.vue 타입 9건은 보고 시점 해소 확인.

---

## 산출물

- `malgn-noti`(사용자단) — 계정 6페이지 실 API 연동 커밋 `6e27329` → Pages 배포 alias `87da3ace`. 8개 패널 수정 + `AppBillingPanel` 신규 + `inquiries/[id].vue` 신규 + `detail.vue` 제거 + `sitemap.vue`. 라이브 <https://malgn-noti.pages.dev>.
- `malgn-noti-api`(백엔드) — 2FA 토글·멤버 관리·영수증 API 커밋 `e076622` → Workers Version `2b7f9fcf`(`/me/security`·`/me/members`·`/credit-ledger/:id/receipt` 401 게이트·`/health` 200 라이브 검증). <https://malgn-noti-api.malgnsoft.workers.dev>.
- `malgn-noti-mng` — 기획 정본 6종(`docs/pages/`) + 본 작업 이력.
- 무관 파일(`malgn-noti/docs/WBS.md`, `malgn-noti-api`의 `0006_company_ad_receive_at.sql`)은 범위 제외.
- **§7 후속 라운드** — `malgn-noti`(문의 작성 버그픽스 + `/charge` 충전) 커밋 `41b1fa5` → Pages `71b85e64`. `malgn-noti-api`(`POST /me/charge` mock + `/ops/sender-phones` 심사) 커밋 `faf40c4` → Workers `34da178d`(`/me/charge` 401·`/ops/sender-phones` 403 라이브). `malgn-noti-admin`(발신번호 심사 페이지 + 프록시 2종) 커밋 `c8b9d64` → Pages `fdf96728`(200). 3레포 origin/main push + 프로덕션 배포(api→admin→frontend).
- **§8 보안·온보딩·마이그레이션·관리자 배치** — 보안 422(noti `95cb158`·api `52ffad2` → `45d266da`·`95360a59`). 온보딩(noti `9722dd8`·api `f5e8990`·mng `80d3b19`). **마이그레이션 `0007`~`0011` Aurora 적용**(`db.malgn.co.kr` 직접 mysql, MEDIUMTEXT 수정). Wave1+2 백엔드 api `076b5e9` → Workers `081a27dd`(+schema mediumtext 정합). Wave1 admin `30bec99` → Pages `ee2a120c` · noti 온보딩 → Pages `e97a1c4f`. Wave2 admin `bc2bb7a` → Pages `adaf06cc`. QA Wave1·2 GREEN.

## 다음 단계 · 한계 (저순위 후속)

- 집계 엔드포인트(`/credit-ledger/summary`, 문의 상태 카운트) 신설 시 요약 타일 정확 집계.
- billing 패널 영수증을 `/credit-ledger/:id/receipt` 실연동으로 보강(현재 행 기반 fallback).
- 세금계산서(TB_TAX_INVOICE)·PG 빌링키 카드 등록(PG 선정 후)·매니저 초대메일 방식(현재 즉시생성).
- publisher 표준화 4건(컴포넌트 중복 정리)·라이브 2FA/멤버 스모크(Aurora 환경).
