# 에이전트팀 — 맑은 메시징

맑은 메시징(맑은노티) 프로젝트를 함께 개발하는 **Claude Code 서브에이전트팀** 정의 정본입니다.
각 에이전트는 `malgn-noti-mng/.claude/agents/<name>.md`에 정의되어 있으며, 이 프로젝트에서
`Agent` 툴의 `subagent_type` 또는 description 자동 매칭으로 스폰됩니다.

> 스택·레포 토폴로지는 [STACK.md](./STACK.md), 디자인 정본은 [DESIGN.md](./DESIGN.md),
> 도메인 기획 정본은 [pages/](./pages/), 큰 그림은 [CLAUDE.md](../CLAUDE.md) 참조.

---

## 팀 구성 (8)

| 에이전트 | 역할 | 담당 레포 | 정의 |
| --- | --- | --- | --- |
| **planner** | 기획자 — 도메인 기획·정책·플로우 정본화 | `malgn-noti-mng/docs` | [planner.md](../.claude/agents/planner.md) |
| **api-developer** | 외부 API 분석 + 백엔드 구현 — 엔드포인트·도메인 로직·외부 호출(NHN·NICE·토스)·DB 접근 | `malgn-noti-api` | [api-developer.md](../.claude/agents/api-developer.md) |
| **frontend-developer** | 사용자단 화면·상태·연동 + 마크업·디자인 시스템 준수 | `malgn-noti` | [frontend-developer.md](../.claude/agents/frontend-developer.md) |
| **admin-developer** | 운영자 콘솔 화면·RBAC + 마크업·디자인 시스템 준수 | `malgn-noti-admin` | [admin-developer.md](../.claude/agents/admin-developer.md) |
| **dba** | DBA — 스키마·마이그레이션·인덱스 | Aurora MySQL | [dba.md](../.claude/agents/dba.md) |
| **qa** | QA — 검증·테스트·회귀·결함 보고 | 전 레포 | [qa.md](../.claude/agents/qa.md) |
| **security-reviewer** | 보안·개인정보 — 결제·CI/DI·JWT·테넌트 격리·시크릿 렌즈 점검 | 전 레포 | [security-reviewer.md](../.claude/agents/security-reviewer.md) |
| **deployer** | 배포/DevOps — Cloudflare Pages/Workers 빌드·배포·검증·env | 전 레포 | [deployer.md](../.claude/agents/deployer.md) |

> **퍼블리셔는 두지 않는다.** Nuxt 3 Vue SFC에서는 `template`(마크업)+`script`(로직)이 한 `.vue` 파일에
> 함께 있어 퍼블리셔/개발 분업이 같은 파일을 다투게 된다. 따라서 마크업·디자인 시스템 준수·반응형·접근성은
> 각 프론트 개발자(frontend/admin-developer)가 직접 책임진다.
>
> **별도 API 연동 분석가(api-integrator)도 두지 않는다.** 외부 API 문서 분석과 실제 연동 코드는 같은
> `malgn-noti-api` 영역이라 분리하면 같은 코드를 다툰다. 문서 분석부터 구현까지 **api-developer**가 함께 책임진다.

---

## 표준 작업 흐름

```
planner ──(기획 정본·정책)──► api-developer (외부 API 분석+백엔드 구현)
   │                                  │
   ├──► frontend-developer (화면+마크업+디자인 시스템)
   ├──► admin-developer    (화면+마크업+디자인 시스템)
   │                                  │
   └──► dba (스키마·마이그레이션) ◄── api-developer (스키마 요청)
                                      │
                  ┌───────────────────┼───────────────────┐
                  ▼                   ▼                   ▼
                 qa          security-reviewer         deployer
          (동작·회귀 검증)   (위협·PII·시크릿 렌즈)   (빌드·배포·검증)
```

1. **planner**가 도메인 기획 정본(`docs/pages/<NAME>.md`)과 정책·상태 모델·API/DB 연결점을 정의.
2. **api-developer**가 외부 API 문서를 직접 분석해 백엔드 구현(외부 호출·도메인 로직), 스키마 변경은 **dba**에 위임.
3. **frontend/admin-developer**가 화면 동작·상태·연동과 마크업·디자인 시스템 준수까지 함께 담당(별도 퍼블리셔 없음).
4. **qa**(동작·회귀)와 **security-reviewer**(위협·PII·시크릿)가 서로 다른 렌즈로 검증하고 결함을 담당 에이전트에 회신.
5. **deployer**가 사용자 요청 시 빌드→배포→검증→커밋·작업이력까지 처리(Cloudflare Pages/Workers).

---

## 역할 경계 (책임 분리)

- **외부 API**: `api-developer`가 문서 분석부터 구현까지 담당. 호출 코드·시크릿은 **`malgn-noti-api`에만**. 프론트는 직접 호출 금지.
- **프론트 풀스택**: `frontend/admin-developer`가 상태·로직·데이터 **그리고** 마크업·디자인 시스템 준수·반응형·접근성까지 한 사람이 책임진다(SFC 특성상 퍼블리셔 분리 안 함).
- **스키마**: 개발자가 직접 DDL을 돌리지 않고 `dba`가 마이그레이션 작성·적용(`db.malgn.co.kr` 직접 mysql, 큰 컬럼 `MEDIUMTEXT`).
- **기획 vs 구현**: `planner`는 정책·플로우·정본 문서, 실제 코드/스키마는 개발자·DBA가.
- **검증 두 렌즈**: `qa`는 동작·회귀·테스트 실행, `security-reviewer`는 위협·권한·시크릿·PII. 둘 다 직접 수정하지 않고 결함을 재현 절차·심각도와 함께 담당자에게 회신.
- **배포**: `deployer`만 빌드·배포·env/시크릿을 다룬다. 개발자는 배포하지 않고, 배포는 사용자 명시 요청 시에만.

## 팀 공통 규칙

- TypeScript `any` 금지. 자체 컴포넌트 `App*`, Nuxt UI `U*`. `@nuxtjs/tailwindcss` 추가 설치 금지.
- 디자인은 Relay-inspired v1.0 토큰 사용(하드코딩 지양). 팝업은 `AppModal` 통일.
- 시크릿(NHN·토스·NICE·DB 접속정보, CI/DI·카드정보)은 출력·로그·커밋 금지.
- 커밋·푸시·배포는 **사용자가 명시 요청할 때만**. 기본은 분석·구현·검증까지.

---

## 스폰 방법

- **자동 위임**: 요청이 에이전트 description과 맞으면 자동으로 위임된다(예: "토스 결제 연동 분석" → api-developer, "배포" → deployer).
- **명시 호출**: `Agent` 툴에서 `subagent_type: "<name>"` 지정.
- ⚠️ 에이전트 정의는 **세션 시작 시 로드**된다. 새로 추가한 에이전트는 새 세션부터 "Available agent types"에 노출된다.
