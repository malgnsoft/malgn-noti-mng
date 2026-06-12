# 2026-06-12 작업 이력

> **한 줄 요약**: `malgn-noti-mng` 관리앱에 **회원 시스템**(직접 회원가입[개인정보 동의·아이디 중복확인·완료 화면]·로그인/세션·내 정보(/account 프로필·비밀번호 변경)·참여자 목록·맑은오피스 연동[서버 간 upsert·SSO 토큰] 임시 구현)을 풀스택으로 구축하고, 원격 D1(`malgn-noti-project`)에 `member` 테이블(마이그레이션 0002·0003) 적용 후 **Cloudflare Pages 프로덕션 배포**. 프로덕션 회원가입이 500으로 실패 → 원인은 `hashPassword` 의 **PBKDF2 반복수 210,000회가 Pages Functions CPU 한도 초과** → `PBKDF2_ITER` 를 **100,000** 으로 하향해 재배포, signup/login/me/account/members 전부 **200 GREEN** 검증 완료. **(§4)** 이어 **사이트 전체 로그인 게이트(#2)+문서 통합(#1)** 을 프로덕션 배포·검증(비로그인 `/`·`/docs`·`/wbs` 302→/login, `/api/*` 401, 로그인 후 전 페이지·문서 렌더 200). **문서 원시 덤프 누수 차단(#3 핵심)은 미해결** — `@nuxt/content` 가 D1 가 아니라 정적 HTTP 덤프(`/__nuxt_content/docs/sql_dump.txt`)를 런타임에 가져오는 구조라, 해당 경로를 리다이렉트로 막으면 SSR·문서 목록(`/docs`·`/`·`/history`)이 500으로 깨짐을 라이브로 확인하고 차단을 **철회**(렌더 우선). 덤프는 현재도 공개 200 — 후속 D1 전환 필요.

---

## 1. 결정 — 회원 시스템 도입 + PBKDF2 CPU 한도 대응

**결정**: 관리앱(`malgn-noti-mng`)에 자체 회원 시스템을 둔다. 직접 회원가입(개인정보 동의·아이디 중복확인·완료 화면), 로그인/세션, 내 정보(프로필·비밀번호 변경), 참여자 목록, 그리고 맑은오피스와의 연동(서버 간 프로비저닝 upsert + SSO 핸드오프 토큰)을 임시 구현으로 포함.

**결정(CPU 한도)**: 프로덕션 signup 500의 단일 원인은 비밀번호 해시의 PBKDF2 반복수(210,000회)가 Cloudflare Pages Functions CPU 한도를 초과한 것. `PBKDF2_ITER` 을 **100,000** 으로 하향. `verifyPassword` 는 저장 해시에 박힌 iter 값을 읽어 검증하므로 하위호환 문제 없고, 프로덕션에 회원 레코드가 없어 마이그레이션 우려도 없음.

## 2. 코드 — 회원 시스템 풀스택

- **서버 유틸**: `server/utils/auth.ts`(PBKDF2 해시/검증·HMAC 서명 HttpOnly 세션 쿠키·맑은오피스 공유 시크릿 검증·SSO 토큰 검증·안전 리다이렉트), `server/utils/members.ts`(회원 조회/생성/수정 D1 헬퍼).
- **API**: `server/api/auth/`(signup·login·logout·me·check-id·sso), `server/api/account/`(프로필 PATCH·비밀번호 변경 POST), `server/api/members.get.ts`(참여자 목록), `server/api/integration/office/upsert.post.ts`(서버 간 회원 upsert 프로비저닝).
- **클라이언트**: `app/pages/login.vue`·`app/pages/signup/{index,complete}.vue`·`app/pages/account.vue`·`app/pages/members.vue`, `app/composables/useAuth.ts`, `app/middleware/auth.ts`(인증 가드), `app/plugins/auth.ts`(초기 세션 로드), `app/utils/extractError.ts`(에러 메시지 추출), `app/layouts/default.vue`(로그인 상태 GNB 반영).
- **DB**: `server/db/schema.ts` 에 `member` 정의 추가, 마이그레이션 `0002`·`0003`(+meta 스냅샷·`_journal.json`).
- **PBKDF2 수정**: `server/utils/auth.ts` `PBKDF2_ITER` 210,000 → **100,000**(주석 갱신). `pnpm typecheck`·`pnpm lint` 통과.
- **기획 정본**: 회원 시스템 기획은 `docs/PROJECT_MANAGEMENT_BLUEPRINT.md`(§5.6·§6·§7·§7.1)에 통합(2026-06-12 — 구 `docs/pages/MEMBER.md`를 흡수·삭제).

## 3. 배포 — D1 적용 + Cloudflare Pages 프로덕션

- **D1**: 원격 `malgn-noti-project` 에 `member` 테이블(14컬럼 + 유니크 인덱스 2개) 직접 execute 로 적용 완료(이 레포는 `d1_migrations` 추적을 쓰지 않음 — 기존 board/wbs와 동일한 직접 execute 방식. `pnpm db:apply` 는 0000 CREATE 충돌로 사용 금지).
- **시크릿**: `NUXT_SESSION_SECRET`·`OFFICE_SHARED_SECRET`(wrangler pages secret, production) 설정 완료.
- **빌드/배포**: `pnpm build`(Nitro cloudflare-pages → dist) → `npx wrangler@4 pages deploy dist --project-name=malgn-noti-mng --branch=main --commit-dirty=true --commit-message "Fix signup PBKDF2 cpu limit"`.
  - 프로덕션 URL: <https://malgn-noti-mng.pages.dev>
  - 이번 배포 alias: <https://9ceaf05f.malgn-noti-mng.pages.dev>
- **검증**(프로덕션, throwaway 계정 `zz_deploytest`):
  - `POST /api/auth/signup` → **200 + Set-Cookie(mng_session)**
  - `POST /api/auth/login` → 200, 쿠키로 `GET /api/auth/me` → 회원 data 200, `GET /account` → 200, `GET /api/members` → 200.
  - 최종 적용 iter: **100,000** (1차 시도에서 바로 GREEN — 추가 하향 불필요).
  - **테스트 데이터 정리**: `member` 에 `zz_deploytest` 1건만 존재 확인 후 삭제, 테이블 0건 확인(이전 실패 probe 계정들은 저장 전 단계에서 죽어 잔여 없음).
- **정합**: 배포는 working tree 기준. 배포 후 회원 시스템 작업 범위 파일만 stage 하여 커밋(`0b4da66`) → origin/main push 로 라이브 ↔ main 일치.

## 산출물

- **신규 코드**: `app/composables/useAuth.ts`, `app/middleware/auth.ts`, `app/plugins/auth.ts`, `app/pages/{login.vue,signup/index.vue,signup/complete.vue,account.vue,members.vue}`, `app/utils/extractError.ts`, `server/api/auth/{signup,login,logout,me,check-id,sso}`, `server/api/account/{index.patch,password.post}`, `server/api/members.get.ts`, `server/api/integration/office/upsert.post.ts`, `server/utils/{auth,members}.ts`, `server/db/migrations/{0002,0003}*` + meta. (회원 기획 정본은 `docs/PROJECT_MANAGEMENT_BLUEPRINT.md`에 통합.)
- **수정**: `app/layouts/default.vue`, `server/db/schema.ts`, `server/db/migrations/meta/_journal.json`.
- **D1**: `malgn-noti-project` `member` 테이블 적용(원격).
- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> (alias `9ceaf05f`). signup/login/me/account/members 모두 HTTP 200.
- **커밋**: `0b4da66` (origin/main push).

## 다음 단계 / 알려진 한계

- 맑은오피스 연동(upsert·SSO)은 **임시 구현** — 실제 서명 방식·필드 매핑은 맑은오피스 스펙 확정 후 조정 필요(`server/utils/auth.ts` 주석 참조).
- PBKDF2 100,000 회는 Pages Functions CPU 한도 내 안전값. 추후 한도 여유가 확인되면 상향 검토 가능(verifyPassword 가 iter 를 해시에서 읽으므로 기존 회원 무영향).
- 권한/역할 세분화는 미구현 — 현재 참여자 목록은 단순 조회 수준.

---

## 4. 배포 — 사이트 전체 로그인 게이트(#2) + 문서 통합(#1) 프로덕션 적용, 덤프 누수 차단(#3) 미해결

**배경**: #2(전역 인증 게이트)·#1(문서 통합)이 working tree 에 준비됨. 게이트는 **프리렌더를 끄고 전 페이지 SSR** 로 전환해 매 요청이 워커(전역 미들웨어)를 거치게 한 방식. #3 의 핵심 요구는 비로그인자가 문서 원시 덤프(`/__nuxt_content/docs/sql_dump.txt`·`/dump.docs.sql`)를 받지 못하게 막는 것.

**코드(working tree)**:
- `app/middleware/01.require-auth.global.ts`(전역 라우트 게이트 — `/login`·`/signup` 외 전부 보호, 비로그인 시 `/login?redirect=` 로 이동), 구 `app/middleware/auth.ts` 삭제.
- `server/middleware/auth.ts`(데이터 API 게이트 — `/api/wbs`·`/api/members`·`/api/account`·`/api/board` 401).
- `app/pages/{account,members}.vue` 의 페이지 단위 `definePageMeta({ middleware:'auth' })` 제거(전역 게이트로 일원화).
- `nuxt.config.ts` 프리렌더 비활성(`prerender.routes: []`, 문서 라우트 열거 로직 삭제) — 정적 HTML 우회 노출 방지.
- 문서 통합(#1): `docs/PROJECT_MANAGEMENT_BLUEPRINT.md` 갱신 + `docs/pages/MEMBER.md` 삭제(블루프린트로 흡수).

**배포/검증**(프로덕션 <https://malgn-noti-mng.pages.dev>, `--branch=main`, ASCII commit-message):
- 검증표 — 비로그인: `/`·`/docs`·`/wbs`·`/history` → **302→/login**, `/login` **200**, `/api/wbs`·`/api/members` **401**. 임시회원 로그인 후: `/`·`/docs`·`/wbs`·`/history`·`/docs/wbs` **200**(문서 목록 28행 SSR 렌더·대시보드 정상), `/api/wbs`·`/api/members` **200**.
- 검증용 임시회원은 `signup` 으로 생성 후 D1 에서 `login_id LIKE 'zz_%'` 2건 삭제(0건 확인).

**#3 덤프 누수 차단 — 미해결(차단 철회)**:
- 1차로 `nuxt.config` `routeRules` 로 `/__nuxt_content/**`·`/dump.docs.sql` → `/login` 302 리다이렉트(빌드시 `dist/_redirects` 반영)하여 배포. 비로그인 덤프 2경로 **302** 차단은 성공.
- **그러나** 로그인 상태에서 `/`·`/docs`·`/history` 가 **500**(`(all.value ?? []).filter is not a function`, 워커 tail 로 확인). 원인: **이 앱의 `@nuxt/content` 는 D1 백엔드가 아니다** — 원격 D1 `malgn-noti-project` 에 `_content_docs` 류 테이블이 없고(테이블은 `member`·`d1_migrations`·`sqlite_sequence` 뿐), 콘텐츠는 gzip+base64 덤프(`/__nuxt_content/docs/sql_dump.txt`)를 **런타임(SSR·클라이언트 내비)에서 HTTP 로 가져와** WASM SQLite 에 적재하는 구조. 그 경로를 리다이렉트로 막으면 콘텐츠 적재가 깨져 목록 쿼리(`.all()`)가 비배열을 반환 → 500.
- **조치**: 렌더 보존을 우선해 `routeRules` 차단을 **철회**하고 재빌드·재배포. 철회 후 로그인 상태 전 페이지·문서 렌더 200 복구 확인. 현재 덤프 2경로는 다시 **공개 200**(누수 미차단).
- **권고(후속)**: 워커-게이트(`_routes.json` include)는 SSR 내부 덤프 fetch 에 세션쿠키가 없어 동일하게 SSR 을 깨므로 부적합. 근본 해법은 **콘텐츠를 D1 백엔드로 전환**(`content.database = { type:'d1', bindingName:'DB' }` + `_content_docs` 적재) 후 정적 덤프 제거/차단. 이는 콘텐츠 저장 구조 변경(런타임 D1 적재 한도·콜드스타트 리스크)이라 #1/#2 구현 담당과 협의해 별도 적용 권장.

**정합**: 이번 배포의 라이브 산출물 = working tree(#1+#2, `routeRules` 미포함) 그대로. main↔live 일치를 위해 해당 범위 커밋.

## 산출물 (§4)

- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> — 게이트·문서 통합 적용. 마지막(렌더 복구) alias `a40cefb0`.
- **검증**: 비로그인 게이트 302/401 GREEN, 로그인 후 페이지·문서 렌더 200 GREEN. 덤프 누수 차단은 **미해결(공개 200)** — 후속 D1 전환 필요.
- **임시 데이터 정리**: D1 `member` 의 `zz_%` 검증회원 2건 삭제(0건 확인).
