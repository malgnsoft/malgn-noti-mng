# 2026-06-11 작업 이력

> **한 줄 요약**: **3차 멀티에이전트팀(`account-pages-dev`, 6역 tmux 분할)** 로 계정 6페이지(cards·security·multi·credit·inquiries·billing)를 **데모 → 실 API 풀스택 연동**. 백엔드 3엔드포인트 신설(2FA 토글·멤버 관리·영수증, 무스키마), 기획 정본 6종 작성, QA 회귀 게이트 GREEN. 2레포 커밋·푸시 + 프로덕션 배포(api `2b7f9fcf`·frontend `87da3ace`).

---

## 1. 팀 구성 — account-pages-dev (6역, 모델 혼합)

사용자 요청으로 역할별 모델을 섞어 tmux 분할 패널로 구성: **planner**(opus)·**api-dev**(opus)·**frontend-dev**(opus)·**designer**(sonnet)·**publisher**(sonnet)·**qa**(haiku, 저비용). 팀리드가 계약 선제 확정·조율. 모든 선택은 추천/1번 기본으로 자체 결정(사용자 "모든 물음에 1번" 지시 — [[prefer-recommended-default]]).

## 2. 백엔드 (api-dev) — malgn-noti-api

데모→실연동에 필요한 API를 **무스키마(기존 컬럼·테이블 재사용)** 로 신설. `src/routes/me.ts`·`credit-ledger.ts`, tsc 0.
- **GET/PUT /me/security** — 2FA on/off·방식(email/sms), 비밀번호 재인증(불일치 401). 기존 `security_login_yn/method` 컬럼 사용.
- **/me/members CRUD** — GET 목록 / POST 즉시생성(같은 company user 생성 + 임시비번 이메일 발송, 초대메일·신규테이블 없음) / PATCH·DELETE(soft-delete). 본인·마지막 활성 owner 가드(403/409), 감사로그 적재.
- **GET /credit-ledger/:id/receipt** — entryType='charge' 행 기반 영수증(신규 테이블 없음).
- 보류(정책/PG 미정): 세금계산서(TB_TAX_INVOICE), PG 카드 등록(billingKeyBase64 목업 유지), 집계 엔드포인트.

## 3. 사용자단 (frontend-dev) — malgn-noti

account 6페이지 전부 `useApi` 경유 실연동(전부 얇은 셸 + `App*Panel` 구조). tsc/eslint green.
- **inquiries** — 동적 라우트 `[id].vue` 신설(구 `detail.vue` 제거) + 답변 컴포저(POST /:id/replies), 목록 커서 페이징·삭제.
- **credit** — `/credit-ledger` 서버 필터·커서 페이징 + 영수증(`/:id/receipt`)→`AppReceiptDialog`(서버값 리팩터, 목업 카드번호 제거). 잔액=auth store 실값.
- **cards** — `/payment-methods` CRUD.
- **security** — `/me/security` 토글 + 비밀번호 재인증 모달. FE `'phone'`→`'sms'` enum 통일.
- **multi** — `/me/members` 멤버 목록·담당자 추가(즉시생성, `AppManagerInviteDialog` "초대"→"담당자 추가" 개조)·권한/상태/삭제.
- **billing** — `AppBillingPanel`(publisher 신규) + `/credit-ledger?entryType=charge` 결제 내역 + 결제 이메일 변경(`PATCH /me/company`).
- 공통 한계: 집계 타일(문의 상태별 카운트·크레딧 요약)은 count 엔드포인트 부재로 로드분 best-effort.

## 4. 디자인·퍼블 (designer·publisher)

- **publisher**: `AppBillingPanel.vue` 신규(결제 내역 테이블 + 결제 이메일 행 + 영수증→기존 `AppReceiptDialog` 재사용), 기존 패널 디자인 패턴 인라인 복제. 제안한 표준화 4건(ms-head 글로벌화·AppListCard 추출·AppReceiptDialog→AppModal·.seg 통일)은 충돌·범위 이유로 **후속 보류**.
- **designer**: 계정 영역 디자인 패턴(섹션 카드·폼 행·배지·테이블·모달) 검토·권장. 신규 색 추가 없음(기존 ink/accent/semantic 토큰 커버).

## 5. QA (haiku) — 회귀 게이트 + 체인 검증

- 회귀 게이트(실제 실행): malgn-noti `typecheck` PASS / `lint` 14 errors(baseline 15 이하·계정 파일 신규 0) / malgn-noti-api `tsc` PASS.
- 6페이지 엔드포인트 코드 spot-check: FE 호출 경로 == BE 라우트 전부 일치, `'sms'` enum 동기화 확인. **최종 GREEN**.
- 검증 상한: 정적 cross-check(라이브 런타임 스모크는 외부 Aurora 필요 — 이전 세션과 동일).

## 6. 기획 정본 (planner) — mng docs/pages

6종 작성: `CARDS.md`·`SECURITY.md`·`MULTI_ACCOUNT.md`·`CREDIT.md`·`INQUIRIES.md`·`BILLING.md`(개요/진입/화면/액션/상태/정책/API/DB/구현상태/한계).

---

## 산출물

- `malgn-noti`(사용자단) — 계정 6페이지 실 API 연동 커밋 `6e27329` → Pages 배포 alias `87da3ace`. 8개 패널 수정 + `AppBillingPanel` 신규 + `inquiries/[id].vue` 신규 + `detail.vue` 제거 + `sitemap.vue`. 라이브 <https://malgn-noti.pages.dev>.
- `malgn-noti-api`(백엔드) — 2FA 토글·멤버 관리·영수증 API 커밋 `e076622` → Workers Version `2b7f9fcf`(`/me/security`·`/me/members`·`/credit-ledger/:id/receipt` 401 게이트·`/health` 200 라이브 검증). <https://malgn-noti-api.malgnsoft.workers.dev>.
- `malgn-noti-mng` — 기획 정본 6종(`docs/pages/`) + 본 작업 이력.
- 무관 파일(`malgn-noti/docs/WBS.md`, `malgn-noti-api`의 `0006_company_ad_receive_at.sql`)은 범위 제외.

## 다음 단계 · 한계 (저순위 후속)

- 집계 엔드포인트(`/credit-ledger/summary`, 문의 상태 카운트) 신설 시 요약 타일 정확 집계.
- billing 패널 영수증을 `/credit-ledger/:id/receipt` 실연동으로 보강(현재 행 기반 fallback).
- 세금계산서(TB_TAX_INVOICE)·PG 빌링키 카드 등록(PG 선정 후)·매니저 초대메일 방식(현재 즉시생성).
- publisher 표준화 4건(컴포넌트 중복 정리)·라이브 2FA/멤버 스모크(Aurora 환경).
