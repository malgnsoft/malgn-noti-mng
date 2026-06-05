# 2026-06-04 — Hyperdrive Cloudflare Tunnel 전환 + 관리자단 핸드오프 17 페이지 풀세트 + NICE IPv6 진단 + WBS R2 편집 + 이메일 변경 버그 fix + 광고 수신 일시 기록

## 한 줄 요약

오늘 9건 처리. **(§6)** NHN Notification Hub 어댑터 신규(OAuth2 client_credentials → Bearer) + SMS·Email 라우트 활성화. Email real 발송 검증 통과(messageId 발급). + 서비스 담당자 이메일 변경 라우트(`POST /me/email-change`, OTP + 비밀번호 검증, **loginid 유지·email만 UPDATE**) 및 사용자단 다이얼로그 실 API 연동. **(§7)** WBS 현행화 — R2 정본(`wbs/wbs.json`) + `doc/WBS.md` 동시 갱신. Step 5 진척 48% → 55%, 가중평균 약 47.5%. 5-2 신규 19/20/21(WBS R2 / 이메일 변경 / NHN OAuth 어댑터), 5-3-15(`/wbs` 인라인 편집), 5-3C-7(완료 승급), 5-3C-20(이메일 변경 다이얼로그), 5-4-14/15/16(핸드오프 17 페이지 + dev 라벨 + 관리자 로고), 5-5-10/11/12(Hyperdrive Tunnel / NHN Email real / NHN SMS pending). **(§8)** 서비스 담당자 이메일 변경 — 두 가지 버그 fix. (a) `/auth/email-code/verify` 가 `purpose='change_email'` 에서 `consumed_at` 을 마킹해 직후 `/me/email-change` 의 OTP 재검증이 항상 실패하던 이중 소비 버그 → verify-only 분기로 수정. (b) 비밀번호·OTP 오류가 401 로 떨어져 `useApi.onResponseError` 가 토큰 만료로 오인하고 자동 로그아웃을 트리거하던 문제 → 새 헬퍼 `errors.unprocessable()`(422) 도입해 본인 재인증 실패를 별도 코드로 분리. (c) 다이얼로그 `submit()` 이 `submitting=true` 만 켜고 부모의 `close` emit 을 기다리던 데드락 → `onConfirm: (p) => Promise<void>` 콜백 prop 패턴으로 전환해 다이얼로그가 자기 상태를 직접 관리. **(§9)** 광고성 메일 수신 동의/거부 일시 기록 — DDL 0006 (`TB_COMPANY.ad_receive_at DATETIME NULL`) Aurora 적용 + `PATCH /me/company` 에서 `adReceive` 변경 시 `adReceiveAt: new Date()` 동시 기록. 사용자단 패널에 `[🕒] YYYY.MM.DD HH:mm 광고성 메일 수신에 동의/거부함` 회색 칩 노출 + 토스트 description 에 처리 일시 표기. 정보통신망법 50조 동의 증빙용. **(§1)** NICE 자격증명 재확인 + 옵션 B(Cloudflare 대역 등록) 시도 → 여전히 1007. 진단용 `/diag/egress`로 Workers의 outbound가 **IPv6**(`2a06:98c0:3600::103`, Cloudflare `2a06:98c0::/29`)임을 확인. NICE 콘솔에 IPv4 대역만 등록된 게 원인 — IPv6 대역(7개) 추가 등록 안내 + mock 복귀. **(§2)** Hyperdrive 바인딩 교체 — `a2ba4efe...` → `439b109d...`. 신규 Hyperdrive는 **Cloudflare Tunnel(Access)** 기반(host `malgn-dev-db.apiserver.kr` + `access_client_id`). Aurora SG egress IP 화이트리스트 운영 부담 해소 — CLAUDE.md §12 TODO "SG 갱신 운영 절차" 항목 달성. 관련 정본 3개(API CLAUDE.md §3·§12·§8, SCALABILITY.md §6 신규 절, MIGRATION.md §1) 동기화. **(§3)** **관리자단 핸드오프 풀세트** — `handoff_noti_admin` (3,129줄 jsx)을 Vue 3 + Nuxt UI v3로 1:1 포팅. 셸(LNB 메뉴 트리 완전 재정비 + Topbar 동적 브레드크럼) · 공유 컴포넌트 14종(PageHeader/SectionCard/Tabs/Segmented/FilterBar/DateRange/DataTable generic+slot/Pagination/StatusBadge 자동 매핑/ChannelChip/StatCard/Drawer/Modal/Field/EmptyState) · 차트 4종(Bar/Area SVG path+gradient/Donut stroke-dasharray/Progress) · **17 페이지**(대시보드·고객사·고객사 상세·계정·모니터링·발신번호·발신프로필·템플릿검수·결제·채널단가·충전쿠폰·1:1문의·FAQ·공지·통계·운영자·권한그룹·API). app.config.ts `info: 'indigo'` 매핑으로 핸드오프 indigo 강조색을 Nuxt UI semantic으로. 18 라우트 라이브 200. **(§4)** 사용자 보고 후속 — admin의 폰트 사이즈가 핸드오프와 다르다는 신고에서 **두 원인 동시 발견**: (a) `main.css` `html,body{font-size:13px}`가 모든 Tailwind 토큰을 18% 축소시킴(핸드오프는 base font-size 명시 없음 = 16px), (b) 직전 turn의 cwd가 사용자단이라 **사용자단 dist를 admin 프로젝트로 배포**한 상태였음(chunk 600개 / GNB·메모·계약 컴포넌트 등 사용자단 자산이 admin URL에 노출). 둘 다 정정: 13px 제거 + `letter-spacing: -0.01em` 추가, admin 디렉토리에서 clean rebuild + 재배포. Pages alias `8852d5da.malgn-noti-admin.pages.dev` (chunk 96개로 정상화). **(§5)** WBS 페이지 편집 기능 — DB 미사용 / R2 단일 JSON 객체 정본(`wbs/wbs.json`). API에 GET 공개 + PATCH 인증 2 라우트 + 142 task 시드. 사용자단은 임베디드 STAGES 제거 → API 비동기 로드 + 인라인 편집 모달(5 필드, 빈값=`null`=필드 제거). Workers Version `28f3e6a8...`, Pages alias `02bb58e6`. 후속(§5.9) — 목표일·완료일 `YYYY.MM.DD` 포맷 통일 + `<input type="date">` 캘린더 위젯 + API Zod regex 강제. Workers Version `eb02206c...`, Pages alias `98bd09e2`.

---

# §1. NICE IPv6 진단 — 옵션 B 시도 → IPv4만 등록되어 여전히 1007

## 한 줄

6/2 §16의 1007 차단 후속. 사용자가 옵션 B(NICE 콘솔에 Cloudflare egress IP 대역 등록)를 진행했다고 알림 → 재시도 했지만 여전히 `1007 허용되지 않은 IP 접근`. 진단을 위해 임시 endpoint `GET /diag/egress`를 추가해 외부 echo(`api.ipify.org`)로 실제 출발지 IP를 8회 캡처 → **모두 IPv6 `2a06:98c0:3600::103`** (Cloudflare 공식 IPv6 `2a06:98c0::/29` 소속). NICE에 등록된 대역은 IPv4뿐이라 IPv6 출발지가 거부됨. 즉시 mock 복원 + 진단 endpoint 제거(/diag/egress → 404) + Workers 재배포. 사용자에게 NICE 콘솔에 **Cloudflare IPv6 대역 7개**(`2400:cb00::/32` · `2606:4700::/32` · `2803:f800::/32` · `2405:b500::/32` · `2405:8100::/32` · `2a06:98c0::/29` · `2c0f:f248::/32`) 추가 등록 또는 IP 검사 OFF(옵션 A) 안내 후 사용자가 IP 보류 결정. 자격증명 3개(CLIENT_ID/SECRET/RETURN_URL) 보관 유지 — 정책 해결 시 `wrangler secret delete NICE_MOCK` 한 번이면 real 전환.

## 1.1 자격증명 재확인

Cloudflare는 secret 값을 `secret list`로 노출하지 않음. 가장 확실한 방법은 사용자가 준 값으로 **덮어쓰기** — 일치하면 그대로, 다르면 정확한 값으로 교정. `wrangler secret put NICE_CLIENT_ID/SECRET`로 사용자 제공값 100% 일치 보장 처리.

## 1.2 1007 재현 → 진단 endpoint

```ts
app.get('/diag/egress', async (c) => {
  const samples: string[] = []
  for (let i = 0; i < 8; i++) {
    const r = await fetch('https://api.ipify.org?format=json', { cf: { cacheTtl: 0 } })
    const j = await r.json()
    samples.push(j.ip)
  }
  return c.json({ samples, unique: [...new Set(samples)] })
})
```

연속 2회 호출 결과 — 16번 모두 동일 IP: `2a06:98c0:3600::103`. Cloudflare 공식 IPv6 대역 `2a06:98c0::/29` 소속.

## 1.3 결정 — IPv6 대역 추가 등록 또는 IP 검사 OFF

| 옵션 | 작업 |
| --- | --- |
| A. NICE 콘솔에서 IP 인증 OFF | 콘솔 → 보안설정 토글 |
| B'. IPv6 대역 7개 추가 등록 (오늘 사용자가 했던 B는 IPv4만 등록되어 실패) | Cloudflare 공식 IPv6 목록 NICE 영업에 송부 |
| C. 고정 IP 프록시 EC2 | AWS EC2 nano + 어댑터 baseUrl 변경 |

사용자 의사로 일단 **보류** 결정. `NICE_MOCK=1` 복원해 가입 흐름은 mock 정상. 진단 endpoint는 보안상 즉시 제거 + 재배포로 라이브에서 404.

## 1.4 산출물

- 코드: 없음(진단 endpoint는 일시 추가 후 제거)
- secret: `NICE_CLIENT_ID/SECRET` 덮어쓰기(값 변경 없음, 일치 보장만), `NICE_MOCK=1` 유지
- Workers 배포 — 진단 endpoint 추가 시 Version `e77f89e0-8fed-4b27-a56a-a212d916cba3`, 제거 후 Version `0e3d3eb0-38ca-487f-8a28-355b0243a5a6`

## 1.5 보안 메모

`CLIENT_SECRET`이 6/2 채팅 평문 노출 + 오늘 한 번 더 노출. IP 정책 해결 시점에 NICE 콘솔에서 회전 권장. `doc/MEMBERSHIP.md` §9 후속 작업 21번에 이미 등록됨.

---

# §2. Hyperdrive 교체 — Cloudflare Tunnel(Access) 기반 (Workers Version a457b7dc)

## 한 줄

`wrangler.toml`의 HYPERDRIVE id를 `a2ba4efe7421464da1d5ff5e620b33a3` → `439b109dd219479e8b3e8d80eea9a240`으로 교체. 신규 Hyperdrive origin host가 `malgn-dev-db.apiserver.kr` (Cloudflare Tunnel 엔드포인트) + `access_client_id: 50b64dc493c35f1a9d9916baf4e2d735.access` (Cloudflare Access 서비스 토큰)이라, 기존 "퍼블릭 엔드포인트 + SG inbound에 Hyperdrive egress IP 화이트리스트" 구성이 "Cloudflare Tunnel 기반"으로 전환됨. 코드 변경 0 — Hyperdrive 바인딩 인터페이스 동일, mysql2 드라이버 그대로 동작. 라이브 검증 통과(`GET /health/db` mysql_version 8.0.42 + `POST /auth/nice/init` DB 쓰기 정상). 관련 정본 3개 문서 동기화.

## 2.1 전환 효과

| 항목 | 이전 (~6/1) | 신규 (6/4~) |
| --- | --- | --- |
| Aurora 노출 | 퍼블릭 엔드포인트 + SG 화이트리스트 | Cloudflare Tunnel 뒤 |
| 출발지 인증 | Hyperdrive egress IP가 SG에 등록되어야 통과 | Tunnel access_client_id로 인증 (출발지 IP 무관) |
| egress IP 갱신 추적 | Cloudflare 공식 IP 목록 변경 시 SG 동기화 필요 | 불필요 |
| 로컬 `drizzle-kit migrate` 직결 | SG 제약으로 불가 (admin 라우트로 우회) | Tunnel 인증 없으면 통과 불가 (동일 운영 절차 유지) |

CLAUDE.md §12 TODO 중 "**SG 갱신 운영 절차**: Hyperdrive egress IP 목록이 바뀔 때 어떻게 감지/반영할지" 항목 자연 달성 — 더 이상 필요 없음.

## 2.2 라이브 검증

- `GET /health/db` → `{ok: true, mysql_version: "8.0.42"}` ✅
- `POST /auth/nice/init` (DB 쓰기) → mockMode true + niceAuth row insert ✅
- `GET /contracts` (인증 라우트) → 401 ✅

## 2.3 정본 문서 동기화

| 파일 | 변경 |
| --- | --- |
| `malgn-noti-api/CLAUDE.md` §3 | Aurora 노출 방식을 Tunnel로 명시. 이전 SG 화이트리스트 절차 삭제. egress IP 동기화 부담 제거 |
| `malgn-noti-api/CLAUDE.md` §12 TODO | "SG 갱신 운영 절차" 항목 ✅ 완료 표시 |
| `malgn-noti-api/CLAUDE.md` §8 | `pnpm db:migrate` 안내 문구 "Aurora SG 제약" → "Tunnel 뒤"로 |
| `malgn-noti-api/doc/SCALABILITY.md` §6 | **신규 절** "Hyperdrive ↔ Aurora 연결 방식 — Cloudflare Tunnel(Access) 기반 (2026-06-02 이후)" 추가. 전/후 구성 표 + 전환 이유 + 운영 영향 + 라이브 검증 + 신규 Hyperdrive id 명시 |
| `malgn-noti-api/doc/MIGRATION.md` §1 | 통로 다이어그램에 Tunnel 단계 추가, 신규 Hyperdrive id 반영 |

## 2.4 산출물

- API: `malgn-noti-api` — 2 커밋
  - `3d779ad` chore(wrangler): Hyperdrive id 교체. Workers 배포 Version `a457b7dc-e951-4f2a-bc78-29b5496fa90f`
  - `334ee69` doc(infra): Aurora 연결 방식 Cloudflare Tunnel 전환 반영 (코드 변경 없음 — 정본만)

## 2.5 알려진 한계 / 후속

- **Aurora SG inbound 단순화** — Tunnel 전환으로 더 이상 Cloudflare egress IP 추적 불필요하므로 SG inbound는 Tunnel daemon 호스트만 허용하도록 단순화 가능. AWS 측 정리 후속.
- **Aurora `PubliclyAccessible=false` 전환 검토** — Tunnel만 노출이 되면 퍼블릭 IP 제거 가능. 운영 정책 합의 후 적용.
- **Tunnel 가용성 모니터링** — Tunnel daemon이 죽으면 전 Workers DB 호출이 실패. 인지·복구 절차(Cloudflare 대시보드 알람 + 백업 경로) 정의 후속.

---

# §3. 관리자단 핸드오프 — 17 페이지 풀세트 + 셸 + 공유 컴포넌트 + 차트 구현 (Pages alias 8852d5da)

## 한 줄

신규 핸드오프 정본 `handoff_noti_admin`(prototype 3,129줄 jsx + 스타일 가이드 + 8 스크린샷)을 받아 사용자 요청으로 17 페이지 풀세트 신규 작성. 기존 admin은 셸(`AppLnb`/`AppTopbar`)만 있는 부트스트랩 상태였고 LNB 메뉴 트리도 핸드오프와 완전히 달라서 (a) 셸 완전 재정비 + (b) 공유 컴포넌트 14종 + (c) 차트 4종 + (d) 17 페이지를 모두 신규로 작성. Vue 3 + Nuxt UI v3로 jsx → Vue 1:1 포팅 패턴. 라이브 18 라우트(17 + 동적 `/customers/:id`) 모두 200 검증.

## 3.1 핸드오프 정본 IA

10 섹션 / 17 라우트 — `handoff_noti_admin/prototype/lnb.jsx`:

| # | 라우트 키 | 경로 | 화면 |
| --- | --- | --- | --- |
| 01 | `dashboard` | `/` | KPI4 + 발송추이(area) + 채널비중(donut) + 검수큐 + 실시간 발송 |
| 02 | `customer` | `/customers` | 필터바 + 선택 + 페이지네이션 |
| 02d | `customer/:id` | `/customers/[id]` | InfoCard(KPI5) + 탭6 + 계정 테이블 + 메모 타임라인 + 차트 + 권한변경 모달 |
| 03 | `account` | `/accounts` | 계정 목록 |
| 04 | `monitoring` | `/monitoring` | LIVE KPI4 + 처리량 라인 + 작업 큐(진행바·상태배지) |
| 05 | `sender-num` | `/senders/numbers` | 검수 목록 → 검수 Drawer(증빙·메모·승인/반려) |
| 06 | `sender-profile` | `/senders/profiles` | 동일 패턴 |
| 07 | `template` | `/templates` | KPI4 + 미리보기 Drawer + 자동검수 결과 |
| 08 | `billing` | `/billing` | KPI4 + 충전/차감/환불 내역 |
| 09 | `price-channel` | `/pricing/channels` | 채널별 단가표 |
| 10 | `price-charge` | `/pricing/coupons` | Tier 보너스 + 쿠폰/프로모션 |
| 11 | `inquiry` | `/support/inquiries` | 답변 Drawer |
| 12 | `faq` | `/support/faq` | 카테고리 사이드 + FAQ 목록 |
| 13 | `notice` | `/support/notices` | 공지 목록(고정·분류·공개) |
| 14 | `report` | `/reports` | KPI4 + 월별 추이 + 실패사유 donut + 채널 bar + Top 고객사 |
| 15 | `sys-operator` | `/system/operators` | 목록 + 운영자 추가 모달 |
| 16 | `sys-role` | `/system/roles` | 권한 그룹 카드 + 권한 매트릭스 |
| 17 | `sys-api` | `/system/api` | KPI4 + API 키 + 웹훅 |

## 3.2 셸 재정비

- **`AppLnb` 완전 재작성** — 기존 메뉴 트리(8 그룹/예약발송/FCM/APNs 등)를 폐기하고 핸드오프 정본 9 그룹 / 17 라우트로 교체. `NuxtLink` 기반 라우트 경로 매핑 + `isActive()` (path prefix 매칭) + 메뉴 검색 입력 + AI 발송 도우미 배너 + 사용자 칩.
- **`AppTopbar`** — `useState('breadcrumb')` 기반 동적 브레드크럼으로 변경. 페이지에서 `useBreadcrumb(['회원/고객사', '고객사'])` 호출로 즉시 갱신.
- **`useBreadcrumb` composable** 신규 — `composables/useBreadcrumb.ts`.
- **`app.config.ts`** — `info: 'indigo'` 매핑 추가. 핸드오프의 indigo 강조색(`검수자` 권한, `PUSH` 채널 등)을 Nuxt UI v3 semantic color로 사용 가능하게.

## 3.3 공유 컴포넌트 14종

| 컴포넌트 | 핵심 |
| --- | --- |
| `AppPageHeader` | caption · title · badges slot · actions slot |
| `AppSectionCard` | title/subtitle/actions/noBody/bodyClass |
| `AppTabs` | `tabs[]` + `v-model` (string\|`{value,label}`) |
| `AppSegmented` | pill 단일선택 (같은 패턴) |
| `AppFilterBar` | 2열 그리드 + 조회/초기화. 필드는 `#field-N` slot으로 |
| `AppDateRange` | from/to 표시 (placeholder) |
| `AppDataTable<T>` | **generic + `#cell-{key}` scoped slot** 패턴. selectable + 선택 set + row-click + min-width + 빈 상태 |
| `AppPagination` | page navigation + page size select |
| `AppStatusBadge` | **값→톤 자동 매핑** (활성/완료=success · 대기/검수중=warning · 중지/반려=error · 임시저장=neutral). 핸드오프 README §7 매핑 그대로 |
| `AppChannelChip` | PUSH=indigo · RCS=primary · SMS=emerald · 알림톡=amber · 이메일=sky |
| `AppStatCard` | icon + label + value + sub + delta(deltaUp 분기) + accent 7종 |
| `AppDrawer` | Teleport + body scroll lock + footer slot |
| `AppModal` | 중앙 + Teleport + scroll lock |
| `AppField` | label + required + hint |
| `AppEmptyState` | icon + title + desc + action slot |

`AppDataTable`의 generic + scoped slot 패턴이 핸드오프 prototype의 `columns: [{render: r => JSX}]` 패턴을 Vue로 가장 자연스럽게 옮긴 결과. 페이지에서 `<template #cell-status="{ row }"><AppStatusBadge :value="row.status" /></template>` 식으로 컬럼별 렌더 정의.

## 3.4 차트 컴포넌트 4종

핸드오프 `charts.jsx`(111줄, SVG 기반)와 동등:

- `AppBarChart` — 그룹/단일 막대 (div + height) + highlight + 점선 가이드
- `AppAreaChart` — SVG path(라인 + 영역 + 그라데이션) + 도트 + 라벨 축
- `AppDonut` — `stroke-dasharray`로 segment + center 라벨/sub + 우측 범례
- `AppProgressBar` — 가로 진행바 + show-pct 옵션

외부 차트 라이브러리 없이 동작(prototype 그대로). 후속에서 ApexCharts/Chart.js로 교체 가능.

## 3.5 17 페이지

각 페이지에서 `useHead({title})` + `useBreadcrumb([...])` 호출 + 더미 데이터 ref + `AppPageHeader`/`AppFilterBar`/`AppSectionCard`/`AppDataTable`/`AppPagination` 조합 + Drawer/Modal(필요 시).

가장 큰 페이지: `customers/[id]` (~370 라인) — InfoCard(좌측 identity + KPI5) + 탭 + 필터 + 계정 테이블(선택·역할 컬러·채널 칩) + 차트 + 최근 활동 + 메모 패널(우측 sticky aside) + 권한변경 모달(3열 라디오 그리드).

## 3.6 라이브 검증

```
/                       200    /support/inquiries     200
/customers              200    /support/faq           200
/customers/C2241        200    /support/notices       200
/accounts               200    /reports               200
/monitoring             200    /system/operators      200
/senders/numbers        200    /system/roles          200
/senders/profiles       200    /system/api            200
/templates              200
/billing                200
/pricing/channels       200
/pricing/coupons        200
```

18 라우트 모두 정상.

## 3.7 산출물

- `malgn-noti-admin: 0227cae` — 21 컴포넌트 + 1 composable + 17 페이지(폴더 8개) + app.config.ts + AppLnb/AppTopbar 갱신. Pages 초기 배포 alias `82178863.malgn-noti-admin.pages.dev` (이 배포는 §4의 사용자단 잘못 배포 시점에 덮어써짐 — §4 참조)

## 3.8 알려진 한계 / 후속

- **실 API 연동** — 현재 모든 더미 데이터. `malgn-noti-api`의 `/admin/*` 라우트 (대부분 미구현)를 신설 후 교체. `/admin/companies`·`/admin/companies/:id/{approve,reject}`가 P0(승인 게이트의 짝).
- **운영자 인증·RBAC 미들웨어** — admin CLAUDE.md §4 보안 원칙(2FA, Cloudflare Access, RBAC). 현재는 공개 라이브.
- **반응형 보강** — 핸드오프는 1600px 데스크톱 기준. 1280px 미만 메모 패널 숨김, 1024px 미만 LNB drawer화 필요.
- **차트 라이브러리 도입** — 현재 SVG 자체 구현(prototype 그대로). 데이터 양이 늘면 ApexCharts/Chart.js로 교체 검토.
- **고객사 상세 메모 composer 동작** — 현재는 placeholder 입력만 있고 등록 동작 없음. 운영자단 메모 API와 함께 후속.

---

# §4. 폰트 사이즈 정합화 — base 16px 복원 + 사용자단을 admin에 잘못 배포한 사고 정정 (Pages alias 8852d5da)

## 한 줄

사용자 보고 — "관리자단의 폰트 사이즈가 핸드오프 디자인과 다르다." 진단 결과 **두 원인이 겹쳐** 있었음. **(a) main.css의 base font-size 13px** — `html, body { font-size: 13px }`로 명시되어 있어 Tailwind 토큰(`text-xs=0.75rem` 등은 16px base 가정)이 모두 약 18% 작게 표시됨. 핸드오프 prototype/index.html과 스타일 가이드는 body에 font-size 명시 없음(= 16px Tailwind 기본). **(b) 사용자단을 admin에 잘못 배포** — 직전 turn의 cwd가 `/Users/dotype/Projects/malgn-noti`(사용자단)였고, 거기서 `pnpm build` + `wrangler pages deploy dist --project-name=malgn-noti-admin`을 실행한 결과 **사용자단의 dist를 admin 프로젝트로 배포**한 상태였음. admin URL을 열어도 사용자단의 LNB·계약·메모 등 컴포넌트와 CSS 토큰(`--paper`/`--ink-700`/`--font-base`)이 떴고, 그래서 폰트 토큰도 사용자단의 것이 적용되어 핸드오프와 일치하지 않게 보임. 둘 다 정정 — (a) main.css 13px 제거 + `letter-spacing: -0.01em` 추가, (b) admin 디렉토리에서 clean rebuild + 재배포(`8852d5da.malgn-noti-admin.pages.dev`). chunk 600개(사용자단) → 96개(admin 정상)로 정상화.

## 4.1 (a) main.css 13px → 16px 정합화

핸드오프 정본 인용 (`prototype/index.html`):
```css
html, body { font-family: "DM Sans","Pretendard Variable",Pretendard,system-ui,sans-serif; letter-spacing: -0.01em; }
```

font-size 명시 없음 → 브라우저/Tailwind 기본 16px base.

우리 main.css는:
```css
html, body {
  font-size: 13px;
  line-height: 1.55;
  ...
}
```

13px base에서 Tailwind 토큰은:
- `text-xs` (0.75rem) → 9.75px (핸드오프 12px ❌)
- `text-sm` (0.875rem) → 11.375px (14px ❌)
- `text-base` (1rem) → 13px (16px ❌)
- `text-2xl` (1.5rem) → 19.5px (24px ❌)

→ 모든 사이즈가 약 **18% 축소**. 페이지 제목·KPI 대표값·필터 라벨 등 전 화면에 영향.

수정:
```css
html, body {
  font-family: var(--font-sans);
  letter-spacing: -0.01em;  /* 핸드오프 정본 — 전역 자간 -1% */
  ...
}
```

`font-size: 13px` + `line-height: 1.55` 제거. Tailwind 기본 16px base 동작. 핸드오프 README §8 Typography 토큰(`text-[11px]`=11 · `text-xs`=12 · `text-[13px]`=13 · `text-sm`=14 · `text-base`=16 · `text-lg`=18 · `text-2xl`=24)이 정본 그대로 매칭.

## 4.2 (b) 사용자단을 admin에 잘못 배포한 사고

증상 — 빌드된 admin `entry.css`에 사용자단 토큰이 보임:
```css
body, html { background: var(--paper); color: var(--ink-700); font-family: var(--font-sans); font-size: var(--font-base); ...; font-feature-settings: "cv11","ss01","ss03"; letter-spacing: 0; line-height: 1.55; ... }
```

`--paper`/`--ink-700`/`--font-base`/`cv11`/`ss01`/`ss03`은 모두 사용자단(malgn-noti)의 `app/assets/css/main.css` 토큰. admin에는 정의 없음.

원인 — `dist/_worker.js/chunks/build/`에 `AppGnb-styles.*.mjs`·`AppContractPanel-styles.*.mjs`·`AppCardAddDialog-styles.*.mjs` 등 사용자단 컴포넌트 chunk가 들어있음. chunk 총수도 **600개**(admin 단독이면 ~96개).

추적 — `pwd`가 `/Users/dotype/Projects/malgn-noti`(사용자단). 거기서 빌드한 `dist`를 `wrangler pages deploy dist --project-name=malgn-noti-admin`으로 **다른 프로젝트로 deploy**. `wrangler`는 dist의 출처를 검증하지 않음. project-name만 일치하면 그대로 푸시.

정정:
```bash
cd /Users/dotype/Projects/malgn-noti-admin
rm -rf .nuxt .output dist
pnpm build
npx wrangler@4 pages deploy dist --project-name=malgn-noti-admin --branch=main --commit-dirty=true --commit-message "admin clean rebuild"
```

검증:
- chunk 수 600 → **96**
- `entry.css` body 룰: `body,html{color:#0f172a;font-family:var(--font-sans);letter-spacing:-.01em;...}` — font-size 없음 + letter-spacing -0.01em 정확
- 18 라우트 200, 제목 `대시보드 · 맑은 메시징 Admin`

## 4.3 산출물

- 사용자단: 없음(사용자단은 6/2 alias `3ee66d7c` 그대로 라이브 유지 — 이번 잘못 배포는 admin 프로젝트로만 갔으므로 사용자단 영향 없음)
- 관리자단: `malgn-noti-admin: 1b63200` fix(font) main.css 정합화. Pages 배포 alias `8852d5da.malgn-noti-admin.pages.dev` (clean rebuild)

## 4.4 교훈 / 운영 절차 보강 검토

1. **deploy 명령 보호** — 멀티 레포 환경에서 cwd가 잘못된 상태로 `wrangler pages deploy`가 다른 프로젝트로 가는 사고는 재발 가능. 방어책:
   - **prebuild 가드** — `package.json`의 `build` 스크립트에 `node -e "if (require('./package.json').name !== '<expected>') process.exit(1)"` 사전 체크
   - **wrangler.toml의 pages 프로젝트 매칭** — `pnpm run deploy:pages` 같은 알리아스 스크립트로 cwd + project-name을 묶음
   - **이력 추적 단순화** — 매 배포 직후 `wrangler deployments list <project>` 결과의 commit hash가 expected repo HEAD와 일치하는지 확인
2. **base font-size 명시 패턴 금지** — Tailwind 토큰이 16px base를 가정하므로, `html`/`body`에 `font-size`를 다른 값으로 명시하면 모든 토큰이 어긋남. 필요한 경우엔 토큰 자체(`@theme`의 `--font-base`)를 갱신.
3. **chunk 수 sanity check** — admin 같이 17 페이지 규모면 chunk가 ~100개 안팎. 600개가 떴다면 외부 자산 혼입 의심.

---

# §5. WBS 페이지 편집 기능 — R2 JSON 정본 + 인라인 모달 (Workers Version 28f3e6a8 / Pages alias 02bb58e6)

## 5.1 배경

`/wbs` 페이지는 그동안 [`app/pages/wbs.vue`](../../app/pages/wbs.vue) 안에 STAGES 상수로 임베디드된 데이터 — 매번 코드 수정 + 배포해야 진척률·메모를 갱신할 수 있었다. 사용자가 "**설명·링크·목표일·완료일·담당자를 수정할 수 있게**" + "**DB 미사용, R2에 JSON 파일로 저장**" 정책을 지정.

## 5.2 결정

- **저장소**: R2 단일 객체 (`malgn-noti-files` 버킷 / 키 `wbs/wbs.json`). 기존 FILES 바인딩 재사용 — 신규 바인딩 없음.
- **편집 가능 필드 5개**: `note` · `href` · `targetDate` · `completionDate` · `owner`. 상태(완료/진행 중/대기) · 단계 가중치 · 진행률 · 그룹 · 제목은 본 화면 편집 대상 아님(시드/코드 변경).
- **인증 정책**: GET 공개 / PATCH 로그인 필요. 페이지 자체는 그대로 `auth: false`, 편집 버튼이 `auth.user`일 때만 노출.
- **동시성**: last-write-wins. 단일 운영자 저빈도 사용 가정. ETag/If-Match는 향후 도입 여지.

## 5.3 API 변경 (malgn-noti-api)

신규 파일:

- [`src/data/wbs-seed.ts`](../../../malgn-noti-api/src/data/wbs-seed.ts) — 5 stages / **142 tasks** 시드. 현행 사용자단 임베디드 STAGES 그대로 복제. R2 미존재 시 첫 GET이 이 값을 PUT 후 반환.
- [`src/routes/wbs.ts`](../../../malgn-noti-api/src/routes/wbs.ts):
  - `GET /wbs` — 공개. `loadDoc()`이 R2 객체 없으면 시드를 PUT 후 반환.
  - `PATCH /wbs/tasks/:taskId` — `requireAuth()` 미들웨어. body 5필드. `null` → `delete target[field]` / `undefined` → 유지 / 값 → 갱신. 마지막에 `lastUpdated = new Date().toISOString().slice(0, 10)` + `saveDoc()`.

수정:

- [`src/index.ts`](../../../malgn-noti-api/src/index.ts) — `app.route('/wbs', wbs)` 등록.
- [`src/openapi.ts`](../../../malgn-noti-api/src/openapi.ts) — `wbs` 태그 + 2개 경로(GET 공개·PATCH 401 응답 포함).

## 5.4 사용자단 변경 (malgn-noti)

[`app/pages/wbs.vue`](../../app/pages/wbs.vue) 전면 재작성:

- 임베디드 STAGES 제거 → top-level `await api('/wbs')`로 비동기 로드. 로딩/에러 상태 노출.
- task 행 우측에 ✏️ 편집 버튼 — `v-if="auth.user"`로 로그인 사용자에게만 노출.
- 모달 (`AppModal` 기반): 담당자 / 설명 / 링크 / 목표일 / 완료일 5개 입력.
  - 빈 문자열 저장 시 payload에 `null` 전송 → 서버 R2에서 해당 필드 제거.
  - `owner`는 빈 값 불가 (Zod min(1)). 빈 값일 땐 payload에서 제외 → 미변경.
- 저장 성공 시 `useToast()` 알림 + `Object.assign(t, res.data)`로 in-place 갱신(refetch 없음).
- 비로그인 부제에 `· 로그인하면 편집 가능` 힌트 노출 + `/login?redirect=/wbs` 링크.

## 5.5 배포

- API: typecheck → `pnpm run deploy` → Version `28f3e6a8-6b53-42ee-b3d7-a145584f43d0`. 번들 2672 KiB / gzip 609. Worker Startup 75 ms. FILES 바인딩(`malgn-noti-files`) 정상.
- Pages: `pnpm build` → `npx wrangler@4 pages deploy dist --project-name=malgn-noti --branch=main`. alias `02bb58e6.malgn-noti.pages.dev`.

## 5.6 검증

- `GET /health` 200 / `/health/db` 200 (mysql 8.0.42)
- `GET /wbs` 200, **30,406 bytes** JSON. stages: 5 / tasks: 142 / lastUpdated: `2026-06-01` (시드 값 — R2 첫 PUT 직후 그대로). 시드 자동 적재 동작 확인.
- `https://malgn-noti.pages.dev/wbs` 200, alias 200.

## 5.7 산출물

- `malgn-noti-api: 9945db3` feat(wbs): R2 JSON 정본 + GET 공개 / PATCH 인증 라우트 (4 files, +452)
- `malgn-noti: 3ed473e` feat(wbs): /wbs API 연동 + 인라인 편집 모달 (1 file, +376 -355)
- R2 객체 `wbs/wbs.json` 라이브 (FILES 바인딩, 시드 자동 적재됨)

## 5.9 후속 — 날짜 포맷 정합화 (Workers Version eb02206c / Pages alias 98bd09e2)

사용자 지시: "목표일과 완료일은 년.월.일 로 변경해 주세요."

- **사용자단** `formatYmd` / `toDateInputValue` / `fromDateInputValue` 헬퍼 도입. 어떤 입력(YYYY.MM.DD / YYYY-MM-DD / 레거시 M-D)이든 `YYYY.MM.DD`로 정규화. 표시에 일괄 적용 — 레거시 `5/8`은 2026 기준 `2026.05.08`로 렌더.
- **편집 모달**: 텍스트 입력 → `<input type="date">` 두 개로 교체(브라우저 캘린더 위젯). 빈값은 `null`로 전송 → R2 필드 제거.
- **API** Zod에 `^\d{4}\.\d{2}\.\d{2}$` regex 검증 추가, 위반 시 400. OpenAPI 스키마도 동기화.
- **저장 정책**: 신규 PATCH는 무조건 `YYYY.MM.DD`. 기존 R2의 레거시 값은 그대로 두고 다음 편집 시 자연 정합화.
- 검증: `/health` 200 / `/health/db` 200 / `/wbs` 200 / `PATCH /wbs/tasks/1-1-1` no-auth → 401(정상). prod & alias `/wbs` 200.
- 산출물: `malgn-noti-api: 3a35464` fix(wbs): targetDate/completionDate 포맷 YYYY.MM.DD 강제 (Workers Version `eb02206c-c076-4f09-8881-5f536feecb02`). `malgn-noti: 08e5c33` fix(wbs): 목표일·완료일 YYYY.MM.DD 포맷 + native date picker (Pages alias `98bd09e2.malgn-noti.pages.dev`).

## 5.10 한계 / 후속

- **동시 편집 — last-write-wins**. 두 명이 동시에 다른 task를 PATCH하면 둘 다 R2 read-modify-write를 하므로 한쪽이 사라질 수 있다. 강한 정합 필요 시 ETag(If-Match) 도입.
- **편집 범위 제한**: status / weight / progress / title / group / 단계 추가·삭제는 본 화면에서 안 됨. 필요하면 별도 슬라이스에서 모달 확장 + 권한 강화(owner/admin only).
- **lastUpdated** 자동 갱신만 됨 — 누가 언제 무엇을 바꿨는지 감사 로그는 없음. 운영 단계 진입 전 도입 검토.

---

---

# §6. NHN Notification Hub OAuth 어댑터 + Email 실 발송 + 서비스 담당자 이메일 변경 라우트

## 한 줄

NHN 신규 통합 서비스(Notification Hub)는 기존 AppKey + SecretKey 직접 호출이 아닌 **OAuth2 client_credentials → Bearer 토큰** 방식. 어댑터 전면 재작성(`src/adapters/nhn/oauth.ts` 신규 + `sms.ts`/`email.ts` 재작성). Email은 `message@malgnsoft.com` 발신 도메인 콘솔 등록 + `EMAIL_FROM`/`EMAIL_FROM_NAME` secret 등록 후 실 발송 검증 통과(messageId 발급). SMS는 콘솔 발신번호 등록 + `SMS_FROM` secret 대기. 동시에 `POST /me/email-change` 신설 — OTP(`purpose=change_email`) + 비밀번호 검증 후 **`user.email` 만** UPDATE(`loginid`는 가입 시 식별자로 고정 유지). 사용자단 `AppEmailChangeDialog`도 실 API로 교체.

## 6.1 어댑터 재작성

- `src/adapters/nhn/oauth.ts` — `https://oauth.api.nhncloudservice.com/oauth2/token/create`로 Basic Auth(`userAccessKey:secretAccessKey`) + body `grant_type=client_credentials&scope=appKey:{APP_KEY}`. 응답 `access_token`은 메모리 캐시(`globalThis.__nhnTokenCache`, 60s 안전 마진).
- `src/adapters/nhn/sms.ts` — `POST {base}/message/v1.0/SMS/free-form-messages/{messagePurpose}`. body: `sender.senderPhoneNumber` + `recipients[].contacts[](contactType=PHONE_NUMBER, contact)` + `content(messageType, body, title?)`. 헤더 `X-NC-APP-KEY` + `X-NHN-Authorization: Bearer ...`.
- `src/adapters/nhn/email.ts` — 동형(`/EMAIL/free-form-messages/{purpose}`, `contactType=EMAIL_ADDRESS`).
- `NhnCredentials` 확장 — `userAccessKey`·`secretAccessKey` 추가, 기존 `secretKey`는 옵셔널로 다운그레이드. push/rcs/kakao는 `!creds.secretKey` 가드로 mock fallback 유지(후속 마이그레이션).

## 6.2 Email 실 발송 활성화

- NHN Notification Hub 콘솔에 `message@malgnsoft.com` 발신 도메인 등록 + SPF/DKIM 설정.
- Workers secret `EMAIL_FROM=message@malgnsoft.com` / `EMAIL_FROM_NAME=맑은 메시징` 등록.
- 라이브 검증 — `POST /send/email`: SUCCESS · `messageId=20260604154608lR6MBAKn8v0`.

## 6.3 `POST /me/email-change` 정책

- **유지**: `user.loginid` — 가입 시 발급된 식별자이며 전역 UNIQUE. 변경 가능하면 감사·연동 추적·세션이 깨진다.
- **변경**: `user.email` 한 항목만. 알림·연락처용 이메일이 새 주소로 교체.
- **검증 흐름**: (1) 새 이메일에 OTP(`purpose=change_email`) 발송 → (2) 클라이언트가 본인 비밀번호 + OTP 동시 입력 → (3) 서버에서 비밀번호 PBKDF2 검증 + OTP 코드 검증 + email-only UPDATE + 코드 소비 마킹.
- 5 시나리오 e2e 통과: 정상 / 코드 만료 / 코드 오타 / 비밀번호 오타 / 동일 이메일 재시도.

## 6.4 사용자단 변경

- `AppEmailChangeDialog.vue`: `sendCode`/`confirmCode`를 `/auth/email-code/{send,verify}`(`purpose=change_email`)로 교체.
- emit `confirm`: `[string]` → `[EmailChangePayload]` (`{newEmail, code, password}`).
- `app/stores/auth.ts`: `changeEmail(payload)` 액션 추가 — `POST /me/email-change` → `user/tenant` 갱신.
- `/account/settings` 두 다이얼로그 중 서비스 담당자 이메일 변경 다이얼로그가 실 API로 교체. **결제 이메일 변경**은 `PATCH /me/company`로 별도 흐름 유지.

## 6.5 산출물

- API: `src/adapters/nhn/oauth.ts` 신규 / `src/adapters/nhn/sms.ts`·`email.ts` 재작성 / `src/adapters/nhn/types.ts` 확장 / `src/routes/me.ts` `POST /email-change` 추가 / `src/openapi.ts` summary 갱신.
- 사용자단: `app/components/AppEmailChangeDialog.vue` 재작성 / `app/stores/auth.ts` `changeEmail` / `app/pages/account/settings.vue` 토스트 메시지 정정.
- 배포: Workers Version 갱신(이메일 변경 + NHN OAuth) / Pages alias 갱신.

## 6.6 알려진 한계

- push/rcs/kakao 어댑터는 아직 legacy AppKey + SecretKey 직호출 형태 — Notification Hub 마이그레이션 후속.
- SMS 라이브 e2e 1건 미실행 (발신번호 등록 대기).
- 자격증명은 현재 Worker 환경변수에 직접 보관. envelope 암호화(`NhnCredential` 테이블 + master key)는 멀티 테넌트 진입 시 도입.

---

# §7. WBS 현행화 — R2 정본 + `doc/WBS.md` 동시 갱신

## 한 줄

오늘 §1~§6 작업을 WBS 정본 두 곳(R2 `wbs/wbs.json` + `doc/WBS.md`)에 반영. Step 5 task 9건 신규(5-2-19/20/21, 5-3-15, 5-3C-20, 5-4-14/15/16, 5-5-10/11/12) + 5-3C-7 완료 승급 + 5-2-16·5-5-5 in_progress 승급. 진척률 48% → 55%, 가중평균 약 47.5%.

## 7.1 추가·갱신된 task

- **5-2-19** `WBS 정본 R2 저장 + GET/PATCH 라우트` ✅
- **5-2-20** `POST /me/email-change` — 서비스 담당자 이메일 변경 ✅
- **5-2-21** NHN Notification Hub 어댑터 신규(OAuth + Bearer) ✅
- **5-2-14** PG 어댑터 — **TossPayments 확정**(메모 갱신)
- **5-2-16** NHN 실 모드 전환 — ⚪ → 🟢 (OAuth 어댑터 완료, envelope 후속)
- **5-3-15** `/wbs` 페이지 — R2 정본 비동기 로드 + 인라인 편집 모달 ✅
- **5-3C-7** 회원 정보 변경 — 🟢 → ✅ (이메일 변경 OTP 연결 완료)
- **5-3C-20** 서비스 담당자 이메일 변경 — 실 OTP API 연동 ✅
- **5-4-14** 관리자단 핸드오프 정본 17 페이지 풀세트 ✅
- **5-4-15** 페이지 진척 상태 라벨 `dev=screen/partial/live` ✅
- **5-4-16** 관리자 로고/브랜드 — 사용자단 로고로 통일 + "관리자" 배지 ✅
- **5-5-1**/`5-5-3` 배포 카운터 갱신
- **5-5-5** NHN Notification Hub real — ⚪ → 🟢 (Email ✅, SMS pending)
- **5-5-10** Hyperdrive Cloudflare Tunnel(Access) 전환 ✅
- **5-5-11** NHN Email 실 발송 활성화 ✅
- **5-5-12** NHN SMS 실 발송 활성화 ⚪ (발신번호 등록 대기)

## 7.2 산출물

- R2: `malgn-noti-files/wbs/wbs.json` 업로드 (142 → 155 task).
- 정본 MD: `doc/WBS.md` 스냅샷 표 / 5-2 / 5-3A / 5-3M / 5-3C / 5-4 / 5-5 / "알려진 한계" 갱신.
- 라이브 검증: `GET https://malgn-noti-api.malgnsoft.workers.dev/wbs` → 155 task 확인.

## 7.3 한계 / 후속

- Step 1·2·3·4의 진척률은 6/4 작업과 무관해 그대로(55/55/35/20%). 컨설팅팀·기획팀 작업이 들어오면 별도 갱신.
- "WBS 현행화" 자체의 감사 로그(누가 언제 무엇을 PATCH 했는지)는 미 — 운영 진입 시 도입.

---

---

# §8. 서비스 담당자 이메일 변경 — 401 자동 로그아웃 + OTP 이중 소비 + 다이얼로그 데드락 fix (Workers Version 772adb3b / Pages alias cd6a5bb3)

## 한 줄

사용자 보고 "변경 완료 후 로그아웃 + 이메일 미변경". 추적 결과 세 단계가 겹쳐 발생: (a) 다이얼로그 "확인" → `/auth/email-code/verify` 가 verification row 의 `consumed_at` 을 마킹 → (b) 직후 "변경" → `/me/email-change` 가 다시 OTP 검증 시 `isNull(consumedAt)` 매치 실패 → 401 → (c) `useApi.onResponseError` 가 `/auth/*` 외 401 을 토큰 만료로 간주해 자동 로그아웃 + `/login` 이동. 추가로 다이얼로그는 `submitting=true` 만 켜고 부모의 `close` 를 기다려서, 에러 토스트는 떴지만 "변경 중…" 버튼이 영원히 잠겨 다시 시도 불가.

## 8.1 (a) OTP 이중 소비 — verify-only 분기

- 다른 purpose (signup·reset_password·contract_sign) 는 verify 한 번에 검증·소비가 끝나는 흐름이라 그대로 두고, **`change_email` 만** verify 단계에서 `consumed_at` 마킹 건너뜀.
- 최종 `/me/email-change` 가 한 번 더 검증 + UPDATE + 소비.

수정:
```ts
// src/routes/auth.ts — POST /auth/email-code/verify
if (purpose !== 'change_email') {
  await db.update(verification)
    .set({ consumedAt: now })
    .where(eq(verification.id, row.id))
}
```

## 8.2 (b) 401 → 422 분리

`errors.unauthenticated()` 401 은 **토큰 검증 실패(미들웨어 단계)** 에만 한정하기로 의미 정리. 본인 재인증(비밀번호·OTP) 실패는 새 헬퍼:

```ts
// src/lib/errors.ts
unprocessable: (msg: string) => new AppError('unprocessable', 422, msg),
```

`/me/email-change` 의 비밀번호 불일치·OTP 만료·OTP 불일치 throw 를 모두 `errors.unprocessable()` 로 교체. 클라이언트의 자동 로그아웃 트리거 회피 + 의미 정확.

## 8.3 (c) 다이얼로그 submit 데드락 — async callback prop

기존: `submit()` → `submitting=true` + `emit('confirm', payload)` → 부모가 `await` 성공 시 `emit('close')` → 다이얼로그 `watch(open)` 이 `reset()` 로 `submitting=false`. 에러 시 부모가 toast 만 띄우고 close 하지 않으므로 데드락.

변경: 다이얼로그 prop 에 `onConfirm: (p) => Promise<void>` 추가. 다이얼로그가 직접 `await` + `try/catch/finally` 로 자기 상태 관리.

```ts
// AppEmailChangeDialog.vue
async function submit() {
  if (submitting.value) return
  submitting.value = true
  try {
    await props.onConfirm({ newEmail: ..., code: ..., password: ... })
    emit('close')
  } catch (e) {
    toast.add({ title: msgFromError(e), color: 'error' })
  } finally {
    submitting.value = false   // 성공·실패 모두 잠금 해제
  }
}
```

부모(`AppMemberInfoPanel.vue`) 는 `:on-confirm="handleEmailConfirm"` 로 비동기 함수만 전달. 성공 toast 만 부모가 띄우고, 에러 toast 는 다이얼로그가 처리.

## 8.4 검증

- 라이브 `/health` 200 / `/me/email-change` 401(인증 미들웨어, 토큰 없는 호출) 정상.
- 다이얼로그: 비밀번호 오타 → 422 → 에러 토스트 + 버튼 활성화 + 재시도 가능. OTP 만료 → 422 → 동일 흐름. 정상 케이스 → 200 → 성공 토스트 + 다이얼로그 닫힘 + 새 이메일 반영.

## 8.5 산출물

- `malgn-noti-api`: `src/lib/errors.ts` (unprocessable 추가) / `src/routes/auth.ts` (verify-only 분기) / `src/routes/me.ts` (`errors.unauthenticated` → `errors.unprocessable` 3 곳).
- `malgn-noti`: `app/components/AppEmailChangeDialog.vue` (prop onConfirm 도입, emit confirm 제거) / `app/components/AppMemberInfoPanel.vue` (handler 시그니처 변경 + `:on-confirm` 바인딩).
- 배포: Workers Version `772adb3b-cb30-4e43-b539-7d60254c6195` / Pages alias `cd6a5bb3.malgn-noti.pages.dev`.

## 8.6 알려진 한계 / 후속

- 비슷한 본인 재인증 라우트(예정: `/me/password`, `/me/security` 2FA)도 같은 패턴 적용 — 비밀번호·OTP 오류는 401 이 아닌 422 로 응답.
- `/auth/email-code/verify` 가 purpose 별로 consume 정책이 다른 분기를 갖게 됐다. 다른 흐름(예: 휴대폰 변경)이 추가되면 동일 패턴 확장 검토.

---

# §9. 광고성 메일 수신 동의/거부 일시 기록 (DDL 0006 / Workers Version 3671ce95 / Pages alias 0f43b158)

## 한 줄

정보통신망법 50조에 따라 광고성 정보 수신 동의는 동의·거부 일시를 보관해야 한다. `TB_COMPANY.ad_receive_at DATETIME NULL` 신규 컬럼 + 사용자 의사 표시 시점마다 갱신 + 사용자단 패널에 마지막 변경 시각 노출 + 토스트에 처리 일시 표기.

## 9.1 DDL (0006_company_ad_receive_at.sql)

```sql
ALTER TABLE TB_COMPANY
  ADD COLUMN ad_receive_at DATETIME NULL AFTER ad_receive;
```

- Aurora 직결로 적용 + 컬럼 확인: `ad_receive_at | datetime | YES | | NULL`.
- 기존 행은 모두 NULL — 의사 표시 이력이 없다는 의미. 다음 변경 시점부터 기록.

## 9.2 API 변경

- `src/db/schema.ts` — `adReceiveAt: datetime('ad_receive_at')` nullable.
- `src/routes/me.ts` `PATCH /me/company` — `adReceive` 가 있으면 `adReceiveAt: new Date()` 동시 set. 같은 값으로 다시 눌러도 의사 표시 갱신으로 간주해 시각 갱신.
- `readContext` + 4 개 응답 라우트(`GET /me` · `PATCH /me` · `PATCH /me/company` · `POST /me/email-change`) 모두 `company.adReceiveAt` 포함.

## 9.3 사용자단 변경

- `app/stores/auth.ts` — `AuthCompany.adReceiveAt?: string | null` 타입 추가.
- `app/components/AppMemberInfoPanel.vue`:
  - `adReceiveAtLabel` computed — `YYYY.MM.DD HH:mm` 포맷 (JetBrains Mono / tabular-nums).
  - `adReceiveNotice` computed — `"YYYY.MM.DD HH:mm 광고성 메일 수신에 동의/거부함"`.
  - 토글 옆에 회색 칩(`.ad-stamp` + `i-lucide-clock-3` 아이콘)으로 노출. 한 번도 변경한 적 없는 회사(기존 데이터)는 칩 미표시.
  - 토스트 성공 메시지 `description: 처리 일시: YYYY.MM.DD HH:mm` 추가.

## 9.4 검증

- 라이브 `/me` 응답에 `company.adReceiveAt` 포함 확인.
- 패널에서 수신동의/거부 토글 → 토스트에 일시 + 칩에 새 일시 즉시 반영 (`updateCompany` 가 응답으로 store hydrate).

## 9.5 산출물

- `malgn-noti-api`: `src/db/migrations/0006_company_ad_receive_at.sql` / `src/db/schema.ts` / `src/routes/me.ts` (응답 4 곳 + UPDATE 1 곳).
- `malgn-noti`: `app/stores/auth.ts` / `app/components/AppMemberInfoPanel.vue`.
- 배포: Workers Version `3671ce95-be05-4ba0-8611-60bd168e7b80` / Pages alias `0f43b158.malgn-noti.pages.dev`.

## 9.6 알려진 한계 / 후속

- 의사 표시 **마지막 시점**만 보관 — 이력(언제 동의→거부→동의→…)은 미. 광고성 메시지 발송 분쟁 시 시점 증빙용으로 마지막 값만으로도 충분하지만, 운영 진입 시 별도 `TB_AD_RECEIVE_LOG` 도입 검토.
- IP·User-Agent 등 의사 표시 환경 정보는 미기록. 분쟁 대응 강화 시 추가.
- 광고 수신 거부자에 대한 발송 차단 로직(쿼리 조건)은 이번 변경 범위 밖. `dispatch` producer 측에서 별도 처리.

---

## 한계 / 다음 단계 (오늘 누적)

- **NICE real 전환** (§1·6/2 §16) — 사용자가 IP 정책 결정 대기. IPv6 대역 등록 또는 검사 OFF.
- **NHN Notification Hub real 전환** (6/2 §16 + 6/4 §6) — Email ✅ 라이브 검증 통과. SMS는 NHN 콘솔 발신번호 등록 + `SMS_FROM` secret 대기. push/rcs/kakao 어댑터는 Notification Hub로 마이그레이션 미.
- **PG = TossPayments 확정** (6/4) — `src/adapters/pg/toss.ts` + `TOSS_CLIENT_KEY`/`TOSS_SECRET_KEY` + 카드 등록/결제/취소/webhook 미구현.
- **운영자단 P0 진입** — admin 셸·페이지 완성됐으므로 다음 단계는 (a) 운영자 인증·RBAC, (b) `/admin/*` 백엔드 라우트 신설(특히 사업자 승인 화면 연동), (c) 실 API 연동.
- **Aurora SG inbound 단순화** (§2.5) — Tunnel 전환 후속 정리.
- **deploy 사고 재발 방지** (§4.4) — 멀티 레포 deploy 가드 도입 검토.
