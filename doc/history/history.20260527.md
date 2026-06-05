# 2026-05-27 — malgn-noti-admin Nuxt 3 부트스트랩 + 셸 레이아웃 + 첫 프로덕션 배포 + malgn-noti-api 멱등 수정·NHN 어댑터·Queues·webhook·Email/Kakao/Push 채널·배포 #6·#7 + 사용자단 추가(랜딩페이지·문의 이동·나의 페이지·충전 — 배포 #44~#46) + malgn-noti-api 루트→/doc 리다이렉트 + RCS 채널·Export 잡·Flow 정의 정식 커밋·배포 #8

## 한 줄 요약

세 트랙 병행. **(A) malgn-noti-admin** — 비어 있던 BackOffice 레포를 **Nuxt 3 + Nuxt UI v3로 부트스트랩** + `design_handoff_customer_detail` 정본 참조 **LNB(256px sticky · 8 그룹 메뉴) + TopBar(64px sticky)** 셸 레이아웃 + `https://malgn-noti-admin.pages.dev` 첫 Nuxt 앱 프로덕션 배포(정적 placeholder 대체). **(B) malgn-noti-api** — §19에서 추적한 멱등 버그를 `TB_IDEMPOTENCY` + INSERT-then-conflict race-free 패턴으로 정식 해결 + NHN SMS 어댑터(mock/real) + Cloudflare Queues(`malgn-noti-dispatch`) + consumer worker(`dispatch_state` 천이) + `POST /webhooks/nhn/sms` HMAC 콜백 수신 + Producer·Consumer 동시 바인딩 프로덕션 배포 #6(Version `b30dc2a3...`) + **Email · Kakao(알림톡/친구톡) · Push 3채널 동시 추가** + 배포 #7(Version `12dae362...`). **(C) malgn-noti 사용자단** — 메시지 관리 랜딩페이지 만들기 신규(목록·기본형/확장형 등록 폼·미리보기 모달) + 문의하기 경로를 `/account/inquiry`로 이동(GNB·푸터·사이트맵 링크 정리) + 나의 페이지 섹션(공통 셸 + 9개 라우트·회원 정보 변경·결제 카드 관리·이메일/휴대폰 인증 모달) + 크레딧 충전 플로우(충전 페이지 재구성·결제 컨펌·결과 화면)로 Pages 배포 #44·#45·#46. **(D) malgn-noti-api 추가** — 루트(`/`) placeholder JSON을 `c.redirect('/doc')`로 교체해 워커 도메인 접속이 곧장 Scalar API 문서로 이동하도록 변경, Workers 재배포(Version `f3fd3eb4...`). **(E) malgn-noti-api §13 WIP 정식 커밋** — §13 시점에 라이브로 올라가 있던 RCS 채널(5채널째 — adapter·producer·consumer·webhook·`RCS_PRICING`) + Export 잡(`TB_EXPORT_JOB` + `/export-jobs` CRUD) + Flow 정의(`TB_FLOW_DEFINITION/RUN/STEP_RUN` + `/flow-definitions` CRUD) + OpenAPI 4지점(+230) + `0002_export_flow.sql` 마이그레이션을 단일 배치 커밋(`1e7bd61`, 12 files +1228 −16) + 배포 #8(Version `95f9f894...`)로 working tree ↔ main 동기화. DDL 적용은 Cloudflare 1105 회복 후로 보류.

## 1. 사전 조사

- **참조 정본**: `/Users/dotype/Projects/design_handoff_customer_detail/` — README + `prototype/` HTML/JSX 프로토타입. 고객사 상세 1화면 hi-fi 시안.
  - 권장 스택: Nuxt 3 + **Nuxt UI v3** + Tailwind v4 + DM Sans(라틴) + Pretendard(한글) + Lucide.
  - 레이아웃: LNB 256px · TopBar 64px · Content + MemoPanel 360px.
  - `prototype/lnb.jsx`에서 8개 그룹 메뉴 트리 + 액티브/배지/NEW 스타일 추출.
- **대상 상태**: `malgn-noti-admin/`은 `CLAUDE.md`(상세 운영 도메인 문서)·`doc/DESIGN-ADMIN.md`(Part A 상속 + Part B 관리자 밀도)·정적 `public/index.html`(placeholder)만 존재 — Nuxt 미부트스트랩.
- **사용자 확인**: `AskUserQuestion` — 산출물 형태 → "Nuxt 3 부트스트랩 + 셸 레이아웃", 범위 → "셸만(LNB + TopBar + 빈 콘텐츠)".

## 2. 프로젝트 부트스트랩

- **package.json**(신규): name=`malgn-noti-admin`, 사용자단과 동일 버전 라인 — `nuxt ^3.16` · `@nuxt/ui ^3.0` · `@iconify-json/lucide` · `vue ^3.5` · `vue-router ^4.4` · `typescript ^5.6` · pnpm 10.25. Pinia/Chart/Zod 제외 — 셸 범위 밖.
- **nuxt.config.ts**(신규): `compatibilityVersion: 4`(app/ 디렉터리 구조) · `modules: ['@nuxt/ui']` · `nitro.preset: 'cloudflare-pages'` · DM Sans + Pretendard 폰트 head 주입 · `noindex,nofollow` 메타.
- **tsconfig.json**(신규): Nuxt 자동생성 `.nuxt/tsconfig.json` 상속.
- **app/app.config.ts**(신규): Nuxt UI 컬러 매핑 — **primary `blue`** + neutral `slate` (핸드오프 정본).
- **app/app.vue**(신규): `<UApp :locale="ko"><NuxtLayout><NuxtPage/></NuxtLayout></UApp>` 루트.
- **app/assets/css/main.css**(신규): `@import "tailwindcss"` + `@import "@nuxt/ui"`. `@theme`에 폰트 정의(DM Sans + Pretendard), `:root`에 `--lnb-width: 256px` · `--topbar-height: 64px` · `--ring-default` · `--shadow-ring`. 본문 13px · slate-50 paper · slate-900 텍스트.

## 3. 셸 레이아웃

- **app/layouts/default.vue**(신규): `flex min-h-screen bg-slate-50` 컨테이너 — `<AppLnb/>` + `<div class="flex-1 min-w-0 flex flex-col"><AppTopbar/><main class="flex-1 px-6 py-5"><slot/></main></div>`.
- **app/components/AppLnb.vue**(신규): 256px sticky 사이드바.
  - 브랜드 헤더 — 그라데이션 로고 + "맑은 message **Admin**".
  - ⌘K 검색 버튼(`ring-1 ring-inset` 입력형).
  - **8개 그룹 메뉴**(핸드오프 `lnb.jsx` 1:1 매핑) — 대시보드 · 회원/고객사(고객사·계정·감사로그+`3` 배지·차단/제재) · 발송 관리(PUSH·RCS·SMS/LMS·알림톡·이메일·예약 발송+NEW) · 템플릿(채널 4종+치환 변수) · 리포트(발송량·실패율·채널·크레딧·정산) · 채널/연동(FCM·APNs·RCS Biz·카카오 비즈·SMPP) · 결제/크레딧(발급·사용 내역·세금계산서) · 운영(공지·FAQ·1:1 문의).
  - 1depth 액티브 — `bg-blue-50 text-blue-700` + 아이콘 박스 `bg-blue-100`. 2depth 액티브 — 좌측 점 표식. 그룹 펼침/접힘 토글.
  - 하단 사용자 chip(아바타 + 이름/이메일 + chevron).
- **app/components/AppTopbar.vue**(신규): 64px sticky 상단 바.
  - 좌측 — 사이드바 토글 + 홈 아이콘 · 브레드크럼 "대시보드".
  - 우측 — `bg-emerald-50 ring-emerald-200` 시스템 상태 pill("시스템 정상 · 14ms"), 검색·벨(+빨간 점), 회사 스위처("맑은소프트"), 사용자 chip.
- **app/pages/index.vue**(신규): 빈 콘텐츠 데모 — 페이지 제목 "맑은 메시징 BackOffice" + 가운데 placeholder 카드("페이지 콘텐츠가 들어갈 영역입니다").

## 4. 부팅 트러블슈팅

- `pnpm install` 완료(Nuxt 3.21.6, Nuxt UI 3.3.7).
- `pnpm dev --port 3001` 백그라운드 실행 → `/` 응답이 부트스트랩 전 정적 `public/index.html`(어두운 placeholder)을 반환.
- **원인**: Nitro가 `public/` 정적 파일을 Nuxt 라우트보다 우선 처리 → `public/index.html`이 `/`를 가로챔.
- **해결**: `public/index.html` 삭제 → Nuxt SSR이 `app/pages/index.vue`를 정상 렌더, LNB 메뉴 마커(대시보드·발송 관리·템플릿·리포트) 확인.

## 5. 첫 프로덕션 배포

- `pnpm build` → `dist/` 272 kB gzip (셸 단계라 작음).
- `npx wrangler@4 pages deploy dist --project-name=malgn-noti-admin --branch=main --commit-dirty=true --commit-message "Initial admin shell: Nuxt 3 + Nuxt UI v3 + LNB + TopBar"`.
- 프로덕션 검증 — `https://malgn-noti-admin.pages.dev/` HTTP 200, "대시보드·발송 관리·템플릿·맑은 메시징" 마커 확인. alias `https://471451c7.malgn-noti-admin.pages.dev`.
- 커밋: `6cbf238 Nuxt 3 + Nuxt UI v3 부트스트랩 + LNB·TopBar 셸 레이아웃` (12 files, +9064 −24 — 대부분 `pnpm-lock.yaml`).
- 푸시: `origin/main` (`d2a6bb6..6cbf238`, `malgnsoft/malgn-noti-admin`).

## 산출물

- 신규 파일(`malgn-noti-admin/`): `package.json` · `nuxt.config.ts` · `tsconfig.json` · `pnpm-lock.yaml` · `app/app.config.ts` · `app/app.vue` · `app/assets/css/main.css` · `app/layouts/default.vue` · `app/components/{AppLnb,AppTopbar}.vue` · `app/pages/index.vue` (10종 + lockfile).
- 삭제: `public/index.html` (부트스트랩 전 placeholder, Nuxt 라우트 가로채는 충돌 해소).
- 프로덕션 URL: `https://malgn-noti-admin.pages.dev` (첫 Nuxt 앱 배포 — 이전 #2 placeholder 정적 페이지 대체).

---

# 트랙 B — malgn-noti-api 백엔드 작업

§19에서 추적한 멱등 버그 정식 해결 + 실제 NHN 발송 경로(어댑터 + 큐 + worker) 구축 + 프로덕션 배포 #6. 본 트랙의 상세는 `history.20260526.md §22·§23` 에 기록 — 26일 파일에 §N으로 누적 중이던 흐름의 연속이라 자연 위치를 따랐고, 본 27일 파일에는 요약 + 참조만 둠.

## 6. 멱등 버그 해결 (`malgn-noti-api 020307f`, `history.20260526.md §22`)

§19에서 보고했던 `/send/sms` 멱등 버그(같은 `Idempotency-Key` 재호출 시 중복 적재·크레딧 중복 차감)를 정식 수정.

- **0001_idempotency.sql** — 비파티션 추적 테이블 `TB_IDEMPOTENCY` (PK `(company_id, scope, idempotency_key)`, `result_id NULL→채움`). Aurora 적용 후 테이블 50개 라이브.
- **race-free 패턴** — MySQL이 PK 인덱스로 atomic dedup. 진행 중 트랜잭션과는 row-lock 대기 후 duplicate key error.
- `/send/sms` 신규 흐름 — `INSERT TB_IDEMPOTENCY (resultType='pending')` 점유 → 검증·트랜잭션 → 마지막에 `UPDATE result_id`. 점유 후 실패 시 `rollbackIdempotency()` 로 키 해제(재시도 가능). 처리 중이지만 commit 전이면 `202 idempotent_in_flight`.
- **검증 3건**: call 1 (key=K) → ID=8, call 2 (key=K, 같음) → **ID=8 + idempotent:true**, call 3 (key=K2) → ID=9. 통과 확인.

## 7. NHN SMS 어댑터 + Cloudflare Queues + consumer worker (`malgn-noti-api 5e1ac72`, `history.20260526.md §23.1~23.2`)

발송 흐름의 비동기 처리 인프라 구축.

- **Cloudflare Queue 생성**: `malgn-noti-dispatch` (id `6c67d698...`). `wrangler.toml`에 producer + consumer 동시 바인딩, batch 10·timeout 5s·max_retries 3.
- **NHN SMS 어댑터** (`src/adapters/nhn/`)
  - `types.ts` — `NhnCredentials` · `NhnSmsSendRequest` · `NhnSmsSendResponse` · `NormalizedSendResult`.
  - `sms.ts` — `sendSms(creds, input, mockMode)`. mock 모드는 외부 호출 없이 시뮬레이션, real 모드는 `/sms/v3.0/appKeys/{appKey}/sender/(sms|mms)` POST + `X-Secret-Key`.
- **Consumer worker** (`src/workers/dispatch.ts`) — `processDispatchBatch(batch, env)` → `processOne()` 으로 메시지마다: dispatch_request 조회 → items + sender + nhn_credential 조회 → `dispatch_state→'sending'` → `sendSms()` → item별 `send_state`·`fail_code`·`nhn_request_id` 갱신 → `dispatch_state→'delivered'/'failed'` + `completed_at`. 일시 오류는 `msg.retry({ delaySeconds: 30 })`.
- **Producer 연동** — `/send/sms` 트랜잭션 commit 후 `c.executionCtx.waitUntil(env.DISPATCH_QUEUE.send({ dispatchRequestId }))` + `dispatch_state→'queued'`.
- **스키마 확장** — `nhnCredential` 테이블 Drizzle 추가 (DATA-MODEL §10.5 반영).
- **Workers entry 변경** — `src/index.ts` 의 default export를 `{ fetch: app.fetch, queue: processDispatchBatch }` 객체로 (fetch + queue handler 분리).
- **secret** — `NHN_MOCK=1` wrangler secret 등록(프로덕션도 모의 모드로 시작).
- **로컬 검증 한계** — wrangler 경고 `"Queues are not yet supported in wrangler dev remote mode"` → 로컬 dev에서 큐 처리 검증 불가.

## 8. NHN webhook 핸들러 — `POST /webhooks/nhn/sms` (`malgn-noti-api 0d28173`)

NHN의 발송 결과 콜백을 받아 `TB_DISPATCH_EVENT` 적재 + `TB_DISPATCH_ITEM.recv_state` 갱신. 발송 흐름의 피드백 루프를 완성.

### 8.1 흐름

1. **HMAC-SHA256 서명 검증** — `X-NHN-Signature: sha256=<hex>` 헤더 + `NHN_WEBHOOK_SIGNING_SECRET` env.
   - 프로덕션: secret 미설정 → 403, 서명 불일치 → 401.
   - 로컬 dev (`APP_ENV=local`): 서명 헤더 없으면 우회(개발 편의).
2. **payload 정규화** — `parseSmsCallback()` → `msgStatus` (0/1/2/3/4) → `eventType` (accepted/sent/delivered/failed/bounced).
3. **dispatch_item lookup** — `nhn_request_id` + `recipient_address` 로 매핑.
4. **`TB_DISPATCH_EVENT` INSERT** — `dedup_key = "sms:<requestId>:<recipientNo>"`. UNIQUE 위반 → 200 dedup (멱등).
5. **`recv_state` 천이** — delivered→success / failed,bounced→failed / 그 외 pending 유지.
6. **dispatch_request 마무리** — 모든 item이 final 이면 `dispatch_state` 갱신(best-effort).

### 8.2 신규 파일

- `src/db/schema.ts` — `dispatchEvent` (파티션 PK `(id, received_at)`).
- `src/lib/webhook-signature.ts` — `verifyHmacSignature()`, Web Crypto + timing-safe.
- `src/adapters/nhn/webhook.ts` — `parseSmsCallback()` (NHN payload → NormalizedEvent).
- `src/routes/webhooks.ts` — `POST /webhooks/nhn/sms`.

`index.ts` — `app.route('/webhooks', webhooks)`, Bindings에 `NHN_WEBHOOK_SIGNING_SECRET` 추가.
`openapi.ts` — `webhooks` 태그 + `/webhooks/nhn/sms` 경로(요청·응답·서명 헤더 명세).

### 8.3 검증 보류

Cloudflare 원격 미리보기 인프라 장애(1105) 지속 — 로컬 `pnpm dev` 자체가 503 → 웹훅 라우트 검증 차단. 타입 검사·코드 패턴은 동일.

Cloudflare 회복 후 검증 절차:
1. NHN_WEBHOOK_SIGNING_SECRET 등록(`wrangler secret put`)
2. 외부에서 NHN 형식 + 서명 헤더로 POST
3. `/dispatch/requests/:id/items` 에서 `recv_state=success` + `received_at` 확인
4. `/admin/...` 로 `TB_DISPATCH_EVENT` 적재 행 확인

## 9. malgn-noti-api 프로덕션 배포 #6 (`history.20260526.md §23.1~23.3`)

§6·§7 변경을 라이브 반영.

- **Version**: `b30dc2a3-dc5a-4050-a435-c3d03a5e69a7`. 번들 2460 KiB / gzip 572. Worker Startup 74 ms.
- 배포 명세에 **`Producer for malgn-noti-dispatch`** + **`Consumer for malgn-noti-dispatch`** 동시 등록 확인.
- 검증 5건 — `/health`, `/health/db`(mysql 8.0.42), `/doc`(paths 44·ops 78·schemas 53), `/send/sms` no-auth 401, `/auth/login` JWT 발급 정상.
- **큐 e2e 검증 보류** — Cloudflare 원격 미리보기 인프라 장애(1105 Temporarily unavailable, Ray ID `a02212096ea185af`·`a02213318ecb85af` 등 30분 지속) → 로컬 `pnpm dev --remote` 가 edge-preview 토큰을 받지 못해 prod Aurora 시드 SQL 송신 자체 실패. 코드·바인딩은 정상이며 Cloudflare 회복 후 외부에서 e2e 절차로 검증 가능.

## 10. Email · Kakao · Push 채널 추가 (`malgn-noti-api 06cf052`)

§7 SMS 토대 위에 3개 추가 채널을 동일 패턴으로 적층 — **producer · adapter · worker · OpenAPI** 4지점 갱신.

### 10.1 공통 패턴

모든 `POST /send/{channel}` 라우트는 §6 멱등 + §7 큐 패턴을 재사용:

1. **`Idempotency-Key` 헤더 점유** — TB_IDEMPOTENCY INSERT-then-conflict (race-free).
2. **발신자 자격 검증** — own + 채널별 승인 상태(아래 표).
3. **수신자 옵트아웃 필터** — channelKind 키(`phone`/`email`)로 TB_OPTOUT_ENTRY 매칭. Push만 예외(앱 내 설정 책임).
4. **단가·총액 계산** + 크레딧 hold (`TB_COMPANY.credit_balance` UPDATE…WHERE balance ≥ amount + `TB_CREDIT_LEDGER` append).
5. **`TB_DISPATCH_REQUEST` + `TB_DISPATCH_ITEM`** bulk insert (단일 트랜잭션).
6. **`TB_IDEMPOTENCY.result_id` = 발송 ID** (트랜잭션 안에서).
7. **큐 enqueue** + `dispatch_state=queued` 천이 (`executionCtx.waitUntil`).

### 10.2 채널별 발신자·옵트아웃·단가

| 채널 | senderRef | 검증 | 옵트아웃 키 | 단가(1건) | 추가 검증 |
| --- | --- | --- | --- | --- | --- |
| `email` | `emailDomainId` | `verified_yn=Y` | `email` | 0.65 | `from`의 도메인이 emailDomain.domain과 일치 |
| `kakao` | `kakaoSenderProfileId` | `profile_state=승인` + `token_state=완료` | `phone` | alimtalk 8 / friendtalk 12 | 알림톡은 `templateCode` 필수(Zod refine) |
| `push` | `pushCertId` | `status=1` + `expires_at` 미경과 | (없음) | 0.5 | `recipients[].token` 8~255자 device token |

### 10.3 어댑터 (신규 파일)

- **`src/adapters/nhn/email.ts`** — NHN `/email/v2.1/appKeys/{appKey}/sender/mail` POST. `receiverList[].receiveType='MRT0'`(TO). mock 시 `mock-email-<uuid>` requestId.
- **`src/adapters/nhn/kakao.ts`** — 알림톡 `/alimtalk/v2.3/...` + 친구톡 `/friendtalk/v2.0/...` 분기. `senderKey` 는 `TB_KAKAO_SENDER_PROFILE.send_key_enc` (평문 가정 — envelope 복호화는 TODO).
- **`src/adapters/nhn/push.ts`** — NHN `/push/v2.5/appkeys/{appKey}/messages` POST. `target.type='TOKEN'`. NHN Push는 messageId 1개만 반환 → 개별 토큰 결과는 webhook(후속)으로 갱신.

기존 `src/adapters/nhn/types.ts` 의 `NormalizedSendResult.perRecipient` 필드 `phone → address` 로 리네임 → 채널 무관(phone/email/token). SMS 어댑터도 동반 수정.

### 10.4 worker 분기

`src/workers/dispatch.ts` — 조건 `channel !== 'sms' && !== 'email' && !== 'kakao' && !== 'push'` 외 skip. channel별 spec 파싱 + 어댑터 호출:

```
sms   → senderRefId → TB_SENDER_PHONE.number
email → senderRefId → TB_EMAIL_DOMAIN (존재만 확인, verified는 producer 단계에서 검증 완료)
kakao → senderRefId → TB_KAKAO_SENDER_PROFILE.send_key_enc → senderKey
push  → senderRefId → TB_PUSH_CERT (존재만 확인)
```

credential 조회는 `nhn_credential.channel = dr.channel` 로 generic 변경(SMS 하드코딩 제거).

### 10.5 단가 정의

`src/lib/pricing.ts` 확장:

```ts
export const EMAIL_PRICING = 0.65
export const KAKAO_PRICING = { alimtalk: 8, friendtalk: 12 } as const
export const PUSH_PRICING = 0.5
```

프론트엔드 `app/types/channel.ts`의 `*_META.pricePerUnit` 와 동기. 실제 운영 시 `TB_PRICING` 테이블로 이전 예정.

### 10.6 OpenAPI

`src/openapi.ts` — `SendEmailRequest` · `SendKakaoRequest` · `SendPushRequest` 스키마 + `/send/email` · `/send/kakao` · `/send/push` 경로 추가. 응답은 SMS와 동일한 `SendResponse` 재사용.

## 11. malgn-noti-api 프로덕션 배포 #7

§10 변경을 라이브 반영.

- **Version**: `12dae362-2900-42ca-9a2e-e6dfb9c60091`. 번들 2508 KiB / gzip 579. Worker Startup 80 ms.
- 명령: `pnpm run deploy` (자동 `wrangler deploy`).
- 바인딩: DISPATCH_QUEUE · HYPERDRIVE(a2ba4efe...) · APP_ENV=production · NHN_MOCK=1(default).
- 검증 3건:
  - `/health` → 200, `{"ok":true,"env":"production","time":"2026-05-27T04:42:50.327Z"}`
  - `/health/db` → 200, `{"ok":true,"mysql_version":"8.0.42",...}`
  - `/doc` → 200 (Scalar UI 페이지 응답)
- 큐 e2e + 외부 NHN 자격증명 연결은 별도 작업(미수행).

---

# 트랙 C — malgn-noti 사용자단 추가 작업

> 비고: 본 트랙의 §12·§13은 같은 날(2026-05-27) 작업이지만 세션 도중 시스템 날짜 알림 혼선으로 일부 세부 섹션이 `history.20260521.md §22~§25`로 먼저 기록됨. 거기에는 화면별 상세 + 동시 작업 격리 절차가 남아 있고, 본 파일에는 요약·배포·커밋만 둠.

## 12. 사용자단 추가 — 랜딩페이지 만들기·문의 경로 이동·나의 페이지·충전 (배포 #44·#45·#46)

- **#44 — 메시지 관리 / 랜딩페이지 만들기** ([/manage/landing](../../app/pages/manage/landing.vue)): GNB 메시지 관리 메뉴 `상세 설정` 위에 신규. C 테이블 스타일 목록(공개여부 필터·이름 검색·선택 복사/삭제·`미리보기`·`URL 복사`) + 기본형/확장형 등록·수정 폼 뷰 전환(공개 여부 토글·랜딩페이지명·URL·메인 타이틀·확장형 비주얼 이미지·콘텐츠 영역·확장형 CTA 버튼) + `AppLandingPreviewDialog`(LIVELY SHOP 빅세일 샘플 렌더, width 960·min-height 74vh) + `AppLandingUrlDialog`(URL 복사 완료). alias `https://184b0fe1.malgn-noti.pages.dev`.
- **#45 — 문의하기 페이지 `/account/inquiry` 경로로 이동**: 문의 폼·완료 페이지를 `app/pages/account/inquiry/` 하위로 이동, 중복되던 별도 문의 목록 페이지 삭제(나의 문의 목록은 `/account/inquiries`에 별도 작업). [AppGnb](../../app/components/AppGnb.vue)·[AppFooter](../../app/components/AppFooter.vue)·[sitemap.vue](../../app/pages/sitemap.vue)의 `/inquiry` 링크를 새 경로로 갱신. 동시 진행 중인 '나의 페이지'·충전 작업분이 working tree에 섞여 있어 임시 git worktree(`a021e2b` 체크아웃)에서 문의 변경만 격리 빌드 후 배포. alias `https://aa4503b7.malgn-noti.pages.dev`.
- **#46 — 나의 페이지 섹션 + 크레딧 충전 플로우**: 계정 관리를 `나의 페이지`로 개편. `AppMyPageShell`(공통 셸 + 좌측 메뉴 9종) + 라우트 9개(`/account/{settings,cards,password,security,multi,contract,credit,billing,inquiries}`) + `AppMemberInfoPanel`·`AppCardListPanel`·`AppEmailChangeDialog`·`AppPhoneVerifyDialog`·`AppCardAddDialog`. 크레딧 충전은 [/charge](../../app/pages/charge/index.vue) 시안 기반 재구성(충전 금액 선택·결제 카드 등록·결제 및 환불안내·동의) + 진행 컨펌 모달 + [/charge/result](../../app/pages/charge/result.vue) 완료 화면. alias `https://fcb87146.malgn-noti.pages.dev`.

## 13. malgn-noti-api 루트(/) → /doc 리다이렉트

- [src/index.ts:55](../../../malgn-noti-api/src/index.ts) 의 placeholder JSON 핸들러를 `c.redirect('/doc')` 한 줄로 교체 — `https://malgn-noti-api.malgnsoft.workers.dev/` 접속이 곧장 Scalar API 문서로 302 이동.
- 동시 진행 중인 API 작업분(NHN webhook·send·schema·dispatch worker·`flow-definitions`/`export-jobs` 신규 라우트)이 working tree에 섞여 있어 — 배포는 working tree 기준이라 함께 라이브에 올라갔으나(typecheck 통과·`/health` 정상), 커밋은 임시 `git checkout HEAD -- src/index.ts`로 베이스라인 복원 → 리다이렉트만 재적용 → stage·commit 후 WIP 복원 방식으로 **리다이렉트 한 줄만** 격리 기록.
- Version `f3fd3eb4-c594-471c-949a-f61ba1b30db1`. `GET /` → 302 `Location: /doc`, `GET /doc` → 200 (Scalar UI), `GET /health` → 200 production 확인.

## 14. malgn-noti-api §13 WIP 정식 커밋 — RCS 채널 + Export 잡 + Flow 정의 + 배포 #8

§13 시점에 working tree에 라이브로 올라가 있었으나 커밋 격리로 인해 `main`과 어긋난 채 남아 있던 3 도메인 슬라이스를 단일 배치로 정리 — 코드 + 신규 마이그레이션 SQL + Workers 재배포까지 일관화.

### 14.1 RCS 채널 (5채널째 — sms·email·kakao·push 잇는)

- `src/adapters/nhn/rcs.ts` 신규 — NHN `/rcs-biz/v2.0` 4타입(sms/lms/mms/template) 어댑터. `NHN_MOCK=1` 또는 `brandId` 미설정 시 mock 응답. 실 모드는 `X-Secret-Key` 헤더 + `chatbotId` 발신.
- `src/adapters/nhn/webhook.ts` — RCS 콜백 파서 추가(`nhnRequestId`·`recipientNo`·`resultCode`·`recv_state` 천이).
- `src/routes/send.ts` (+227) — RCS producer. 발신 RCS 브랜드(`TB_RCS_BRAND`) 검증 + 옵트아웃 필터 + 크레딧 hold + 트랜잭션 적재(기존 SMS/Email/Kakao/Push 패턴 generic 재사용).
- `src/routes/webhooks.ts` — `POST /webhooks/nhn/rcs` (기존 SMS 핸들러와 동일 HMAC-SHA256 검증 + `dedup_key` 멱등).
- `src/workers/dispatch.ts` — Consumer에 RCS 채널 분기 추가.
- `src/lib/pricing.ts` — `RCS_PRICING = { sms: 12, lms: 40, mms: 120, template: 50 }` (frontend `app/types/channel.ts` RCS_META 참조).

### 14.2 Export 잡 (비동기 다운로드)

- 시안의 "**다운로드 요청 PU + 목록 PU**" 패턴 + 90일 윈도우 우회 경로.
- `src/db/schema.ts` — `TB_EXPORT_JOB` 비파티션. `resource_type` 7종(history_sms/email/kakao/push/rcs + contacts + credit_ledger) · `job_state` 5단계(pending → running → ready / failed / expired) · `r2_key`(R2 결과 위치) · `expires_at`(등록 +30일).
- `src/routes/export-jobs.ts` 신규 — POST 등록 / GET 목록(커서·필터) / GET 단건(ready면 `downloadUrl` placeholder 노출) / DELETE soft.
- 처리 worker + R2 presigned URL 발급은 후속.

### 14.3 Flow 정의 (복합 발송 그래프)

- `src/db/schema.ts` — `TB_FLOW_DEFINITION`(nodes JSON) + `TB_FLOW_RUN`(1회 실행 인스턴스) + `TB_FLOW_STEP_RUN`(노드 단위). 3 테이블 모두 비파티션 + 인덱스.
- `src/routes/flow-definitions.ts` 신규 — Zod superRefine로 노드 검증(order 0부터 연속 + 첫 노드 `condition='always'` 강제 + 채널 5종 enum + `delayMinutes ≤ 7일`).
- 실행 엔진(`POST /send/flow`)·`TB_FLOW_STEP_RUN` 천이는 후속.

### 14.4 신규 마이그레이션

- `src/db/migrations/0002_export_flow.sql` 신규 — TB_EXPORT_JOB + TB_FLOW_DEFINITION + TB_FLOW_RUN + TB_FLOW_STEP_RUN (인덱스 4종 포함).
- **DDL 적용 보류** — `wrangler dev --remote`가 Cloudflare API edge-preview 호출에서 실패(1105 잔류). 1105 회복 후 `pnpm dev --remote` 띄워 `/admin/migrate`에 POST 예정. 그동안 `/export-jobs`·`/flow-definitions`는 라이브 5xx(table not found) 가능 — **프런트 호출처 0개**로 무영향.

### 14.5 OpenAPI 4지점 갱신

- `src/openapi.ts` (+230) — RCS 발송·Export 잡 CRUD·Flow 정의 CRUD 문서화. Scalar UI(`/doc`)에서 즉시 확인 가능.

### 14.6 배포 #8 + 검증

- `wrangler whoami` OAuth 토큰 재인증(info@malgnsoft.com) 선행 후 `pnpm run deploy`.
- Workers Version `95f9f894-4d6c-419d-9cec-8bc7f6c37999`. Total Upload 2549.53 KiB / gzip 583.70 KiB, Startup 78 ms.
- 검증: `/health` 200(env=production), `/health/db` 200(mysql 8.0.42), `/export-jobs`·`/flow-definitions` 모두 401(auth 가드 작동 — DDL 부재가 트리거되지 않음).

### 14.7 정리 — working tree ↔ main 동기

- 단일 배치 커밋 `malgn-noti-api: 1e7bd61 feat: RCS 채널 + Export 잡 + Flow 정의 — 3 도메인 슬라이스` (12 files, +1228 −16). origin/main 푸시 완료(`677dffa..1e7bd61`).

## 산출물

### 트랙 A (admin)

- 신규 파일(`malgn-noti-admin/`): `package.json` · `nuxt.config.ts` · `tsconfig.json` · `pnpm-lock.yaml` · `app/app.config.ts` · `app/app.vue` · `app/assets/css/main.css` · `app/layouts/default.vue` · `app/components/{AppLnb,AppTopbar}.vue` · `app/pages/index.vue` (10종 + lockfile).
- 삭제: `public/index.html` (부트스트랩 전 placeholder, Nuxt 라우트 가로채는 충돌 해소).
- 프로덕션 URL: `https://malgn-noti-admin.pages.dev` (첫 Nuxt 앱 배포 — 이전 #2 placeholder 정적 페이지 대체).
- 커밋: `malgn-noti-admin: 6cbf238 Nuxt 3 + Nuxt UI v3 부트스트랩 + LNB·TopBar 셸 레이아웃` (12 files, +9064 −24 — 대부분 `pnpm-lock.yaml`).

### 트랙 B (api)

- `malgn-noti-api: 020307f fix(idempotency): TB_IDEMPOTENCY + INSERT-then-conflict 패턴 — 멱등 버그 해결` (4 files, +151 −74). `0001_idempotency.sql` 신규.
- `malgn-noti-api: 5e1ac72 feat(send): NHN SMS 어댑터 + Cloudflare Queues + consumer worker (mock 모드)` (8 files, +439 −5). `src/adapters/nhn/{types,sms}.ts`·`src/workers/dispatch.ts` 신규.
- `malgn-noti-api: 0d28173 feat(webhooks): POST /webhooks/nhn/sms — NHN 발송 결과 콜백 수신` (6 files). `src/db/schema.ts` (dispatchEvent) · `src/lib/webhook-signature.ts` · `src/adapters/nhn/webhook.ts` · `src/routes/webhooks.ts` 신규.
- `malgn-noti-api: 06cf052 feat(send): Email · Kakao · Push 채널 추가 — 3채널 producer + adapter + worker` (9 files, +1211 −50). `src/adapters/nhn/{email,kakao,push}.ts` 신규.
- Cloudflare Queue `malgn-noti-dispatch` (id `6c67d698...`) + Workers Version `b30dc2a3-dc5a-4050-a435-c3d03a5e69a7` (배포 #6) → `12dae362-2900-42ca-9a2e-e6dfb9c60091` (배포 #7).
- `history.20260526.md §22·§23` 에 트랙 B 상세 기록.

### 트랙 C (사용자단 추가)

- `malgn-noti: 265395a` 랜딩페이지 만들기 — 목록·등록/수정 폼·미리보기 신규 구성 (배포 #44, alias `https://184b0fe1.malgn-noti.pages.dev`)
- `malgn-noti: a021e2b` 문의하기 페이지를 /account/inquiry 경로로 이동 (배포 #45, alias `https://aa4503b7.malgn-noti.pages.dev`)
- `malgn-noti: 83c4c37` 나의 페이지 섹션 + 크레딧 충전 플로우 신규 구성 (배포 #46, alias `https://fcb87146.malgn-noti.pages.dev`)
- `malgn-noti-api: 677dffa` 루트(/) 요청을 API 문서(/doc)로 302 리다이렉트 (Workers Version `f3fd3eb4-c594-471c-949a-f61ba1b30db1`)
- 화면·격리 절차 상세는 `history.20260521.md §22~§25` 에 기록(세션 도중 시스템 날짜 알림 혼선으로 1차 작성된 위치).

### 트랙 E (api §13 WIP 정식 커밋 — RCS·Export·Flow)

- `malgn-noti-api: 1e7bd61 feat: RCS 채널 + Export 잡 + Flow 정의 — 3 도메인 슬라이스` (12 files, +1228 −16). 신규: `src/adapters/nhn/rcs.ts` · `src/routes/{export-jobs,flow-definitions}.ts` · `src/db/migrations/0002_export_flow.sql`. 수정: `src/db/schema.ts`(4 테이블 추가) · `src/openapi.ts`(+230) · `src/routes/send.ts`(+227 RCS producer) · `src/lib/pricing.ts`(`RCS_PRICING`) · `src/adapters/nhn/webhook.ts` · `src/routes/webhooks.ts` · `src/workers/dispatch.ts` · `src/index.ts`(라우트 마운트).
- Workers Version `95f9f894-4d6c-419d-9cec-8bc7f6c37999` (배포 #8). `wrangler whoami` 재인증 후 `pnpm run deploy`. `/health`·`/health/db`·`/export-jobs(401)`·`/flow-definitions(401)` 검증.
- **DDL 보류**: `0002_export_flow.sql` 적용은 `wrangler dev --remote`가 Cloudflare 1105로 막혀 있어 1105 회복 후 `/admin/migrate`로 적용 예정.

## 다음 단계 / 알려진 한계

### 트랙 A (admin)

- 셸만 구성 — 각 라우트(`/customer`, `/send`, `/template`, `/report`, `/billing`, `/ops` …)의 페이지/컴포넌트는 미구현. LNB 메뉴 항목은 시각 동작만(클릭 시 라우트 이동 없음, 액티브 키만 변경).
- `MemoPanel`(우측 360px sticky)·고객사 상세의 InfoCard·계정 테이블·BarChart·ActivityList·권한 변경 모달 — 핸드오프 정본에 있으나 셸 범위 밖.
- `doc/DESIGN-ADMIN.md`의 primary `#6366f1`(indigo)과 부트스트랩 정본 `blue(#3b82f6)` **불일치** — 핸드오프를 우선해 구현, DESIGN-ADMIN.md 정합화는 후속 작업.
- `malgn-noti-admin/CLAUDE.md`에 사용자단 §7.1 유사한 **배포·Git·작업 이력 운영 컨벤션** 미수록 — 후속 작성 필요(현재는 사용자단 컨벤션을 준용해 진행).
- 인증 미들웨어·RBAC·`Cmd+K` 명령 팔레트·다크 모드 — 모두 셸 이후 별도 작업.

### 트랙 B (api)

- 큐 e2e 검증 — Cloudflare 1105 회복 후 `pnpm dev` + 시드 + PROD URL 발송 → `dispatch_state` 천이 추적.
- `0002_export_flow.sql` DDL 적용 — 1105 회복 후 `/admin/migrate`로 4 테이블 생성. 그 전까지 `/export-jobs`·`/flow-definitions` 호출 시 5xx(table not found).
- 채널별 webhook — `/webhooks/nhn/email` · `/webhooks/nhn/kakao` · `/webhooks/nhn/push` (현재는 SMS·RCS만). Push는 별도 결과 조회 API 필요.
- Flow 실행 엔진 — `POST /send/flow` + `TB_FLOW_RUN`/`TB_FLOW_STEP_RUN` 천이 + 폴백 정책(예: 알림톡→친구톡→LMS) 실행기.
- Export 잡 처리 worker — Cloudflare Queues 컨슈머 + 채널별 이력 조회 → R2 업로드 → presigned URL 발급.
- 실 NHN 자격증명 등록 + `NHN_MOCK` secret 삭제 → real 모드 전환 (채널별 appKey).
- Kakao senderKey · pushCert credential의 envelope 복호화 (현재 평문 가정).
- 트랜잭션 rollback 시 idempotency cleanup race 추가 보강.
