# 2026-06-08 — 관리자단 LNB AI 배너 닫기/하루 비노출 + 전체 메뉴 사양(13그룹/55항목) 반영

**한 줄 요약**: `malgn-noti-admin` 좌측 사이드바(`AppLnb`) — ① "AI 발송 도우미 베타" 배너에 닫기(X) 버튼 + 닫으면 "하루 동안 다시 표시되지 않습니다" 토스트 + `localStorage` 만료 시각(24h) 비노출. ② 핸드오프(10그룹/17라우트) 기준이던 메뉴 트리를 **전체 메뉴 사양(13그룹/약 55항목)**으로 교체 — 수신거부·콘텐츠/사이트·API 그룹 신설 + 발송 모니터링·템플릿·결제·통계 등 leaf→다항목 확장. 둘 다 Cloudflare Pages 프로덕션 재배포.

---

## 1. 코드 변경 (malgn-noti-admin)

- **`app/components/AppLnb.vue`** — AI 배너 닫기/비노출 로직 추가.
  - 배너 우상단에 닫기(X) 버튼(`i-lucide-x`) + `aria-label` 추가, 배너를 `v-if="aiBannerVisible"`로 토글.
  - `dismissAiBanner()` — `localStorage.aiBannerDismissedUntil`에 `Date.now() + 24h` 저장 → 배너 숨김 → `useToast()`로 "AI 발송 도우미 안내를 닫았어요 / 하루 동안 다시 표시되지 않습니다." 토스트(`i-lucide-clock`, neutral).
  - `onMounted` — 저장된 만료 시각과 현재 시각을 비교해 재노출 판정(만료 경과 시 다시 노출).
  - 토스터는 기존 `app.vue`의 `UApp`에 구성돼 있어 `useToast()` 바로 동작.

## 2. 배포·검증

- `pnpm build`(Nitro `cloudflare-pages`) → `npx wrangler@4 pages deploy dist --project-name=malgn-noti-admin --branch=main --commit-dirty=true --commit-message "Dismissible AI banner with 1-day localStorage"`.
- 라이브 검증: 프로덕션 <https://malgn-noti-admin.pages.dev> 200, 배포 alias <https://69c788bd.malgn-noti-admin.pages.dev> 200.

## 3. 전체 메뉴 사양 반영 (malgn-noti-admin · AppLnb)

- 사용자 제공 **전체 메뉴 사양 이미지**(13그룹/약 55항목)가 실제 앱(핸드오프 `lnb.jsx` 10그룹/17라우트)과 다름을 확인 → `app/components/AppLnb.vue` MENU 전면 교체.
- **신규 그룹 3개**: `수신거부`(`/optout/*`), `콘텐츠/사이트`(`/content/*`), `API`(독립 그룹 — 종전엔 시스템 하위 항목).
- **leaf → 다항목 그룹 확장**: 발송 모니터링(6)·템플릿(5)·결제/크레딧(6)·통계/리포트(5). 회원/고객사(2→5)·발신 정보 검수(2→6)·시스템(3→6)·요금/단가(2→3)·고객 지원(3→5)도 확장.
- **기존 17개 페이지 재사용 매핑** → 클릭 시 200. **신규 ~38 라우트는 경로만 정의**(페이지 미구현 → 404). 합의된 범위: "메뉴 트리만 먼저, 경로 네이밍은 일임".
- 판단 사항: ① 대시보드는 leaf `/` 유지(사양 하위 4개는 위젯/플레이스홀더 성격). ② **API 경로는 `/developers/*`** — Nuxt/Cloudflare Pages `/api/*` 서버 함수 예약과 충돌 회피. ③ 템플릿 2차 진행 3종 회색 `2차` 배지, 기존 "12" 배지 제거. ④ 운영 가이드 외부 링크 아이콘(`MenuItem.external` 필드 신설). ⑤ 기존 `/system/api` 페이지는 미연결(파일 잔존).
- 빌드·배포·검증: `pnpm build` → Pages 재배포 alias `1b6e0584.malgn-noti-admin.pages.dev`, 프로덕션 200 + 라이브 HTML에 13개 그룹 라벨 전부 렌더 확인. `pnpm lint` 통과.

## 4. 신규 42개 라우트 '준비 중' 스텁 페이지 (malgn-noti-admin)

- §3에서 경로만 정의된 신규 라우트가 클릭 시 404 → 전부 **준비 중 플레이스홀더**로 채움.
- 공용 컴포넌트 **`AppComingSoon.vue`** 신설 — `caption`/`title` prop으로 `AppPageHeader`(dev=`screen` 회색 "화면" 배지) + `AppEmptyState`(망치 아이콘 "준비 중인 화면입니다") 렌더 + `useHead`·`useBreadcrumb` 자동 설정. 기존 페이지 패턴(`AppPageHeader`/`AppSectionCard`/`AppDataTable`) 재사용.
- `app/pages` 하위 **42개 스텁** 생성: 회원/고객사 3·발송 모니터링 5·발신 정보 검수 4·템플릿 4·결제/크레딧 5·요금/단가 1·수신거부 3·고객 지원 1·콘텐츠/사이트 4·통계/리포트 4·시스템 4·API(`/developers/*`) 4.
- 샌드박스 PATH에 `mkdir`/`dirname` 미존재로 신규 폴더 3종(optout·content·developers 11개)은 Write 툴로 생성(부모 디렉터리 자동 생성), 나머지 31개는 셸 루프로 생성.
- 빌드·배포·검증: `pnpm build` → Pages alias `9b2de4ec`. 종전 404였던 라우트 8종 샘플 전부 200 + "준비 중" 마커 렌더 확인.

## 5. LNB 메뉴 중복 활성화 버그 수정 (malgn-noti-admin · AppLnb)

- `/monitoring/blocked` 등 하위 라우트 진입 시 "통합 발송"(`/monitoring`)과 해당 항목이 **동시에 활성 표시**되던 버그. 원인은 `isActive`의 `startsWith` 접두사 매칭(`/monitoring`이 `/monitoring/*` 전부 매칭).
- 수정: 현재 경로에 매칭되는 메뉴 경로 중 **가장 긴(가장 구체적인) 하나만 활성**으로 처리하는 `activePath` computed 도입(`allPaths`에서 최장 매칭 탐색). 고객사 상세(`/customers/1`) 같은 detail 라우트는 부모 "고객사"만 활성으로 유지.
- 라이브 검증: `/monitoring`·`/monitoring/blocked`·`/customers`·`/customers/1`·`/` 모두 활성 메뉴 정확히 1개. Pages alias `a3facf3a`.

## 6. 산출물

- `malgn-noti-admin` 커밋 4건 + `main` 푸시 — §1 AI 배너(`AppLnb.vue`), §3 전체 메뉴(`AppLnb.vue`), §4 스텁 42 + `AppComingSoon.vue`, §5 중복 활성화 수정(`AppLnb.vue`).
- Cloudflare Pages alias: AI 배너 `69c788bd`, 전체 메뉴 `1b6e0584`, 준비 중 스텁 `9b2de4ec`, 중복 활성화 수정 `a3facf3a` (`*.malgn-noti-admin.pages.dev`).

## 7. 다음 단계 / 알려진 한계

- 42개 라우트는 '준비 중' 스텁 — 도메인별 실제 화면(목록/폼/연동)은 별도 구현 필요.
- 대시보드 그룹화 여부, API `/developers/*` 경로 확정은 페이지 본격 구현 시 재검토.
- 배너 비노출 상태는 브라우저 `localStorage` 기준(기기·브라우저 한정) — 서버 저장 아님. 노출/클릭/닫기 지표 백엔드 수집은 추후 검토.
