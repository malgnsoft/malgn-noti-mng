# 2026-06-08 — 관리자단 LNB AI 배너 닫기 → 하루 비노출

**한 줄 요약**: `malgn-noti-admin` 좌측 사이드바(`AppLnb`)의 "AI 발송 도우미 베타" 배너에 닫기(X) 버튼을 추가하고, 닫으면 "하루 동안 다시 표시되지 않습니다" 토스트 안내와 함께 `localStorage` 만료 시각(24시간)을 저장해 비노출 처리. Cloudflare Pages 프로덕션 재배포.

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

## 3. 산출물

- `malgn-noti-admin` 커밋(`app/components/AppLnb.vue` 1 파일) + `main` 푸시.
- Cloudflare Pages alias `69c788bd.malgn-noti-admin.pages.dev`.

## 4. 다음 단계 / 알려진 한계

- 비노출 상태는 브라우저 `localStorage` 기준(기기·브라우저 한정) — 서버 저장 아님.
- 향후 배너 노출/클릭/닫기 이벤트를 백엔드 지표로 수집할지 검토.
