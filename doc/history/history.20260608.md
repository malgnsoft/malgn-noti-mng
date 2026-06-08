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

## 4. 산출물

- `malgn-noti-admin` 커밋 2건(`app/components/AppLnb.vue`) + `main` 푸시 — §1 AI 배너, §3 전체 메뉴.
- Cloudflare Pages alias: AI 배너 `69c788bd`, 전체 메뉴 `1b6e0584` (`*.malgn-noti-admin.pages.dev`).

## 5. 다음 단계 / 알려진 한계

- 신규 ~38개 라우트 페이지 미구현 → 클릭 시 404. "준비 중" 스텁 또는 본격 구현 별도 진행 필요.
- 대시보드 그룹화 여부, API `/developers/*` 경로 확정은 페이지 구현 시 재검토.
- 배너 비노출 상태는 브라우저 `localStorage` 기준(기기·브라우저 한정) — 서버 저장 아님. 노출/클릭/닫기 지표 백엔드 수집은 추후 검토.
