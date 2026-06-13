# 2026-06-12 작업 이력

> **한 줄 요약**: `malgn-noti-mng` 관리앱에 **회원 시스템**(직접 회원가입[개인정보 동의·아이디 중복확인·완료 화면]·로그인/세션·내 정보(/account 프로필·비밀번호 변경)·참여자 목록·맑은오피스 연동[서버 간 upsert·SSO 토큰] 임시 구현)을 풀스택으로 구축하고, 원격 D1(`malgn-noti-project`)에 `member` 테이블(마이그레이션 0002·0003) 적용 후 **Cloudflare Pages 프로덕션 배포**. 프로덕션 회원가입이 500으로 실패 → 원인은 `hashPassword` 의 **PBKDF2 반복수 210,000회가 Pages Functions CPU 한도 초과** → `PBKDF2_ITER` 를 **100,000** 으로 하향해 재배포, signup/login/me/account/members 전부 **200 GREEN** 검증 완료. **(§4)** 이어 **사이트 전체 로그인 게이트(#2)+문서 통합(#1)** 을 프로덕션 배포·검증(비로그인 `/`·`/docs`·`/wbs` 302→/login, `/api/*` 401, 로그인 후 전 페이지·문서 렌더 200). **문서 원시 덤프 누수 차단(#3 핵심)은 미해결** — `@nuxt/content` 가 D1 가 아니라 정적 HTTP 덤프(`/__nuxt_content/docs/sql_dump.txt`)를 런타임에 가져오는 구조라, 해당 경로를 리다이렉트로 막으면 SSR·문서 목록(`/docs`·`/`·`/history`)이 500으로 깨짐을 라이브로 확인하고 차단을 **철회**(렌더 우선). 덤프는 현재도 공개 200 — 후속 D1 전환 필요. **(§5)** 이어 **이슈 게시판**(`/issues` 목록·작성·상세·수정, 커밋 `21bc838`)·**목록 테이블 정렬 fix**(`table-layout:fixed`+컬럼 폭, `4205411`)·**재시드 도구**(`1c21522`)의 누락된 배포 이력을 정합하고, 라이브 `/issues` 가 stale 배포로 여전히 깨져 보이던 문제를 **재배포**로 해결 — 소스는 정상(fix 기커밋·working tree clean)이었고 빌드만 미반영. alias `2463c918`, 프로덕션 fix-CSS `index.Cc80tf4J.css` **200+`table-layout:fixed`** GREEN 검증. **(§6→§7)** 재배포 후에도 동일 리포트 → §6 에선 HTML `Cache-Control` 부재로 **캐시 탓**이라 보고 `no-cache` 미들웨어를 넣었으나(`34c31abb`), 이는 **오진**. **(§7)** Playwright 실브라우저 computed style 실측으로 본문 행 `class="row"` 가 전역 유틸 **`.row{display:flex}`(main.css:1389)** 와 충돌해 `tbody tr=flex`/`td=block` 이 되며 `table-layout:fixed` 컬럼을 무시함을 확정 → `app/pages/issues/index.vue` 본문 행 클래스 `row`→**`issue-row`** 분리로 수정·배포(`b2134bd8`), 헤더·본문 5컬럼 좌표 일치(`ALIGNED:true`)·스크린샷 정상 검증. 교훈: 표 행에 범용 유틸명 금지·레이아웃 버그는 실브라우저로 확정. **(§8)** **이슈 등록/수정 이미지 업로드**(Cloudflare R2 + 본문 마크다운 `![](url)` 첨부) 구현 — R2 버킷 `malgn-noti-mng-files`(FILES 바인딩)·업로드/서빙 API(`/api/uploads`, 인증 게이트·png/jpg/gif/webp·5MB·UUID 키·immutable)·`markdown.ts` 이미지 렌더 추가·`AppIssueForm` 첨부 버튼/드래그/붙여넣기. E2E(curl 69B 라운드트립·쿠키 없으면 401) + 실브라우저(Playwright `.doc-prose img` 로드 `IMAGE_OK:true`) GREEN. alias `b80f7bd2`. typecheck·lint 통과. **(§9)** **이슈 상세(조회) 페이지 디자인 정리** — 투박한 회색 액션바 제거, 수정/삭제를 헤더 우측 상단으로, 상태 변경 select 를 메타 라인에 인라인 통합(상태 라벨 두 줄 깨짐 `white-space:nowrap` 로 해소), 제목/여백 정돈. 실브라우저 검증·alias `2fd403a5`. (부수 발견: markdown `>` blockquote 가 escape 순서로 미파싱 — 별건 후속.) **(§10)** **수정 페이지 라우팅 충돌 수정** — `[id].vue`+`[id]/edit.vue` 공존 시 edit 가 `[id].vue` 자식이 되나 부모에 `<NuxtPage/>` 아웃렛이 없어 `/edit` 가 상세로 렌더되던 문제를, 상세를 `[id]/index.vue` 로 이동(형제 라우트화)해 해결. **+ 마크다운 인용문 버그 수정**(escape 후 `^&gt;` 매칭). 실브라우저 검증(`EDIT_OK`·`QUOTE_OK`)·alias `d7805887`.

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

---

## 5. 이슈 게시판 도입 + 이슈 목록 테이블 정렬 fix 프로덕션 반영(재배포)

**배경**: 관리앱에 정책·이슈·공지·논의를 올리는 **이슈 게시판**(`/issues` 목록·작성·상세·수정)을 추가하고(커밋 `21bc838`), 목록 테이블의 헤더(상태/작성자/작성일)와 본문 셀 어긋남을 `table-layout: fixed` + 컬럼 폭 확정으로 수정(커밋 `4205411`), 문서 변경 배포 시 D1 재시드 도구를 추가(커밋 `1c21522`)했으나, 이 커밋들의 배포 이력이 누락돼 있었음.

**이슈(2026-06-12 후속 리포트)**: 라이브 <https://malgn-noti-mng.pages.dev/issues> 에서 목록이 여전히 깨져 보임 — 헤더는 우측까지 펼쳐지는데 본문 셀은 좌측에 몰림.

**진단**: 정렬 fix(`app/pages/issues/index.vue` `.table { table-layout: fixed }` + `.c-type 84 / .c-status 84 / .c-author 120 / .c-date 140` 컬럼 폭)는 이미 커밋 `4205411`에 존재하고 working tree 도 clean. 즉 **소스는 정상이나 그 빌드가 프로덕션에 반영되지 않은 stale 배포**가 원인. 라이브는 로그인 게이트로 막혀 curl 로 CSS 직접 확인 불가 → 로컬 `pnpm build` 후 컴파일 CSS(`dist/_nuxt/index.Cc80tf4J.css`)에 `table-layout:fixed` 포함을 확인해 소스 정상성 검증.

**배포/검증**(프로덕션 <https://malgn-noti-mng.pages.dev>, `--branch=main`, ASCII commit-message):
- `npx wrangler@4 pages deploy dist --project-name=malgn-noti-mng --branch=main --commit-dirty=true --commit-message "fix: issue list table column alignment"` → 배포 alias `2463c918`.
- 검증: 프로덕션에서 fix 포함 CSS `index.Cc80tf4J.css` 가 **HTTP 200 + `table-layout:fixed`** 로 서빙됨 확인. `/issues` 헤더·본문 컬럼 정렬 복구.

**정합**: 소스 변경 없음(fix 는 `4205411` 에 기커밋, working tree clean) — 이번 작업의 변경분은 본 배포 이력 기록뿐. 라이브 산출물 = 기존 working tree 그대로.

## 산출물 (§5)

- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> — 이슈 목록 정렬 fix 반영. alias `2463c918`.
- **검증**: 프로덕션 fix-CSS `index.Cc80tf4J.css` HTTP 200 + `table-layout:fixed` GREEN.
- **관련 커밋(기존)**: `21bc838`(이슈 게시판)·`4205411`(정렬 fix)·`1c21522`(재시드 도구) — 본 §5 에서 배포·이력 정합.

---

## 6. 재배포 후에도 "정렬 안 됨" 리포트 → 근본원인 = 브라우저 캐시, HTML no-cache 로 재발 차단

**증상**: §5 재배포 후에도 사용자가 `/issues` 목록 정렬이 여전히 깨져 보인다고 리포트.

**진단(프로덕션 실측)**: stale 배포 가설을 버리고 **프로덕션 SSR HTML 을 임시 로그인 세션으로 직접 수신**해 실제 DOM·CSS 를 검증.
- 임시계정 `zz_align_chk` 로 `signup`(필드 `agreedPrivacy:true`) → 세션 쿠키로 `GET /issues` **200**(27KB).
- 렌더 DOM = 정상 5컬럼 테이블: `thead` `c-type/제목/c-status/c-author/c-date` 5×`th`, `tbody tr.row` 5×`td`, 전 셀 동일 스코프 `data-v-51f06334`.
- scoped CSS 가 **HTML 에 인라인**돼 있고 `.table[data-v-51f06334]{table-layout:fixed;width:100%}` + `.c-type/.c-status{width:84px}` `.c-author{120px}` `.c-date{140px}` 전부 포함. specificity `.table[data-v]`(0,2,0) > 전역 `.table`(0,1,0) → fixed 레이아웃이 이김. **즉 라이브 HTML 은 이미 정렬 정상.**
- 응답 헤더에 **`Cache-Control` 부재**, 서비스워커 없음(`/sw.js` 는 게이트로 302) → 사용자 화면은 **브라우저 휴리스틱 캐시의 옛(auto-layout) 문서**가 원인으로 확정.

**조치(재발 차단)**: `server/middleware/no-cache.ts` 신설 — `text/html` 내비게이션 응답에 `Cache-Control: no-cache, must-revalidate` 부여. 해시 immutable 에셋(`/_nuxt/*`)·API(`/api/*`)·콘텐츠 덤프(`/__nuxt_content`)는 제외(에셋 장기 캐시 유지). 빌드·배포(alias `34c31abb`).
- 검증: `/`·`/login`(html) → **`cache-control: no-cache, must-revalidate`**, `/_nuxt/entry.*.css` → **`public, max-age=31536000, immutable`**(불변). 이후 매 방문 서버 재검증 → 배포 직후 최신 HTML 보장.
- 사용자 안내: 이번 1회는 강력 새로고침(⌘+Shift+R) 또는 배포 alias 직접 접속으로 기존 캐시 무효화 필요.

**임시 데이터 정리**: D1 `member` 의 `zz_align_chk`(id 10) 삭제, `zz_%` 0건 확인.

## 산출물 (§6)

- **신규**: `server/middleware/no-cache.ts`(HTML no-cache 미들웨어).
- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> alias `34c31abb`. HTML `no-cache` / 에셋 immutable 헤더 GREEN 검증.
- **결론**: 정렬 fix 는 §5 시점에 이미 라이브 정상. §6 은 캐시로 인한 "옛 화면" 재발을 헤더로 차단.

> ⚠️ **정정(§7)**: §5·§6 의 "라이브 정렬은 정상, 원인은 브라우저 캐시" 결론은 **오진**이었다. `table-layout:fixed` 자체는 적용됐으나 **본문 행이 전역 `.row{display:flex}` 와 충돌해 컬럼을 무시**하고 있었다 — 정적 HTML/CSS 텍스트 검사로는 안 잡히고 실브라우저 computed style 로만 드러났다. no-cache 헤더(§6)는 유효한 개선이지만 정렬 깨짐의 원인은 아니었다. 실제 수정은 §7.

---

## 7. 진짜 원인 — 본문 행 `class="row"` ↔ 전역 `.row{display:flex}` 충돌 (실브라우저 computed style 로 확정)

**전환**: §6 재배포 후에도 동일 리포트. 정적 HTML/CSS 텍스트 검사(인라인 scoped CSS·specificity)로는 "정상"이라 결론이 났으나 화면은 계속 깨짐 → **추론을 버리고 Playwright(channel chrome)로 프로덕션 `/issues` 를 임시 세션으로 실제 렌더**해 computed style·셀 좌표를 실측.

**실측 결과(결정적)**:
- 테이블 computed `table-layout: fixed` ✓, width 1030 ✓.
- `thead th` 좌측 좌표 = 121/205/807/891/1011 (84/602/84/120/140 으로 전폭 정상 분배).
- `tbody td` 좌측 좌표 = 121/196/352/427/497 (67/148/67/62/130 **내용 크기로 좌측에 뭉침**).
- **같은 테이블인데 thead 와 tbody 의 컬럼 모델이 분리** → 원인 후보는 tbody 계열의 `display` 오버라이드.
- 하위 요소 computed `display` 덤프: `thead tr=table-row`·`th=table-cell`(정상) vs **`tbody tr=flex`**·**`td=block`**. → 본문 행이 테이블 행이 아니라 **플렉스 컨테이너**(자식 `td` 는 flex 가 자동 blockify).

**근본원인**: `app/assets/css/main.css:1389` 의 전역 유틸 **`.row { display: flex; align-items: center; gap: 8px }`** 가, 이슈 목록이 `tbody` 행에 붙인 **`class="row"`** 와 클래스명 충돌. 페이지 scoped `.row[data-v]` 는 `cursor`·`hover` 만 정의하고 `display` 를 안 줘서 전역 `display:flex` 가 그대로 적용 → 행이 flex 박스가 되며 `table-layout:fixed` 컬럼을 무시.

**수정**: `app/pages/issues/index.vue` 의 본문 행 클래스 `row` → **`issue-row`** 로 변경(템플릿 + scoped `.issue-row`/`.issue-row:hover td`, 충돌 사유 주석 추가). 전역 `.row` 유틸은 건드리지 않음. 코드베이스 전수 grep 결과 테이블 행에 `class="row"` 를 쓴 곳은 이 페이지뿐(타 페이지 동일 충돌 없음).

**배포/검증**(프로덕션, alias `b2134bd8`):
- Playwright 재렌더 — `tbody tr display = table-row` 복구, 헤더·본문 셀 좌측 좌표 **5컬럼 모두 일치**(121·205·807·891·1011), `ALIGNED: true`, 스크린샷 정상 정렬 육안 확인.
- 검증용 임시계정 `zz_%` 3건(render/disp/verify) 삭제, 0건 확인. 임시 렌더 스크립트 정리.

## 산출물 (§7)

- **수정**: `app/pages/issues/index.vue`(본문 행 `.row`→`.issue-row`, 충돌 주석).
- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> alias `b2134bd8` — 이슈 목록 정렬 **실브라우저 검증 GREEN**.
- **교훈**: scoped-CSS 인라인·specificity 가 "정상"이어도 **전역 유틸 클래스명 충돌(`.row`)** 은 정적 검사로 안 드러난다. 레이아웃 버그는 **실브라우저 computed style** 로 확정할 것. 표 행에 범용 유틸명(`row`/`col`)을 쓰지 말 것.

---

## 8. 이슈 등록/수정 시 이미지 업로드 (Cloudflare R2 + 본문 마크다운 첨부)

**요청/결정**: 이슈 작성·수정 시 이미지 첨부 지원. 저장은 **Cloudflare R2**(추천 채택), 본문엔 마크다운 `![alt](url)` 로 삽입.

**인프라**:
- R2 버킷 **`malgn-noti-mng-files`** 신규 생성. `wrangler.toml` 에 `[[r2_buckets]] binding="FILES"` 추가(D1 `DB` 와 동일하게 Pages 가 wrangler.toml 바인딩을 적용 — 프로덕션 검증으로 확인).

**서버**:
- `server/utils/uploads.ts` — `useFileStore(event)`(R2 `FILES` 바인딩, dev 바인딩 없으면 인메모리 폴백). 화이트리스트 MIME(png/jpg/gif/webp)·5MB 상한 상수.
- `server/api/uploads/index.post.ts` — 세션 필수. `readMultipartFormData` 로 `file` 파트 수신, MIME/크기 검증 후 `<uuid>.<ext>` 키로 R2 `put`, `{ url:'/api/uploads/<key>', name }` 반환. SVG/스크립트 차단.
- `server/api/uploads/[key].get.ts` — 세션 필수. 키 형식 정규식 검증 후 R2 `get` → content-type + `private, max-age=31536000, immutable` 로 서빙. 동일 출처 `<img>` 요청은 세션 쿠키 동반 → 로그인자만 노출.
- `server/middleware/auth.ts` — `PROTECTED_PREFIXES` 에 `/api/uploads` 추가(업로드·서빙 모두 인증 게이트).

**클라이언트**:
- `app/utils/markdown.ts` — 이미지 `![alt](url)` 렌더 추가(링크보다 먼저 처리해 `!` 소비, `safeHref` 로 src 제한 → 내부 `/api/uploads/…`·http(s) 만). `.doc-prose img` 는 기존 스타일(max-width:100%) 재사용.
- `app/components/AppIssueForm.vue` — 본문 에디터에 **이미지 첨부 버튼 + 드래그&드롭 + 붙여넣기**. 업로드 후 커서 위치에 `![name](url)` 삽입(`bodyEl` ref·`setSelectionRange`). 클라이언트 측 MIME/5MB 선검증, 업로드 중 상태·에러 표시. 신규/수정 폼 공용이라 양쪽 모두 적용.

**배포/검증**(프로덕션, alias `b80f7bd2`):
- E2E(curl, 임시세션) — `POST /api/uploads`(1×1 PNG) **200**+url, `GET /api/uploads/<key>`(쿠키) **200** image/png·immutable·69B 라운드트립 일치(R2 영속 확인), 쿠키 없으면 **401**.
- 실브라우저(Playwright) — 이미지 본문 이슈 상세에서 `.doc-prose img` 로드 확인(`naturalWidth=1`·`complete=true`, `IMAGE_OK:true`).
- 정리: 테스트 이슈 1건·임시회원 `zz_%`·R2 테스트 객체 삭제(실데이터 `첫 게시물`만 잔존). `pnpm typecheck`·`lint` 통과.

## 산출물 (§8)

- **신규**: `server/utils/uploads.ts`, `server/api/uploads/index.post.ts`, `server/api/uploads/[key].get.ts`, R2 버킷 `malgn-noti-mng-files`.
- **수정**: `wrangler.toml`(R2 바인딩), `server/middleware/auth.ts`(게이트 prefix), `app/utils/markdown.ts`(이미지 렌더), `app/components/AppIssueForm.vue`(첨부 UI).
- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> alias `b80f7bd2`. 업로드·서빙·렌더 E2E GREEN.
- **알려진 한계**: 이미지는 본문에 삽입만(삭제 시 R2 객체 GC 미구현 — 고아 객체는 후속 정리 잡 필요). 업로드 후 본문에서 마크다운을 지워도 R2 객체는 남음.

---

## 9. 이슈 상세(조회) 페이지 디자인 정리

**요청**: `/issues/[id]` 조회 페이지 디자인 개선("별루").

**문제**: ① 작성자용 액션바가 투박한 **회색 박스**(`.owner-bar`)로 본문과 분리돼 떠 보임. ② 그 안의 "상태" 라벨이 폭 부족으로 **두 줄(상/태)로 깨짐**.

**개선**(`app/pages/issues/[id].vue`, Relay 저밀도·hairline 기조):
- 회색 액션바 제거. **수정/삭제**(아이콘 추가)를 헤더 우측 상단으로 이동(`.head-top` = 배지 줄 ↔ 액션 `space-between`).
- **상태 변경 select** 를 메타 라인(`작성자 · 작성일 · 상태 [▾]`)에 인라인 통합 — 별도 박스 없이 가볍게. `.status-label` 에 `white-space:nowrap` 로 줄바꿈 차단, select 는 컴팩트(`--r-sm`)·hover 보더.
- 제목 26px·자간 정리, 작성자명 강조(`.author`), 본문 상단 여백 확대.
- 검증: 빌드·배포(alias `2fd403a5`) 후 실브라우저(Playwright, 작성자 세션) — 상태 라벨 1줄(높이 20px=lineHeight), 수정/삭제 2개 노출, 스크린샷으로 정렬·간격 육안 확인. `lint`·빌드 통과.

**부수 발견(미수정)**: `app/utils/markdown.ts` 가 `escapeHtml` 을 라인 분해보다 **먼저** 수행 → `>` 가 `&gt;` 로 escape 되어 **blockquote(`> 인용`) 파싱이 안 됨**(원문 그대로 노출). 이슈 본문에서 인용 사용 시에만 발생하는 기존 버그 — 이번 디자인 작업 범위 밖이라 별건으로 남김(escape 순서/블록 감지 분리 리팩터 필요).

## 산출물 (§9)

- **수정**: `app/pages/issues/[id].vue`(상세 헤더/액션/상태 컨트롤 재배치·스타일).
- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> alias `2fd403a5`. 작성자/비작성자 뷰 정상.
- **후속 후보**: markdown blockquote escape 순서 버그 수정.

---

## 10. 이슈 수정 페이지 라우팅 충돌 수정 + 마크다운 인용문 버그 수정

### 10.1 수정 페이지가 상세로 렌더되던 라우팅 충돌

**증상**: `/issues/2/edit` 가 HTTP 200 인데 **수정 폼이 아니라 상세 페이지**를 렌더(폼 없음·`이슈를 찾을 수 없음`도 아님). 실브라우저에서 "Hydration completed but contains mismatches" 경고.

**근본원인**: `pages/issues/[id].vue`(상세)와 `pages/issues/[id]/edit.vue`(수정)가 공존하면 Nuxt 파일 라우터가 `edit` 을 **`[id].vue` 의 자식 라우트**로 만든다. 그런데 부모 `[id].vue` 에 `<NuxtPage/>` 아웃렛이 없어 `/edit` 에서도 자식 대신 **부모(상세)만** 렌더됨. SSR 마커 비교로 `/issues/N/edit` 와 `/issues/N` 둘 다 `head-actions`(상세) 만 나오고 `issue-form`·`이슈 수정` 은 없음을 확정.

**수정**: 상세 페이지를 **`pages/issues/[id]/index.vue`** 로 이동(`git mv`). 이제 `[id]/index.vue`·`[id]/edit.vue` 가 부모 `[id].vue` 없는 **형제 라우트** → `/issues/:id`(index)·`/issues/:id/edit`(edit) 가 아웃렛 없이 각자 렌더. 상세 페이지는 alias import(`~/utils/*`)만 써 경로 이동에도 무파손.

### 10.2 마크다운 인용문(blockquote) 미파싱

**근본원인**: `app/utils/markdown.ts` 가 `escapeHtml(src)` 를 라인 분해보다 먼저 수행 → 줄 시작 `>` 가 `&gt;` 로 escape 되어 blockquote 감지 정규식 `^>` 가 영영 매칭 안 됨(원문 `> 인용` 그대로 노출, §9 에서 발견).

**수정**: blockquote 감지·연속·prefix 제거 정규식을 escape 후 형태인 **`^&gt;`** 로 변경(3곳). 캡처된 본문은 이미 escape 상태라 `renderInline` 그대로 적용 — 기존 "선 escape 후 서식" 설계와 일관.

**검증/배포**(프로덕션 alias `d7805887`):
- 실브라우저(Playwright, 작성자 세션, 신규 이슈) — `/issues/N/edit` 에 `.issue-form` 렌더·제목 "이슈 수정"·필드 프리필(`EDIT_OK:true`). 상세에서 `.doc-prose blockquote` 텍스트 "인용문이 이제 보이나요?" 렌더·리터럴 `>` 소멸(`QUOTE_OK:true`).
- `lint`·빌드 통과. 테스트 이슈 3건·임시회원 `zz_%` 3건 정리(실데이터 `첫 게시물`만 잔존).

## 산출물 (§10)

- **이동**: `app/pages/issues/[id].vue` → `app/pages/issues/[id]/index.vue`(라우팅 충돌 해소).
- **수정**: `app/utils/markdown.ts`(blockquote `&gt;` 매칭).
- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> alias `d7805887`. 수정 페이지·인용문 GREEN.

---

## 11. 이슈 목록에서 본문 미리보기 제거

**요청**: 목록 행에 제목 아래로 노출되던 본문 미리보기(`it.preview`) 삭제 — 이미지 첨부 시 마크다운 원문(`![스크린샷 …](/api/uploads/…)`)이 그대로 보여 지저분.

**수정**: `app/pages/issues/index.vue` 에서 `.row-preview` 스팬 + 미사용 CSS 제거(제목만 표시). API 의 `preview` 필드는 그대로 두되 미사용(추후 정리 가능).

**검증/배포**(alias `7d859381`): 프로덕션 목록 SSR 에 `row-preview` 0개·`row-title` 유지. `lint`·빌드 통과.

## 산출물 (§11)

- **수정**: `app/pages/issues/index.vue`(목록 본문 미리보기 제거).
- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> alias `7d859381`.

---

## 12. 이슈 목록 필터 레이아웃 — 상태 필터 축소(좌상단)·검색 우측 유지

**증상**: `/issues` 상태 필터(`모든 상태` select)가 **전체 폭으로 늘어나** 레이아웃을 차지(§7 `.row` 충돌과 동일 패턴).

**근본원인**: 전역 `app/assets/css/main.css:555` **`.input,.select,.textarea{width:100%}`** 와 페이지의 `class="select"` 충돌. 페이지 scoped `.select` 가 width 를 안 줘서 전역 `width:100%` 가 적용됨.

**수정**(`app/pages/issues/index.vue`): scoped `.select{width:auto}` 로 내용 폭만 차지하게 override(전역 화살표·높이 등 나머지 스타일은 유지). 템플릿 순서를 **상태 select → 분류 탭(seg) → 검색(search)** 으로 재배치 — 상태는 좌상단, 검색은 `margin-left:auto` 로 우측 끝 유지.

**검증/배포**(alias `be6fee5d`): 실브라우저 — select 폭 89px·필터 좌측 끝(left 0)·검색 우측 끝(gap 0)·동일 행, 스크린샷 확인. `lint`·빌드 통과.

## 산출물 (§12)

- **수정**: `app/pages/issues/index.vue`(필터 레이아웃·`.select` 폭).
- **배포**: 프로덕션 <https://malgn-noti-mng.pages.dev> alias `be6fee5d`.

---

## 13. 작업 이력/문서 페이지 "문서를 찾을 수 없습니다" — 콘텐츠 D1 재시드 누락 + `gen-content-seed` `;;` 버그 수정

**증상**: `/history/history.20260611`(→ `/docs/history/history.20260611`) 등 문서 상세가 "문서를 찾을 수 없습니다 / 경로: …" 로 빈다.

**근본원인(2중)**:
1. 이 앱 @nuxt/content(v3, Cloudflare)는 **콘텐츠 D1 `_content_docs` 를 런타임 조회**하고, docs 변경 배포 시 **빌드 체크섬이 바뀌면** 런타임이 덤프로 재시드를 시도하나 그게 불안정 → **`docs/` 변경 배포에서는 원격 콘텐츠 D1 을 미리 시드해야 한다**(이미 문서화된 필수 절차, `scripts/gen-content-seed.mjs` 주석). **오늘 §1~§12 동안 history 를 여러 번 고쳐 배포하면서 이 재시드를 매번 누락** → 프로덕션 콘텐츠 D1 이 stale·체크섬 불일치 → 문서 조회 실패.
2. 재시드 생성기 `scripts/gen-content-seed.mjs` 가 각 문이 이미 `;` 로 끝나는데 join 에서 `;` 를 또 붙여 **`;;`**(빈 statement) 를 만들어 `wrangler d1 execute` 가 **"SQL code did not contain a statement"** 로 실패 → 이 도구는 **한 번도 실제 적용된 적이 없었음**.

**수정/조치**:
- `scripts/gen-content-seed.mjs` — 각 문에서 후행 `;` 를 떼고(`replace(/;+\s*$/,'')`) join 하도록 수정(`;;` 제거).
- 절차 적용: `pnpm build`(현재 docs 전체 덤프) → 배포(alias `cc6424fb`) → `pnpm content:seed:gen`(dist/content-seed.sql) → `wrangler d1 execute malgn-noti-project --remote --file=dist/content-seed.sql`(56문, `_content_docs` DROP+재생성·`_content_info` 체크섬을 배포 빌드값으로 갱신, 161행 기록).
- **검증**(실브라우저, 로그인): `/docs/history/history.20260611` h1 "2026-06-11 작업 이력"·본문 13,953자, `/docs/history/history.20260612` 18,437자, `/history`·`/docs` 목록 정상(미발견 alert 없음).

**운영 규칙(중요)**: **docs/ 를 바꾼 배포는 반드시 build → deploy → `content:seed:gen` → `d1 execute content-seed.sql` 까지** 한 흐름으로 수행한다(배포 빌드와 콘텐츠 D1 체크섬을 일치시킬 것). 이 §13 기록 자체도 docs 변경이므로 동일 절차로 최종 재시드한다.

## 산출물 (§13)

- **수정**: `scripts/gen-content-seed.mjs`(`;;` 빈 statement 버그).
- **운영**: 원격 콘텐츠 D1 `_content_docs`/`_content_info` 재시드(현재 빌드 체크섬). 최종 alias 는 §13 재시드 빌드 기준.
- **문서화**: docs 변경 배포 시 콘텐츠 D1 재시드 필수 절차 재확인(§4 한계의 실무 해소).
