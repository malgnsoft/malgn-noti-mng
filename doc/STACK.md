# 기술 스택 — 맑은 메시징

3개 레포(`malgn-noti` / `malgn-noti-admin` / `malgn-noti-api`)와 외부 의존을 한 번에 정리한 문서입니다.

> 큰 그림은 [CLAUDE.md](../CLAUDE.md), 프론트엔드 코딩 컨벤션은 [FRONTEND.md](./FRONTEND.md)를 참조.

---

## 1. 전체 토폴로지

```
사용자(고객사)             내부 운영자
       │                       │
       ▼                       ▼
┌─────────────────┐    ┌──────────────────────┐
│ malgn-noti      │    │ malgn-noti-admin     │       Cloudflare Pages
│ (Nuxt 3, SSR)   │    │ (Nuxt 3, SSR)        │       (.pages.dev)
└────────┬────────┘    └──────────┬───────────┘
         │                        │
         │     공개 API + 어드민 API│
         └───────────┬────────────┘
                     ▼
            ┌─────────────────────┐
            │ malgn-noti-api      │       Cloudflare Workers
            │ (Hono, TS)          │       (.workers.dev)
            └─────────┬───────────┘
                      │
       ┌──────────────┼──────────────────┐
       ▼              ▼                  ▼
┌─────────────┐ ┌─────────────┐  ┌────────────────────┐
│ Hyperdrive  │ │ R2 / KV /   │  │ NHN Notification    │
│ (MySQL)     │ │ Queues      │  │ Hub                 │
└──────┬──────┘ └─────────────┘  └─────────────────────┘
       ▼
┌─────────────────┐
│ AWS Aurora MySQL│
└─────────────────┘
```

---

## 2. 사용자단 — `malgn-noti`

고객(테넌트) 사용자가 사용하는 콘솔.

| 항목 | 선택 | 버전 | 역할 |
| --- | --- | --- | --- |
| 프레임워크 | **Nuxt** | 3.21.5 (`future.compatibilityVersion: 4`) | SSR + 라우팅 + 자동 import |
| 언어 | **TypeScript** | 5.9 (strict) | 타입 안전성 |
| 뷰 라이브러리 | **Vue** | 3.5 | UI 렌더 (`<script setup>`) |
| UI 컴포넌트 | **Nuxt UI v3 (MIT)** | 3.3.7 | 폼/모달/테이블/메뉴 — Reka UI + Tailwind |
| 스타일 | **Tailwind CSS** | v4 (Nuxt UI 통합) | 유틸리티 + `@theme`로 테마 토큰 |
| 상태 관리 | **Pinia** | 2.3 | 인증/사용자/크레딧 |
| 검증 | **Zod** | 3.25 | 폼/응답 |
| 아이콘 | **Iconify** | `lucide`, `heroicons`, `bi` | 채널 카드는 `bi`, 일반은 `lucide` |
| 차트 | **Chart.js** | 4.x (예정) | 통계 페이지 |
| 폰트 | **Inter · JetBrains Mono · Pretendard** | Google Fonts / CDN | UI=Inter, 숫자/ID=JetBrains Mono, 한국어 fallback=Pretendard (2026-05-18 디자인 피벗) |
| 린트 | **ESLint** | 9.x + `@nuxt/eslint` | Nuxt 권장 룰 |
| 패키지 매니저 | **pnpm** | 10.25.0 | 빠른 설치 + 워크스페이스 가능 |

배포 대상: **Cloudflare Pages** (`nitro.preset: 'cloudflare-pages'`). production: <https://malgn-noti.pages.dev>

---

## 3. 운영자단 — `malgn-noti-admin`

사용자단과 **완전히 동일한 스택**. 컴포넌트/도메인 타입 공유 전제.

차이점만:
- 배포 위치: <https://malgn-noti-admin.pages.dev>
- 접근 제어: 사내망/Cloudflare Access (예정)
- 인증: 어드민 전용 JWT + 2FA 강제 (예정)
- 추가 라이브러리(예정): 차트, CSV 내보내기 헬퍼

---

## 4. 백엔드 — `malgn-noti-api`

NHN/PG/AI를 직접 호출하는 유일한 컴포넌트.

| 항목 | 선택 | 버전 | 역할 |
| --- | --- | --- | --- |
| 런타임 | **Cloudflare Workers** | (V8 isolates) | edge 런타임 |
| 호환 모드 | `nodejs_compat` | — | `mysql2` 등 Node API |
| 호환 날짜 | `2025-01-01` | — | Workers 동작 기준 |
| 프레임워크 | **Hono** | 4.12 | 라우터/미들웨어 |
| 언어 | **TypeScript** | 5.x (strict) | 타입 안전성 |
| ORM | **Drizzle ORM** (`drizzle-orm/mysql2`) | 예정 | 타입 안전 쿼리 + 마이그레이션 |
| DB 드라이버 | **mysql2** | 예정 | MySQL wire 프로토콜 |
| 검증 | **Zod** | 예정 | 요청/응답 스키마 |
| 타입 정의 | **@cloudflare/workers-types** | 4.20260511 | Workers 환경 타입 |
| 빌드/배포 | **Wrangler** | 4.90.0 | `wrangler deploy`, secrets, hyperdrive |
| OpenAPI (검토) | hono-openapi / zod-openapi | — | 자동 스펙 |

배포: **Cloudflare Workers**. 엔드포인트: <https://malgn-noti-api.malgnsoft.workers.dev>

---

## 5. 데이터 / 스토리지 / 큐

| 종류 | 선택 | 위치 | 용도 |
| --- | --- | --- | --- |
| 트랜잭션 DB | **AWS Aurora MySQL 8.0** | AWS | 테넌트, 사용자, 발송 메타, 크레딧 원장, 캠페인, 템플릿 |
| DB 연결 | **Cloudflare Hyperdrive (MySQL)** | Cloudflare → AWS | 풀링 + 캐시 + 자격증명 보관 |
| 객체 스토리지 | **Cloudflare R2** | Cloudflare | MMS 첨부, Excel 업로드, Export 결과 |
| KV | **Cloudflare KV** | Cloudflare | 세션, 짧은 캐시 |
| 큐 | **Cloudflare Queues** | Cloudflare | 발송 큐 / 재시도 큐 / Export 잡 / 캠페인 fan-out |
| Cron | **Workers Crons** | Cloudflare | 캠페인 스케줄러, 정리 잡, FCM/APNs 만료 알림 |
| Durable Objects (검토) | — | Cloudflare | 테넌트별 rate limit, 캠페인 실행 단위 |

**Aurora 노출**: 퍼블릭 엔드포인트 + SG로 Hyperdrive egress IP 화이트리스트(개발 단계). TLS 강제, 앱 전용 최소권한 계정. 운영 단계에서 RDS Proxy / Cloudflare Tunnel 검토.

---

## 6. 외부 서비스

| 서비스 | 용도 | 통합 방식 | 상태 |
| --- | --- | --- | --- |
| **NHN Cloud Notification Hub** | SMS/RCS/알림톡/이메일/Push 실 발송 | api 서버의 채널 어댑터에서 HTTP 호출 | 통합 예정 |
| **결제 PG** (토스/포트원/나이스 중 미정) | 크레딧 충전 결제 | api 서버 어댑터 + 웹훅 | 미정 |
| **LLM 제공자** (Anthropic/OpenAI 중 미정) | AI 템플릿 생성 | api 서버 게이트웨이 (비용 통제) | 미정 |
| **Google Fonts / CDN** | Inter · JetBrains Mono · Pretendard · Instrument Serif 로드 | 프론트 `<link>` | 적용 |

---

## 7. 개발·운영 도구

| 도구 | 버전 | 용도 |
| --- | --- | --- |
| Node.js | 24.11.1 | 로컬 런타임 |
| pnpm | 10.25.0 | 패키지 매니저 |
| Wrangler | 4.90.0 | Cloudflare CLI (deploy, secret, hyperdrive, tail) |
| Git / GitHub | — | 버전 관리, 원격 저장소(`malgnsoft/*`) |
| ESLint | 9.x | 정적 분석 |
| Vitest | 예정 | 단위/통합 테스트 |
| Miniflare | 예정 | Workers 로컬 시뮬레이션 |
| drizzle-kit | 예정 | 마이그레이션 생성/적용 |

---

## 8. 배포 / 호스팅

| 프로젝트 | 호스팅 | 트리거 | URL |
| --- | --- | --- | --- |
| malgn-noti | Cloudflare Pages | `wrangler pages deploy` (CLI) | <https://malgn-noti.pages.dev> |
| malgn-noti-admin | Cloudflare Pages | `wrangler pages deploy` (CLI) | <https://malgn-noti-admin.pages.dev> |
| malgn-noti-api | Cloudflare Workers | `wrangler deploy` (CLI) | <https://malgn-noti-api.malgnsoft.workers.dev> |
| AWS Aurora | AWS RDS | (수동/IaC 예정) | (VPC 내부 + 퍼블릭 엔드포인트) |

배포는 현 단계에서 **wrangler CLI 직접 배포**. GitHub Actions 자동화는 추후 옵션.

---

## 9. 핵심 선택 이유 / 대안 비교

### Nuxt 3 vs. 다른 프레임워크

| 후보 | 선택 여부 | 메모 |
| --- | --- | --- |
| **Nuxt 3** | ✅ | Vue 생태계 + Nuxt UI 공식 통합 + SSR/SSG/CSR 자유 |
| Next.js | ❌ | React 기반. 사용자 선호 Vue. |
| Vite + Vue Router | ❌ | SSR/auto-import 직접 구축 부담 |

### Nuxt UI vs. 다른 UI 라이브러리

| 후보 | 선택 여부 | 메모 |
| --- | --- | --- |
| **Nuxt UI v3 (MIT)** | ✅ | Nuxt 공식 + Tailwind v4 통합 + 263 페이지에 필요한 컴포넌트 풀세트 |
| Nuxt UI Pro | ❌ (검토 보류) | Dashboard 레이아웃 등 유료. MVP 후 재검토. |
| Naive UI / Element Plus | ❌ | 자체 디자인 시스템, Tailwind와 분리 — 통합 비용 |
| shadcn-vue | ❌ | 컴포넌트 일일 복사. 빠른 263 페이지엔 부담. |

### Cloudflare vs. AWS-only

| 후보 | 선택 여부 | 메모 |
| --- | --- | --- |
| **Cloudflare(Workers/Pages/R2/KV/Queues) + AWS(Aurora)** | ✅ | edge 글로벌 + 비용 효율, Aurora만 AWS 의존 |
| AWS-only (Lambda + RDS + S3 + SQS) | ❌ | 글로벌 분산/콜드스타트/비용 면에서 Cloudflare가 우세 |
| Vercel + PlanetScale | ❌ | PlanetScale 무료 티어 종료, MySQL 호환성 트레이드오프 |

### Aurora MySQL via Hyperdrive

| 후보 | 선택 여부 | 메모 |
| --- | --- | --- |
| **Hyperdrive (MySQL) + mysql2** | ✅ | TCP 풀링 + 캐시, 자격증명 분리, 코드 단순 |
| RDS Data API (HTTP) | ❌ | Serverless v2만, MySQL Data API 제약 |
| Cloudflare D1 (SQLite) | ❌ | 대량 이력/원장에 부담, 멀티 리전 제약 |
| 자체 RDS Proxy | (이전) | Hyperdrive와 이중 풀링 충돌 가능. 운영 단계 재검토. |

### Hono vs. Itty Router / 직접 작성

| 후보 | 선택 여부 | 메모 |
| --- | --- | --- |
| **Hono** | ✅ | Workers에 최적화, 미들웨어 풍부, TS 친화 |
| Itty Router | ❌ | 더 가볍지만 미들웨어 빈약 |
| 직접 작성 | ❌ | 라우팅·검증·CORS·에러 처리 다시 만들 이유 없음 |

---

## 10. 버전 호환 표

각 도구의 메이저 버전이 맞물려 동작합니다.

| 묶음 | 버전 |
| --- | --- |
| Node.js | **24.x** |
| pnpm | **10.x** |
| Nuxt | **3.21.x** (compat v4 모드) |
| Vue | **3.5.x** |
| TypeScript | **5.9.x** |
| Nuxt UI | **3.3.x** (Reka UI + Tailwind v4) |
| Tailwind CSS | **v4** |
| Pinia | **2.3.x** |
| Hono | **4.12.x** |
| Wrangler | **4.90.x** |
| Cloudflare Workers compatibility_date | **2025-01-01** |
| Cloudflare Workers compatibility_flags | `nodejs_compat` |

> 의존성 업데이트 시 Nuxt ↔ Nuxt UI ↔ Tailwind는 같이 올려야 합니다 (서로 강한 결합).

---

## 11. 미정 / 결정 대기

| 항목 | 선택지 | 결정 시점 |
| --- | --- | --- |
| 결제 PG | 토스 / 포트원 / 나이스 | api 결제 모듈 작업 시 |
| AI 제공자 | Anthropic / OpenAI / 자체 | AI 템플릿 모듈 작업 시 |
| Aurora 토폴로지 | Provisioned vs. Serverless v2, Multi-AZ, R/W 분리 | 운영 환경 준비 시 |
| Aurora SG 갱신 절차 | IaC(Terraform/SAM) vs. 수동 | 운영 진입 전 |
| 객체 스토리지 | R2 단독 vs. S3 병행 | Aurora 리전 확정 후 |
| 다국어 지원 | 한국어 우선 → 영어 추가 시점 | 글로벌 확장 결정 시 |
| Nuxt UI Pro 도입 | 무료 → Pro 전환 여부 | MVP 후 재검토 |
| GitHub Actions 자동 배포 | 도입 시점 | CI 정책 결정 후 |

---

## 12. 참고

- [Cloudflare Workers docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Hyperdrive (MySQL)](https://developers.cloudflare.com/hyperdrive/)
- [Cloudflare Pages docs](https://developers.cloudflare.com/pages/)
- [Hono docs](https://hono.dev/)
- [Nuxt 3 docs](https://nuxt.com/docs)
- [Nuxt UI v3](https://ui.nuxt.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Drizzle ORM (MySQL)](https://orm.drizzle.team/docs/get-started-mysql)
- [NHN Cloud Notification Hub](https://docs.nhncloud.com/ko/Notification/Notification%20Hub/ko/overview/)
- [AWS Aurora MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraMySQL.html)
