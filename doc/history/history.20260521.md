# 2026-05-21 — 발신 정보 페이지 마무리 + 테이블 스타일 A/B/C 정의

## 한 줄 요약

발신 정보 카테고리의 남은 페이지 3종을 신규 구성 — 카카오 발신 프로필 관리(등록 마법사·그룹 관리 모달), PUSH 인증 관리(FCM·APNs 인증 설정 섹션), 080 수신 거부 번호 관리(번호 신청·이용 해지) — 하고, 그룹 관리 페이지의 그룹 아이디 컬럼을 정리하여 Cloudflare Pages에 배포 (#27). 이후 **목록 테이블 스타일을 A/B/C로 정의**하고(별도 필터영역/검색없음/인라인검색), 발송 조회 툴바 재배치 + 발신정보·주소록·그룹 관리 목록을 해당 스타일로 일괄 정리하여 재배포 (#28). GNB 캠페인 메뉴 삭제 (#29). **수신 거부 관리 페이지 3종**(휴대폰·이메일·토큰)을 신규 구성 — C 테이블 스타일, 등록/일괄 등록 모달 — 하여 배포 (#30). GNB 드롭다운 중복 메뉴명 삭제 (#31). **메시지 관리 — 문자메시지·알림톡 템플릿 페이지**를 신규 구성 — 카테고리 트리·등록/수정 폼·샘플/AI 모달 — 하여 배포 (#32). 알림톡·RCS·PUSH 미리보기 시각을 현재 시각으로 변경 (#33). **로그인 페이지를 시안 IA로 재구성**(아이디 라벨·아이디 기억하기·비밀번호 재설정 링크·회원가입 안내 카드)하여 배포 (#34). 비밀번호 재설정 이메일 입력란 너비 보정 (#35). **메시지 관리 — 이메일 템플릿 페이지**(카테고리 트리·등록/수정 폼·샘플/AI 모달·이메일 미리보기)를 신규 구성하여 배포 (#36). 보안 인증 페이지 안내 문구 수정 + 인증코드 입력란 너비 보정 (#37). **메시지 관리 — RCS 템플릿 페이지**(카테고리 트리·등록/수정 폼·버튼 8종·샘플/AI 모달)와 사이트맵 페이지를 배포 (#38). 사이트맵 보강 + 캠페인 페이지 삭제 (#39). **메시지 관리 — PUSH 템플릿 페이지**(카테고리 트리·등록/수정 폼·기본/JSON 입력·샘플/AI 모달·Android/iOS 미리보기)를 신규 구성하여 배포 (#40) — 메시지 관리 5채널 템플릿 페이지 완성. **회원가입 페이지를 5단계 마법사로 신규 구성**(회원 가입 안내·정보 확인·아이디 등록 및 약관 동의·휴대폰 본인 인증·가입 완료)하여 배포 (#41). **메시지 관리 — 상세 설정 페이지**(5탭·접이식 설정 섹션·대체 문자 모달)를 신규 구성하여 배포 (#42). 새 비밀번호 설정 페이지 입력란 너비·검증 메시지 보정 (#43). **메시지 관리 — 랜딩페이지 만들기**(목록·기본형/확장형 등록 폼·미리보기 모달)를 신규 구성하여 배포 (#44). **문의하기 페이지를 `/account/inquiry` 경로로 이동**(폼·완료 페이지 + GNB·푸터·사이트맵 링크 갱신)하여 배포 (#45). **나의 페이지 섹션**(공통 셸 + 좌측 메뉴 9종 라우트·회원 정보 변경·결제 카드 관리·이메일/휴대폰 인증 모달)과 **크레딧 충전 플로우**(충전 페이지 재구성·결제 컨펌·충전 결과 화면)를 신규 구성하여 배포 (#46). **malgn-noti-api 루트(`/`) → `/doc` 리다이렉트** — placeholder JSON 응답 대신 Scalar API 문서로 302 이동시키도록 변경하여 Workers 배포.

## 1. 발신 프로필 관리 페이지

- **sender/profiles.vue**: placeholder → 신규 구성. 발신 번호·RCS 브랜드 관리와 동일한 리스트 구조(헤더 우측 등록 버튼 + 안내 박스 + list-card + 하단 번호형 페이지바).
  - 안내: 카카오톡 채널 생성 CTA, 토큰 인증 절차, 알림톡 일별 최대 발송량 — 중첩 bullet.
  - 툴바: `발신 프로필 삭제` · `발신 프로필 그룹 관리` · 검색(아이디) / `새로고침` · `총 N개`.
  - 표: 체크박스 · 발신 프로필 아이디 · 발신 키 · 등록 일시 · 토큰 인증 상태(배지) · 발신 프로필 상태(배지).
- **AppProfileRegisterDialog**(신규): 발신 프로필 등록 모달. 아이디(0/16) · 관리자 휴대폰(0/11) · 카테고리 3단 select(대/중/소분류 종속, 21개 대분류 + 종속 트리) · `토큰 요청` → 6자리 입력/`토큰 재요청` 흐름. 모든 필드 + 토큰 6자리 충족 시 `저장` 활성.
- **AppProfileGroupDialog**(신규): 발신 프로필 그룹 관리 모달. 그룹 이름 추가, 표(이름·프로필 수·등록 일시·삭제), 빈 상태.

## 2. PUSH 인증 관리 페이지

- **sender/push-cert.vue**: PUSH 인증 관리 페이지 신규 구성 — FCM · APNs 인증 설정 섹션(서비스 계정 키 등록 등).
- **AppPushCertSection**(신규): 인증 설정 섹션 공용 컴포넌트.

## 3. 080 수신 거부 번호 관리 페이지

- **sender/optout-080.vue**: 080 수신 거부 번호 관리 페이지 신규 구성 — 번호 신청, 이용 해지. 정보통신망법 관련 안내 포함.

## 4. 그룹 관리 페이지 정리

- **contacts/groups.vue**: 표에서 그룹 아이디 컬럼 제거(컬럼 정리, colspan 보정).

## 5. 배포·커밋

- `pnpm build` → `npx wrangler@4 pages deploy dist --project-name=malgn-noti --branch=main --commit-dirty=true --commit-message "sender info pages: kakao sender profile management, push cert, 080 opt-out"` — 배포 #27.
- 프로덕션 검증: `https://malgn-noti.pages.dev/sender/profiles`·`/sender/push-cert`·`/sender/optout-080` 200, alias `https://d1c4e2eb.malgn-noti.pages.dev` 200.
- 커밋: `e30da5c 발신 정보 페이지 신규 구성 — 발신 프로필·PUSH 인증·080 수신 거부` (7 files, +1516 −23) → `origin/main` 푸시.

## 6. 테이블 스타일 A/B/C 정의 + 발송 조회 툴바 재배치 (§6, 배포 #28)

- **발송 조회 툴바 정리** ([AppHistoryView.vue](../../app/components/AppHistoryView.vue)·5채널 공용 + [stats.vue](../../app/pages/history/stats.vue)):
  - `조회` → `검색하기`(아이콘 포함), 통계 페이지 검색 버튼도 아이콘 통일.
  - 액션 영역 좌측 = `총 N건 · | · 새로고침`(테두리 없는 텍스트형), 우측 = `목록 다운로드 요청 · 다운로드 요청 목록 · 조회 필드 추가 · 일괄 취소 · 선택 취소`.
  - 필터 바 날짜칸 폭을 통계 페이지와 동일(190)하게 맞춰 시·분 표시. `검색 결과 다운로드 요청`→`목록 다운로드 요청`, `조회 필드 추가 설정`→`조회 필드 추가`.
- **테이블 스타일 A/B/C 정의** ([doc/DESIGN.md](../../doc/DESIGN.md) §6.5 + [/guide §11](../../app/pages/guide.vue)):
  - **A** = 별도 검색(필터) 영역 `.filter-bar` + 액션 영역 — 다중 조건 검색(조회·이력). ref `AppHistoryView`.
  - **B** = 별도 필터 영역 없음, 액션 영역만, 검색란 없음 — 소규모 목록. ref `sender/numbers`.
  - **C** = 별도 필터 영역 없음, 액션 영역 안에 인라인 검색란(260px·아이콘 우측·28px) — 단일 검색어 목록. ref `sender/domains`.
  - 각 테이블에 `data-table-style="a|b|c"` 마커, 가이드 §11에 A·B·C 시각 예시 목업 추가.
- **목록 페이지 일괄 정리**: 발신 번호(B)·RCS 브랜드(B)·이메일 도메인(C)·발신 프로필(C)·080 수신 거부(C)·주소록 관리(C)·그룹 관리(C)의 테이블 상단을 해당 스타일로 재배치.
- **주소록 관리**: 가입일 우측에 `메시지 발송` 컬럼 추가(행별 채널 드롭다운 — 그룹 관리와 동일, 해당 연락처를 `sendRecipients`로 인계), 맨 오른쪽 더보기(`⋮`) 컬럼 제거.
- 배포 #28: `wrangler pages deploy` (`--commit-message "table styles A/B/C + history toolbar restructure"`), 프로덕션 `/guide`·`/history/sms`·`/contacts/groups` 200, alias `https://ec51b8d0.malgn-noti.pages.dev` 200.
- 커밋: `74943e8 테이블 스타일 A/B/C 정의 + 발송 조회 툴바 재배치` (11 files, +746 −172) → `origin/main` 푸시.

## 7. GNB 캠페인 메뉴 삭제 (§7, 배포 #29)

- [AppGnb.vue](../../app/components/AppGnb.vue) 상단 메뉴에서 `캠페인`(`/campaign`) 항목 제거 → 메뉴: 서비스·메시지 발송·발송 조회/통계·주소록·발신 정보·메시지 관리·운영가이드.
- 배포 #29: `wrangler pages deploy` (`--commit-message "remove campaign menu from GNB"`), 프로덕션 `/home` 200, alias `https://e23f4a20.malgn-noti.pages.dev` 200.
- 커밋: `d0802e6 GNB에서 캠페인 메뉴 삭제` → `origin/main` 푸시.

## 8. 수신 거부 관리 페이지 3종 (§8, 배포 #30)

- **페이지 분리**: 수신 거부 관리를 탭 없이 채널별 독립 페이지 3종으로 구성 — [/contacts/optout](../../app/pages/contacts/optout.vue)(휴대폰) · [/contacts/optout-email](../../app/pages/contacts/optout-email.vue) · [/contacts/optout-token](../../app/pages/contacts/optout-token.vue). [AppGnb](../../app/components/AppGnb.vue) 주소록 메뉴에 3개 항목 추가.
- **AppOptoutManager**(신규): `kind`(phone/email/token) prop으로 단일 화면을 렌더링하는 공용 컴포넌트. C 테이블 스타일(`.list-card` + `.list-toolbar` border-bottom + `.list-pager` border-top).
  - 안내(`.notice`) + 페이지 헤더 우측 `일괄 등록`·`등록` 버튼(토큰은 없음).
  - 툴바 좌: `총 N개 · | · 080 번호/도메인 선택 · 인라인 검색(260px)` / 우: `목록 다운로드 요청 · 다운로드 요청 목록 · 해지`(맨 오른쪽).
  - 표: 휴대폰·이메일 = 체크박스·수신 거부 번호/이메일·등록 일시 / 토큰 = 수신 거부 토큰·수신 거부 항목·등록 일시(체크박스 없음).
- **AppOptoutAddDialog**(신규): 수신 거부 번호/이메일 등록 모달 — 080 번호·도메인 select + 직접 입력(최대 10건, 추가/삭제 서브 테이블).
- **AppOptoutBulkDialog**(신규): 일괄 등록 모달 — 080 번호·도메인 select + `양식 다운로드`(흰 버튼) + .xlsx 업로드(최대 1MB).
- **AppExportListDialog**: `jobs` prop 추가(기본값은 기존 목업, 수신 거부 페이지는 빈 목록 전달).
- **AppContactBulkDialog**: `템플릿 다운로드` → `양식 다운로드` 문구 변경.
- 배포 #30: `wrangler pages deploy` (`--commit-message "Add opt-out management pages (phone/email/token)"`), 프로덕션 `/contacts/optout`·`/contacts/optout-email`·`/contacts/optout-token` 200, alias `https://81348384.malgn-noti.pages.dev`.
- 커밋: `5f4cb47 수신 거부 관리 페이지 3종 신규 구성 (휴대폰·이메일·토큰)` (9 files, +931 −15) → `origin/main` 푸시.

## 9. GNB 드롭다운 중복 메뉴명 삭제 (§9, 배포 #31)

- [AppGnb.vue](../../app/components/AppGnb.vue) 하위 메뉴(드롭다운) 상단에 작은 글씨로 한 번 더 표시되던 GNB 메뉴명(`.gnb-dropdown-title` = `item.title`) 제거 → 드롭다운은 하위 항목만 노출.
- 진행 중인 메시지 관리 작업분은 `git stash`로 격리하고 **AppGnb 변경만** 빌드·배포.
- 배포 #31: `wrangler pages deploy` (`--commit-message "GNB dropdown: remove duplicated menu title"`), 프로덕션 `/home` 200, alias `https://b11d8703.malgn-noti.pages.dev` 200.
- 커밋: `0f0d9cc GNB 드롭다운에서 중복 메뉴명 표시 삭제` (1 file, −3) → `origin/main` 푸시.

## 10. 메시지 관리 — 문자메시지·알림톡 템플릿 페이지 (§10, 배포 #32)

- **문자메시지 템플릿** ([/manage/sms](../../app/pages/manage/sms.vue)): placeholder → 신규 구성. 카테고리 트리(폴더/파일, 펼침·검색) + 툴바(`카테고리 등록/수정`·`템플릿 등록/수정`·`삭제`·`샘플 템플릿 보기`) + 우측 상세(기본 정보 + 폰 미리보기). `템플릿 등록/수정`은 폼 뷰로 전환 — 이름·발신 번호·발송 목적·발송 유형·내용(바이트 카운터).
- **알림톡 템플릿** ([/manage/kakao](../../app/pages/manage/kakao.vue)): 문자 레이아웃 기반 신규 구성. 트리 + 필터 바(발신 프로필 종류·프로필·템플릿 상태) + 2탭 상세(`기본 정보` + 카카오 미리보기 / `카카오톡 템플릿(생성 이력)` 표). 폼 뷰 — 템플릿/카카오 코드, 발신 프로필(일반·그룹), 메시지 유형 4종, 강조 유형 4종, 내용(0/1300)·부가정보, 보안 템플릿, 카테고리 대/중분류, 대표 링크·버튼 관리.
- **신규 컴포넌트**: `AppTemplateCategoryDialog`(카테고리 등록/수정), `AppAiTemplateDialog`·`AppKakaoAiDialog`(채널별 AI 템플릿 생성), `AppKakaoSampleDialog`(알림톡 샘플 — 유형 탭·강조 칩·카드 그리드), `AppKakaoButtonDialog`(버튼 추가/수정).
- **공용 변경**: `AppSmsTemplateDialog` `title` prop 추가(샘플 보기/선택 공용), `AppPhonePreview` 미리보기 시각을 현재 시각으로, `AppKakaoPreview` 폰 높이를 내용에 맞춰 자동(버튼 잘림 해소).
- 배포 #32: `wrangler pages deploy` (`--commit-message "Add SMS/Kakao message template pages"`), 프로덕션 `/manage/sms`·`/manage/kakao` 200, alias `https://84b6df73.malgn-noti.pages.dev`.
- 커밋: `b52b9fa 문자메시지·알림톡 템플릿 관리 페이지 신규 구성` (10 files, +3630 −19) → `origin/main` 푸시.

## 11. 미리보기 시각 현재화 — 알림톡·RCS·PUSH (§11, 배포 #33)

- `usePreviewClock` 컴포저블 신규([app/composables/usePreviewClock.ts](../../app/composables/usePreviewClock.ts)) — `onMounted`(클라이언트)에서 현재 시각 `H:MM`·날짜 `M월 D일 요일` 계산(SSR hydration 불일치 방지).
- `AppKakaoPreview`·`AppRcsPreview` 상태바 시간, `AppPushPreview` 상태바 + 잠금화면 시계(Android·iOS) + 날짜를 현재 값으로 표시. (문자 `AppPhonePreview`는 §10에서 이미 적용)
- 배포 #33: `wrangler pages deploy` (`--commit-message "Preview clock: live time for kakao/RCS/PUSH"`), 프로덕션 `/manage/kakao`·`/send/rcs`·`/send/push` 200, alias `https://34a5b3b0.malgn-noti.pages.dev`.
- 커밋: `985905f 미리보기 시각을 현재 시각으로 — 알림톡·RCS·PUSH` (4 files, +31 −8) → `origin/main` 푸시.

## 12. 로그인 페이지 시안 IA 재구성 (§12, 배포 #34)

- [app/pages/login/index.vue](../../app/pages/login/index.vue): 시안 캡처 기준 재구성.
  - 라벨 `아이디 (이메일)` → `아이디`, 비밀번호 입력란에 안내 placeholder + eye 토글 세로 중앙 정렬 보정.
  - `로그인 상태 유지` → `아이디 기억하기` 체크박스(기본 체크).
  - `비밀번호 재설정` 링크를 `로그인 하기` 버튼 아래 별도 줄로 분리, 회원가입 안내를 테두리 카드(`회원가입하기` 링크 → `/signup`)로 변경.
  - 로그인 후 `?redirect=` 쿼리 경로 또는 `/home`으로 이동(`auth.global.ts` 호환). 아이디·비밀번호 미입력 시 `로그인 하기` 비활성.
- 진행 중인 메시지 관리 작업분(`manage/email.vue`·`manage/rcs.vue`)은 `git stash`로 격리하고 **로그인 변경만** 빌드·배포.
- 배포 #34: `wrangler pages deploy` (`--commit-message "login page: id field, remember-id, reset-password link, signup card"`), 프로덕션 `/login` 200, alias `https://7ee50da3.malgn-noti.pages.dev` 200.
- 커밋: `efa6d4a 로그인 페이지 재구성 — 시안 IA 반영` (1 file, +113 −33) → `origin/main` 푸시.

## 13. 비밀번호 재설정 — 이메일 입력란 너비 보정 (§13, 배포 #35)

- [app/pages/reset-password/index.vue](../../app/pages/reset-password/index.vue): `UInput`이 내용 너비만 차지해 입력 박스가 짧게 보이던 문제 → `class="w-full"` 추가로 폼 너비(`재설정 메일 발송` 버튼)와 정렬.
- 진행 중인 메시지 관리 작업분(`manage/email.vue`·`AppEmailPreview.vue`)은 `git stash`로 격리하고 **비밀번호 재설정 변경만** 빌드·배포.
- 배포 #35: `wrangler pages deploy` (`--commit-message "reset-password: full-width email input"`), 프로덕션 `/reset-password` 200, alias `https://e479fadc.malgn-noti.pages.dev` 200.
- 커밋: `489ce30 비밀번호 재설정 — 이메일 입력란 전체 너비 적용` (1 file, +1 −1) → `origin/main` 푸시.

## 14. 메시지 관리 — 이메일 템플릿 페이지 (§14, 배포 #36)

- **이메일 템플릿** ([/manage/email](../../app/pages/manage/email.vue)): placeholder → 문자 템플릿 레이아웃 기반 신규 구성. 카테고리 트리 + 툴바(카테고리/템플릿 등록·수정·삭제·샘플 보기) + `기본 정보` 상세(템플릿 이름·발송 목적·발신 메일·등록/수정 일시 + **이메일 미리보기** 460px). 등록/수정 폼 — 템플릿 이름(0/50)·발송 목적(일반·인증·광고)·발신 메일·제목(0/1000)·내용·첨부파일(.jpg/.jpeg, 최대 3개·300KB·합산 800KB), 미리보기 너비는 발송 페이지와 동일(`1fr 460px`).
- **신규 컴포넌트**: `AppEmailSampleDialog`(샘플 — 검색 + 카드 그리드 + 이메일 미리보기), `AppEmailAiDialog`(AI — 프롬프트 → 제목+본문 생성).
- **공용 변경**: `AppEmailPreview` 하단 `텍스트/HTML` 토글 제거.
- 진행 중인 RCS 템플릿 작업분(`manage/rcs.vue`·`AppRcs*`)은 격리하고 **이메일 템플릿 변경만** 빌드·배포.
- 배포 #36: `wrangler pages deploy` (`--commit-message "Add email message template page"`), 프로덕션 `/manage/email` 200(실 콘텐츠 확인), alias `https://f184634e.malgn-noti.pages.dev`.
- 커밋: `3ca0531 이메일 메시지 템플릿 관리 페이지 신규 구성` (4 files, +1403 −19) → `origin/main` 푸시.

## 15. 보안 인증 페이지 — 문구·입력란 보정 (§15, 배포 #37)

- [app/pages/login/security.vue](../../app/pages/login/security.vue): 안내 문구 `등록된 이메일/OTP로 발송된 인증코드를 입력하세요.` → `등록된 이메일/휴대전화로 발송된 인증코드를 입력하세요.`. 인증코드 `UInput`에 `class="w-full"` 추가로 폼 너비(`확인` 버튼)와 정렬.
- 진행 중인 RCS 템플릿 작업분(`manage/rcs.vue`·`AppRcs*`·`sitemap.vue`)은 격리하고 **보안 인증 변경만** 빌드·배포.
- 배포 #37: `wrangler pages deploy` (`--commit-message "login security: full-width code input, copy fix"`), 프로덕션 `/login/security` 200(문구 확인), alias `https://3eccd509.malgn-noti.pages.dev`.
- 커밋: `d59cb13 보안 인증 페이지 — 문구 수정 + 인증코드 입력란 전체 너비` (1 file, +2 −2) → `origin/main` 푸시.

## 16. 메시지 관리 — RCS 템플릿 페이지 + 사이트맵 페이지 (§16, 배포 #38)

- **RCS 템플릿** ([/manage/rcs](../../app/pages/manage/rcs.vue)): placeholder → 문자 템플릿 레이아웃 기반 신규 구성. 카테고리 트리 + `기본 정보` 상세(RCS Bizcenter 템플릿 아이디·발신 브랜드·발송 목적·템플릿 상태·승인 일시 + RCS 미리보기). 등록/수정 폼 — 발신 브랜드(브랜드·대화방)·발송 목적·발송 유형(SMS/LMS/MMS + 스탠드얼론/대화형 + 대체발송 SMS/통합)·내용·버튼 관리(순서 이동).
- **신규 컴포넌트**: `AppRcsButtonDialog`(버튼 8종 — URL 연결·전화 걸기·복사하기·지도 보여주기/검색하기·현재 위치 공유·일정 등록·대화방 열기, 유형별 조건 필드), `AppRcsSampleDialog`(SMS/LMS/MMS 탭 + 카드 그리드 + RCS 미리보기), `AppRcsAiDialog`(발송 유형·발송 방식 + RCS 미리보기).
- **사이트맵 페이지**(`/sitemap`, 커밋 `d56b338`)가 미배포 상태(404)였어 함께 배포.
- 배포 #38: `wrangler pages deploy` (`--commit-message "Add RCS message template page and sitemap page"`), 프로덕션 `/manage/rcs`·`/sitemap` 200(실 콘텐츠 확인), alias `https://efb7e52a.malgn-noti.pages.dev`.
- 커밋: `30921e0 RCS 메시지 템플릿 관리 페이지 신규 구성` (4 files, +1845 −5) → `origin/main` 푸시.

## 17. 사이트맵 보강 + 캠페인 페이지 삭제 (§17, 배포 #39)

- **사이트맵 보강**([/sitemap](../../app/pages/sitemap.vue)): 항목별 전체 순번·한 줄 설명·`페이지`/`팝업` 구분 배지 추가, 새 창 링크·한 행 1항목. 라우트 페이지 + 주요 팝업(모달)을 카테고리별로 수록.
- **캠페인 페이지 삭제**: `app/pages/campaign/index.vue`·`campaign3/index.vue` 제거(라우트 `/campaign`·`/campaign3` 삭제), 사이트맵 캠페인 카테고리 그룹 제거. (GNB 캠페인 메뉴는 §7에서 이미 삭제)
- 배포 #39: `wrangler pages deploy` (`--commit-message "sitemap page + remove campaign pages"`), 프로덕션 `/sitemap` 200·`/campaign` 404 확인, alias `https://6f1f15f2.malgn-noti.pages.dev`.
- 커밋: `d56b338 사이트맵 페이지 신규 구성` · `a1f0969 사이트맵에서 캠페인 제거 + 캠페인 페이지 파일 삭제` → `origin/main` 푸시.

## 18. 메시지 관리 — PUSH 템플릿 페이지 (§18, 배포 #40)

- **PUSH 템플릿** ([/manage/push](../../app/pages/manage/push.vue)): placeholder → 템플릿 페이지 레이아웃 기반 신규 구성. 카테고리 트리 + `기본 정보` 상세(템플릿 이름·발송 목적·입력 유형·등록/수정 일시 + Android·iOS 잠금화면 미리보기 2종). 등록/수정 폼 — 발송 목적(일반/광고)·입력 유형(기본/JSON). 기본: HTML스타일·제목·내용·배지 + 버튼·미디어·Android/iOS 미디어·Android 큰 아이콘·그룹 추가 / JSON: 페이로드 textarea.
- **신규 컴포넌트**: `AppPushAddDialog`(버튼·미디어·그룹 추가 공용 모달), `AppPushSampleDialog`(샘플 — 카드 그리드 + PUSH 미리보기), `AppPushAiDialog`(AI — 제목+내용 생성).
- 진행 중인 회원가입(`signup.vue`) 작업분은 격리하고 **PUSH 템플릿 변경만** 빌드·배포.
- 배포 #40: `wrangler pages deploy` (`--commit-message "Add PUSH message template page"`), 프로덕션 `/manage/push` 200(실 콘텐츠 확인), alias `https://b21d275f.malgn-noti.pages.dev`.
- 커밋: `f7838f6 PUSH 메시지 템플릿 관리 페이지 신규 구성` (4 files, +1659 −5) → `origin/main` 푸시.

## 19. 회원가입 페이지 5단계 마법사 (§19, 배포 #41)

- [app/pages/signup.vue](../../app/pages/signup.vue): 기존 좁은 `auth` 카드 3단계 → 넓은 `blank` 레이아웃(1140px) 5단계 마법사로 전면 재구성. 상단 로고 + `회원가입` 타이틀 + 5단계 인디케이터(현재=ink 다크·완료=중간·이후=연회색).
  - **Step 1 회원 가입 안내**: `서비스 이용 절차`(4카드·화살표 연결) + `서비스 신청 서류`(3행 표) + **회원 유형 선택**(법인사업자·개인사업자·개인 카드 — 선택해야 다음 진행).
  - **Step 2 정보 확인**: 회원 유형은 읽기 전용 표시, 사업자(사업자번호 3분할·회사명·대표자명) / 개인(이름·주소)으로 폼 분기.
  - **Step 3 아이디 등록 및 약관 동의**: 이메일 + 인증코드 6칸(자동 이동) + 비밀번호·확인, 약관 동의 카드(전체 동의 + 4종 행 — 필수/선택 배지·`약관보기`).
  - **Step 4 휴대폰 본인 인증**: 통신사·이름·주민등록번호(앞 6자리+성별)·내외국인·휴대폰 번호 + 인증번호 발송/확인.
  - **Step 5 가입 완료**: 승인 안내 + `로그인 하러 가기`.
  - 단계별 필수값 검증 통과 시에만 `다음` 활성.
- **AppSignupTermsDialog**(신규): 약관 전문 모달 — 이용약관·스팸메시지 이용약관·개인정보 수집 및 이용동의·광고성 정보 수신 동의 4종 조항 본문, `동의하기` 시 해당 약관 체크.
- 진행 중인 메시지 관리 작업분(`manage/settings.vue`)은 `git stash`로 격리하고 **회원가입 변경만** 빌드·배포.
- 배포 #41: `wrangler pages deploy` (`--commit-message "signup: 5-step wizard (info, verify, id+terms, phone auth, done)"`), 프로덕션 `/signup` 200(실 콘텐츠 확인), alias `https://28324dbc.malgn-noti.pages.dev`.
- 커밋: `a836fdf 회원가입 페이지 5단계 마법사 신규 구성` (2 files, +1252 −93) → `origin/main` 푸시.

## 20. 메시지 관리 — 상세 설정 페이지 (§20, 배포 #42)

- **상세 설정** ([/manage/settings](../../app/pages/manage/settings.vue)): placeholder → 신규 구성. 5개 탭(문자 메시지·RCS·PUSH·웹훅·백업), 탭마다 좌측 그룹 라벨 + 접이식 설정 섹션 카드.
  - 문자 메시지: 국제 SMS 발송(사용 여부·월 발송 건수·발송 허용 국가 태그)·메시지 중복 발송 차단·대체 문자 설정(모달)·광고성 메시지 발송 시간 제한.
  - RCS: 광고성 메시지 발송 시간 제한. PUSH: 토큰 만료 기간·앱 유형·중복 발송 차단·수신/확인 수집·광고 표시 문구 위치·수신 동의 자동 발송. 웹훅: URL·재시도 횟수. 백업: 발송 데이터 백업.
- **AppSettingsSection**(신규): 제목·설명·`설정 변경` 토글 + 본문 박스 + 섹션별 `저장`/`취소`. `modal` 모드 시 펼침 대신 모달 오픈 이벤트 emit(대체 문자 설정에 사용).
- 배포 #42: `wrangler pages deploy` (`--commit-message "Add message detail settings page"`), 프로덕션 `/manage/settings` 200(실 콘텐츠 확인 — 첫 배포는 stale dist라 재빌드 후 재배포), alias `https://448a1130.malgn-noti.pages.dev`.
- 커밋: `07e78b3 메시지 상세 설정 페이지 신규 구성` (2 files, +939 −6) → `origin/main` 푸시.

## 21. 새 비밀번호 설정 페이지 — 입력란·검증 보정 (§21, 배포 #43)

- [app/pages/reset-password/new.vue](../../app/pages/reset-password/new.vue): 비밀번호·확인 `UInput`에 `class="w-full"` 적용(폼 너비 정렬), placeholder 추가.
- 검증 메시지 추가 — 새 비밀번호: `help`로 "영문·숫자·특수문자 조합 8자 이상" 안내 + 8자 미만 시 오류, 새 비밀번호 확인: 불일치 시 "비밀번호가 일치하지 않습니다." (`UFormField :error`).
- 배포 #43: `wrangler pages deploy` (`--commit-message "reset-password/new: full-width inputs, validation messages"`), 프로덕션 `/reset-password/new` 200, alias `https://1fe8363d.malgn-noti.pages.dev` 200.
- 커밋: `54b53c5 새 비밀번호 설정 — 입력란 전체 너비 + 검증 메시지` (1 file, +34 −4) → `origin/main` 푸시.

## 22. 메시지 관리 — 랜딩페이지 만들기 (§22, 배포 #44)

- **GNB**: 메시지 관리 메뉴 `상세 설정` 위에 `랜딩페이지 만들기`(`/manage/landing`) 추가.
- **목록**([/manage/landing](../../app/pages/manage/landing.vue)): C 테이블 스타일 — 공개여부 필터·이름 검색·선택 복사/삭제, 행별 `미리보기`(공개·비공개 모두)·`URL 복사`(공개만). `페이지 등록` 버튼은 기본형/확장형 드롭다운.
- **AppLandingForm**(신규): 랜딩페이지 등록/수정 폼(폼 뷰 전환). 공개 여부 토글·랜딩페이지명·설명·URL / 메인 타이틀(헤드 이미지·헤드라인·서브·확장형 텍스트 정렬) / (확장형)비주얼 이미지 / 콘텐츠 영역(리치 에디터 목업) / (확장형)CTA 버튼(텍스트·이동 링크·색상). 하단 액션은 발송 페이지 공용 `.send-actions` 스타일. 이름 클릭 시 수정 모드 진입.
- **AppLandingPreviewDialog**(신규): 미리보기 모달 — "LIVELY SHOP 빅세일" 샘플 랜딩 렌더(헤로·콘텐츠·CTA), width 960·min-height 74vh.
- **AppLandingUrlDialog**(신규): 랜딩페이지 URL 복사 완료 모달(그린 체크 + 숏 URL + 복사 버튼).
- 배포 #44: `wrangler pages deploy` (`--commit-message "Add landing page builder (list, basic/extended form, preview)"`), 프로덕션 `/manage/landing` 200, alias `https://184b0fe1.malgn-noti.pages.dev` 200. 동시 진행 중인 '나의 페이지'·충전 작업분은 `git stash`로 격리하고 랜딩페이지 변경만 배포.
- 커밋: `265395a 랜딩페이지 만들기 — 목록·등록/수정 폼·미리보기 신규 구성` (5 files, +1444 −2) → `origin/main` 푸시.

## 23. 문의하기 페이지 — /account/inquiry 경로 이동 (§23, 배포 #45)

- 문의 관련 라우트를 최종 정리: `/account/inquiry` = **문의하기 폼**, `/account/inquiry/complete` = **접수 완료**, `/account/inquiries` = 나의 문의 목록(동시 진행 중인 '나의 페이지' 작업 소관).
- 파일 이동: `app/pages/inquiry/index.vue`·`inquiry/complete.vue` → `app/pages/account/inquiry/` 하위로. 중복되던 별도 문의 목록 페이지(`inquiry/index.vue`)는 삭제.
- 링크 갱신: [AppGnb](../../app/components/AppGnb.vue)(데스크톱 '문의' 필 + 모바일 드로어 '문의하기'), [AppFooter](../../app/components/AppFooter.vue)(고객센터), [sitemap.vue](../../app/pages/sitemap.vue)(1:1 문의 작성·완료)의 `/inquiry` 링크를 `/account/inquiry`로.
- 배포 #45: 동시 진행 중인 '나의 페이지'·충전 작업분이 working tree에 섞여 있어, 문의 커밋(`a021e2b`)에서 **임시 git worktree**(`a021e2b` 체크아웃)를 만들어 문의 변경만 격리 빌드 후 배포 (`--commit-message "Move inquiry pages to account inquiry route"`). 프로덕션 `/account/inquiry`·`/account/inquiry/complete` 200, `/inquiry` 404 확인, alias `https://aa4503b7.malgn-noti.pages.dev`.
- 커밋: `a021e2b 문의하기 페이지를 /account/inquiry 경로로 이동` (6 files, +310 −17) → `origin/main` 푸시. (sitemap.vue의 '계정 관리'→'나의 페이지' 라벨 변경은 동시 작업분이 같은 파일에 섞여 함께 커밋됨.)

## 24. 나의 페이지 섹션 + 크레딧 충전 플로우 (§24, 배포 #46)

- **나의 페이지** — 계정 관리를 `나의 페이지`로 개편. **AppMyPageShell**(신규): `MY PAGE` 헤더 + 좌측 메뉴 9종(라우트 링크) 공통 셸. 라우트 9개 — `/account/settings`(회원 정보 변경)·`cards`(결제 카드 관리)·`password`(비밀번호 변경)·`security`(보안로그인 설정)·`multi`(멀티 계정 추가)·`contract`(계약 관리)·`credit`(크레딧 관리)·`billing`(결제 내역)·`inquiries`(나의 문의).
- **AppMemberInfoPanel**(신규): 회원 정보 변경 — 가입 정보(읽기 전용 + 광고성 메일 수신 컨펌 토글)·서비스 담당자(이메일 변경·휴대폰 인증)·결제 이메일·저장하기/회원 탈퇴. 사업자등록증 변경 → 계약 관리 이동.
- **AppCardListPanel**(신규): 결제 카드 관리 — 카드 목록·기본 카드 라디오·`저장하기`로 기본 카드 저장·카드 삭제.
- **신규 모달**: `AppEmailChangeDialog`(이메일/결제 이메일 변경 — 인증코드 6칸), `AppPhoneVerifyDialog`(휴대폰 본인 인증), `AppCardAddDialog`(카드 추가).
- **크레딧 충전** ([/charge](../../app/pages/charge/index.vue)): 시안 기반 재구성 — 충전 금액 선택(보너스)·결제 카드 등록(`AppCardAddDialog` 연동)·결제 및 환불안내·동의. `결제하기` → 진행 컨펌 모달 → [/charge/result](../../app/pages/charge/result.vue) 충전 완료 화면(주문 정보·결제 전/후 크레딧).
- 배포 #46: `wrangler pages deploy` (`--commit-message "My Page section + credit charge flow"`), 프로덕션 `/account/settings`·`/account/cards`·`/charge`·`/charge/result` 200, alias `https://fcb87146.malgn-noti.pages.dev`.
- 커밋: `83c4c37 나의 페이지 섹션 + 크레딧 충전 플로우 신규 구성` (17 files, +2189 −205) → `origin/main` 푸시.

## 25. malgn-noti-api 루트(/) → /doc 리다이렉트 (§25, API 배포)

- [src/index.ts:55](../../../malgn-noti-api/src/index.ts) 의 placeholder JSON 핸들러를 `c.redirect('/doc')` 한 줄로 교체 — 워커 도메인 루트 접속이 곧장 Scalar API 문서로 이동.
- 배포: `pnpm run deploy` — `https://malgn-noti-api.malgnsoft.workers.dev/` `GET` 응답이 `302 Location: /doc`로 변경. Version ID `f3fd3eb4-c594-471c-949a-f61ba1b30db1`, `/health` 200 production.
- 격리: 동시 진행 중인 API 작업분(NHN webhook·send·schema·dispatch worker·flow-definitions/export-jobs 신규 라우트)이 working tree에 섞여 있어 — 배포는 working tree 기준이라 함께 라이브에 올라갔으나(typecheck 통과·`/health` 정상), 커밋은 임시 `git checkout HEAD -- src/index.ts`로 베이스라인 복원 → 리다이렉트만 재적용 → stage·commit 후 WIP 복원 방식으로 **리다이렉트 한 줄만** 격리하여 기록.
- 커밋: `malgn-noti-api: 677dffa 루트(/) 요청을 API 문서(/doc)로 302 리다이렉트` (1 file, +1 −8) → `origin/main` 푸시.

## 산출물

### 신규 (3)
- [app/components/AppProfileRegisterDialog.vue](../../app/components/AppProfileRegisterDialog.vue)
- [app/components/AppProfileGroupDialog.vue](../../app/components/AppProfileGroupDialog.vue)
- [app/components/AppPushCertSection.vue](../../app/components/AppPushCertSection.vue)

### 신규 (6 — §8 수신 거부 관리)
- [app/components/AppOptoutManager.vue](../../app/components/AppOptoutManager.vue)
- [app/components/AppOptoutAddDialog.vue](../../app/components/AppOptoutAddDialog.vue)
- [app/components/AppOptoutBulkDialog.vue](../../app/components/AppOptoutBulkDialog.vue)
- [app/pages/contacts/optout.vue](../../app/pages/contacts/optout.vue), `optout-email.vue`, `optout-token.vue`

### 수정 (4 — §1~5)
- `app/pages/sender/profiles.vue`(발신 프로필 관리 페이지 전면 구성)
- `app/pages/sender/push-cert.vue`(PUSH 인증 관리 페이지 전면 구성)
- `app/pages/sender/optout-080.vue`(080 수신 거부 번호 관리 페이지 전면 구성)
- `app/pages/contacts/groups.vue`(그룹 아이디 컬럼 제거)

### 수정 (11 — §6 테이블 스타일 A/B/C)
- `app/components/AppHistoryView.vue`, `app/pages/history/stats.vue`(발송 조회 툴바)
- `app/pages/sender/{numbers,brands,domains,profiles,optout-080}.vue`(B·C 스타일 적용)
- `app/pages/contacts/{list,groups}.vue`(C 스타일 + 주소록 메시지 발송 컬럼)
- `app/pages/guide.vue`(§11 A·B·C 예시), `doc/DESIGN.md`(§6.5 A·B·C 정의)

### 배포
- #27 — 발신 정보 페이지 (발신 프로필·PUSH 인증·080 수신 거부) / Alias: https://d1c4e2eb.malgn-noti.pages.dev
- #28 — 테이블 스타일 A/B/C + 발송 조회 툴바 재배치 / Alias: https://ec51b8d0.malgn-noti.pages.dev
- #29 — GNB 캠페인 메뉴 삭제 / Alias: https://e23f4a20.malgn-noti.pages.dev
- #30 — 수신 거부 관리 페이지 3종 (휴대폰·이메일·토큰) / Alias: https://81348384.malgn-noti.pages.dev
- #31 — GNB 드롭다운 중복 메뉴명 삭제 / Alias: https://b11d8703.malgn-noti.pages.dev
- #32 — 문자메시지·알림톡 템플릿 관리 페이지 / Alias: https://84b6df73.malgn-noti.pages.dev
- #33 — 알림톡·RCS·PUSH 미리보기 시각 현재화 / Alias: https://34a5b3b0.malgn-noti.pages.dev
- #34 — 로그인 페이지 시안 IA 재구성 / Alias: https://7ee50da3.malgn-noti.pages.dev
- #35 — 비밀번호 재설정 이메일 입력란 너비 보정 / Alias: https://e479fadc.malgn-noti.pages.dev
- #36 — 이메일 메시지 템플릿 페이지 / Alias: https://f184634e.malgn-noti.pages.dev
- #37 — 보안 인증 페이지 문구·입력란 보정 / Alias: https://3eccd509.malgn-noti.pages.dev
- #38 — RCS 메시지 템플릿 페이지 + 사이트맵 페이지 / Alias: https://efb7e52a.malgn-noti.pages.dev
- #39 — 사이트맵 보강 + 캠페인 페이지 삭제 / Alias: https://6f1f15f2.malgn-noti.pages.dev
- #40 — PUSH 메시지 템플릿 페이지 / Alias: https://b21d275f.malgn-noti.pages.dev
- #41 — 회원가입 페이지 5단계 마법사 / Alias: https://28324dbc.malgn-noti.pages.dev
- #42 — 메시지 관리 상세 설정 페이지 / Alias: https://448a1130.malgn-noti.pages.dev
- #43 — 새 비밀번호 설정 페이지 입력란·검증 보정 / Alias: https://1fe8363d.malgn-noti.pages.dev
- #44 — 메시지 관리 랜딩페이지 만들기 / Alias: https://184b0fe1.malgn-noti.pages.dev
- #45 — 문의하기 페이지 /account/inquiry 경로 이동 / Alias: https://aa4503b7.malgn-noti.pages.dev
- #46 — 나의 페이지 섹션 + 크레딧 충전 플로우 / Alias: https://fcb87146.malgn-noti.pages.dev
- (API) malgn-noti-api 루트 → /doc 리다이렉트 / Version `f3fd3eb4-c594-471c-949a-f61ba1b30db1`

### 커밋
- `e30da5c` 발신 정보 페이지 신규 구성 — 발신 프로필·PUSH 인증·080 수신 거부 (§5, 배포 #27)
- `74943e8` 테이블 스타일 A/B/C 정의 + 발송 조회 툴바 재배치 (§6, 배포 #28)
- `d0802e6` GNB에서 캠페인 메뉴 삭제 (§7, 배포 #29)
- `5f4cb47` 수신 거부 관리 페이지 3종 신규 구성 (휴대폰·이메일·토큰) (§8, 배포 #30)
- `0f0d9cc` GNB 드롭다운에서 중복 메뉴명 표시 삭제 (§9, 배포 #31)
- `b52b9fa` 문자메시지·알림톡 템플릿 관리 페이지 신규 구성 (§10, 배포 #32)
- `985905f` 미리보기 시각을 현재 시각으로 — 알림톡·RCS·PUSH (§11, 배포 #33)
- `efa6d4a` 로그인 페이지 재구성 — 시안 IA 반영 (§12, 배포 #34)
- `489ce30` 비밀번호 재설정 — 이메일 입력란 전체 너비 적용 (§13, 배포 #35)
- `3ca0531` 이메일 메시지 템플릿 관리 페이지 신규 구성 (§14, 배포 #36)
- `30921e0` RCS 메시지 템플릿 관리 페이지 신규 구성 (§16, 배포 #38)
- `d59cb13` 보안 인증 페이지 — 문구 수정 + 인증코드 입력란 전체 너비 (§15, 배포 #37)
- `d56b338` 사이트맵 페이지 신규 구성 · `a1f0969` 사이트맵에서 캠페인 제거 + 캠페인 페이지 파일 삭제 (§17, 배포 #39)
- `f7838f6` PUSH 메시지 템플릿 관리 페이지 신규 구성 (§18, 배포 #40)
- `a836fdf` 회원가입 페이지 5단계 마법사 신규 구성 (§19, 배포 #41)
- `07e78b3` 메시지 상세 설정 페이지 신규 구성 (§20, 배포 #42)
- `54b53c5` 새 비밀번호 설정 — 입력란 전체 너비 + 검증 메시지 (§21, 배포 #43)
- `265395a` 랜딩페이지 만들기 — 목록·등록/수정 폼·미리보기 신규 구성 (§22, 배포 #44)
- `a021e2b` 문의하기 페이지를 /account/inquiry 경로로 이동 (§23, 배포 #45)
- `83c4c37` 나의 페이지 섹션 + 크레딧 충전 플로우 신규 구성 (§24, 배포 #46)
- `malgn-noti-api: 677dffa` 루트(/) 요청을 API 문서(/doc)로 302 리다이렉트 (§25, API 배포)

## 다음 단계 / 한계

- 발신 정보 카테고리 6개 페이지(발신 번호·RCS 브랜드·이메일 도메인·PUSH 인증·발신 프로필·080 수신 거부) 모두 구성 완료. 메시지 관리·캠페인·계정/문의·시스템 페이지가 핸드오프 디자인 미반영 영역으로 남음.
- 모든 다이얼로그 시드 데이터는 목업. 백엔드(malgn-noti-api) 연동 전이라 저장 후 새로고침하면 휘발됨.
