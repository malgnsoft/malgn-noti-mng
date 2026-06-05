# 2026-06-05 — malgn-noti-mng 관리 레포 신설: 문서 집약 + Nuxt 문서/이력 브라우저 앱 + Cloudflare 배포

**한 줄 요약**: 맑은노티 프로젝트를 관리할 신규 레포 `malgn-noti-mng`를 GitHub에 연결하고, `malgn-noti`의 `doc/` 트리(공통 참조·도메인 정본·작업 이력)를 집약한 뒤, malgn-noti와 **동일 스택**(Nuxt 3 + Tailwind v4 + Nuxt UI v3) + `@nuxt/content` 기반 **문서/이력 브라우저 앱**으로 구현해 Cloudflare Pages에 정적 배포(<https://malgn-noti-mng.pages.dev>). 앞으로의 작업 이력은 이 레포에서 작성·갱신한다.

---

## 1. 레포 연결 + 문서 집약

- 빈 `malgn-noti-mng` 폴더를 `git init`(main) 후 원격 <https://github.com/malgnsoft/malgn-noti-mng.git> 연결, 첫 커밋·푸시.
- `malgn-noti/doc/` 트리 전체(24개 md)를 `malgn-noti-mng/doc/`로 복사 — 공통 참조(DESIGN/FRONTEND/STACK/WBS), 도메인 정본(MEMBERSHIP/NICE_AUTH/PAGES/pages/*), 일자별 작업 이력(history/* 14개 + README).
- 세션 중 생성된 `.claude/` 로컬 권한 설정은 문서 레포에 부적합 → `.gitignore` 처리.

## 2. CLAUDE.md 병합·현행화 (양쪽 동일 유지)

- `malgn-noti`의 CLAUDE.md를 기본으로, 관리 레포 설명을 **§11**로 통합. 두 레포의 CLAUDE.md를 **항상 동일**하게 유지하는 규칙 명시.
- **작업 이력 작성처 변경(§7.1·§11)**: 앞으로 history는 `malgn-noti`가 아니라 **`malgn-noti-mng/doc/history/`에서 작성·갱신**하고, 작성 후 이 레포에 커밋·푸시한다. 이에 따라 `malgn-noti/doc/history/` 폴더와 15개 파일은 삭제(사본은 본 레포에 보존).

## 3. Nuxt 문서/이력 브라우저 앱 스캐폴딩

- **스택**: malgn-noti 미러링 — Nuxt 3(compat v4) + Nuxt UI v3(Reka UI + Tailwind v4) + Pinia + ESLint(@nuxt/eslint), pnpm. `@nuxtjs/tailwindcss` 미설치 원칙 동일.
- **+ @nuxt/content v3**: `doc/` 마크다운 렌더링. `content.config.ts`에서 소스 `cwd`를 `doc/`로 매핑(단일 `docs` 컬렉션). SQLite 어댑터 `better-sqlite3`는 `package.json`의 `pnpm.onlyBuiltDependencies`로 네이티브 빌드 허용.
- **디자인 시스템 이식**: `app/assets/css/main.css`(Relay-inspired v1.0, 1911줄) + `app/app.config.ts`(zinc)를 malgn-noti에서 그대로 복사 → 형제 앱과 시각 일관성.
- **화면**: `/`(대시보드 — 문서 바로가기 + 최근 이력), `/docs`(문서 목록) + `/docs/[...slug]`(마크다운 렌더, ContentRenderer), `/history`(작업 이력 타임라인). 공용 훅 `composables/useDocs.ts`(history 판별·날짜 포맷).
- 로컬 검증: 콘텐츠 24개 파싱, `/`·`/docs`·`/history` 200, `/docs/design` 등 렌더 확인, `pnpm lint` 통과.
- 환경 노트: 이 샌드박스에서 macOS 기본 `$TMPDIR`(`/var/folders/...`)가 길어 Nuxt vite-node Unix 소켓이 104자 제한 초과 → `connect EINVAL` 500. `TMPDIR=/tmp/mtmp pnpm dev`로 우회(환경 한정 이슈, 설정엔 미반영).

## 4. Cloudflare Pages 정적 배포

- @nuxt/content(better-sqlite3)는 Cloudflare 런타임 DB가 없으므로 **정적 프리렌더(`nuxt generate`) → Pages** 방식 채택. nitro 프리렌더로 전 페이지 HTML 생성.
- 프리렌더 이슈 2건 해결:
  1. **마크다운 내부 상대 링크 크롤**: 문서의 `./FRONTEND.md`·`../../app/...`·`./CLAUDE.md` 등 원본 레포 기준 링크를 크롤러가 따라가 404 → 빌드 실패. **crawlLinks 끄고** `doc/` 트리를 재귀 순회해 정규 라우트만 직접 열거(`nuxt.config.ts`).
  2. **대소문자 구분**: macOS(케이스 무시)에선 안 보였으나, 크롤이 만든 `docs/DESIGN/` 대문자 디렉터리 때문에 Cloudflare(케이스 구분)에서 소문자 `/docs/design`이 404. 라우트를 **전부 소문자로 정규화**해 해결. 파일명 점(`history.20260604`)으로 크롤러가 라우트를 건너뛰던 문제도 같은 열거 방식으로 회피.
- Pages 프로젝트 `malgn-noti-mng` 생성(production-branch=main) 후 `.output/public` 배포. 재배포로 57개 정규 라우트 전부 라이브 200 확인(`/docs/*` 9개 문서 + `/docs/history/*` 16개 이력 + 인덱스).
- 인증: wrangler OAuth(info@malgnsoft.com).

---

## 산출물

- **신규 레포**: `malgn-noti-mng` (GitHub `malgnsoft/malgn-noti-mng`, branch `main`).
- **프로덕션**: <https://malgn-noti-mng.pages.dev> (배포마다 `https://<id>.malgn-noti-mng.pages.dev` alias).
- **커밋**: 문서 집약 `0db385a` · history 작성처 변경 `bebb5b8` · 앱 스캐폴딩 `5ac81c6` · 프리렌더 대소문자 fix(이번).
- **주요 파일**: `nuxt.config.ts`(프리렌더 라우트 열거), `content.config.ts`(doc/ 매핑), `app/pages/{index,docs/index,docs/[...slug],history/index}.vue`, `app/layouts/default.vue`, `app/composables/useDocs.ts`, `package.json`(@nuxt/content + better-sqlite3 + pnpm.onlyBuiltDependencies).

## 다음 단계 / 알려진 한계

- 문서 마크다운 내부의 원본 레포 상대 링크(`./FRONTEND.md` 등)는 이 앱에서 클릭 시 404 — 앱 라우트(`/docs/...`)로 재작성하거나 무효화 필요.
- 문서 상세에 좌측 TOC/사이드바, 전체 검색 미구현.
- 콘텐츠 현행화는 수동 복사(§11 규칙) — `malgn-noti/doc/` 갱신 시 `malgn-noti-mng/doc/`로 동기화하는 절차 자동화 미정.
- 배포는 로컬 `nuxt generate` 산출물 수동 업로드 — CI(예: GitHub 연동 자동 빌드) 미설정.
