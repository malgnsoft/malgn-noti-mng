# WBS (Work Breakdown Structure)

> 맑은메시지(가칭) — NHN Cloud Notification Hub 기반 멀티 테넌트 메시징 SaaS.
>
> 5단계(준비 → 정책 → 기획·설계 → 디자인 → 개발)를 가중치로 묶어 단일 사이클로 진행. 일별 변경은 [docs/history/](history/)에 누적 기록.
>
> **마지막 현행화**: 2026-06-04

---

## 진행률 스냅샷 (2026-06-04 기준)

| Step | 가중치 | 진행률 | 핵심 진행 사항 |
| --- | --- | --- | --- |
| **Step 1 · 프로젝트 준비** | 10% | **55%** | R&R·텔레그램·화면설계 정본·환경 셋팅 완료. 도메인·브랜딩·계약서·마케팅 진행 중 |
| **Step 2 · 주요 서비스 정책 이슈 정리** | 15% | **55%** | 회원 구조·결제·메시지 채널·주소록 정책 90% 합의. **PG = 토스(TossPayments) 확정**(6/4). 후불결제·캠페인 AB 테스트 미정 |
| **Step 3 · 서비스 기획 (화면설계)** | 20% | **35%** | BackOffice 1차 5종 70%. 2차·통계·운영가이드 미진 |
| **Step 4 · 디자인 / 퍼블리싱** | 10% | **20%** | 사용자단 Relay-inspired DS 정본·디자인 가이드(/guide) 살아있는 카탈로그로 대체 운영. 정식 스타일 가이드·MD 산출물은 미작성 |
| **Step 5 · 서비스 개발** | 45% | **55%** | UI(5-3A) 거의 완료(14✅) / API(5-2) 약 72%(13✅+2🟢+3⚪) — 6/4 신규 5-2-19 WBS R2 + 5-2-20 `/me/email-change` + 5-2-21 NHN Notification Hub 어댑터 / **연동(5-3C) 약 40%(10✅+2🟢+8⚪)** — 6/4 5-3C-7(이메일·휴대폰 변경 OTP) + 5-3C-20(서비스 담당자 이메일 변경) 완료 / 관리자단(5-4) **핸드오프 17 페이지 화면 ✅** + dev=screen/partial/live 라벨 + 로고 통일 / 통합·배포(5-5) Hyperdrive Tunnel 전환 + NHN Email 실 발송 ✅. 가중평균 약 55%. |

**전체 가중평균: 약 47.5%** (`0.10×55 + 0.15×55 + 0.20×35 + 0.10×20 + 0.45×55 ≈ 47.5`)

**상태 범례**: ✅ 완료 · 🟢 진행 중 · ⚪ 대기 · ⛔ 보류

### 김도형 담당 — 7/3 개발·테스트 완료 일정 (6/4 결정)

남은 task를 우선순위·블로커 의존 순으로 5주에 배분.

| 주차 | 기간 | 주요 마일스톤 | 대상 task |
| --- | --- | --- | --- |
| W1 | 6/5~6/9 | 잔작업·in_progress 마무리 + P0 backbone | 5-3C-2(로그아웃) · 5-3C-5(약관) · 5-3C-6(companyType) · 5-2-10(웹훅 전 채널) |
| W2 | 6/10~6/15 | 사용자단 발송·NHN real 1차 | 5-3C-3(비번 재설정 OTP) · 5-3-14(시스템 페이지) · 5-2-16(envelope) · 5-5-12(NHN SMS) · 5-3C-12(발송 6채널 실 API) |
| W3 | 6/16~6/22 | 이력/통계/주소록/문의 + Flow 엔진 | 5-3C-13·14·16 · 5-2-11(Export worker) · 5-2-12(Flow 엔진) · 5-5-5(push/rcs/kakao 어댑터) |
| W4 | 6/23~6/29 | 캠페인·PG·관리자단 P0 | 5-2-13(캠페인) · 5-2-14(PG 토스) · 5-5-8(결제 연동) · 5-3C-15(크레딧·결제) · 5-3C-8·9·10(계정 부속) · 5-4-3·4·5·6·8(관리자 P0) |
| W5 | 6/30~7/3 | 관리자단 잔여 + AI + 외부 의존 + 통합 테스트 | 5-4-7·9·10·11·12·13 · 5-2-15(AI 게이트웨이) · 5-5-9(AI 연동) · 5-5-6(NICE 실 모드, 외부 의존) |

> 운영성 task(5-5-1 사용자단 배포 카운터·5-5-3 API Workers 배포 카운터)는 단일 마감일이 없는 누적 지표이므로 일정 미설정.

---

## 단계별 가중치

| 단계 | 비중 |
| --- | --- |
| 1. 프로젝트 준비 | 10% |
| 2. 주요 서비스 정책 이슈 정리 | 15% |
| 3. 서비스 기획 (화면설계) | 20% |
| 4. 디자인 / 퍼블리싱 | 10% |
| 5. 서비스 개발 | 45% |

> 개발 비중이 큰 프로젝트라 Step 5를 45%로 가중. Step 1·2는 합의·문서 위주라 가볍게.

---

# Step 1 — 프로젝트 준비 (10%)

## 1-1. R&R · 사업 기획

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 | 완료일 |
| --- | --- | --- | --- | --- | --- | --- |
| 1-1-1 | 작업 R&R 분배 | ✅ | 김덕조 | 메모 확인 | 5/8 | 5/8 |
| 1-1-2 | 경쟁 서비스 가격 분석 | ✅ | 컨설팅팀 | 경쟁사 단가표 | — | — |
| 1-1-3 | 당사 원가 확인 및 가격 정책 결정 (단가 결정) | 🟢 | 컨설팅팀 | 기본 단가 책정(고객 모수에 따른 할인률 정책 필요), MMS는 이미지 3장까지 비용설계, 단가표(기획안) | — | — |

## 1-2. 사업 준비

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 | 완료일 |
| --- | --- | --- | --- | --- | --- | --- |
| 1-2-1 | 특수한 유형의 메시징 사업자 신청 | ⚪ | 컨설팅팀 | 프로젝트 추진 중간평가 이후 진행 | — | — |
| 1-2-2 | 통신판매사업자 신청 | ⚪ | 컨설팅팀 | 프로젝트 추진 중간평가 이후 진행 | — | — |
| 1-2-3 | 자본 Up 방안 | ⚪ | — | 프로젝트 추진 중간평가 이후 진행 | — | — |
| 1-2-4 | 관련 계약서 작성 | 🟢 | 컨설팅팀 | 가입신청서·이용약관·개인정보처리방침·요금신고내역 초안 / 1차 검토 완료 → 2차 수정본 진행 / 전무님 검토 필요 | — | — |

## 1-3. 커뮤니케이션

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 | 완료일 |
| --- | --- | --- | --- | --- | --- | --- |
| 1-3-1 | 그룹 텔레그램 개설 | ✅ | 김도형 | 맑은메시지 TF | 5/8 | 5/8 |
| 1-3-2 | 화면설계 — 피그마 정본 | ✅ | 김경은 | 피그마 | 5/11 | 5/11 |
| 1-3-3 | 문서 공유 폴더 | ⚪ | 김덕조 | 프로젝트 폴더 | — | — |

## 1-4. 서비스 메타 결정

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 |
| --- | --- | --- | --- | --- |
| 1-4-1 | 서비스 도메인 결정 | ⚪ | 김덕조 | — |
| 1-4-2 | 브랜딩 (맑은메시지 외 함께 아이데이션) | ⚪ | 김덕조 | — |
| 1-4-3 | 마케팅 기획 — 기존 고객군 & 메시징 only 고객군 | ⚪ | 안병훈 | — |

## 1-5. 프로젝트 환경 셋팅

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 | 완료일 |
| --- | --- | --- | --- | --- | --- | --- |
| 1-5-1 | 커뮤니케이션 문서 폴더 운영 | ✅ | 김덕조 | 폴더 셋팅 | 5/8 | 5/8 |
| 1-5-2 | GitHub(malgnsoft) · Cloudflare 셋팅 | ✅ | 김도형 | 3 레포(malgn-noti·-admin·-api) + Cloudflare Pages 2 + Workers 1 | 5/11 | 5/11 |
| 1-5-3 | 사용자단 | ✅ | 김도형 | https://malgn-noti.pages.dev/ | 5/11 | 5/11 |
| 1-5-4 | 관리자단 | ✅ | 김도형 | https://malgn-noti-admin.pages.dev/ | 5/11 | 5/11 |
| 1-5-5 | API 서버 | ✅ | 김도형 | https://malgn-noti-api.malgnsoft.workers.dev/ | 5/11 | 5/11 |

---

# Step 2 — 주요 서비스 정책 이슈 정리 (15%)

## 2-1. 프로토타입 및 문서

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 |
| --- | --- | --- | --- | --- |
| 2-1-1 | Front 프로토타입 | 🟢 | 김덕조 | https://malgn-notifications.pages.dev/#/ — **IA 정본(263 페이지)** |
| 2-1-2 | Front 메뉴 및 스펙 | ⚪ | — | /#/sitemap |
| 2-1-3 | Front 페이지 리스트 | ⚪ | 김덕조 | /#/pagelists |
| 2-1-4 | BackOffice 프로토타입 | ⚪ | 김경은 | 프로토타입 만들지 말지 결정 |
| 2-1-5 | BackOffice 메뉴 및 스펙 | ⚪ | — | /#/backoffice + Google Sheets |

## 2-2. 주요 서비스 참조

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 |
| --- | --- | --- | --- | --- |
| 2-2-1 | NHN Cloud Notification 서비스 | ⚪ | — | 통합 대상 |
| 2-2-2 | 비즈 뿌리오 서비스 | ⚪ | — | 참조 |

## 2-3. 캠페인 서비스

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 |
| --- | --- | --- | --- | --- |
| 2-3-1 | 벤치마킹 조사 | ⚪ | 안병훈 | 솔라피(CRM 결합) + 개별 문자 발송 사례 |

## 2-4. 회원·결제·계약 정책

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 | 완료일 |
| --- | --- | --- | --- | --- | --- | --- |
| 2-4-1 | 회원가입·판매방식 — 후불 정산 / 개인 회원 추가 | 🟢 | 김덕조 | 법인사업자/개인사업자/개인 3유형, 회원유형별 계약서 초안 단계별, 카드 충전식 vs 후불 결제, 계정관리>계약관리에 지급이행보증보험 첨부 인터페이스 추가 | 5/12 | 5/12 |
| 2-4-2 | 회원 구조 — 멀티 계정 (주계정·보조계정) | 🟢 | 김덕조 | 법인·개인사업자만 멀티계정 추가 탭 노출, 개인은 미노출 | 5/12 | 5/12 |
| 2-4-3 | 결제 — 자동충전 | ⚪ | 김덕조 | 크레딧 일정금액 이하일 때 n원 자동 충전 (향후 재논의) | — | — |
| 2-4-4 | 결제내역 — 결제 페이지 추가 | ⚪ | 김덕조 | — | — | — |
| 2-4-5 | 결제 — 후불 결제 고려 | ⚪ | 김덕조 | 후불결제 내부로직은 -크레딧, 후불시 사용 크레딧 표현, 다음 결제일 표현 | — | — |
| 2-4-6 | 계약관리 정책 | ⚪ | — | 법인·개인사업자 온라인 계약 절차 후 BackOffice 승인 → 로그인 가능 (후불시 통장사본). 개인은 계약관리 없음 → 즉시 사용 | — | — |

## 2-5. 메시지 채널 정책

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 | 완료일 |
| --- | --- | --- | --- | --- | --- | --- |
| 2-5-1 | AI 문장 다듬기 기능 | 🟢 | 김덕조 | 발송창(알림톡 제외)에 AI검토(맞춤법·문장 다듬기). 문자·RCS·이메일에 AI 문장다듬기 기능 추가 | 5/12 | 5/12 |
| 2-5-2 | 광고용 선택 시 수신거부 전화번호 이슈 | ⚪ | 김덕조 | 광고 선택 시 수신거부 번호 입력창 분리(맨 마지막). 내용 재확인 후 인터페이스 설계 예정 | — | — |
| 2-5-3 | 순차발송 | 🟢 | 김덕조 | 알림톡 미수신 시 SMS/LMS 순차발송 기본세팅, RCS·복합·푸시는 상단 설명. 복합(플로우) 생성 관리 화면의 Default 알림톡→SMS→이메일 순 호출 | 5/12 | 5/12 |
| 2-5-4 | 랜딩페이지 만들기 추가 | 🟢 | 김덕조 | 랜딩페이지 관리 페이지 + 기본형·확장형 화면 추가 | 5/12 | 5/12 |
| 2-5-5 | 발신번호 관리에 휴대폰번호 추가 | 🟢 | 김덕조 | 유선(증명서 업로드) + 휴대폰(본인인증 PASS) 인터페이스 | 5/12 | 5/12 |

## 2-6. 캠페인·주소록·브랜드

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 | 완료일 |
| --- | --- | --- | --- | --- | --- | --- |
| 2-6-1 | 캠페인 관리 — AB 테스트 기능 | ⚪ | 김덕조 | 대상자에게 랜덤으로 A·B 메시지 발송 후 성과 비교. 캠페인 관리 기능 최종 정의 후 설계 | — | — |
| 2-6-2 | 주소록 — CRM 기능 확대 | 🟢 | 김덕조 | 이메일·전화번호 클릭 시 단건 발송 레이어 팝업. 연락처·그룹에 메시지채널 선택 후 바로가기. CRM 예제 화면 수집(안병훈) | 5/12 | 5/12 |
| 2-6-3 | 브랜드 네임 | ⚪ | 안병훈 외 전체 | — | — | — |

---

# Step 3 — 서비스 기획 (화면설계 or 설계) (20%)

## 3-1. Front

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 |
| --- | --- | --- | --- | --- | --- |
| 3-1-1 | 프로토타입으로 대체 | 🟢 | 김덕조·김경은 | https://malgn-notifications.pages.dev/#/ | — |
| 3-1-2 | 서비스 메뉴 콘텐츠 | ⚪ | 컨설팅팀·김경은 | — | — |
| 3-1-3 | 운영가이드 | ⚪ | 김덕조·김경은 | (사용자단 [/help](https://malgn-noti.pages.dev/help) 라이브 — 컨텐츠 보강 필요) | — |

## 3-2. BackOffice 1차

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 |
| --- | --- | --- | --- | --- | --- |
| 3-2-1 | 공통 / 로그인 / 계정 관리 | 🟢 | 김경은 | 바로가기 | 5/22 |
| 3-2-2 | 회원 / 고객사 관리 | 🟢 | 김경은 | 회원 발송 이력 관리, 고객사 결제 상세, 환불신청 제외 | 5/22 |
| 3-2-3 | 시스템 관리 | 🟢 | 김경은 | 운영자 계정 관리, 권한/역할 관리(RBAC), 감사 로그 | 5/22 |
| 3-2-4 | 요금 / 단가 관리 | 🟢 | 김경은 | 바로가기 | 5/29 |
| 3-2-5 | 고객지원 | 🟢 | 김경은 | 운영 가이드 관리 제외 | 5/29 |
| 3-2-6 | 발송 운영 모니터링 | ⚪ | 김경은 | 캠페인 제외, 회원/고객사 관리의 회원 발송 이력 포함 | 6/12 |
| 3-2-7 | 발신 정보 검수 | ⚪ | 김경은 | — | 6/12 |
| 3-2-8 | 결제 / 크레딧 관리, 고객사 상세 결제 탭 | ⚪ | 김경은 | — | 6/19 |
| 3-2-9 | 템플릿 검수 / 관리 | ⚪ | 김경은 | 샘플 템플릿 관리, AI 템플릿 정책 관리 제외 | 6/24 |
| 3-2-10 | 수신거부 (운영) | ⚪ | 김경은 | — | 6/24 |

## 3-3. BackOffice 2차

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 |
| --- | --- | --- | --- | --- |
| 3-3-1 | 통계 / 리포트 | ⚪ | 김경은 | — |
| 3-3-2 | 대시보드 | ⚪ | 김경은 | — |
| 3-3-3 | 템플릿 검수 / 관리 (AI 템플릿 정책 관리) | ⚪ | 김경은 | 샘플 템플릿 관리, AI 템플릿 정책 관리 |
| 3-3-4 | 발송 운영 모니터링 (캠페인) | ⚪ | 김경은 | 캠페인 진행 |
| 3-3-5 | 고객지원 | ⚪ | 김경은 | 운영 가이드 관리 |
| 3-3-6 | 콘텐츠 / 사이트 관리 | ⚪ | 김경은 | 시스템 설정, 점검 모드 관리, 외부 연동 설정 |
| 3-3-7 | 시스템 관리 | ⚪ | 김경은 | — |
| 3-3-8 | API 관리 | ⚪ | 김경은 | — |

---

# Step 4 — 디자인 / 퍼블리싱 (10%)

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 |
| --- | --- | --- | --- | --- |
| 4-1 | 디자인 스타일 가이드 | ⚪ | 김양현 | (개발 측에서 [docs/DESIGN.md](DESIGN.md) Relay-inspired v1.0 정본 + [/guide](https://malgn-noti.pages.dev/guide) 라이브 카탈로그를 운영 — 디자인팀 정식 스타일 가이드 별도 필요) |
| 4-2 | 퍼블리싱 MD 파일 | ⚪ | 김양현 | (개발 측에서 Nuxt 3 + Nuxt UI v3 + Tailwind v4로 직접 퍼블리싱 운영 중) |

---

# Step 5 — 서비스 개발 (45%)

> ⚠️ **2026-06-01 재구성** — 원본 WBS는 채널·도메인 단위로 묶여 있었으나, 실제 진행은 **사용자단 화면이 6채널·전 도메인에 걸쳐 빠르게 완성**된 반면 관리자단은 셸·기획 단계에 머무름. 진행 그래프가 더 잘 보이도록 산출물 단위로 재정렬.

## 5-1. 설계 및 준비

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 | 완료일 |
| --- | --- | --- | --- | --- | --- | --- |
| 5-1-1 | 아키텍처 설계 | ✅ | 김도형 | [malgn-noti/doc/STACK.md](STACK.md) — 3 레포 책임 분리 + Cloudflare/AWS 혼합 토폴로지 + NHN 통합 모델 | 5/14 | 5/14 |
| 5-1-2 | 데이터 모델링 | ✅ | 김도형 | 49 테이블 데이터 모델(`TB_`·`company_id`·`status INT 1/0/-1` + `*_state`/`*_yn`/`loginid`+`email` 분리), Mermaid ERD 9종, 확장성 전략(월 RANGE 파티셔닝·Hot/Warm/Cold·R2 오프로드) | 5/27 | 5/27 |
| 5-1-3 | 사용자단 디자인 시스템 | ✅ | 김도형 | Relay-inspired v1.0 ([docs/DESIGN.md](DESIGN.md)) — ink 11단 + 그린 액센트 `#00DC82` + Inter + JetBrains Mono + Pretendard | 5/18 | 5/18 |
| 5-1-4 | 사용자단 디자인 가이드 (살아있는 카탈로그) | ✅ | 김도형 | [/guide](https://malgn-noti.pages.dev/guide) — 18+ 섹션 라이브 카탈로그 | 5/19 | 5/19 |
| 5-1-5 | 관리자단 부트스트랩 + 셸 레이아웃 | ✅ | 김도형 | Nuxt 3 + Nuxt UI v3 + LNB(256px·8그룹) + TopBar(64px) + 첫 배포 | 5/27 | 5/27 |
| 5-1-6 | 관리자단 디자인 가이드 | ✅ | 김도형 | [admin /guide](https://malgn-noti-admin.pages.dev/guide) — 14 섹션 단일 페이지 | 5/27 | 5/27 |
| 5-1-7 | 관리자단 페이지 기획 MD | ✅ | 김도형 | `malgn-noti-admin/doc/pages/` 33개 MD (8 그룹 + 32 sub) | 5/27 | 5/27 |

## 5-2. API 서버 (`malgn-noti-api`)

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 | 목표일 | 완료일 |
| --- | --- | --- | --- | --- | --- | --- |
| 5-2-1 | Hono on Workers 부트스트랩 + Hyperdrive(Aurora) 연결 | ✅ | 김도형 | drizzle-orm/mysql2 + `/health/db` + `wrangler dev --remote` + 프로덕션 배포 #1 | 5/26 | 5/26 |
| 5-2-2 | DB 마이그레이션 — 49 테이블 + 파티션 5종 | ✅ | 김도형 | `0000_initial.sql` Aurora 적용 (49 테이블 + 75 파티션 라이브) | 5/26 | 5/26 |
| 5-2-3 | 기초 도메인 CRUD (14 도메인) | ✅ | 김도형 | `/me` `/contacts` `/contact-groups` 등 + 표준 errors/pagination/auth/Drizzle 스키마 | 5/26 | 5/26 |
| 5-2-4 | OpenAPI 문서 (Scalar UI) | ✅ | 김도형 | [/doc](https://malgn-noti-api.malgnsoft.workers.dev/doc) — paths 37 / schemas 45+, 루트 `/` → `/doc` 302 | 5/27 | 5/27 |
| 5-2-5 | 인증 — signup/login/JWT/PBKDF2 | ✅ | 김도형 | Phase 1·2·3 — `/auth/signup` → `/me`, JWT HS256, JWT_SECRET secret | 5/26 | 5/26 |
| 5-2-6 | 발송 producer — 5채널 (SMS·Email·Kakao·Push·RCS) | ✅ | 김도형 | 발신정보 검증·옵트아웃 필터·크레딧 hold·트랜잭션. 채널 branching generic화 | 5/27 | 5/27 |
| 5-2-7 | 멱등성 — TB_IDEMPOTENCY + INSERT-then-conflict | ✅ | 김도형 | `0001_idempotency.sql` race-free 패턴 | 5/27 | 5/27 |
| 5-2-8 | NHN 어댑터 — 5채널 (mock/real) | ✅ | 김도형 | `src/adapters/nhn/{sms,email,kakao,push,rcs}.ts` + types | 5/27 | 5/27 |
| 5-2-9 | Cloudflare Queues + Consumer Worker | ✅ | 김도형 | `malgn-noti-dispatch` + `dispatch_state` 천이 | 5/27 | 5/27 |
| 5-2-10 | NHN Webhook 핸들러 (SMS·RCS) | 🟢 | 김도형 | `POST /webhooks/nhn/{sms,rcs}` — HMAC-SHA256 + dedup_key. Email/Kakao/Push 미 | 6/9 | — |
| 5-2-11 | Export 잡 (다운로드 요청) | 🟢 | 김도형 | `TB_EXPORT_JOB` ✅ DDL 적용 + `/export-jobs` CRUD ✅ 라이브 검증 (POST 201, GET 200). 처리 worker + R2 미 | 6/17 | — |
| 5-2-12 | Flow 정의 (복합 발송) | 🟢 | 김도형 | `TB_FLOW_DEFINITION/RUN/STEP_RUN` ✅ DDL 적용 (FK 6 포함) + `/flow-definitions` CRUD ✅ 라이브 검증 (POST 201, GET 200). 실행 엔진(`POST /send/flow`) 미 | 6/22 | — |
| 5-2-13 | 캠페인 API (스케줄러·시뮬레이션·테스트 발송) | ⚪ | 김도형 | — | 6/25 | — |
| 5-2-14 | PG(결제) 어댑터 + 카드 등록·결제·취소 | ⚪ | 김도형 | **TossPayments 확정** (6/4). `src/adapters/pg/toss.ts` 신규 작성 + `TOSS_CLIENT_KEY`/`TOSS_SECRET_KEY` secret + 콜백 webhook 예정 | 6/24 | — |
| 5-2-15 | AI 템플릿 게이트웨이 (LLM) | ⚪ | 김도형 | 제공자 미정 (Anthropic / OpenAI) | 7/1 | — |
| 5-2-16 | NHN 실 모드 전환 + envelope 암호화 | 🟢 | 김도형 | 6/4 §6. Notification Hub OAuth2(client_credentials → Bearer) 어댑터 재작성 완료. SMS·Email 라우트 활성화. envelope 암호화·테넌트별 자격증명은 후속 | 6/12 | — |
| 5-2-17 | 계약·서류 R2 라우트 (`/contracts/*`) + FILES 바인딩 | ✅ | 김도형 | 5 라우트(list/sign/files list/upload/download/delete) + R2 bucket `malgn-noti-files` + `TB_CONTRACT`/`TB_CONTRACT_FILE` schema.ts + signup auto-create + reviewing 자동 전이 + lazy backfill (6/2 §11·§12·§13) | 6/2 | 6/2 |
| 5-2-18 | NICE 통합인증 인프라 | ✅ | 김도형 | 6/1 §5 + 6/2 §16 + 6/4. mock 모드 — 자격증명 등록 후 콘솔 IP 정책 1007(Workers outbound IPv6 vs NICE 콘솔 IPv4) 미해결로 mock 유지 | 6/1 | 6/1 |
| 5-2-19 | WBS 정본 R2 저장 + GET/PATCH 라우트 | ✅ | 김도형 | 6/4 §5. DB 미사용 — R2 단일 JSON(`wbs/wbs.json`, FILES 바인딩) 시드 142 task. GET 공개 + PATCH 인증 2 라우트. last-write-wins | 6/4 | 6/4 |
| 5-2-20 | `POST /me/email-change` — 서비스 담당자 이메일 변경 | ✅ | 김도형 | 6/4. 비밀번호 + OTP(`purpose=change_email`) + email-only UPDATE (loginid 가입 시 식별자로 고정 유지). 라이브 e2e 5 시나리오 통과 | 6/4 | 6/4 |
| 5-2-21 | NHN Notification Hub 어댑터 신규 (OAuth + Bearer) | ✅ | 김도형 | 6/4 §6. `adapters/nhn/oauth.ts`(토큰 발급+캐시) + `sms.ts`/`email.ts` 재작성(POST `/message/v1.0/{SMS\|EMAIL}/free-form-messages/{purpose}`). `contactType=PHONE_NUMBER`/`EMAIL_ADDRESS`, `X-NC-APP-KEY` + `X-NHN-Authorization`. `NhnCredentials` 확장(userAccessKey/secretAccessKey + legacy secretKey 옵셔널) | 6/4 | 6/4 |

## 5-3. 사용자단 (`malgn-noti`) — **3 트랙으로 분리**

> ⚠️ 2026-06-02 재구성. 그동안 5-3은 **화면(UI)만 완료된 상태도 ✅로 표기**되어 "실제로는 안 했는데 완료처럼 보이는" 문제가 있었다. 이를 명확히 하기 위해 한 도메인을 세 트랙으로 나눈다:
>
> - **A. 화면 UI 구성** (목업 데이터로 페이지 그리기) — `5-3A-*`
> - **B. 백엔드 API 엔드포인트** — `5-2-*`에 이미 정의됨 (5-2를 도메인 단위로 재정렬한 결과는 5-3M 매트릭스 참조)
> - **C. 화면 ↔ API 연동** (실 데이터 흐름 + 상태 관리 + 에러 처리) — `5-3C-*`
>
> ✅의 의미가 트랙마다 다르다는 점에 주의. 5-3A의 ✅는 "UI 화면이 목업으로 그려짐" 단계까지를 의미.

### 5-3A. 화면 UI 구성 (목업 데이터 기준)

| ID | 작업 | UI | 담당 | 산출물 / 메모 |
| --- | --- | --- | --- | --- |
| 5-3A-1 | 인증·계정 — 로그인 / 회원가입 5단계 / 비번 재설정 / 보안 인증 | ✅ | 김도형 | `/login` `/login/security` `/reset-password` `/reset-password/new` `/signup` |
| 5-3A-2 | 발송 — 6채널 (SMS/RCS/Kakao/Email/Push/Flow) | ✅ | 김도형 | `/send/*` + PU 풀세트 |
| 5-3A-3 | 이력 / 통계 (5채널 + 대시보드) | ✅ | 김도형 | `/history/{sms,rcs,kakao,email,push,stats}` + 비동기 다운로드 요청 UI |
| 5-3A-4 | 주소록 — 연락처 / 그룹 / 수신거부 | ✅ | 김도형 | `/contacts/{list,groups,optout}` |
| 5-3A-5 | 발신 정보 — 6종 | ✅ | 김도형 | `/sender/{numbers,brands,domains,push-cert,profiles,optout-080}` + 등록 마법사 |
| 5-3A-6 | 템플릿 관리 — 5채널 + 발송 상세 설정 | ✅ | 김도형 | `/manage/{sms,rcs,kakao,email,push,settings}` |
| 5-3A-7 | 캠페인 — 본안 + 변형 v3 | ✅ | 김도형 | `/campaign` `/campaign3` |
| 5-3A-8 | 크레딧 / 결제 — 충전·결과·내역·영수증·카드 | ✅ | 김도형 | `/charge` `/charge/result` `/account/{credit,cards}` |
| 5-3A-9 | 문의 — 작성 / 완료 / 내 문의 / 상세 | ✅ | 김도형 | `/inquiry` `/inquiry/complete` `/account/inquiries(/detail)` |
| 5-3A-10 | 나의 페이지 — 9 라우트 | ✅ | 김도형 | `/account/*` 9종 + `AppMyPageShell` |
| 5-3A-11 | 메시지 관리 랜딩페이지 | ✅ | 김도형 | 목록 · 기본형/확장형 등록 폼 · 미리보기 |
| 5-3A-12 | 공개 랜딩페이지 + 운영 가이드 | ✅ | 김도형 | `/`(공개) + `/help` |
| 5-3A-13 | 디자인 가이드 (라이브 카탈로그) | ✅ | 김도형 | `/guide` — 18+ 섹션 |
| 5-3A-14 | 시스템 페이지 — 404 / system error | 🟢 | 김도형 | 단독 일부 라이브. 점검 / 네트워크 / 인증 메일 템플릿 미 |
| 5-3A-15 | `/wbs` 페이지 — R2 정본 비동기 로드 + 인라인 편집 모달 | ✅ | 김도형 | 6/4 §5. 임베디드 STAGES 제거 → top-level await `api(/wbs)`. `AppModal` 편집 다이얼로그(owner·note·href·targetDate·completionDate). 비로그인 읽기 전용 + "로그인하면 편집 가능" 힌트 |

### 5-3M. 화면 ↔ API 연동 매트릭스 (3 트랙 한눈에)

> 각 도메인의 진척을 **UI / API / 연동** 3 트랙으로 분리해 한 행에. ✅=완료, 🟢=진행 중·부분, ⚪=미.

| 도메인 | UI (5-3A) | API 엔드포인트 (5-2) | **연동** (5-3C) | 비고 |
| --- | --- | --- | --- | --- |
| **인증·계정** (로그인/가입/me) | ✅ | ✅ (`/auth/signup`·`/auth/login`·`/me`·`/auth/email-code/*`) | ✅ | 6/1 §4·§5 완료. JWT 쿠키 + 부트스트랩 플러그인. signup OTP 인증 실 API 연동. |
| **발송 SMS/LMS/MMS** | ✅ | ✅ (`POST /send/sms`) | ⚪ | producer 라이브, 실 NHN 자격증명 미 → mock fallback |
| **발송 RCS** | ✅ | ✅ (`POST /send/rcs`) | ⚪ | |
| **발송 알림톡/친구톡** | ✅ | ✅ (`POST /send/kakao`) | ⚪ | |
| **발송 Email** | ✅ | ✅ (`POST /send/email`) | ⚪ | |
| **발송 Push** | ✅ | ✅ (`POST /send/push`) | ⚪ | |
| **발송 Flow** | ✅ | 🟢 (`POST /flow-definitions` CRUD ✅, `POST /send/flow` 실행 엔진 미) | ⚪ | |
| **이력/통계** | ✅ | 🟢 (목록 라우트 부분, 통계 라우트 미) | ⚪ | |
| **다운로드 요청 (Export)** | ✅ | 🟢 (`/export-jobs` CRUD ✅, 처리 worker + R2 미) | ⚪ | |
| **주소록** (연락처/그룹/수신거부) | ✅ | ✅ (`/contacts`·`/contact-groups`·`/optout-entries`) | ⚪ | |
| **발신 정보** (6종) | ✅ | ✅ (`/sender-phones`·`/rcs-brands`·`/email-domains`·`/push-certs`·`/kakao-sender-profiles`·`/optout-080-numbers`) | ⚪ | |
| **템플릿** (5채널 + settings) | ✅ | ✅ (`/templates`·`/company-settings`) | ⚪ | |
| **캠페인** | ✅ | ⚪ (스케줄러·시뮬레이션·테스트) | ⚪ | |
| **크레딧·결제** | ✅ | 🟢 (`/credit-ledger` 읽기, `/payment-methods` 일부, PG 어댑터 미) | ⚪ | |
| **문의** | ✅ | ✅ (`/inquiries`) | ⚪ | |
| **나의 페이지** — 회원 정보 변경 | ✅ | ✅ (`GET /me` · `PATCH /me` · `PATCH /me/company` · `POST /me/email-change`) | ✅ | 6/2 §6 + 6/4. 서비스 담당자 이메일 변경(OTP + 비밀번호 검증, **loginid 유지**) 실 API 연동 |
| **나의 페이지** — 비밀번호 변경 | ✅ | ⚪ (`POST /auth/password`) | ⚪ | |
| **나의 페이지** — 보안로그인 (2FA) | ✅ | ⚪ (`PATCH /me/security`) | ⚪ | TB_VERIFICATION 재사용 |
| **나의 페이지** — 멀티 계정 (담당자 초대) | ✅ | ⚪ (`/manager-invites`) | ⚪ | |
| **나의 페이지** — 계약 관리 | ✅ | ✅ (`/contracts/*` 5 라우트 + R2) | ✅ | 6/2 §11~§15. 이용계약·서명·R2 업로드·미리보기·삭제·휴대폰 본인인증 모두 실 API. 운영자 승인 화면만 미 |
| **비밀번호 재설정** | ✅ | ⚪ (`POST /auth/password/reset` — OTP 인프라 재활용) | ⚪ | |
| **로그아웃** | (GNB 데모 토글) | (클라이언트 쿠키 삭제만, `TB_SESSION` 미) | ⚪ | GNB 미연동 |
| **약관 동의 적재** | (Step 3 화면용 체크박스) | ⚪ (`POST /auth/agree-terms`) | ⚪ | TB_TERMS·TB_TERMS_AGREEMENT |
| **사업자등록증 심사 승인 게이트** | ✅ (배너 + 미들웨어) | ✅ (DB 4단계 + `requireApproved` 18 라우트 + reviewing 자동 전이) | ✅ | 6/2 §7~§10·§12·§13·§14. 운영자단 승인 UI만 미 |
| **메시지 관리 랜딩페이지** | ✅ | ⚪ (`/landing-pages` 부분) | ⚪ | |
| **시스템 페이지** | 🟢 | (정적) | — | |

**진척 합계** (트랙별, 2026-06-04 기준):
- UI(5-3A) — 14 ✅ + 1 🟢 = **거의 완료** (6/4 신규 5-3A-15 `/wbs` 페이지 R2 비동기 로드 + 인라인 편집)
- API(5-2) — 13 ✅ + 2 🟢 + 3 ⚪ = **약 72%** (6/4 신규 5-2-19 WBS R2 + 5-2-20 `/me/email-change` + 5-2-21 NHN Notification Hub 어댑터)
- **연동(5-3C) — 10 ✅ + 2 🟢 + 8 ⚪ = 약 40%** (인증·계정 / 이메일 OTP / login-by-email / companyType / 회원정보 / 계약 관리 / 승인 게이트 / 계약 서명 본인인증 / 사업자등록증 reviewing 자동전이 / 서비스 담당자 이메일 변경)

### 5-3C. 화면 ↔ API 연동 (개별 작업 항목, 진행 중)

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 |
| --- | --- | --- | --- | --- |
| 5-3C-1 | 인증·계정 (`/auth/*` + `/me`) | ✅ | 김도형 | 6/1 §4 완료. JWT 쿠키 + 부트스트랩 플러그인 + `last-company-id` |
| 5-3C-1a | 이메일 OTP (`/auth/email-code/*`) | ✅ | 김도형 | 6/1 §5 완료. `signup.vue` Step 3에서 실 API 호출 |
| 5-3C-2 | 로그아웃 — GNB 실 연결 | ⚪ | 김도형 | `useAuthStore().logout()` 호출로 GNB 데모 토글 교체 |
| 5-3C-3 | 비밀번호 재설정 — OTP 인프라 재활용 | ⚪ | 김도형 | `purpose='reset_password'` + `POST /auth/password/reset` 신설 |
| 5-3C-4 | `POST /auth/login-by-email` — companyId UX 개선 | ✅ | 김도형 | 6/2 §2. 고객사 ID 필드 제거 |
| 5-3C-5 | 약관 동의 적재 (`POST /auth/agree-terms`) | ⚪ | 김도형 | TB_TERMS_AGREEMENT |
| 5-3C-6 | `companyType` 전달·저장 + 화면 분기 | 🟢 | 김도형 | 6/2 §7. signup 전달·저장 ✅. 개인 메뉴 미노출 분기 미 |
| 5-3C-7 | `PATCH /me` + `/account/settings` (회원 정보 변경) | ✅ | 김도형 | 6/2 §6 + 6/4. `PATCH /me`·`/me/company`·`POST /me/email-change`. 서비스 담당자 이메일 변경(loginid 유지·email만)·결제 이메일 변경·광고수신 토글 모두 실 API. 비밀번호 변경은 5-3C-8 별도 |
| 5-3C-8 | `POST /auth/password` + `/account/password` (비밀번호 변경) | ⚪ | 김도형 | |
| 5-3C-9 | `/account/security` (2FA) + `PATCH /me/security` | ⚪ | 김도형 | TB_VERIFICATION 재사용 |
| 5-3C-10 | `/account/multi` + `/manager-invites` | ⚪ | 김도형 | 초대 토큰·수락 흐름 |
| 5-3C-11 | `/account/contract` + `/contracts/*/files` (R2 업로드) | ✅ | 김도형 | 6/2 §11~§15. `/contracts/*` 5 라우트 + R2 + 미리보기·삭제·휴대폰 본인인증 서명 + 사업자등록증 자동 reviewing 전이 |
| 5-3C-12 | 발송 6채널 — UI에 실 API 호출 (Idempotency-Key 헤더 포함) | ⚪ | 김도형 | NHN Notification Hub 자격증명 + 어댑터 재작성 필요 (6/2 §16) |
| 5-3C-13 | 이력/통계 — 목록·통계 라우트 연동 | ⚪ | 김도형 | API 일부 미구현이라 5-2 동시 진행 필요 |
| 5-3C-14 | 주소록·발신 정보·템플릿 — CRUD 연동 (API 모두 ✅이므로 프런트 작업) | ⚪ | 김도형 | |
| 5-3C-15 | 크레딧·결제 — 충전 흐름은 PG 어댑터 미정 (블로커) | ⚪ | 김도형 | |
| 5-3C-16 | 문의 — `/inquiries` 연동 | ⚪ | 김도형 | |
| 5-3C-17 | 사업자등록증 심사 승인 게이트 (DB + 미들웨어 + 배너 + 라우트 가드) | ✅ | 김도형 | 6/2 §7~§10·§12·§13·§14. 4단계 enum(pending/reviewing/approved/rejected) + `requireApproved` 18 라우트 + `AppApprovalBanner` 3분기 + lazy backfill |
| 5-3C-18 | 사업자등록증 첨부 시 reviewing 자동 전이 + 파일 행 배지 + 반려 시 삭제 | ✅ | 김도형 | 6/2 §12·§14 |
| 5-3C-19 | 계약서 전자서명 다이얼로그 — 휴대폰 본인인증 sub-step (`phone-code` purpose=`contract_sign`) | ✅ | 김도형 | 6/2 §15. 공인인증서 탭 제거 + dialog open 시 fetchMe 강제 hydrate |
| 5-3C-20 | 서비스 담당자 이메일 변경 — 실 OTP API 연동 | ✅ | 김도형 | 6/4. `AppEmailChangeDialog` `sendCode`/`confirmCode`를 `/auth/email-code/{send,verify}`(`purpose=change_email`)로 교체. confirm payload `{newEmail,code,password}`. auth store `changeEmail()` → `POST /me/email-change`. **결제 이메일 변경은 기존 흐름 유지** |

## 5-4. 관리자단 (`malgn-noti-admin`) 화면 개발

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 |
| --- | --- | --- | --- | --- |
| 5-4-1 | 셸 + LNB(8 그룹) + TopBar + 디자인 가이드 | ✅ | 김도형 | 부트스트랩·라이브 |
| 5-4-2 | 페이지 기획 MD (33종) | ✅ | 김도형 | `docs/pages/` — P0: 14 / P1: 13 / P2: 5 |
| 5-4-3 | 회원·고객사 관리 (P0) | ⚪ | 김도형 | 회원 발송 이력 / 고객사 결제 상세 / 환불 |
| 5-4-4 | 시스템 관리 (P0) — 운영자 계정 / RBAC / 감사 로그 | ⚪ | 김도형 | — |
| 5-4-5 | 요금 / 단가 관리 (P0) | ⚪ | 김도형 | — |
| 5-4-6 | 고객지원 (P0) | ⚪ | 김도형 | 운영 가이드 관리 제외 |
| 5-4-7 | 발송 운영 모니터링 (P1) | ⚪ | 김도형 | 캠페인 제외 |
| 5-4-8 | 발신 정보 검수 (P0) | ⚪ | 김도형 | — |
| 5-4-9 | 결제 / 크레딧 관리 + 고객사 상세 결제 탭 (P0) | ⚪ | 김도형 | — |
| 5-4-10 | 템플릿 검수·관리 (P0) | ⚪ | 김도형 | 샘플·AI 템플릿 정책 제외 |
| 5-4-11 | 수신거부(운영) (P1) | ⚪ | 김도형 | — |
| 5-4-12 | 통계 / 리포트 + 대시보드 (P2) | ⚪ | 김도형 | — |
| 5-4-13 | 콘텐츠 / 사이트 관리 + 시스템 관리 + API 관리 (P2) | ⚪ | 김도형 | — |
| 5-4-14 | 핸드오프 정본 17 페이지 풀세트 (화면만, API 연동 후속) | ✅ | 김도형 | 6/4 §3. `handoff_noti_admin`(3,129줄 jsx) → Vue 1:1 포팅. 셸 완전 재정비 + 공유 컴포넌트 14종 + 차트 4종 + 17 페이지(대시보드·고객사·고객사 상세·계정·모니터링·발신번호·발신프로필·템플릿검수·결제·채널단가·충전쿠폰·1:1문의·FAQ·공지·통계·운영자·권한그룹·API). 18 라우트 라이브 200 |
| 5-4-15 | 페이지 진척 상태 라벨 (`dev=screen/partial/live`) | ✅ | 김도형 | 6/4. `AppPageHeader` prop `dev` 3단계. 화면(neutral·flask)·일부 연동(warning·construction)·연동(미표시). 17 페이지 모두 `dev="screen"`으로 명시 |
| 5-4-16 | 로고/브랜드 — 사용자단 로고로 통일 + "관리자" 식별 태그 | ✅ | 김도형 | 6/4. 기존 파랑 그라데이션 박스 폐기 → `AppLogoMark`(말풍선+스파클) + "맑은 message" + `primary-50` 배경 "관리자" 배지 |

## 5-5. 통합·배포

| ID | 작업 | 상태 | 담당 | 산출물 / 메모 |
| --- | --- | --- | --- | --- |
| 5-5-1 | 사용자단 Cloudflare Pages 배포 #1~#80+ alias 다수 | 🟢 | 김도형 | 매 마일스톤 직후 배포 (6/4 누적 #80+ alias 다수) |
| 5-5-2 | 관리자단 Cloudflare Pages 첫 Nuxt 배포 | ✅ | 김도형 | 정적 placeholder → 실 Nuxt 앱 (#1) |
| 5-5-3 | API Workers 배포 #1~#25+ | 🟢 | 김도형 | 6/4 최신 Version `1ca0446e-ed3f-4079-be5f-3407f4550ba7` |
| 5-5-4 | DDL — `0001`~`0005` 라이브 적용 | ✅ | 김도형 | 0001 idempotency / 0002 export_flow / 0003 loginid global unique / 0004 nice_auth / 0005 company_approval. `TB_CONTRACT`/`TB_CONTRACT_FILE`은 §11에서 schema.ts 정의(라이브에 이미 존재) |
| 5-5-5 | NHN Notification Hub 실 자격증명 등록 + 어댑터 재작성 | 🟢 | 김도형 | **6/4: SMS·Email 어댑터 Notification Hub로 재작성 완료** + Email real 발송 검증 통과. SMS는 NHN 콘솔 발신번호 등록 + `SMS_FROM` secret 대기. push/rcs/kakao 어댑터 마이그레이션 후속 |
| 5-5-6 | NICE 통합인증 실 모드 전환 | ⚪ | 김도형 | 6/4 재시도 → 여전히 1007 (Workers outbound IPv6 vs NICE 콘솔 IPv4 등록). 사용자 콘솔 IP 정책 해결 대기 |
| 5-5-7 | R2 bucket `malgn-noti-files` 신규 + FILES 바인딩 | ✅ | 김도형 | 6/2 §11. 사업자등록증·대부업등록증·보험증권 첨부용. 6/4 §5에서 `wbs/wbs.json` 시드 추가 |
| 5-5-8 | PG 카드 결제 연동 | ⚪ | 김도형 | **TossPayments 확정**(6/4). 미구현 |
| 5-5-9 | AI 템플릿 게이트웨이 연동 | ⚪ | 김도형 | — |
| 5-5-10 | Hyperdrive Cloudflare Tunnel(Access) 전환 | ✅ | 김도형 | 6/4 §2. id `a2ba…` → `439b…` 신규 origin `malgn-dev-db.apiserver.kr` + access_client_id. Aurora SG egress IP 화이트리스트 운영 부담 해소. 정본 3개(API CLAUDE.md §3·§8·§12, SCALABILITY.md §6 신규 절, MIGRATION.md §1) 동기화. 라이브 검증 통과 |
| 5-5-11 | NHN Email 실 발송 활성화 | ✅ | 김도형 | 6/4. `message@malgnsoft.com` 발신 도메인 NHN Notification Hub 콘솔 등록 + `EMAIL_FROM`/`EMAIL_FROM_NAME` secret 등록. NHN 직접 호출 SUCCESS · messageId 발급 확인 |
| 5-5-12 | NHN SMS 실 발송 활성화 | ⚪ | 김도형 | 어댑터·인증·페이로드 검증 완료. NHN 콘솔 발신번호 등록 + `SMS_FROM` secret 설정 + 라이브 e2e 1건 대기 |

---

## 알려진 한계 / 다음 단계

- ~~**DDL 적용 보류**~~ — 2026-06-01 라이브 적용 확인 + e2e 검증 완료. 라이브 정본이 더 정교한 인덱스/FK로 적용돼 있어 `0002_export_flow.sql` 파일도 정본에 맞춰 동기화 — 신규 환경에서도 동일 적용 가능.
- **`wrangler dev --remote` 의존성 다중화** — 1105 같은 dev/preview 장애가 또 일어나면 또 막힘. Cloudflare Tunnel·RDS Proxy·bastion 등 후보 중 하나 도입 검토 (CLAUDE.md §12 TODO).
- **Drizzle schema.ts 정합화** — `src/db/schema.ts`의 export/flow 테이블 정의는 인덱스/FK 미선언(컬럼만). 동작 영향은 없으나 위생적으로 명시화 후속.
- **김도형 담당 마감 = 7/3** (개발·테스트 통합 완료 목표) — 남은 task는 위 W1~W5 일정에 분배.
- **백엔드 연동 점진 진행 중** — 인증·계정·계약·승인 게이트·서비스 담당자 이메일 변경까지 실 API. 발송 6채널·이력/통계·주소록·발신정보·템플릿·캠페인은 여전히 목업.
- **관리자단 화면 vs 연동 분리** — 6/4 핸드오프 17 페이지 화면(`dev="screen"`)은 모두 완료. API 연동·관리자 인증/RBAC·실데이터 바인딩은 미. 대시보드 차트 4종은 더미 데이터.
- **NHN real 모드** — Email ✅ 라이브 발송. SMS는 발신번호 등록 대기. push/rcs/kakao 어댑터는 Notification Hub로 마이그레이션 미.
- **PG** — TossPayments 확정. `src/adapters/pg/toss.ts` + 카드 등록/결제/취소/webhook 미구현. **AI 템플릿** 게이트웨이도 미.
- **시스템 페이지** — 시안의 "쏠쏠 브랜드" 단독 404·점검·네트워크 페이지를 맑은 브랜드로 재작업 필요.
- **Step 4 정식 디자인 산출물** — 디자인팀 정식 스타일 가이드 + 퍼블리싱 MD는 미작성. 현재는 개발 측 [DESIGN.md](DESIGN.md) + [/guide](https://malgn-noti.pages.dev/guide) 카탈로그로 대체.
