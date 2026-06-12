# 2026-06-10 작업 이력

> **한 줄 요약**: `malgn-noti-mng` WBS 전체 화면 스크롤 동작을 solsol 방식(GNB·상단 접힘)으로 교체 + 스텝별 비중 표시·기준일 클릭 오늘 점프 + 블루프린트 현행화·스타터 zip 재패키징 + `/docs/board` 빈 본문 버그 수정. `malgn-noti-admin` 고객사 상세에 **발신정보 6테이블 섹션**(Figma `Deatail.png` 매칭) 추가 + **고객사 그룹(주소록) 페이지** 개발(스텁→목록·모달 2종) + **고객사 상세 전면 재구성(KPI 헤더+7탭+메모 패널)·단가 모달·로그인 이력·탈퇴 계정**·배포. + **멀티에이전트 개발팀(8역) 구성**해 WBS 김도형 이번 주(6/8~14) 작업을 14태스크로 일괄 처리 — `malgn-noti-api` 크레딧 차감 결선·발송 취소/환불·고객사 statusReason 감사로그·비번 재설정 API + schema 라이브 정합(캠페인·파티션 인덱스·감사로그) + 사용자단 인증 3페이지 + 화면설계서 9종 + QA typecheck 5게이트 GREEN. **4레포 14커밋 origin/main push**. + **2차 멀티에이전트팀(`auth-member-dev`, tmux 분할 패널 6역)** — 회원·인증 도메인을 사용자단·관리자단·API에 걸쳐 풀스택 구현: 로그인 2FA·비번 변경·회원 탈퇴(사용자단), 회원관리 4페이지 실 API(관리자단), 2FA·`/me/*`·관리자 accounts API(백엔드). QA 정적 cross-check로 **계약 6/6 GREEN**·회귀 0. 3개 코드 레포 분리 커밋·push.

---

## 1. mng — WBS 풀스크린 스크롤을 solsol 방식으로 교체

**결정**: 직전에 적용한 이중 스크롤(sticky pane: 페이지 스크롤로 GNB·topbar를 밀어낸 뒤 간트 내부 스크롤로 전환)은 두 스크롤 컨텍스트 전환이 어색. 로컬 `solsol-mng` 소스를 직접 확인해 **간트 단일 스크롤 + 스크롤 다운 시 GNB·상단 부드럽게 접힘** 방식으로 교체.

**코드**:
- `app/pages/wbs.vue`: `.wbs-pane`(sticky) 제거 → `.wbsx` full-height(`calc(100vh - 56px)`) 단일 내부 스크롤 복원. 간트 `scrollTop > 72`에서 공유 상태 `useState('wbsChromeHidden')` 토글, 스크롤 업(4px) 시 해제. `.chrome-collapsed`에서 `topbar`(`max-height`)·`.wbsx`(`height:100vh`) transition 접힘.
- `app/layouts/default.vue`: `/wbs`에서 GNB도 `wbsChromeHidden` 연동으로 `height` transition 접힘(`gnb-hidden`), 푸터 숨김 유지.

## 2. mng — WBS 스텝 비중 표시 + 기준일 클릭 오늘 점프

- **스텝 비중**: 스텝 행 표기를 현황판 단계 헤더와 동일하게 `개수 · 비중 N% · 진행 N%`로 변경(`stepWeight()` = `wbsStageMeta.weight`).
- **기준일 점프**: 부제 기준일(`todayDot`) 클릭 시 오늘선(`.todayline`) 위치 기준으로 간트를 가로 스크롤(타임라인 좌측 1/3 지점에 오늘 배치, `behavior:'smooth'`).

## 3. mng — 블루프린트 현행화 + 스타터 zip 재패키징

- `docs/PROJECT_MANAGEMENT_BLUEPRINT.md`: WBS CRUD·전체화면 스크롤·실시간 기준일(KST)·호버 툴팁/메모·단계 관리(가중치) 반영, §6에 날짜 ISO 저장 필수, §9 함정 4종 추가(날짜 ISO 통일·FK `defer_foreign_keys` 재명명·인라인 코드 줄바꿈·풀스크린 스크롤 패턴), 마지막 갱신일 표기.
- `project-mng-starter.zip` 삭제 후 최신 워킹트리로 재패키징(43파일, 236K — wbs CRUD/스크롤·schema·API·블루프린트 반영).

## 4. mng — `/docs/board` 빈 본문 버그 수정

**증상**: `/docs/board`에서 `.prose-wrap` 카드만 그려지고 본문이 비어 보임(직접 로드 HTML·payload에는 본문 정상 → 클라이언트 이동 시점 정황).
**원인/조치**: 문서 상세(`app/pages/docs/[...slug].vue`)의 `useAsyncData` 키를 **함수(`() => 'doc:'+경로`) → 문자열(`'doc:'+경로`)** 로 정정. SSR↔클라이언트 payload 키 일치로 본문 누락 방지. 새 빌드로 산출물 재생성.

## 5. admin — 고객사 상세 발신정보 섹션 추가 (Figma `Deatail.png`)

**배경**: `/Users/dotype/ProjectHandoff/figma_noti` 핸드오프 18장(운영자 콘솔 카테고리 1:1). 회원/고객사부터 매칭 시작 — 목록은 이미 일치, 상세에 발신정보 섹션이 누락.

**코드** (`malgn-noti-admin` `app/pages/customers/[id].vue`): 계약 섹션 아래 **6개 테이블**(발신번호·브랜드RCS·도메인·PUSH 인증서·알림톡 발신 프로필·080 수신거부) 추가. 상태 배지는 `정보.png` 범례 반영(신청/심사중/승인/반려/취소·완료/실패·정상/사용불가·개통완료/신청중/해지 등), 각 카드 우측 "~ 관리" 버튼 + "발신정보" 그룹 헤딩.
**데이터**: 상세 API(`opsFetch` → `malgn-noti-api`) 응답에 `senderInfo` 미포함 → 백엔드 연동 전까지 데모 데이터, 추후 `data.senderInfo.*`로 교체(주석). typecheck 통과(기존 `server/utils/ops.ts` 제네릭 오류는 무관).

## 6. admin — 고객사 그룹(주소록) 페이지 개발 (LNB `회원/고객사 > 고객사 그룹(주소록)`)

**배경**: 캔버스에서 해당 프레임 정독 — 고객사 그룹(주소록) 목록 + 그룹 수정 모달 + 그룹 연락처 모달.

**코드** (`malgn-noti-admin` `app/pages/customers/groups.vue`): `AppComingSoon` 스텁 → 풀 페이지.
- 목록: NO·고객사ID·구분·고객사명·그룹명·그룹ID·연락처 수·등록일·수정일·상태 + 체크박스. 필터(구분 세그먼트·고객사명 select·그룹명 검색). 액션 엑셀 다운로드·신규 등록·그룹 삭제.
- **그룹 등록/수정 모달**: 고객사(select)·그룹명, 수정 시 삭제 버튼.
- **그룹 연락처 모달**: 검색 + 테이블(수신사·수신자ID·휴대폰·이메일·토큰) + 연락처 추가·삭제·엑셀.
- API 미연동 → 데모 데이터로 필터·페이징·CRUD·CSV를 클라이언트에서 동작. typecheck 통과(`@toggle` 시그니처를 `string | number`로 정정).

## 7. admin — 고객사 상세 전면 재구성 + 단가 모달 + 로그인 이력 / 탈퇴 계정

캔버스 정독으로 Figma 상세 구조 확인 후 매칭.

- **고객사 상세(`customers/[id].vue`) 재구성**: 헤더 **KPI 카드**(상태/구분/승인 배지 + 회사명 + 담당자·가입일 / 멀티계정·계약상태·이용기간·**계약 단가 구간 보기**·잔여 크레딧) + **7탭**(기본 정보·담당자·계약관리·발신정보·발송통계·크레딧·결제, `AppTabs`) + **우측 메모 패널**(제목·본문 입력·저장/초기화 + 타임라인·삭제). 발신정보는 §5의 6테이블을 탭으로 이동. 발송통계/크레딧/결제는 데모 데이터.
- **단가 모달(`AppPricingDialog.vue`) 신설**: 고객사 단가표(채널·유형·최저/제공 단가, 채널 필터·엑셀) + 적용기간(남은일 배지)·상태. 목록 '단가 보기' + 상세 '계약 단가 구간 보기' 공용. (Figma `고객사 단가` 모달)
- **로그인 이력(`accounts/login-history.vue`)**: 일시·아이디·이름·소속·IP·접속환경·결과(성공/실패)·비고 + 고객사/결과/기간/검색 필터·엑셀.
- **탈퇴 계정(`accounts/withdrawn.vue`)**: 아이디(취소선)·이름·소속·권한·가입/탈퇴일·탈퇴유형(본인/관리자)·사유 + **복구** 버튼 + 고객사/유형/기간/검색 필터·엑셀.
- 상세 실데이터(company/users/contracts)는 유지, 나머지 데모. typecheck 통과(기존 `ops.ts` 무관).

## 8. admin — 화면 보강·위험 액션 사유·스크롤락 누적 변경 배포

§5~§7 이후 추가된 커밋(화면 보강·정합)을 검토 후 라이브 반영.

- **위험 액션 사유 입력**: 고객사 상태 일괄 변경(중지 사유 필수)·이용 정지/재개·반려에 사유 입력 + 확인 모달(감사 로그 대비), `patch` 실패 시 모달 유지(재던짐).
- **스크롤락 이식**: `app/utils/scrollLock.ts` + `AppModal`·`AppDrawer` 카운터 기반 스크롤락(다중 모달 안전).
- **계정·대시보드 화면 보강**(`accounts/index.vue` +235, `index.vue`), 로그인이력·탈퇴계정 페이지네이션 표기 정리 + 복구 확인 모달.
- **`server/utils/ops.ts` 타입 정합**(`as T` 캐스트로 TS2322 해소) → **typecheck 전체 통과**.
- 문서 정본 보강: `DESIGN-ADMIN.md`(컴포넌트 동결 가드레일) + `docs/pages/{dashboard,member/account,member/company}.md`.
- 검토(diff·typecheck) 후 빌드·배포(alias `03aa7735`), 7개 핵심 라우트 200 검증. (코드 커밋·푸시는 이미 완료된 상태였고, 이번 턴은 검토+배포.)

## 9. 멀티에이전트 개발팀 스프린트 — WBS 김도형 이번 주 작업 일괄

**구성**: 사용자 요청으로 8역 에이전트팀 `malgn-noti-dev`(디자인·퍼블리싱·관리자단·사용자단·API·DBA·화면설계서 검토·QA)를 구성. WBS에서 **김도형 담당 이번 주(6/8~14)** 항목만 추려 14개 태스크로 배분·조율(팀리드 = 본 세션). 4개 레포 동시 작업, 충돌(`schema.ts`·admin 공용 컴포넌트·scrollLock)은 에이전트 간 직접 조율 + 가드레일(승인 전 커밋 금지·레포 스코프 한정·완료 전 typecheck·6/4 인간 WIP 경로 분리).

**`malgn-noti-api` — 크레딧 결선 + 인증 백엔드**:
- 크레딧 차감 결선(`7255337`): dispatch 워커 `settleCredit()` — 발송 확정 시 성공분 `consume`·실패분 `refund`(멱등키·트랜잭션), `sending` 천이를 조건부 UPDATE로 바꿔 취소 레이스 차단, 정산 직전 크래시로 멈춘(stranded) hold를 재발송 없이 정산하는 resume 분기. `POST /dispatch/requests/:id/cancel`(pending/queued 한정 + `hold_release` 전액 환불). 원장 생명주기 `hold → {consume|refund} | hold_release` 전 구간 append-only·멱등.
- 고객사 statusReason 감사로그(`7255337`): `PATCH /ops/companies/:id`가 `statusReason` 검증(중지 시 필수) + `TB_AUDIT_LOG` 기록(before/after·ip). 프론트 "일괄변경"이 단건 PATCH N회 호출이라 단건 핸들러가 모두 커버.
- 비밀번호 재설정 완료 API(`ae4eb89`): `POST /auth/reset-password`(코드 재검증→사용자 매치→새 비번 적용+코드 소비를 한 트랜잭션, 조건부 `consumedAt`로 경합 차단). `email-code/verify`의 `change_email`·`reset_password`를 verify-only purpose로 분리 — 2단계 플로우(미리검증→완료 API 최종소비)가 정상 동작(기존엔 완료 단계가 항상 실패하던 구조).

**`malgn-noti-api`(DB) — schema 라이브 정합**(`9bf53c4`): 캠페인 5테이블(campaign/audience/channelStep/scheduledRun/testRun) ORM 미러(라이브 DDL엔 존재, `schema.ts` 누락 drift), `dispatch_request/item/event`·`credit_ledger` 파티션 보조 인덱스 미러, `TB_AUDIT_LOG`(auditLog) 미러. 전부 라이브 DDL에 이미 존재 → 신규 마이그레이션 불필요.

**`malgn-noti`(사용자단) — 인증 페이지**(`2336c0b`): `reset-password`(이메일+OTP 발송/검증)·`reset-password/new`(완료 API 호출, 10분 TTL 컨텍스트)·`login/security`(2FA 6칸 코드박스+쿨다운) 재작성, 옛 Nuxt UI 스캐폴드→디자인시스템 idiom 통일. 위 reset-password API와 계약 일치(프론트 무수정 동작).

**`malgn-noti-admin` — 회원/고객사 4화면**: §5~§8과 동일 산출물(고객사 상세·목록·대시보드·회원계정 보강 + 위험액션 사유입력/감사로그 + AppModal·AppDrawer scrollLock + DESIGN-ADMIN as-built 정본화 + 로그인이력/탈퇴 페이지네이션·복구 모달). 커밋 `7ffc133`·`e4a3078`·`3dd8bfa`·`eef69e1`·`1a89852`(= §8 배포분).

**화면설계서 9종**: 사용자 `SEND·HISTORY·CONTACTS·SENDER·CAMPAIGN·MANAGE` + admin `dashboard·company·account` 보강 정본. `malgn-noti`(`2336c0b` 외 `2849f08`·`c262e7a`)와 `malgn-noti-mng`(`76dc133`·`c8f3c6e`) 양 레포 동기화.

**QA·품질**: 4레포 typecheck/lint 베이스라인 캡처 → 부채 픽스(admin `server/utils/ops.ts` 타입 `as T`, mng `@types/node` `9f3992e`)로 **typecheck 5게이트(noti·api·mng·admin tc + mng lint) 전부 GREEN**. noti lint 15건·signup dead code는 6/4 WIP 정리 후 별도 패스로 보류.

**커밋·푸시**: 4레포 14커밋 전부 origin/main push. **6/4 인간 WIP(이메일변경 기능 — noti `AppEmailChangeDialog`·`AppMemberInfoPanel`·`stores/auth.ts`·`WBS.md` / api `errors.ts`·`0006` 마이그레이션)는 경로 분리해 우리 커밋에서 제외**(작성자 검토용으로 워킹트리에 보존).

**발견**: ① WBS 진척률이 실제 코드보다 낮게 잡혀 있음(고객사 화면 "10%"였으나 사실상 완성 → 이번 주는 신규 구축이 아니라 **보강·결선·실데이터 미연동 식별** 위주). ② `#14 reset-password`는 6/4 인간 WIP가 아니라 api-dev 이번 세션 구현분(초기 귀속 오판을 팀원 보고로 정정·커밋).

## 10. 사용자단 + API 프로덕션 배포 + WBS 진척 반영

**배포**(스프린트 산출물 라이브 반영):
- `malgn-noti`(사용자단) Pages — 인증 페이지(reset-password·reset-password/new·login/security) 배포(alias `6f535226`), 4개 라우트 200.
- `malgn-noti-api` Workers — 크레딧 정산 결선·발송 취소/환불·비번 재설정 API + schema 정합 프로덕션 배포(Version `de6775c2`), `/health/db` 200·`/auth/reset-password` 400(정상 검증)·`/doc` 200. (admin은 §8 `03aa7735`로 이미 최신.)

**WBS 반영**(D1 `wbs_item` 진행률 갱신 + 단계 진척 상향):
- 항목 진행률: 발송 API 85→**100**, 고도화 API 35→**55**, 데이터 모델링 80→**95**, 관리자단 화면 개발 40→**55**, 관리자 회원/고객사(대시보드 10→**60**·고객사 목록 10→**85**·고객사 상세 10→**85**·회원·계정 관리 5→**85**), 사용자 로그인 70→**90**·보안인증 70→**90**·비밀번호 재설정 60→**90**·새 비밀번호 60→**90**. (회원·계정 관리는 계정·로그인이력·탈퇴·그룹 페이지 일괄 구현, 로그인은 인증 페이지 재작성 반영분.)
- 단계 진척: **Step 4 서비스 개발 55→60**(`wbsStageMeta` 코드 + 현황판 `stage` D1 동시) → 전체 가중평균 ≈ 47.8%. mng 배포(alias `958e67bf`).

---

## 11. 멀티에이전트 2차 스프린트 — 회원·인증 도메인 풀스택(사용자단·관리자단·API)

**구성**: 별도 에이전트팀 `auth-member-dev`(team-lead + `user-auth-dev`·`user-member-dev`·`admin-member-dev`·`api-auth-dev`·`qa`)를 **tmux 분할 패널**로 구성해 회원·인증 도메인을 3개 레포에 걸쳐 동시 개발. 팀리드가 계약 조율·검증·커밋.

**사용자단(`malgn-noti`)**:
- 로그인 2FA 수직 슬라이스 — `stores/auth.ts`에 `twoFactor` 챌린지 처리(`verifyTwoFactor`/`resendTwoFactor`), `login/index`→`login/security` 분기, `expiresAt` 카운트다운 + resend 쿨다운(서버 `retryAfterSeconds` 동기화).
- 비밀번호 변경 — `AppPasswordChangePanel` `POST /me/password` 실연동, 특수문자 규칙(`/[^A-Za-z0-9]/`)을 백엔드와 동일화.
- 회원 탈퇴 — `AppWithdrawDialog`(비밀번호 재인증) 신설, `POST /me/withdraw` 연동.
- 이메일 변경 다이얼로그 `onConfirm` 비동기 패턴 정리, reset-password 완료 플로우 401 단일 분기.

**관리자단(`malgn-noti-admin`)**: 회원관리 **4페이지 전부 실 API** — `accounts/index`(목록·필터·페이징·CSV·상태변경·임시PW)·`[id]`(상세·로그인이력·PATCH·temp-password)·`withdrawn`(탈퇴 메타 컬럼·복구)·`login-history`(글로벌 성공이력). Nitro 프록시 6종 + `types/account.ts`. **3계층 구조**(브라우저 `/api/admin/*` → Nitro `opsFetch` → 백엔드 `/ops/*` `X-Ops-Token`), `:id`=숫자 user PK.

**백엔드(`malgn-noti-api`)**: 2FA(`POST /auth/2fa/verify`·`resend`, 로그인 챌린지 `twoFactorRequired/pendingToken/sentTo/expiresAt`, `pendingToken` `stage='2fa'` 마커로 access 토큰 오용 차단, 429 `rate_limited`) + `POST /me/password`·`/me/withdraw`(soft-delete `status=-1` + `TB_AUDIT_LOG`) + 관리자 accounts(`GET /ops/accounts` 목록·탈퇴메타 부착, `:id` 4종, `GET /ops/login-history` 성공 로그인 통합 + user-agent 캡처) + 로그인 성공 감사로그. **신규 마이그레이션 불필요**(`security_login_yn/method`·`purpose='login_2fa'`·audit_log 재사용). §9의 reset-password API는 기구현 확인.

**QA**: 정적 cross-check(양 레포 코드 file:line 대조) + typecheck/lint 실행 → **계약 6/6 GREEN**(2FA·`/me/password`·`/me/withdraw`·reset-password·관리자 accounts 상세+목록), 회귀 게이트(noti·api·admin typecheck) green·신규 회귀 0. **라이브 스모크는 외부 Aurora MySQL(Hyperdrive `--remote`) 필요로 불가 → 정적 검증이 상한**(옵션① 채택).

**계약 thrash 사례·교훈**: 2FA 네이밍(`mfa*`↔`twoFactor*`)·경로(`/auth/login/2fa/*`↔`/auth/2fa/*`)에서 **2.5회 왕복** 발생(자기 보고 ≠ 실제 코드, 팀리드 상충 지시 일부 포함). **리터럴 문자열 고정 + 한쪽(FE) 동결 선언 + QA 코드 대조를 단일 진실원**으로 수습. 관리자 accounts base 충돌도 실은 3계층 프록시의 레이어 오해였음(QA가 코드로 규명).

**커밋·푸시**: 3개 코드 레포 **분리 커밋** origin/main push — `malgn-noti d613c76`, `malgn-noti-admin 0cd3149`, `malgn-noti-api a799e4a`. 무관 파일(`docs/WBS.md`, 마이그레이션 `0006`)은 범위 제외.

**배포**(의존성 순서 api→admin→frontend): `malgn-noti-api` Workers Version `bcf24c04`(검증 `/health` 200·`/health/db` mysql 8.0.42·`/auth/2fa/verify·resend` 400·`/ops/accounts·login-history` 403 — 신규 라우트·게이트 라이브) → `malgn-noti-admin` Pages alias `90072cdc`(프로덕션 200) → `malgn-noti`(사용자단) Pages alias `41af0bd2`(프로덕션 200). 신규 마이그레이션 없어 DDL 잡 불요.

---

## 산출물

- `malgn-noti-mng` Pages 배포 다수 — WBS 스크롤(`32118503`)·비중·기준일 점프·블루프린트·`/docs/board` 수정(`1cddc81f`)·WBS 진척 반영(`958e67bf`). 라이브 <https://malgn-noti-mng.pages.dev>.
- `malgn-noti`(사용자단) Pages 배포 — 인증 페이지(alias `6f535226`). 라이브 <https://malgn-noti.pages.dev>.
- `malgn-noti-api` Workers 배포 — 크레딧 정산·취소/환불·비번 재설정(Version `de6775c2`). <https://malgn-noti-api.malgnsoft.workers.dev>.
- `malgn-noti-admin` Pages 배포 — 발신정보 섹션(`4520c8ab`) · 고객사 그룹(`e11d362f`) · 상세 재구성+단가 모달+로그인 이력+탈퇴 계정(`3f61d7e5`) · 화면 보강+위험액션 사유+스크롤락+ops 타입 정합(`03aa7735`). 라이브 <https://malgn-noti-admin.pages.dev>. 커밋 push 완료.
- 신규 컴포넌트 `app/components/AppPricingDialog.vue`(단가 모달, 목록·상세 공용).
- `docs/PROJECT_MANAGEMENT_BLUEPRINT.md` 현행화, `project-mng-starter.zip` 재생성.
- **멀티에이전트 팀 스프린트 push(§9)** — `malgn-noti-api`: 크레딧 결선·취소/환불·statusReason 감사로그(`7255337`)·schema 정합(`9bf53c4`)·비번재설정 API(`ae4eb89`). `malgn-noti`: 인증 3페이지(`2336c0b`)·화면설계서 6종(`2849f08`·`c262e7a`). `malgn-noti-mng`: 설계서 집약 9종(`76dc133`·`c8f3c6e`)·`@types/node`(`9f3992e`). 4레포 14커밋 origin/main 반영.
- 에이전트팀 `malgn-noti-dev`(8역) 구성·운영 — 스프린트 후 유지(idle 대기).
- **2차 멀티에이전트팀 push·배포(§11)** — `malgn-noti`(사용자단 2FA·비번변경·탈퇴): `d613c76` → Pages alias `41af0bd2`. `malgn-noti-admin`(관리자 회원관리 4페이지·Nitro 프록시 6종·`types/account.ts`): `0cd3149` → Pages alias `90072cdc`. `malgn-noti-api`(2FA·`/me/*`·관리자 accounts API·감사로그): `a799e4a` → Workers Version `bcf24c04`. 3레포 origin/main push + 프로덕션 배포(api→admin→frontend 순)·전부 200/라우트 검증. 에이전트팀 `auth-member-dev`(6역, tmux 분할) 운영 — idle 유지.

## 다음 단계 · 한계

- 발신정보 6테이블은 **데모 데이터** — `malgn-noti-api` 운영자 응답(`senderInfo`) 확장 후 실데이터 연동 필요.
- 일부 컬럼 라벨은 캔버스(22393px) 해상도 한계로 추정 — 실제 Figma 대비 검수 필요.
- 회원/고객사 잔여 요소(단가 모달·등록 폼 3탭·상태변경 모달 등) 및 다음 카테고리(대시보드 등) 매칭은 후속.
- **(§9 이월)** `export-jobs` 처리 워커·`flow-definitions` 실행 엔진 — `wrangler.toml` 인프라 바인딩(EXPORT_QUEUE/R2) 결정 동반, api 다음 증분.
- ~~**(§9 이월)** 로그인 2FA `verify/resend`~~ → **§11에서 해소** — `POST /auth/2fa/verify`·`resend` + `login/security.vue` 실연동(기존 `security_login_yn/method` 재사용, 스키마 추가 없음).
- **(§11 후속, 저순위)** 실패 로그인 로깅(enumeration 보안정책 합의 필요)·`must_change_password` 컬럼(임시PW 강제변경)·`TB_LOGIN_HISTORY` 전용 테이블(현재 audit_log 대체)·FE nullable 타입 정합·정지 PATCH 백엔드측 사유 강제 — 전부 DBA/정책 동반. DB 의존 런타임 검증(OTP 소비·동시성·401 분기)은 라이브 스모크(Aurora 환경)로만 확인 가능.
- **(§9 이월)** admin 화면 백엔드 실데이터 연동(senderInfo·발송통계·크레딧·결제·메모·accounts·dashboard 엔드포인트), signup 수동 OTP dead code 제거, noti `lint --fix` 정리 패스(6/4 WIP 정리 후).
- **(§9)** 6/4 인간 WIP(이메일변경 기능: noti 프론트 3파일 + api `errors.ts`·`0006`)는 미커밋 보존 — 작성자 검토·커밋 필요.
