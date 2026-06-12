# 2026-06-12 작업 이력

> **한 줄 요약**: `malgn-noti-mng` 관리앱에 **회원 시스템**(직접 회원가입[개인정보 동의·아이디 중복확인·완료 화면]·로그인/세션·내 정보(/account 프로필·비밀번호 변경)·참여자 목록·맑은오피스 연동[서버 간 upsert·SSO 토큰] 임시 구현)을 풀스택으로 구축하고, 원격 D1(`malgn-noti-project`)에 `member` 테이블(마이그레이션 0002·0003) 적용 후 **Cloudflare Pages 프로덕션 배포**. 프로덕션 회원가입이 500으로 실패 → 원인은 `hashPassword` 의 **PBKDF2 반복수 210,000회가 Pages Functions CPU 한도 초과** → `PBKDF2_ITER` 를 **100,000** 으로 하향해 재배포, signup/login/me/account/members 전부 **200 GREEN** 검증 완료.

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
- **기획 정본**: `docs/pages/MEMBER.md` 신규.

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

- **신규 코드**: `app/composables/useAuth.ts`, `app/middleware/auth.ts`, `app/plugins/auth.ts`, `app/pages/{login.vue,signup/index.vue,signup/complete.vue,account.vue,members.vue}`, `app/utils/extractError.ts`, `server/api/auth/{signup,login,logout,me,check-id,sso}`, `server/api/account/{index.patch,password.post}`, `server/api/members.get.ts`, `server/api/integration/office/upsert.post.ts`, `server/utils/{auth,members}.ts`, `server/db/migrations/{0002,0003}*` + meta, `docs/pages/MEMBER.md`.
- **수정**: `app/layouts/default.vue`, `server/db/schema.ts`, `server/db/migrations/meta/_journal.json`.
- **D1**: `malgn-noti-project` `member` 테이블 적용(원격).
- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> (alias `9ceaf05f`). signup/login/me/account/members 모두 HTTP 200.
- **커밋**: `0b4da66` (origin/main push).

## 다음 단계 / 알려진 한계

- 맑은오피스 연동(upsert·SSO)은 **임시 구현** — 실제 서명 방식·필드 매핑은 맑은오피스 스펙 확정 후 조정 필요(`server/utils/auth.ts` 주석 참조).
- PBKDF2 100,000 회는 Pages Functions CPU 한도 내 안전값. 추후 한도 여유가 확인되면 상향 검토 가능(verifyPassword 가 iter 를 해시에서 읽으므로 기존 회원 무영향).
- 권한/역할 세분화는 미구현 — 현재 참여자 목록은 단순 조회 수준.
