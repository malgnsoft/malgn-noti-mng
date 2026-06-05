# 2026-05-20 — 발송 페이지 UX 폴리시 2차 + PUSH 부가항목·플로우 관리 완성

## 한 줄 요약

§17(5/19) 이후 발송 6채널 전반의 UX를 다듬고, PUSH 메시지 설정의 부가 항목(버튼·미디어·Android 미디어·iOS 미디어·Android 큰 아이콘·그룹)을 모두 실 동작 다이얼로그로 구현하고, 복합 플로우의 등록·수정·삭제·이름 클릭 편집까지 한 다이얼로그로 통합. 공용 컴포넌트(이메일 미리보기·다중 키 컬럼 수신자 위젯·중첩 모달 스크롤 잠금)도 다듬어 Cloudflare Pages에 배포 (#15). 이후 문구 정리(발송 옵션→발송 설정, 띄어쓰기, 푸터 이메일 오타)로 재배포 (#16), 5/18 피벗 이후 누적분을 DESIGN/FRONTEND/STACK/CLAUDE·가이드 페이지에 현행화하여 재배포 (#17). 끝으로 FRONTEND/DESIGN 문서에 남아 있던 stale 매핑(USlideover·구 `--gray-*` 토큰 예시)을 코드 현실에 맞춰 정정하여 재배포 (#18). 이어서 발송 조회 페이지(`AppHistoryView`)의 목록 영역·검색 필터·다이얼로그를 캡처 기준으로 전면 재작업하고, `.btn-sky` 레거시 클래스를 프로젝트 전역에서 제거(→`.btn-primary`)하여 재배포 (#19). 이후 통계 페이지를 Chart.js로 재구성하고, `zoom` 전역 스케일을 폐기한 뒤 폰트 타입 스케일을 토큰화(`--fz-scale`)하여 +15% 적용, 재배포 (#20). 이어서 발송 6채널의 '템플릿 사용유무' 토글 동작을 개선 — 토글 시 수신자 목록을 항상 유지하고 메시지 설정만 stash/복원하도록 `useTemplateToggle` composable로 통일, 재배포 (#21). 이어서 주소록 관리 페이지를 강화 — 등록·일괄등록·그룹이동 모달, 선택 발송 채널 드롭다운, 이름 클릭 수정, 페이지네이션·토큰 컬럼을 추가하여 재배포 (#22). 이어서 발신 정보·발신 번호 관리 페이지를 신규 구성하고, 개인정보 동의 → 등록 방식 선택 → 서류 인증/휴대폰 본인인증 3단계 등록 마법사를 추가했으며, 누적 타입 에러 8건을 정리해 재배포 (#23). 이어서 그룹 관리 페이지를 신규 구성하고(그룹 등록·수정 모달, 행별 메시지 발송 채널 드롭다운, 검색·페이지네이션), 주소록·그룹 관리 툴바를 통일하여 재배포 (#24). 이어서 RCS 브랜드 관리 페이지를 신규 구성하고(RCS Biz Center 연동 흐름, 브랜드 목록 표, 하단 번호형 페이지바·새로고침), 발신 정보 리스트 페이지 구조를 통일하여 재배포 (#25). 끝으로 이메일 도메인 관리 페이지를 신규 구성하고(도메인 등록·DKIM 설정 모달), 재배포 (#26).

## 1. 수신자 입력 다이얼로그 일괄 강화

- **AppRecipientFormDialog**
  - `keyColumn` 단일 → `keyColumns?: ('phone'|'email'|'token')[]` 다중 지원. 단일 모드는 기존 검증 유지, 다중 모드는 "최소 한 항목 + 입력된 항목 형식 검사" 정책.
  - 휴대폰은 하이픈 자동 포맷팅을 다시 제거하고 **국내 11자리 숫자만 입력** 으로 단순화(국가코드 칸도 폐기). 안내문 동일 갱신.
  - 이메일 행에 정규식 형식 검증(`^[^\s@]+@[^\s@]+\.[^\s@]+$`).
  - "(이름 없음)" 폴백 등 UX 보정.
- **AppRecipientCard**
  - `keyColumns?:` prop 추가 → 표 헤더·셀이 N개 컬럼으로 확장 (`headOf` / `valOf` 도우미).
  - **별칭 클릭 → 수정 다이얼로그** 오픈(`<button class="rcp-name-btn">`, accent-ink + bold + hover underline). `수신자 정보 수정` 버튼은 6채널 모두에서 제거.
- **AppAddressBookDialog**
  - `keyColumns?:` 동일 지원, valOf에 `token` 분기 추가.
  - 개별 샘플 8명에 FCM/APNS 형태 `token` 필드 부여 + 그룹 합성 수신자에도 토큰 포함 → PUSH 페이지 토큰 열 의미화.
  - 행 클릭 시 체크박스 더블 토글로 체크가 누락되던 버그 수정: `<label class="checkbox">` → `<span class="checkbox">`(라벨 포워딩 제거), input은 `pointer-events: none` + `tabindex="-1"` 표시 전용으로 분리.

## 2. SMS 발송 페이지

- **AppSmsTemplateDialog**: 단순 리스트 → "샘플 템플릿 선택" 카드 그리드(검색 + 단문/장문/포토 탭 + 우측 미리보기). SMS 8종(봄 인사) + LMS 2종 + MMS 3종 시드. `Tpl`에 `images?` 추가.
- **MMS 템플릿 선택 시 자동 첨부 + 수정 불가**: `attachLocked` computed로 칩 회색 처리 + 자물쇠 아이콘 + "(수정 불가)" 안내, 삭제 ×·이미지 선택 버튼 숨김.
- **AppPhonePreview**: `images?` prop 추가 → 발송 페이지 미리보기에도 첨부 이미지가 그대로 표시(아이콘+파일명+KB 카드).
- **이미지 첨부 실제 파일 픽커**: 숨김 `<input type="file" accept=".jpg,.jpeg,image/jpeg" multiple>` + `onPickImages()` 검증(JPG/JPEG · 3장 · 1장 ≤300KB · 합산 ≤800KB).
- **템플릿 사용유무 토글 시 페이지 내용 초기화**: `resetContent()` 추출 + watcher(`flush: 'sync'` + `suppressTplReset` 가드) → 전체 초기화 다이얼로그도 같은 함수를 재사용.
- **광고용 자동 (광고) 접두 강제**: purpose / subject 두 개 watcher가 idempotent하게 부착·해제.

## 3. 이메일 발송 페이지

- **공용 컴포넌트 추출**: 다이얼로그 미리보기와 발송 페이지 미리보기가 구조적으로 달랐던 문제를 `AppEmailPreview`(제목·보낸사람·첨부·헤딩·본문 카드·버튼·HTML/텍스트 토글)로 통합. `EmailTpl`을 `app/types/template.ts`로 이동, 다이얼로그/페이지 모두 같은 컴포넌트 사용.
- `EmailTpl`에 `heading` / `buttonLabel` 까지 전달되어 페이지 미리보기에 즉시 반영.
- 미리보기 컬럼 너비 `320px` → **`460px`** 확대.
- 광고용 자동 (광고) 접두 강제 동일 적용.

## 4. 알림톡 발송 페이지

- 수신자 카드 잠금 게이팅(`:locked`) 제거 → 다른 채널과 동일 동작.
- 메시지 설정 카드도 `:locked` 제거 + `v-if="template"` 게이팅 해제 → 템플릿 미선택 시에도 각 항목 표시 + 값 공란, 내용 textarea placeholder 안내.

## 5. RCS 발송 페이지

- 발송 유형 셀렉트 옵션 캡처 반영
  - 2번째: `스탠드얼론 / 템플릿` → **`스탠드얼론 / 대화형`**
  - 3번째: `SMS / LMS / 대체 없음` → **`SMS / 통합 SMS`**
- 수신 대기 만료 기한: `1시간/6시간/24시간/3일` → **`40초/3분/1시간/24시간`** (기본 `24h`).
- `RcsTpl` 공용 타입 + 9개 비디오팩 템플릿에 발송 목적·유형 3종·내용·이미지·버튼·만료 기한 시드 → 템플릿 선택 시 **메시지 설정 자동 채움**.
- 템플릿 사용유무 토글 → SMS와 동일한 `resetContent()` / `handleReset()` / suppress watcher 패턴.

## 6. PUSH 발송 페이지 — 부가 항목 완성

- **AppPushPreview**: `platform: 'android'|'ios'` prop 추가 → 두 디바이스를 별도 잠금화면 레이아웃으로 렌더(상태바/시계/날짜/알림 카드/하단 버튼). 콘텐츠(`title`/`body`)는 항상 동일 바인딩.
- **AppPushRecipientDialog**(수신자 직접 입력): 타이틀 "수신자 직접 입력" / "수신자 수정", **별칭** 단일 입력 + 토큰 다중 추가(푸시 유형 7종 셀렉트). 수정 모드에서는 `+ 추가`·푸시 유형 뱃지·× 삭제 모두 숨김. 데이터: `name`=별칭, `token`=토큰, `vars.pushType`=유형.
- 메시지 설정 부가 항목 전용 다이얼로그 6종(공용 `AppPushMediaDialog`를 prop으로 분기):
  - **AppPushButtonDialog**: 유형 4종(응답/앱 열기/URL 열기/닫기). 칩 = `유형 ✏ ×`(연필 클릭 시 수정 다이얼로그 재오픈)
  - **AppPushMediaDialog** (재사용): `title` / `showType` / `showExpand` / `types` prop으로 다음 4행을 한 컴포넌트로 처리
    - **미디어**: URL · 유형 4종 · 펼치기 (사용/사용 안함). 칩 `유형 · URL ×`
    - **Android 미디어**: URL · 유형(이미지만) · 펼치기 → 단일 옵션 자동 선택
    - **iOS 미디어**: URL · 유형 4종 (펼치기 없음)
    - **Android 큰 아이콘**: URL만 (유형/펼치기 없음), 타이틀 "Android 큰 아이콘"
  - **AppPushGroupDialog**: 키 + 설명. 칩 `key ✏ ×`
- 광고용 자동 (광고) 접두 강제(pushType + title)
- 주소록 다이얼로그를 `key-column="token"`으로 전환 → 토큰 컬럼 노출

## 7. 복합 플로우 페이지 — 등록/수정/관리 통합

- 초기 로드 시 **플로우 미선택** 상태로 시작. select에 placeholder `<option value="">플로우를 선택하세요</option>` 추가, 메시지 설정 각 항목은 표시·값 공란, 발신/제목/내용 disabled, 발송 버튼 `!selectedFlow` 시 비활성.
- 수신자 설정도 다른 채널과 동일하게 빈 상태 시작 — `varKeys` computed로 노드 본문에서 `#{...}` 동적 수집, `:show-vars`·`:show-substitution`을 `varKeys.length > 0`으로 게이팅. 플로우 전환 시 recipients/selectedRcpt/commonVars/substitutionMode 초기화.
- **수신자 휴대폰 + 이메일 동시 입력 + 표 동시 표시** — `:key-columns="['phone', 'email']"`(card/dialog/address book 모두).
- **AppFlowCreateDialog**: 등록·수정 겸용 (`edit?: FlowDraft | null` prop / `isEdit` computed로 타이틀·확인 버튼 라벨 분기). 폼 카드 2개("플로우 발송 정보" + "플로우 설정"), 채널 옵션 4종(SMS/알림톡/이메일/PUSH) + 채널 변경 시 템플릿 자동 비움 + HTML5 드래그 앤 드롭 순서 변경 + 첫 행 채널 미선택은 placeholder.
- **AppFlowTemplatePickerDialog**(신규): "선택" 버튼 → 채널별 템플릿 라디오 선택(검색 + 커스텀 라디오). 채널별 목업 템플릿(SMS 3·알림톡 3·이메일 1·PUSH 1).
- **AppFlowManageDialog** 리팩토링: `Flow` 인터페이스를 raw(`purpose`·`mode`·`channels: { id, ch, template }[]`)로 정규화, 표시는 `purposeLabel`·`channelsLabel` 도우미. `openCreate` 단일 상태 → `openFlowDialog` + `editingFlow: FlowDraft | null` 공용. **플로우 이름 클릭 → 수정 다이얼로그**, 별도 "플로우 수정" 버튼은 제거. "플로우 생성" → **"플로우 등록"**, "플로우 생성 관리" → **"플로우 관리"** 라벨/타이틀 통일.

## 8. AppModal — 스크롤 잠금 견고화

- 모달 열 때 본 페이지가 맨 위로 튀던 문제, 그리고 살짝 위로 어긋나던 잔여 문제까지 해결.
- **scrollLock 공용 유틸** `app/utils/scrollLock.ts` 신설: 모듈 수준 카운터 + `savedY`로 **중첩 모달**에서도 최초 잠금만 body 변경, 마지막 해제 시에만 복원. `html { zoom: var(--ui-scale) }` 보정 — `body.top`을 `savedY / zoom`으로 나눠 실제 시각 오프셋이 정확히 `savedY`가 되도록 함.
- AppModal은 인스턴스별 `locked` 가드로 중복 lock/unlock을 방지하고, `onBeforeUnmount`에서도 안전 해제.

## 9. 배포·커밋·이력

- `pnpm build` → `npx -y wrangler@4 pages deploy dist --project-name=malgn-noti --branch=main --commit-dirty=true --commit-message "send-page UX polish 2nd batch + PUSH extension dialogs + flow mgmt"` 1회 (배포 #15)
- 프로덕션 검증: `https://malgn-noti.pages.dev/send/push` 200, `/send/flow` 200, alias `https://c4b53baf.malgn-noti.pages.dev/send/push` 200
- 커밋: `bd7e07e 발송 페이지 UX 폴리시 2차 + PUSH 부가항목·플로우 관리 완성` (25 files changed, 2355+/447-) → `origin/main` 푸시
- Cloudflare Pages 자동 배포가 추가로 트리거되었을 수 있음(working tree 기준 wrangler 직접 배포본이 라이브)

## 10. 문구 정리 + 재배포 (§10, 배포 #16)

- **발송 옵션 → 발송 설정**: `AppSendOptionsCard` 카드 타이틀 변경 → 6채널 공용 컴포넌트라 한 곳 수정으로 전 발송 페이지 반영.
- **띄어쓰기 교정**: `사용 안함` → `사용 안 함`(템플릿 사용유무·HTML 스타일 라디오, 5곳), `직접입력` → `직접 입력`(AppRecipientCard·AppRecipientActions·DESIGN.md).
- **푸터 이메일 오타**: `massage@malgnsoft.com` → `message@malgnsoft.com` (AppFooter).
- 배포: `pnpm build` → `wrangler pages deploy` (`--commit-message "wording fixes: send option label, spacing, footer email typo"`) — 배포 #16.
- 프로덕션 검증: `https://malgn-noti.pages.dev/send/sms` 200, alias `https://e22f7472.malgn-noti.pages.dev/send/sms` 200.
- 커밋: `704a1b4 문구 정리: 발송 설정 라벨 변경 + 띄어쓰기 + 푸터 이메일 오타` (10 files, +12 −12) → `origin/main` 푸시.

## 11. 문서·디자인 가이드 현행화 + 재배포 (§11, 배포 #17)

- 5/18 디자인 피벗 이후 누적된 변경을 문서에 반영.
- **DESIGN.md**: §0 적용 현황(Phase 1·2 완료), §6 "Phase 2 재작업 예정" 제거, §12 발송 아키텍처를 **5-카드 → 3+1 카드 골격**(템플릿 선택/수신자 설정/메시지 설정/발송 설정)으로 재작성, §12.3 핵심 컴포넌트 목록 전면 갱신, §14에 5/19·5/20 이력 추가.
- **FRONTEND.md**: 디자인 정본을 DESIGN.md로 명시, §3 디자인 시스템을 ink/accent 토큰·1400px·`zoom 1.15` 기준으로 전면 재작성(구 indigo/Noto Sans KR/1200px 폐기), §9.1 GNB를 56px·7개 메뉴로 정정, §12의 시안 base.css 섹션 카탈로그 폐기 → `/guide`·`main.css` 안내.
- **STACK.md**: 폰트 행을 Inter/JetBrains Mono/Pretendard로 갱신.
- **CLAUDE.md**: §4 UI 패턴을 실제 `AppModal` 기반 공용 컴포넌트로 정정(USlideover·존재하지 않는 컴포넌트 제거), §7 "(계획)" 표기 삭제, §8 네이밍 예시 실존 컴포넌트로 교체, §2 pnpm 확정, §10 TODO 정리.
- **guide.vue**: §16 "5-카드 골격" → "발송 카드 골격" 섹션을 실제 3+1 카드 구조·매트릭스로 갱신.
- 배포 #17: `wrangler pages deploy` (`--commit-message "docs sync: ..."`), 프로덕션 `https://malgn-noti.pages.dev/guide` 200 / alias `https://c9760142.malgn-noti.pages.dev` 200.
- 커밋: `75ab98c 문서·디자인 가이드 현행화 (2026-05-18~20 반영)` (5 files, +114 −140) → `origin/main` 푸시.

## 12. 문서 stale 매핑 정정 + 재배포 (§12, 배포 #18)

`doc/` 문서 일독 검수에서 5/18 피벗 이후에도 갱신되지 않은 매핑 2건을 발견해 코드 현실에 맞춰 정정.

- **USlideover 매핑 불일치**: FRONTEND.md §7과 DESIGN.md §6.4가 패널형 팝업·상세/편집을 `USlideover`로 매핑했으나, 실제로는 모든 팝업이 자체 `AppModal` 기반 `App*Dialog`이고 `USlideover`는 `AppGnb.vue`의 모바일 GNB 드로어 전용. CLAUDE.md §4("USlideover 사용하지 않음")와 어긋나 정정.
- **구 `--gray-*` 토큰 예시**: FRONTEND.md §5.1·§5.2의 자체 CSS 예시가 폐기된 `--gray-*` 별칭·시안 base.css 1:1 차용을 권장. `--gray-*`는 main.css에 backward-compat용으로만 남아 있고 신규 코드는 `--ink-*`/`--line` 직접 사용이 정본 → §5.2를 "디자인 토큰 사용"으로 재작성, AppGnb 예시도 `var(--white)`/`var(--line)`로 교체.
- 검증: `history.20260520.md`는 잘리지 않은 완전한 파일임을 확인(142줄 정상 종료) — Read 출력 끝 혼동이었음.
- 빌드 → `wrangler pages deploy` (`--commit-message "docs sync: fix stale USlideover mapping and gray token examples"`) — 배포 #18.
- 프로덕션 검증: `https://malgn-noti.pages.dev/home`·`/guide` 200, alias `https://3f68045a.malgn-noti.pages.dev/home` 200. (문서만 변경이라 라이브 산출물은 #17과 동일.)
- 커밋: `f81424b 문서 정정: USlideover 매핑·구 토큰 예시 현행화` (2 files, +11 −9) → `origin/main` 푸시.
- 변경 파일: `doc/FRONTEND.md`, `doc/DESIGN.md`.

## 13. 발송 조회 페이지 전면 재작업 + btn-sky 제거 (§13, 배포 #19)

사용자 제공 캡처 기준으로 발송 조회(`AppHistoryView` — `/history/{sms,rcs,kakao,email,push}` 5채널 공용)의 목록 영역·검색 필터·다이얼로그를 단계적으로 재작업.

- **목록 영역 재구성**: 컬럼을 `메시지 아이디 / 메시지 채널 / 요청 일시 / 발송 시점 / 발신 정보 / 발송 상태 / 발송 목적 / 수신자 정보 / 수신 상태`로 교체. 카드 상단 툴바(선택 취소·일괄 취소·조회 필드 추가 설정·검색 결과 다운로드 요청·다운로드 요청 목록·총 N건), 카드 하단 페이지네이션(`«‹ 1…N ›»`). 목업 데이터·생성기 신규.
- **조회 필드 추가 설정**: 체크박스 다중선택 드롭다운(바깥클릭/Esc 닫힘). 체크 시 `예약/발송/수신 일시·템플릿 이름·플로우 이름` 컬럼이 발송 목적↔수신자 정보 사이에 동적 삽입.
- **검색 필터**: 시안 카드형 → 처음의 가로 바(`.filter-bar`) 스타일로 회귀(사용자 피드백). 필드 라벨 제거 + 셀렉트 기본 옵션을 필드명으로 표시해 한 줄 배치. 발송 상태(9종)·발송 시점·수신 상태·발송 목적 셀렉트 + 요청 일시 날짜 범위 + 조회/초기화. `조회` 클릭 시 적용(draft→applied). 메시지 채널 필터는 페이지 고정이라 UI 제외.
- **AppDateTimePicker**: 미사용 상태였던 컴포넌트를 정비해 요청 일시에 적용. **`html{zoom:1.15}`+`UPopover`(floating-ui JS 위치계산) 충돌로 팝오버가 어긋나던 문제**를 CSS `position:absolute` 앵커로 해결. 24시간제(시 00–23)·1분 단위(분 00–59), 시·분은 네이티브 `<select>`(텔레포트 회피), 트리거는 `.input` 클래스로 셀렉트와 높이(36px) 정렬.
- **다이얼로그 4종**: 다운로드 요청 확인 / 다운로드 요청 목록(신규 `AppExportListDialog`) / 일괄 취소 / 선택 취소 — 모두 `AppConfirmDialog`·`AppModal` 기반. `AppConfirmDialog` 본문에 `white-space: pre-line` 추가(2단락 메시지). 선택 취소·일괄 취소는 발송 대기·예약 건의 발송 취소 기능(선택 취소=체크 행 / 일괄 취소=검색 결과 전체).
- **btn-sky 전역 제거**: 레거시 `.btn-sky`(정의가 `.btn-primary`와 동일)를 컴포넌트·페이지 21개에서 `.btn-primary`로 교체, `main.css`의 `.btn-sky` 정의·`.modal-footer` 오버라이드 삭제, `guide.vue` 카탈로그 중복 예시 제거, `DESIGN.md` §6.4 갱신. 시각 변화 없음(클래스명 통일).
- 빌드 → `wrangler pages deploy` (`--commit-message "history list area rebuild, search filter, dialogs, btn-sky cleanup"`) — 배포 #19.
- 프로덕션 검증: `https://malgn-noti.pages.dev/history/sms`·`/home` 200, alias `https://77a6d8df.malgn-noti.pages.dev` 200, `fb-select` 마커 확인.
- 커밋: `d0efe8c 발송 조회 페이지 목록·검색 필터·다이얼로그 전면 작업 + btn-sky 정리` (28 files, +867 −191) → `origin/main` 푸시.

## 14. 통계 페이지 재구성 + 폰트 토큰화 + zoom 제거 (§14, 배포 #20)

- **통계 페이지(`history/stats.vue`) 전면 재구성**: 기존 KPI·스택바·도넛 → 검색 필터(한 줄 가로 바) + 차트 + 데이터 테이블 3-카드. **Chart.js(`chart.js@4.5.1`) 도입** — CLAUDE.md·STACK.md가 지정한 차트 라이브러리("예정"→실도입). 7종 상태(요청·요청취소·발송·발송실패·수신·수신실패·실발송) 막대 그래프 + 합계 행 테이블, 차트·표가 단일 소스(`STAT_ROWS`·`SERIES`)에서 파생. 기간 프리셋(오늘/최근 7·30일) 선택 시 날짜 자동 설정 + 역방향 동기화. 헤더는 발송 페이지와 동일한 `.page-header`로 통일.
- **`zoom` 전역 스케일 폐기**: `html { zoom: var(--ui-scale) }`(1.15)가 좌표계 어긋남으로 팝오버(`UPopover`)·정렬 버그를 유발 → `--ui-scale` 토큰·`--container-max` 보정 calc·`scrollLock`의 zoom 보정 모두 제거. 네이티브 100% 렌더로 전환. (`AppDateTimePicker`도 같은 원인이라 `UPopover`→CSS `position:absolute` 앵커로 사전 수정.)
- **폰트 타입 스케일 토큰화**: zoom 없이 전역 폰트 확대를 위해 `--fz-scale` 단일 노브 + `--fz-2xs~5xl` 토큰 도입(`calc(기준px × --fz-scale)`). 하드코딩 `font-size: Npx`·인라인 `text-[Npx]` 약 460곳을 `var(--fz-*)`/`text-[length:var(--fz-*)]`로 일괄 치환(sed). `--fz-scale: 1.15`로 전역 +15% 적용 — 이후 스케일 조정은 한 줄.
- **AppDateTimePicker**: 미사용이던 컴포넌트를 정비해 요청 일시 날짜 범위에 적용(24시간제·1분 단위). 발송 조회·통계 필터 공용.
- 잡정리: 발송 조회 페이지 `CSV 다운로드` 버튼 제거, `.table th` 폰트 크기 상향(`--fz-2xs`→`--fz-sm`).
- 빌드 → `wrangler pages deploy` — 배포 #20. 프로덕션 `https://malgn-noti.pages.dev/history/stats`·`/history/sms`·`/home` 200, alias `https://95f36a35.malgn-noti.pages.dev` 200, `fz-scale` 마커 확인.
- 커밋: `6bc05c6 통계 페이지 재구성 + 폰트 토큰화 + zoom 스케일 제거` (53 files, +664 −637) → `origin/main` 푸시.

## 15. 발송 페이지 템플릿 토글 동작 개선 (§15, 배포 #21)

- **`useTemplateToggle` composable 신규**: 발송 페이지의 "템플릿 사용유무" 토글 동작을 한 곳에 정의. off→on(사용)은 현재 off 모드 메시지 설정을 스냅샷으로 보관하고 메시지+템플릿만 초기화, on→off(사용 안 함)는 템플릿을 해제하고 보관해 둔 off 모드 설정을 복원. `setSilently`로 전체 초기화 시 watch 억제.
- **수신자 목록 항상 유지**: 기존 sms·rcs는 토글 시 `resetContent()`로 수신자(`recipients`/`selectedRcpt`)까지 전부 날렸음 → `resetMessage()`(메시지+템플릿만)로 분리. 수신자는 어느 페이지·어느 전환에서도 초기화하지 않음.
- **치환자 표시/숨김만**: `commonVars` 값은 보존하고 표시 여부만 computed(`showSubst` 등)가 제어. 템플릿으로 치환자가 추가되면 칸이 나타나고 빠지면 숨겨지되 값은 살아 있음.
- **email·push**: 토글 watch가 아예 없던 상태 → `useTemplateToggle` 신설. `handleReset`도 정식 구현(기존엔 `recipients=[]`만 비웠음).
- **flow**: `watch(flowName)`에서 수신자·치환자 초기화 라인 제거 — 플로우를 바꿔도 수신자 유지. 기존 타입 에러(`nodes[0]` undefined 접근) 4건도 함께 정리.
- **kakao**: "템플릿 사용유무" 토글이 없는 구조(항상 사전 승인 템플릿 기반)라 변경 없음.
- 빌드 → `wrangler pages deploy` (`--commit-message "send pages: keep recipients on template toggle, stash and restore message settings"`) — 배포 #21. 프로덕션 `/send/{sms,kakao,rcs,email,push,flow}` 전부 200, alias `https://e1b4d7da.malgn-noti.pages.dev` 200.
- 커밋: `93411ae 발송 페이지 템플릿 토글 동작 개선 — 수신자 유지 + 메시지 stash/복원` (6 files, +345 −46) → `origin/main` 푸시.

## 16. 주소록 관리 페이지 강화 (§16, 배포 #22)

- **GNB**: '연락처 관리' → '주소록 관리'.
- **주소록 페이지(`contacts/list.vue`)**: 타이틀 '주소록 그룹/연락처' → '주소록 관리', 발송 페이지와 동일한 `.page-header`로 통일. 테이블 하단 페이지네이션 추가, 'CSV 가져오기' 제거, **토큰 컬럼**(있음 / `-`) 추가.
- **그룹 이동 모달**: 선택한 연락처를 다른 그룹으로 일괄 이동. `DATA`를 `reactive`로, 그룹 카운트를 `computed`로 전환해 이동 즉시 좌측 인원수 갱신.
- **선택 발송 → 5채널 드롭다운**: 선택 발송 클릭 시 문자메시지/알림톡·친구톡/RCS/이메일/PUSH 드롭다운, 채널 선택 시 선택 연락처를 `useState('sendRecipients')`로 인계해 해당 채널 발송 페이지로 이동. 발송 6채널이 `onMounted`에서 인계 수신자를 반영(sms는 §15 이전 적용, kakao/rcs/email/push 추가).
- **AppContactFormDialog**(신규): 주소록 등록/수정 겸용 모달 — 별칭(64자)·휴대폰·이메일, 토큰 입력 패널(푸시 유형·국가/언어 코드·시간대·수신 거부 3종·디바이스 ID, 칩으로 다중), 그룹 다중 선택(최대 16). 이름 클릭 시 수정 모드로 오픈.
- **AppContactBulkDialog**(신규): 주소록 일괄 등록 모달 — 템플릿 다운로드 + `.xlsx` 파일 업로드(최대 1MB).
- **배포 범위 분리**: 배포 시점 working tree에 별개의 '발신번호 등록' 진행 중 작업이 섞여 있어, 사용자 확인 후 해당 변경을 `git stash`로 임시 분리하고 **주소록 작업만** 빌드·배포·커밋한 뒤 stash 복원.
- 빌드 → `wrangler pages deploy` (`--commit-message "address book: register/bulk dialogs, group move, channel send dropdown"`) — 배포 #22. 프로덕션 `https://malgn-noti.pages.dev/contacts/list`·`/home` 200, alias `https://57bab931.malgn-noti.pages.dev` 200.
- 커밋: `547dd61 주소록 관리 페이지 강화 — 등록·일괄등록·그룹이동·채널 발송` (5 files, +839 −41) → `origin/main` 푸시.

## 17. 발신 번호 관리 페이지 + 등록 마법사 (§17, 배포 #23)

- **발신 정보 · 발신 번호 페이지(`sender/numbers.vue`)**: 시안 IA를 Relay-inspired 디자인에 맞춰 신규 구성 — 명의자 인증 안내 박스, `발신 번호 등록`(페이지 헤더 우측 배치)·삭제·등록 안내 툴바, 표(발신 번호 유형·번호·승인 상태 배지·요청/승인 일시), 페이지네이션.
- **등록 안내 모달**: 발신 번호 유형별 필요 서류를 표로 안내(대표자·임직원·타사·타인 번호).
- **AppSenderRegisterDialog**(신규): 3단계 등록 마법사. ① 개인정보 수집 이용 동의(체크 후 진행) → ② 등록 방식 선택(직접 등록·서류 인증 / 휴대폰 본인인증) → ③ 분기 — 서류 인증(유형 select·번호·필요 서류 파일 업로드 → `심사 중` 등록) 또는 휴대폰 본인인증(통신사·이름·주민번호·내외국인·휴대폰, 인증번호 3분 카운트다운 → `승인` 즉시 등록). 단계 인디케이터·검증별 버튼 활성화 포함.
- **types/sender.ts**(신규): `SenderNumber`·`SenderRegisterResult` 공용 타입 분리.
- **타입 에러 정리**: 누적 타입 에러 8건 해소 — 템플릿 다이얼로그 4종의 배열 인덱스 접근 가드(`?? null`·`?? ''`·`?? []`), `AppPushRecipientDialog`의 수신자 `vars` 타입 명시, `KakaoMessageBody`를 재작성된 `AppTemplateVariableTextarea`(`body`+`modelValue` API)에 정합. `pnpm typecheck` 클린.
- 빌드 → `wrangler pages deploy` (`--commit-message "sender numbers page: 3-step register wizard ..."`) — 배포 #23. 프로덕션 `https://malgn-noti.pages.dev/sender/numbers`·`/send/sms` 200, alias `https://3c26af5f.malgn-noti.pages.dev` 200.
- 커밋: `fe58e2d 발신 번호 관리 페이지 — 등록 마법사 3단계 + 타입 에러 정리` (9 files, +1182 −12) → `origin/main` 푸시.

## 18. 그룹 관리 페이지 + 주소록·그룹 툴바 통일 (§18, 배포 #24)

- **그룹 관리 페이지(`contacts/groups.vue`)**: placeholder → 신규 구성. 표(그룹 이름·그룹 아이디·주소록 수·등록 일시·메시지 발송), 그룹 이름 검색, 페이지네이션.
- **그룹 등록/수정**: `그룹 등록` 버튼(헤더 우측)·그룹 이름 클릭 → `AppGroupFormDialog`(신규, 등록·수정 겸용 — `edit` prop으로 제목·문구 분기). 등록 시 목록 상단 추가, 수정 시 이름 갱신.
- **행별 메시지 발송 드롭다운**: `메시지 발송` 컬럼의 버튼 클릭 → 5채널(문자메시지/알림톡·친구톡/RCS/이메일/PUSH) 드롭다운. 채널 선택 시 그룹의 주소록 수만큼 목업 수신자를 생성해 `useState('sendRecipients')`로 인계 → 해당 발송 페이지 수신자 설정에 표시. 주소록 수 0이면 안내 토스트.
- **그룹 삭제**: 선택 → `AppConfirmDialog`(위험) → 일괄 삭제(`reactive`).
- **툴바 통일**: 주소록 관리·그룹 관리 툴바를 동일 형식으로 — 검색 입력이 바를 채우고, 선택 시 `N개/명 선택됨` + `선택 삭제` 노출, `새로고침`(ghost) + `총 N개/명`. 주소록 관리의 '삭제'→'선택 삭제', '연락처 수'→'주소록 수' 문구 정리, `새 그룹` 버튼 → `AppGroupFormDialog` 연결.
- 빌드 → `wrangler pages deploy` (`--commit-message "contacts: group management page, group register/edit dialog, toolbar polish"`) — 배포 #24. 프로덕션 `https://malgn-noti.pages.dev/contacts/groups`·`/contacts/list`·`/home` 200, alias `https://8a830019.malgn-noti.pages.dev` 200.
- 커밋: `4e88e1f 주소록·그룹 관리 페이지 보강` (3 files, +525 −7) → `origin/main` 푸시.

## 19. RCS 브랜드 관리 페이지 (§19, 배포 #25)

- **발신 정보 · RCS 브랜드 페이지(`sender/brands.vue`)**: placeholder → 신규 구성. 발신 번호 관리 페이지와 동일한 구조(페이지 헤더 우측 액션 버튼 + 안내 박스 + 리스트 카드).
- **안내 박스**: RCS Biz Center 가입·대행사 지정·사업자등록번호 기준 연동·정보 변경 시 재연동 4-bullet. "RCS Biz Center"는 외부 링크.
- **브랜드 연동**: `브랜드 연동` 버튼(헤더 우측) → `AppConfirmDialog`(사업자등록번호 기준 연동 안내) → 확인 시 연동 일시 갱신 + 토스트. 직접 등록 폼이 아니라 RCS Biz Center sync 흐름.
- **리스트 카드**: 툴바(`업체명` · `새로고침` · `총 N개`) + 표(브랜드 이름·아이디·승인 상태 배지·승인/연동 일시) + 하단 번호형 페이지바(`« ‹ 1 › »`) — 발신 번호 관리 페이지와 동일 포맷. 검색은 미포함.
- 빌드 → `wrangler pages deploy` (`--commit-message "rcs brand management page: sync flow, brand list table, bottom pager, refresh"`) — 배포 #25. 프로덕션 `https://malgn-noti.pages.dev/sender/brands`·`/sender/numbers` 200, alias `https://6f271361.malgn-noti.pages.dev` 200.
- 커밋: `e3e7a02 RCS 브랜드 관리 페이지 — 연동 흐름 + 브랜드 목록` (1 file, +277 −5) → `origin/main` 푸시.

## 20. 이메일 도메인 관리 페이지 (§20, 배포 #26)

- **발신 정보 · 이메일 도메인 페이지(`sender/domains.vue`)**: placeholder → 신규 구성. 발신 번호·RCS 브랜드 관리 페이지와 동일 구조(헤더 우측 `도메인 등록` + 안내 박스 + 리스트 카드 + 번호형 페이지바).
- **안내 박스**: 도메인 소유권 인증 / 인증 후 SPF·DMARC·DKIM 설정 가능 2-bullet.
- **리스트 카드**: 툴바(`DKIM 설정`(검색 앞, 1개 선택 시 활성) · 검색란 · 선택 시 `선택 삭제` · `새로고침` · `총 N개`) + 표(도메인·소유 인증 상태·인증 일시). 그룹 관리 페이지 툴바 패턴(검색 채움 + 선택 시 액션) 적용.
- **AppDomainRegisterDialog**(신규): 루트 도메인 입력 + `검증` 버튼(형식 검증) → 검증 전 `확인` 비활성, "사용 가능한 도메인입니다." 안내.
- **AppDkimSettingsDialog**(신규): DKIM 레코드 인증 카드 — 절차 안내, DNS 호스트 이름·TXT 레코드 값(읽기전용 + `복사`), `인증` 버튼 + 성공 표시, `DKIM 사용 설정` 토글.
- 빌드 → `wrangler pages deploy` (`--commit-message "email domain management page with domain register and DKIM dialogs"`) — 배포 #26. 프로덕션 `https://malgn-noti.pages.dev/sender/domains`·`/home` 200, alias `https://298c40ec.malgn-noti.pages.dev` 200.
- 커밋: `46f18f8 이메일 도메인 관리 페이지 신규 구성` (3 files, +711 −6) → `origin/main` 푸시.

## 산출물

### 신규 (10)
- [app/components/AppFlowCreateDialog.vue](../../app/components/AppFlowCreateDialog.vue)
- [app/components/AppFlowTemplatePickerDialog.vue](../../app/components/AppFlowTemplatePickerDialog.vue)
- [app/components/AppPushButtonDialog.vue](../../app/components/AppPushButtonDialog.vue)
- [app/components/AppPushGroupDialog.vue](../../app/components/AppPushGroupDialog.vue)
- [app/components/AppPushMediaDialog.vue](../../app/components/AppPushMediaDialog.vue)
- [app/components/AppPushRecipientDialog.vue](../../app/components/AppPushRecipientDialog.vue)
- [app/utils/scrollLock.ts](../../app/utils/scrollLock.ts)
- [app/composables/useTemplateToggle.ts](../../app/composables/useTemplateToggle.ts) — §15
- [app/components/AppSenderRegisterDialog.vue](../../app/components/AppSenderRegisterDialog.vue) — §17
- [app/types/sender.ts](../../app/types/sender.ts) — §17

### 수정 (20)
- 6개 발송 페이지(`app/pages/send/{sms,kakao,rcs,email,push,flow}.vue`)
- `app/components/AppAddressBookDialog.vue`, `AppEmailPreview.vue`, `AppEmailTemplateDialog.vue`, `AppFlowManageDialog.vue`, `AppModal.vue`, `AppPhonePreview.vue`, `AppPushPreview.vue`, `AppRcsTemplateDialog.vue`, `AppRecipientCard.vue`, `AppRecipientFormDialog.vue`, `AppSmsTemplateDialog.vue`
- `app/types/template.ts`(EmailTpl·RcsTpl 추가)
- `app/pages/sender/numbers.vue`(§17 발신 번호 관리 페이지 전면 구성)
- §17 타입 에러 정리: `AppKakaoTemplateDialog.vue`, `AppPushRecipientDialog.vue`, `AppPushTemplateDialog.vue`, `KakaoMessageBody.vue`
- `app/pages/sender/brands.vue`(§19 RCS 브랜드 관리 페이지 전면 구성)

### 배포
- #15 — 프로덕션: https://malgn-noti.pages.dev / Alias: https://c4b53baf.malgn-noti.pages.dev
- #16 — 문구 정리 / Alias: https://e22f7472.malgn-noti.pages.dev
- #17 — 문서·가이드 현행화 / Alias: https://c9760142.malgn-noti.pages.dev
- #18 — 문서 stale 매핑 정정 / Alias: https://3f68045a.malgn-noti.pages.dev
- #19 — 발송 조회 페이지 전면 재작업 + btn-sky 제거 / Alias: https://77a6d8df.malgn-noti.pages.dev
- #20 — 통계 페이지 재구성 + 폰트 토큰화 + zoom 제거 / Alias: https://95f36a35.malgn-noti.pages.dev
- #21 — 발송 페이지 템플릿 토글 동작 개선 / Alias: https://e1b4d7da.malgn-noti.pages.dev
- #22 — 주소록 관리 페이지 강화 / Alias: https://57bab931.malgn-noti.pages.dev
- #23 — 발신 번호 관리 페이지 + 등록 마법사 / Alias: https://3c26af5f.malgn-noti.pages.dev
- #24 — 그룹 관리 페이지 + 주소록·그룹 툴바 통일 / Alias: https://8a830019.malgn-noti.pages.dev
- #25 — RCS 브랜드 관리 페이지 / Alias: https://6f271361.malgn-noti.pages.dev
- #26 — 이메일 도메인 관리 페이지 / Alias: https://298c40ec.malgn-noti.pages.dev

### 커밋
- `bd7e07e` 발송 페이지 UX 폴리시 2차 + PUSH 부가항목·플로우 관리 완성
- `428eeca` history: 2026-05-20 작업 이력 추가 (배포 #15)
- `704a1b4` 문구 정리: 발송 설정 라벨 변경 + 띄어쓰기 + 푸터 이메일 오타 (§10, 배포 #16)
- `75ab98c` 문서·디자인 가이드 현행화 (2026-05-18~20 반영) (§11, 배포 #17)
- `f81424b` 문서 정정: USlideover 매핑·구 토큰 예시 현행화 (§12, 배포 #18)
- `d0efe8c` 발송 조회 페이지 목록·검색 필터·다이얼로그 전면 작업 + btn-sky 정리 (§13, 배포 #19)
- `6bc05c6` 통계 페이지 재구성 + 폰트 토큰화 + zoom 스케일 제거 (§14, 배포 #20)
- `93411ae` 발송 페이지 템플릿 토글 동작 개선 — 수신자 유지 + 메시지 stash/복원 (§15, 배포 #21)
- `547dd61` 주소록 관리 페이지 강화 — 등록·일괄등록·그룹이동·채널 발송 (§16, 배포 #22)
- `fe58e2d` 발신 번호 관리 페이지 — 등록 마법사 3단계 + 타입 에러 정리 (§17, 배포 #23)
- `4e88e1f` 주소록·그룹 관리 페이지 보강 (§18, 배포 #24)
- `e3e7a02` RCS 브랜드 관리 페이지 — 연동 흐름 + 브랜드 목록 (§19, 배포 #25)
- `46f18f8` 이메일 도메인 관리 페이지 신규 구성 (§20, 배포 #26)

## 다음 단계 / 한계

- **발신정보·메시지 관리·캠페인·계정/문의·시스템 페이지** — 디자인 핸드오프 미반영 영역. IA만 있고 핸드오프 기반 디자인 미적용.
- **수정 모드에서 푸시 유형 재선택 UI** — 현재 수정 다이얼로그에는 토큰 행 안에서 유형 셀렉트가 노출되지 않음(추가가 막혀 있어 그 안에서 유형만 갈아끼우려면 삭제→재추가 흐름이 필요). 한 칸짜리 인라인 유형 셀렉트로 보강 여지 있음.
- **백엔드 연동 부재** — 모든 다이얼로그 시드 데이터는 목업. NHN API 연동 전이라 저장 후 새로고침하면 휘발됨.
- **드래그 핸들 키보드 접근성** — AppFlowCreateDialog의 행 순서 변경은 마우스 드래그만 지원. ↑/↓ 화살표 키보드 보조가 필요할 수 있음.
- **AppFlowCreateDialog의 placeholder 채널** — 새 행 추가 시 ch=""로 시작하지만 선택 버튼 클릭 시 토스트로 가드만 함. 필드 자체에 빨간 외곽선 등 시각 검증을 더할 수 있음.
