# 2026-06-09 — SMS 실발송·iPIN 검증 + 관리자단 고객사 페이지 풀스택 실연동(배포)

**한 줄 요약**: ① `malgn-noti-api`의 **문자(SMS) 서비스 실작동 확인** — 010-3283-5673으로 NHN 경유 실발송 성공(실제 messageId·성공코드 0). **iPIN(NICE 본인확인)은 real 불가** — 토큰 발급 단계에서 `1007 허용되지 않은 IP 접근`(Cloudflare egress IP 미등록)으로 mock만 동작. ② **관리자단 고객사 페이지(`/customers` 목록·상세)를 정적 목업 → 풀스택 실연동**으로 개발: api에 운영자용 `/ops/companies` 엔드포인트 신설(교차-테넌트, 공유 토큰 게이트) + admin 앱 Nitro 서버 프록시(토큰 서버측 주입) + 페이지 실데이터화. 워커·Pages 양쪽 프로덕션 배포 + 실 Aurora 데이터 전 구간 검증. **(같은 날 추가 §7)** 동그라미 이니셜에서 `(주)`/`주식회사` 접두어 제거 + **고객사 등록**(운영자가 회사+소유자 계정 생성, `POST /ops/companies`) 추가·배포.

---

## 1. 서비스 검증 (malgn-noti-api) — SMS 실작동 / iPIN mock

- **검증 방식**: 풀 발송 플로우(인증·크레딧) 대신 **임시 진단 라우트**(`src/routes/diag.ts`)로 NHN 어댑터를 직접 호출 → 테스트 후 라우트 제거·재배포(흔적 없음, `/diag` 404 확인).
- **SMS = 실작동 ✅**: `sendSms(creds, …, mockMode=false)` 결과 `ok:true`, `nhnRequestId` 실값(예: `20260609122600DC5l6JTQUL0`), perRecipient `code:"0"` — NHN이 실제 수락. 발신 16663412 → 수신 010-3283-5673 실문자 도착 확인(사용자 확인).
- **iPIN(NICE) = real 불가 ❌**: 강제 real 모드로 `requestToken` 호출 시 `NICE token failed: 1007 허용되지 않은 IP 접근`. Cloudflare Workers egress IP가 NICE 콘솔 화이트리스트에 없어 토큰 발급(첫 관문)부터 실패 → 인증창 URL도 못 받음. 현재 `NICE_MOCK`/자격 미구성으로 mock만 동작.
- **레포 이상 발견·정정**: 테스트 중 `malgn-noti-api`의 `src/routes/me.ts`가 삭제되고 내용이 `src/routes/1.ts`로 복사돼 있어 빌드 깨짐(제 작업 아님). `me.ts`를 커밋본(HEAD)에서 복원 + `1.ts` 삭제로 정상화(둘 다 커밋 안 함 — 작업 범위 외).

## 2. 백엔드 신설 (malgn-noti-api) — 운영자용 `/ops/companies`

- 관리자단에는 **운영자 인증 도메인이 없고** api의 JWT는 테넌트(회사) 스코프라 **교차-테넌트 고객사 목록 조회 불가** → 별도 `/ops` 네임스페이스 신설(`src/routes/ops.ts`).
  - `GET /ops/companies` — 분류(corp/sole/personal)·승인상태(pending/reviewing/approved/rejected)·상태(active/disabled/all) 필터 + 회사명·사업자번호 검색(`q`) + 페이징(`page`/`size`) + 페이지 회사들의 계정 수 집계(`TB_USER` group by).
  - `GET /ops/companies/:id` — 회사 + 계정(`TB_USER`) + 계약(`TB_CONTRACT`).
  - `PATCH /ops/companies/:id` — `status`/`approvalState`(+`rejectedReason`) 변경.
- **인증**: 운영자 인증 도메인 부재로 **과도기 공유 운영자 토큰**(`X-Ops-Token` = 워커 시크릿 `OPS_TOKEN`) 게이트 — 교차-테넌트 PII(사업자번호·이메일·전화) 무인증 노출 방지. TODO: 운영자 계정/JWT 도입 시 미들웨어로 교체.
- DB는 기존 `getDb`(Hyperdrive→Aurora MySQL + Drizzle) 그대로. `app.route('/ops', ops)` 등록(로컬 전용 `/admin` 게이트 앞).
- 배포: `wrangler secret put OPS_TOKEN` + `wrangler deploy`. 라이브 검증 — 실 Aurora 고객사 5건 반환, 토큰 없으면 403.

## 3. 프론트 실연동 (malgn-noti-admin) — 고객사 목록·상세

- **Nitro 서버 프록시**(`server/api/admin/companies*` + `server/utils/ops.ts`): 브라우저 → admin Nitro(`/api/admin/*`) → 워커(`/ops/*`). 운영자 토큰은 **서버측 `runtimeConfig`에서만** 읽어 주입(브라우저 비노출). `nuxt.config.ts`에 `opsApiBase`(기본값=워커 URL)/`opsToken`(`NUXT_OPS_TOKEN`) 추가. `types/company.ts` 도메인 타입.
- **목록(`app/pages/customers/index.vue`)**: 하드코딩 목업 → `useFetch('/api/admin/companies')` 실데이터. 분류·승인상태·상태 필터 + 검색 + **서버 페이징**(`AppPagination` `v-model:page`/`page-size`) + 일괄 이용정지/재개(PATCH) + 현재 페이지 **CSV 내보내기**. 코드/라벨 매핑(분류·승인·상태·크레딧·날짜·CID).
- **상세(`app/pages/customers/[id].vue`)**: 기본정보(사업자번호·대표·업태/종목·주소·연락처·청구이메일·광고수신·가입일시)·KPI(계정·승인·크레딧·계약·가입일)·계정 테이블·계약 테이블 실데이터 + **승인/반려(사유 모달)/이용정지·재개** 액션(PATCH).
- 기존 목업의 데코 차트·메모·활동 타임라인(백킹 데이터 없음)은 상세에서 제거하고 실데이터 섹션으로 재구성.

## 4. 배포·검증 (CLAUDE.md §7.1 Pages 절차)

- **워커(api)**: 이미 배포(§2). `/ops/*` 라이브.
- **Pages(admin)**: `wrangler pages secret put NUXT_OPS_TOKEN --project-name=malgn-noti-admin`(production) → `pnpm build`(`TMPDIR=/tmp/mtmp`) → `npx wrangler@4 pages deploy dist --project-name=malgn-noti-admin --branch=main --commit-dirty=true --commit-message "feat(customers): real-data customers list/detail via ops API"`. alias `4ac6f26e.malgn-noti-admin.pages.dev`.
- **라이브 검증**(프로덕션 <https://malgn-noti-admin.pages.dev>): `/customers` SSR 실데이터 렌더(맑은소프트 등), `/api/admin/companies` 목록·`/api/admin/companies/:id` 상세 200 실데이터(Pages 시크릿→워커→Aurora), PATCH 쓰기 왕복(테스트사 정지→재개, 원복). 초기 1회 `/api` 404는 엣지 전파 지연 — 재확인 시 전부 200.

## 5. 산출물

- `malgn-noti-api` 커밋 1건 + `main` 푸시 — `feat(ops): 운영자 콘솔용 고객사 백오피스 엔드포인트 신설`(`src/routes/ops.ts`, `src/index.ts`만 스테이징 — 기존 미커밋 변경 schema/errors/auth/migration 0006은 제외).
- `malgn-noti-admin` 커밋 1건 + `main` 푸시 — `feat(customers): 고객사 목록·상세 실데이터 연동 (정적 목업 → 풀스택)`(customers 2페이지·`server/`·`types/`·`nuxt.config.ts`).
- 시크릿: 워커 `OPS_TOKEN` + Pages `NUXT_OPS_TOKEN`(동일 값) — 레포 비저장(`.env` gitignored).
- Cloudflare 배포: api 워커 + admin Pages alias `4ac6f26e`.

## 6. 다음 단계 / 알려진 한계

- **운영자 인증**: 현재 공유 토큰(`OPS_TOKEN`)은 과도기. 운영자 계정/JWT·RBAC·2FA·감사 로그(admin CLAUDE.md §4) 도입 시 `/ops` 게이트를 정식 미들웨어로 교체.
- **iPIN real 활성화**: NICE 콘솔에 Cloudflare egress IP 대역 등록(또는 IP 검사 OFF) → `NICE_MOCK` 제거 → 재검증 필요.
- 가입일 범위 필터·계정 권한/채널 등 상세 부가 기능은 백엔드 스키마 확장 시 추가.
- 고객사 등록 시 생성한 임시 비밀번호의 안내(이메일 발송)·강제 변경 유도는 추후. soft-delete된 회사의 owner loginid는 `TB_USER`에 잔존(재사용 불가).

## 7. 추가 작업 (같은 날) — 동그라미 이니셜 정리 + 고객사 등록

- **이니셜 정리(`customers/index.vue`)**: 동그라미 아바타가 `(주)맑은소프트` → `(` 로 표시되던 문제. `avatarChar()` 헬퍼 — 선행 `(주)`·`㈜`·`주식회사` 접두어 제거 후 첫 글자(`맑`). Pages alias `c288abc6`.
- **고객사 등록(운영자 생성 플로우 신설)**: 당초 "미구현"으로 두었던 등록 기능을 추가.
  - api **`POST /ops/companies`** — 회사(name·companyType·bizNo·ceoName·approvalState) + **소유자 계정**(loginid·password·name·email·phone) 동시 생성. `loginid` 전역 중복 차단(409), 비밀번호 PBKDF2 해싱(`hashPassword` 재사용), 운영자 생성은 기본 `approved`. (회사는 로그인 계정이 있어야 쓸 수 있어 가입 플로우처럼 owner 동반 생성.)
  - admin: 헤더 **'고객사 등록' 버튼 + 모달**(회사 정보 + 소유자 계정) → `server/api/admin/companies.post.ts` 프록시. 필수값(회사명·아이디 3자+·비번 8자+) 검증, 등록 후 목록 새로고침.
  - 워커 + Pages(alias `1667b405`) 배포. 라이브 검증: 등록 성공(회사+계정 생성), 중복 아이디 409, 임시 테스트 회사는 soft-delete로 정리(active 총계 5건 복귀).
- 커밋: api `560978c`, admin `c9ed709`(이니셜)·`7f67285`(등록).
