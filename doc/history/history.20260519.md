# 2026-05-19 — 디자인 가이드 페이지 + Cloudflare 프로덕션 배포

## 한 줄 요약

Relay-inspired 정본을 시각화한 `/guide` 라이브 카탈로그 페이지(18섹션)를 추가하고, 디자인 피벗 전체(Phase 1~2b-2 + 가이드)를 Cloudflare Pages 프로덕션에 배포. 이후 UI 스케일 115%·1400px 폭·정렬 근본수정·로고 이미지화·푸터 다크·채널칩 통일·카드강조 B·헤더 불투명·수신자 접기 등 페이지 설정과 **Phase 2b-3(발송조회/통계/주소록/충전/인증)**까지 적용하며 재배포(총 10회).

---

## 1. 디자인 가이드 페이지 (`/guide`)

- `app/pages/guide.vue` 신설 — sticky 사이드 nav + 스크롤 스파이 + 18섹션 라이브 카탈로그.
  - 소개(hero) · 01 원칙(7) · 02 컬러(ink 11단/accent/semantic/채널 도트) · 03 타이포 · 04 간격 · 05 라운드·그림자 · 06 버튼 · 07 Pill · 08 폼 · 09 배지 · 10 카드 · 11 테이블 · 12 빈상태 · 13 토스트 · 14 미리보기 폰 5종 · 15 레이아웃 · 16 5-카드 골격+매트릭스 · 17 톤
  - 실제 `App*` 컴포넌트로 라이브 예시 렌더 (AppBadge/AppEmptyState/Phone·Kakao·Rcs·Email·Push Preview/AppFormRow/AppRadioGroup/AppSegmented/AppSendFormCard).
- **결정**: 핸드오프 `design-guide.jsx`는 구 토큰이 섞인 stale 아티팩트(`--color-sky-vivid`, Noto Sans KR, 1200px, indigo 그라데이션)라 그대로 복사하지 않고, **현재 정본(ink/accent, Inter/JetBrains Mono, 1400px, r-sm/md/lg, shadow-soft/popover/modal)에 맞춰 값·라벨 재작성**. 가이드 표기값 = main.css 일치.
- `app/pages/home.vue` 바로가기에 "디자인 가이드"(`/guide`) 링크 추가.
- 검증: `/guide` HTTP 200 (87.6KB), 컴파일·하이드레이션 오류 0.

## 2. Cloudflare Pages 프로덕션 배포

- 빌드: `pnpm build` (Nitro `cloudflare-pages` 프리셋) → `dist/` 1.35MB / gzip 423KB.
- 인증: `wrangler whoami` → info@malgnsoft.com (account `d2b8c552…`, 기존 배포 계정 동일).
- 배포: `npx wrangler@4 pages deploy dist --project-name=malgn-noti --branch=main` (프로덕션).
- 결과:
  - 프로덕션: https://malgn-noti.pages.dev — `/home`·`/guide` HTTP 200
  - 배포 alias: https://4b3da057.malgn-noti.pages.dev
  - 라이브 마커 확인: `gnb-wrap` · `ai-card` · `credit-hero` · Inter 폰트 · `ink-900` · "운영 콘솔"
- 배포 시점 working tree 기준이라 `guide.vue`/`home.vue`/문서가 git 미반영 상태였음 → 본 커밋으로 라이브 ↔ git 일치화.

## 3. Git

- `main` 직접 커밋·푸시 (브랜치는 main 단일 운영 — 2026-05-18 사용자 결정 유지).
- 범위: `app/pages/guide.vue`(신규), `app/pages/home.vue`(가이드 링크), `doc/DESIGN.md`(§0 현황), 이 history + README 인덱스.

---

## 4. 전역 UI 스케일 115% + 재배포

- 요청: 전체 폰트 스케일 ~115% 확대.
- **결정**: 카드 제목·헤딩·테이블 등 폰트가 px 하드코딩이라 `--font-base`만 키우면 부분만 커짐. `:root` 에 `--ui-scale: 1.15` 토큰 + `body { zoom: var(--ui-scale); }` 한 줄로 텍스트·간격·컴포넌트를 균일 비례 확대(브라우저 줌 효과). sticky GNB·모달·토스트 정상. 복원 = `--ui-scale: 1`.
- 트레이드오프: 폰트만이 아니라 레이아웃·여백도 ~15% 확대(전체 비례). 텍스트-only는 타이포 스케일 재설계 필요(범위 큼) — 보류.
- 빌드 → `wrangler pages deploy dist --branch=main` 재배포.
  - 배포 alias: https://ec3368a2.malgn-noti.pages.dev
  - 검증: 프로덕션 CSS 자산(`entry.*.css`)에 `ui-scale:1.15` · `zoom:var(--ui-scale)` 포함 확인.
- 변경 파일: `app/assets/css/main.css` 단일.

## 5. 디자인 폭 1400px 보정 + 재배포

- 요청: 디자인 너비 1400px.
- 진단: `--container-max` 토큰은 이미 `1400px`였으나 §4의 `body{zoom:1.15}`가 곱해져 화면 실제 폭 ≈ 1610px.
- **수정**: `--container-max: calc(1400px / var(--ui-scale))` → `1217.4px × 1.15 = 1400px` 화면폭. `--ui-scale` 변경 시 자동 유지(절대 디자인 폭). 본문·GNB·푸터 일괄.
- 빌드 → `wrangler pages deploy dist --branch=main` 재배포(3회차).
  - 배포 alias: https://3ae53fbd.malgn-noti.pages.dev
  - 검증: 프로덕션 CSS에 `container-max:calc(1400px/var(--ui-scale))` 포함 확인.
- 변경 파일: `app/assets/css/main.css` 단일.

## 6. 헤더/본문 좌우 정렬 버그 수정 + 재배포

- 증상: sticky 헤더(GNB)가 본문보다 안쪽으로 들어와 좌우 끝이 어긋남.
- **원인**: §4의 `body { zoom }`이 스크롤바(html/viewport 기준)·sticky GNB·중앙정렬과 다른 좌표계 → sticky 헤더가 스크롤바 폭만큼 가로 오프셋.
- **수정**: zoom을 스크롤 컨테이너인 `html`로 이동 + `scrollbar-gutter: stable`. 스크롤바·sticky·`.app-container`/`.gnb-inner`/푸터가 동일 좌표계 → 좌우 끝 일치. `--container-max` calc·115%·1400px 모두 불변(html zoom 균일).
- 빌드 → `wrangler pages deploy dist --branch=main` 재배포(4회차).
  - 배포 alias: https://2c1a6180.malgn-noti.pages.dev
  - 검증: 프로덕션 CSS에 `html{scrollbar-gutter:stable;zoom:var(--ui-scale)}` 포함 확인.
- 변경 파일: `app/assets/css/main.css` 단일.

## 7. 운영 컨벤션 문서화

- `CLAUDE.md` §7.1 "Git · 배포 · 작업 이력 (운영 컨벤션)" 신규 — 그간 따라온 워크플로 규약화.
  - Git: 단일 `main` 운영, 커밋/푸시는 명시 요청 시, Co-Authored-By trailer.
  - 배포: `pnpm build` → `wrangler pages deploy dist --branch=main`, "배포"=빌드→배포→검증→커밋·푸시·history 한 흐름, working tree 기준→배포 후 git 일치.
  - 이력: `history.yyyyMMdd.md` 하루 한 파일, 같은 날 추가는 `§N`+README 인덱스 갱신.
- 변경 파일: `CLAUDE.md` 단일 (문서, 무배포).

## 8. 페이지 타이틀 설명 줄 제거 + 재배포

- 요청: 페이지 타이틀 영역 3번째 줄(설명 `<p>`) 제거 — 범위는 **페이지 헤더 패턴 전체**(사용자 확인).
- 수정: `main.css` `.page-header p { display: none }`. `.page-header` 쓰는 모든 페이지(발송 6종 + 향후) 일괄, 홈/가이드는 다른 헤더라 무영향. 복원 = `display` 제거. 마크업 `<p>`는 템플릿 유지(숨김).
- 빌드 → `wrangler pages deploy dist --branch=main` 재배포(5회차).
  - 배포 alias: https://08d1a759.malgn-noti.pages.dev
  - 검증: 프로덕션 CSS `page-header p{…display:none…}` 확인.
- 변경 파일: `app/assets/css/main.css` 단일.

## 9. 페이지 설정 묶음 (로고·정렬·푸터·채널 칩) + 재배포

사용자 요청을 모아 처리한 일괄 변경:

- **로고 이미지화**: 워드마크를 이미지대로 변경 — 다크 r-md 타일 + 화이트 글리프, "맑은"(700) + "message"(연회색). 아이콘은 lucide 단일로 없어 `AppLogoMark.vue`(말풍선+스파클 커스텀 SVG, currentColor) 신설, GNB(헤더·드로어)·푸터·인증 일관. 단어 간격 축소(`.gnb-logo` gap 10→7 + `.gnb-logo-sub` margin-left -5 → ~2px, `.auth-logo` 8, 푸터 name-row 2).
- **헤더/푸터 ↔ 본문 정렬 근본 수정**: 원인은 zoom/스크롤바가 아니라 **CSS 단축속성 충돌** — 페이지 루트 `class="app-container page-body"`에서 `.page-body { padding: 32px 0 64px }`가 `.app-container`의 좌우 패딩(32px)을 0으로 덮어써 본문만 풀블리드였음. `.page-body`를 `padding-block: 32px 64px`(세로 전용)로 변경. 부수 가드: `html { overflow-y: scroll }`(스크롤바 폭 고정), `.layout-default { overflow-x: clip }` + `.layout-main { min-width: 0 }`.
- **푸터 다크**: 배경 `--ink-900`, 텍스트는 흰색 투명도 단계로 재배치. 1차 가독성 미흡 피드백 → 작은 텍스트(11~12px) 대비를 WCAG AA 기준으로 상향(회사명·강조 링크 = 순백, 사업자정보 0.75, 기본 0.72 등).
- **채널 칩 통일**: KAKAO만 박스로 보인 원인은 **클래스 충돌** — 미리보기 셸 전역 `.kakao`/`.rcs`가 `.ch-pill kakao/rcs`에 누수. 셸 컨테이너를 `.phone .imsg`/`.phone .kakao`/`.phone .rcs`로 스코프 → 6채널 모두 SMS·EMAIL과 동일(점+모노 코드).
- **타이틀 실사 이미지 검토**: 디자인 시스템(정보 우선·calm)과 충돌해 비권장. 비교 목업 페이지로 6안 제시 → 사용자 **현행 유지** 결정, 목업 페이지 폐기(미커밋).
- 빌드 → `wrangler pages deploy dist --branch=main` 재배포(6회차).
  - 배포 alias: https://cecb5166.malgn-noti.pages.dev
  - 검증: 프로덕션 CSS `.footer{background:var(--ink-900)}` · `.phone .kakao{` · `page-body{…padding-block}` 확인.
- 변경 파일: `main.css`, `AppLogoMark.vue`(신규), `AppGnb.vue`, `AppFooter.vue`, `layouts/{auth,default}.vue`.

## 10. 카드 헤더 단계번호 제거·타이틀 강조 + 강조안 목업 배포

- 요청: 발신/수신자 등 카드의 `01·02` 단계 번호 삭제 + 영역 강조(우선 폰트 키우기).
- 적용: `AppSendFormCard.vue`에서 `.step` 번호 요소 제거(발송 6종 전체, `step` prop은 호환 위해 유지·미렌더). `.card-header .title` 13→15px·600→700·tracking -0.01em, `.card-header` padding 14→16px.
- 강조 추가안 8종(현행/A eyebrow/B accent바/A+B/D dot/F 헤더↔바디 accent 경계선/C 섹션헤더 분리/E 헤더톤) 비교용 `app/pages/dev/card-emphasis-mockups.vue` 생성 — **사용자 요청으로 배포 포함**(이전 title 목업과 달리 폐기 보류, 결정 시 정리).
- **배포 사고·수정**: `wrangler pages deploy`가 git HEAD 한글 커밋 메시지를 배포 메타로 읽다 `Invalid commit message, must be valid UTF-8`로 실패. `--commit-message "<ascii>" --commit-dirty=true` 명시로 해결. CLAUDE.md §7.1 배포 절차에 규약 반영.
- 빌드 → 재배포(7회차).
  - 배포 alias: https://20c0b350.malgn-noti.pages.dev
  - 검증: 프로덕션 `/dev/card-emphasis-mockups` 200, `/send/sms` `class="step"` 0건(번호 제거), `/home` 200.
- 변경 파일: `AppSendFormCard.vue`, `main.css`, `app/pages/dev/card-emphasis-mockups.vue`(신규), `CLAUDE.md` §7.1.

## 11. 강조안 B 확정 적용 + 목업 폐기

- 사용자 결정: 강조안 **B (accent 좌측 바)** 채택.
- 적용: `AppSendFormCard`의 `.card-header`에 `card-header--accent` 클래스 부여 + `main.css`에 `.card-header--accent { border-left: 3px solid var(--accent); padding-left: 17px }`. AppSendFormCard 한정 스코프 → 발송 6종의 4카드(발신/수신자/메시지/발송옵션)에만 적용, 홈·가이드 카드 무영향.
- 결정 완료로 `app/pages/dev/card-emphasis-mockups.vue` + `app/pages/dev/` 폐기.
- 빌드 → 재배포(8회차).
  - 배포 alias: https://e86488b5.malgn-noti.pages.dev
  - 검증: 프로덕션 `/send/sms` `card-header--accent` 4건(B 적용), `/dev/card-emphasis-mockups` 404(목업 제거).
- 변경 파일: `AppSendFormCard.vue`, `main.css`, `app/pages/dev/`(삭제).

## 12. 헤더 불투명화 + 수신자 카드 접기/펼치기

- 헤더: `.gnb-wrap` 반투명(`rgba(255,255,255,.8)` + `backdrop-filter blur`) → **불투명 `var(--white)`**, backdrop-filter 제거(성능).
- 수신자 카드 접기/펼치기: `AppSendFormCard`에 `collapsible`/`defaultCollapsed` prop + chevron 토글(헤더 클릭/버튼, `aria-expanded`·`aria-label`, ▾↔▸ 회전, 바디 `v-show`). `AppRecipientCard`만 `collapsible` 적용 — 발신정보·메시지·발송옵션·홈·가이드 무영향.
- 아이콘 위치: 사용자 요청으로 헤더 우측 끝 → **타이틀 바로 옆**으로 이동(hint "총 N명"은 기존 `margin-left:auto`로 우측 유지).
- 빌드 → 재배포(9회차).
  - 배포 alias: https://7910043f.malgn-noti.pages.dev
  - 검증: 프로덕션 CSS `.gnb-wrap{background:var(--white)}`(불투명), `/send/sms` `card-toggle` 존재(접기 토글), 200.
- 변경 파일: `main.css`, `AppSendFormCard.vue`, `AppRecipientCard.vue`.

## 13. Phase 2b-3 — 발송조회/통계/주소록/충전/인증

- 핸드오프 `other-pages.jsx` 6개 페이지군 이식:
  - `AppHistoryView.vue` 신규 — 발송 조회(4 stat-card+segmented 기간+채널/상태 필터+검색+테이블+페이지네이션). `/history/{sms,rcs,kakao,email,push}` 5채널이 `defaultChannel`만 달리해 공유.
  - `history/stats.vue` — 4 KPI + 일별 stacked bar + 채널 donut(SVG) + TOP 템플릿 progress. 차트색 = DESIGN §2.4 채널 도트 체계(info/amber/warning/accent/violet).
  - `contacts/list.vue` — 240px 그룹 사이드바 + 필터바 + 연락처 테이블 + 선택 액션.
  - `charge/index.vue` — `.content-2col`, 프리셋 5 + 결제수단 3 + 최근내역 / aside `.credit-hero` + 결제요약.
  - `login/index.vue`·`signup.vue` — 기존 `auth` 레이아웃 셸 안에 카드 내용만 렌더(로그인: 비번토글/유지/찾기, 회원가입: 3-step 스테퍼).
- 핸드오프 적응: 구 토큰 → ink/accent/semantic+채널색, `Icon`→`UIcon i-lucide-*`, `useToast`→Nuxt UI, 기존 공용 클래스 재사용.
- 빌드 → 재배포(10회차).
  - 배포 alias: https://08f9446c.malgn-noti.pages.dev
  - 검증: 10개 URL 200, stats `donut-wrap`·charge `credit-hero` 확인.
- 변경: `AppHistoryView.vue`(신규), `pages/history/{sms,rcs,kakao,email,push,stats}.vue`, `pages/contacts/list.vue`, `pages/charge/index.vue`, `pages/login/index.vue`, `pages/signup.vue`, `doc/DESIGN.md` §0.
- **잔여**: 발신정보·메시지관리·캠페인·계정설정·문의·시스템페이지 — 핸드오프 시안 없음, 디자인 방향 별도 협의 필요.

## 14. GNB "발송 관리" 메뉴 분리

- 요청: 단일 "발송 관리" 드롭다운을 둘로 분리.
- `AppGnb.vue` MENU_TREE: `발송 조회/통계`(채널별 발송조회 5 + 구분선 + 통계) / `주소록`(연락처/그룹/수신거부) 2개 그룹으로 분리. 메뉴는 데이터+CSS 호버 기반이라 인덱스 의존 없음.
- 빌드 → 재배포(11회차).
  - 배포 alias: https://3af5079b.malgn-noti.pages.dev
  - 검증: 프로덕션 `/home` 200, "발송 조회/통계"·"주소록" 렌더, "발송 관리" 0건.
- 변경 파일: `AppGnb.vue` 단일.

## 15. SMS 타이틀 변경 + 수신자 카드 최상단 이동

- `pages/send/sms.vue`: H1·문서타이틀 `SMS 발송` → `문자메시지 발송` (브레드크럼은 이미 일치).
- 발송 6채널(sms/kakao/rcs/email/push/flow) 전체: `AppRecipientCard`를 카드 스택 첫 번째(타이틀 다음)로 이동. 새 순서 = 수신자 → 발신/플로우 → 메시지 → 발송옵션. 사용자 결정: 6채널 전체 적용(알림톡은 잠긴 수신자 카드가 먼저 노출되는 UX 감수).
- 빌드 → 재배포(12회차).
  - 배포 alias: https://5ad321a1.malgn-noti.pages.dev
  - 검증: 소스상 6파일 모두 `<AppRecipientCard`가 첫 `<AppSendFormCard`보다 앞, 프로덕션 200.
- 변경: `pages/send/{sms,kakao,rcs,email,push,flow}.vue`.

## 16. 알림톡 발신 정보 카드 최상단 복귀

- 요청: 알림톡 페이지만 발신 정보 카드를 타이틀 다음(첫 카드)으로.
- `pages/send/kakao.vue`: 발신 정보 ↔ 수신자 순서 교체 → 발신 정보 → 수신자 → 메시지 → 옵션. 알림톡은 발신 프로필+템플릿 선택 전 수신자/메시지 잠금(progressive disclosure)이라 발신 정보 선행이 자연스러움. 나머지 5채널은 수신자-우선 유지.
- 빌드 → 재배포(13회차).
  - 배포 alias: https://372eab23.malgn-noti.pages.dev
  - 검증: 소스 `<AppSendFormCard`@85 < `<AppRecipientCard`@120, 프로덕션 200.
- 변경: `pages/send/kakao.vue` 단일.

## 17. 발송 6채널 3-카드 재배치 + 템플릿 다이얼로그 (캡처 기준)

사용자 제공 캡처 6종 기준으로 발송 페이지를 **템플릿 선택 / 수신자 설정 / 메시지 설정 3-카드** 패턴으로 통일:

- **공용 컴포넌트**: `AppSendFormCard` 접기 토글 → "닫기/열기" 텍스트형. `AppRecipientCard` `title` prop 추가(기본 "수신자"), 액션 버튼 라벨/스타일 캡처 기준(+ 직접입력/+ 주소록에서 선택=다크, 수신자 정보 수정/삭제=핑크), "수신자 추가" 라벨 제거.
- **SMS**: 3-카드, 발송목적 일반용/인증용/광고용, 발신번호 안내문, 국내/국제 2줄 byte 카운터, 템플릿 행 통일(선택된 템플릿 없음 + 선택), 수신자 초기 공란.
- **알림톡**: 발신 프로필 셀렉트화, 메시지 설정=읽기전용 메타(템플릿코드/카카오톡코드/발송목적/메시지유형/강조유형/내용/보안여부), 프로필 모달 제거.
- **RCS**: 발신 브랜드+번호 2-셀렉트, 발송유형 3-단, 수신 대기 만료 기한, `AppRcsTemplateDialog` 신규(미리보기 미지원 안내).
- **이메일**: 발송목적/발신메일/제목(0/1000)/내용/첨부파일(안내 4줄)+인라인 이메일 미리보기(텍스트/HTML 토글), `AppEmailTemplateDialog` 신규(미리보기 포함).
- **PUSH**: 발송목적·입력유형 라디오, HTML 스타일 박스, 배지, 확장 6행(버튼/미디어/Android·iOS 미디어/큰 아이콘/그룹), Android·iOS 미리보기 2-up, `AppPushTemplateDialog` 신규.
- **Flow**: 안내 2줄, 플로우 이름 셀렉트+생성관리, 발송 순서 chips+메시지 채널 셀렉트, 읽기전용 발신/목적/유형, `AppFlowManageDialog` 신규(생성 관리 목록).
- 빌드 → 재배포(14회차).
  - 배포 alias: https://093effc9.malgn-noti.pages.dev
  - 검증: 발송 6채널 + 홈 200, 컴파일/하이드레이션 0.
- 신규 컴포넌트: `AppRcsTemplateDialog`/`AppEmailTemplateDialog`/`AppPushTemplateDialog`/`AppFlowManageDialog`. 변경: `AppSendFormCard`·`AppRecipientCard` + `pages/send/{sms,kakao,rcs,email,push,flow}.vue`.

---

## 산출물 (당일)

- `app/pages/guide.vue` (신규, 18섹션 라이브 가이드)
- `app/pages/home.vue` (바로가기 5번째: 디자인 가이드)
- `doc/DESIGN.md` (§0 적용 현황에 가이드 페이지 행 추가)
- `app/assets/css/main.css` (전역 115% `html{zoom}`+`scrollbar-gutter`, `--container-max` 1400px 보정, 헤더 정렬 수정)
- `CLAUDE.md` §7.1 운영 컨벤션(Git·배포·이력) 신규
- `AppLogoMark.vue` 신규(브랜드 마크 SVG) · AppGnb/AppFooter/auth/default 로고·정렬·푸터 다크
- `doc/history/history.20260519.md` + README 인덱스
- 강조안 **B(accent 좌측 바)** 확정 적용 → `card-header--accent`, 비교 목업 폐기
- 헤더 불투명화 + 수신자 카드 접기/펼치기(`AppSendFormCard` collapsible)
- **Phase 2b-3** — 발송조회(`AppHistoryView`)/통계/주소록/충전/로그인/회원가입 6페이지군
- GNB "발송 관리" → "발송 조회/통계" + "주소록" 분리
- SMS→문자메시지 발송 타이틀 변경 + 발송 6채널 수신자 카드 최상단 이동
- 알림톡 발신 정보 카드 최상단 복귀(disclosure 정합)
- 발송 6채널 3-카드 재배치(템플릿 선택/수신자 설정/메시지 설정) + 채널 템플릿 다이얼로그 4종 신규
- Cloudflare Pages 프로덕션 배포 ×14 (https://malgn-noti.pages.dev)

## 다음 단계 / 알려진 한계

- **Phase 2b-3 남음**: 이력·통계·주소록·발신정보·메시지관리·캠페인·충전·인증 페이지.
  - 핸드오프 `other-pages.jsx`에 발송조회/통계/주소록/충전/로그인/회원가입 시안 존재.
  - 발신정보·메시지관리·캠페인은 핸드오프 시안 없음 → 별도 협의.
- 미적용 화면은 backward-compat 별칭으로 색만 이행(간격·폰트·형태는 구 시안).
- GitHub Actions 자동 배포 미구성 — 현재는 wrangler CLI 수동 배포.
