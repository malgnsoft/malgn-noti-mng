// 자동 생성(시드) — D1 바인딩이 없는 로컬 dev 폴백용. 정본은 D1(malgn-noti-project).
import type { WbsDocument } from '~/composables/useWbs'

export const boardSeed: WbsDocument = {
  "projectName": "맑은 메시징",
  "lastUpdated": "2026-06-04",
  "stages": [
    {
      "id": "step-1",
      "no": "Step 1",
      "emoji": "🎯",
      "name": "프로젝트 준비",
      "summary": "R&R · 사업 기획 · 계약서 초안 · 커뮤니케이션 · 환경 셋팅",
      "weight": 10,
      "progress": 55,
      "tasks": [
        {
          "id": "1-1-1",
          "group": "R&R · 사업 기획",
          "title": "작업 R&R 분배",
          "status": "done",
          "owner": "김덕조",
          "note": "메모 확인",
          "targetDate": "5/8",
          "completionDate": "5/8"
        },
        {
          "id": "1-1-2",
          "group": "R&R · 사업 기획",
          "title": "경쟁 서비스 가격 분석",
          "status": "done",
          "owner": "컨설팅팀",
          "note": "경쟁사 단가표"
        },
        {
          "id": "1-1-3",
          "group": "R&R · 사업 기획",
          "title": "당사 원가 확인 및 가격 정책 결정 (단가)",
          "status": "in_progress",
          "owner": "컨설팅팀",
          "note": "기본 단가 책정(할인률 정책) · MMS 이미지 3장까지 비용설계 · 단가표(기획안)"
        },
        {
          "id": "1-2-1",
          "group": "사업 준비",
          "title": "특수 유형의 메시징 사업자 신청",
          "status": "pending",
          "owner": "컨설팅팀",
          "note": "프로젝트 추진 중간평가 이후"
        },
        {
          "id": "1-2-2",
          "group": "사업 준비",
          "title": "통신판매사업자 신청",
          "status": "pending",
          "owner": "컨설팅팀",
          "note": "중간평가 이후"
        },
        {
          "id": "1-2-3",
          "group": "사업 준비",
          "title": "자본 Up 방안",
          "status": "pending",
          "owner": "—",
          "note": "중간평가 이후"
        },
        {
          "id": "1-2-4",
          "group": "사업 준비",
          "title": "관련 계약서 작성",
          "status": "in_progress",
          "owner": "컨설팅팀",
          "note": "가입신청서·이용약관·개인정보처리방침·요금신고내역 초안 / 1차 검토 완료 → 2차 수정본 / 전무님 검토 필요"
        },
        {
          "id": "1-3-1",
          "group": "커뮤니케이션",
          "title": "그룹 텔레그램 개설",
          "status": "done",
          "owner": "김도형",
          "note": "맑은메시지 TF",
          "targetDate": "5/8",
          "completionDate": "5/8"
        },
        {
          "id": "1-3-2",
          "group": "커뮤니케이션",
          "title": "화면설계 · 피그마 정본",
          "status": "done",
          "owner": "김경은",
          "note": "피그마",
          "targetDate": "5/11",
          "completionDate": "5/11"
        },
        {
          "id": "1-3-3",
          "group": "커뮤니케이션",
          "title": "문서 공유 폴더",
          "status": "pending",
          "owner": "김덕조",
          "note": "프로젝트 폴더"
        },
        {
          "id": "1-4-1",
          "group": "서비스 메타",
          "title": "서비스 도메인 결정",
          "status": "pending",
          "owner": "김덕조"
        },
        {
          "id": "1-4-2",
          "group": "서비스 메타",
          "title": "브랜딩 (맑은메시지 외 아이데이션)",
          "status": "pending",
          "owner": "김덕조"
        },
        {
          "id": "1-4-3",
          "group": "서비스 메타",
          "title": "마케팅 기획",
          "status": "pending",
          "owner": "안병훈",
          "note": "기존 고객군 & 메시징 only 고객군"
        },
        {
          "id": "1-5-1",
          "group": "환경 셋팅",
          "title": "커뮤니케이션 문서 폴더 운영",
          "status": "done",
          "owner": "김덕조",
          "note": "폴더 셋팅",
          "targetDate": "5/8",
          "completionDate": "5/8"
        },
        {
          "id": "1-5-2",
          "group": "환경 셋팅",
          "title": "GitHub(malgnsoft) · Cloudflare 셋팅",
          "status": "done",
          "owner": "김도형",
          "note": "3 레포 + Pages 2 + Workers 1",
          "targetDate": "5/11",
          "completionDate": "5/11"
        },
        {
          "id": "1-5-3",
          "group": "환경 셋팅",
          "title": "사용자단",
          "status": "done",
          "owner": "김도형",
          "href": "https://malgn-noti.pages.dev/",
          "targetDate": "5/11",
          "completionDate": "5/11"
        },
        {
          "id": "1-5-4",
          "group": "환경 셋팅",
          "title": "관리자단",
          "status": "done",
          "owner": "김도형",
          "href": "https://malgn-noti-admin.pages.dev/",
          "targetDate": "5/11",
          "completionDate": "5/11"
        },
        {
          "id": "1-5-5",
          "group": "환경 셋팅",
          "title": "API 서버",
          "status": "done",
          "owner": "김도형",
          "href": "https://malgn-noti-api.malgnsoft.workers.dev/",
          "targetDate": "5/11",
          "completionDate": "5/11"
        }
      ]
    },
    {
      "id": "step-2",
      "no": "Step 2",
      "emoji": "📐",
      "name": "주요 서비스 정책 이슈 정리",
      "summary": "프로토타입 · 회원/결제/계약 · 메시지 채널 · 캠페인 · 주소록 정책",
      "weight": 15,
      "progress": 55,
      "tasks": [
        {
          "id": "2-1-1",
          "group": "프로토타입 · 문서",
          "title": "Front 프로토타입",
          "status": "in_progress",
          "owner": "김덕조",
          "note": "IA 정본(263 페이지)",
          "href": "https://malgn-notifications.pages.dev/#/"
        },
        {
          "id": "2-1-2",
          "group": "프로토타입 · 문서",
          "title": "Front 메뉴 및 스펙",
          "status": "pending",
          "owner": "—",
          "href": "https://malgn-notifications.pages.dev/#/sitemap"
        },
        {
          "id": "2-1-3",
          "group": "프로토타입 · 문서",
          "title": "Front 페이지 리스트",
          "status": "pending",
          "owner": "김덕조",
          "href": "https://malgn-notifications.pages.dev/#/pagelists"
        },
        {
          "id": "2-1-4",
          "group": "프로토타입 · 문서",
          "title": "BackOffice 프로토타입",
          "status": "pending",
          "owner": "김경은",
          "note": "만들지 말지 결정"
        },
        {
          "id": "2-1-5",
          "group": "프로토타입 · 문서",
          "title": "BackOffice 메뉴 및 스펙",
          "status": "pending",
          "owner": "—"
        },
        {
          "id": "2-2-1",
          "group": "주요 서비스 참조",
          "title": "NHN Cloud Notification 서비스",
          "status": "pending",
          "owner": "—",
          "note": "통합 대상"
        },
        {
          "id": "2-2-2",
          "group": "주요 서비스 참조",
          "title": "비즈 뿌리오 서비스",
          "status": "pending",
          "owner": "—",
          "note": "참조"
        },
        {
          "id": "2-3-1",
          "group": "캠페인",
          "title": "벤치마킹 조사",
          "status": "pending",
          "owner": "안병훈",
          "note": "솔라피(CRM 결합) + 개별 문자 발송"
        },
        {
          "id": "2-4-1",
          "group": "회원·결제·계약",
          "title": "회원가입·판매방식 — 후불 정산 / 개인 회원 추가",
          "status": "in_progress",
          "owner": "김덕조",
          "note": "법인·개인사업자·개인 3유형 / 카드 충전식 vs 후불 결제 / 계약관리에 지급이행보증보험 첨부",
          "targetDate": "5/12",
          "completionDate": "5/12"
        },
        {
          "id": "2-4-2",
          "group": "회원·결제·계약",
          "title": "회원 구조 — 멀티 계정 (주·보조)",
          "status": "in_progress",
          "owner": "김덕조",
          "note": "법인·개인사업자만 멀티계정 탭 노출, 개인은 미노출",
          "targetDate": "5/12",
          "completionDate": "5/12"
        },
        {
          "id": "2-4-3",
          "group": "회원·결제·계약",
          "title": "결제 — 자동충전",
          "status": "pending",
          "owner": "김덕조",
          "note": "향후 재논의"
        },
        {
          "id": "2-4-4",
          "group": "회원·결제·계약",
          "title": "결제내역 — 결제 페이지 추가",
          "status": "pending",
          "owner": "김덕조"
        },
        {
          "id": "2-4-5",
          "group": "회원·결제·계약",
          "title": "결제 — 후불 결제 고려",
          "status": "pending",
          "owner": "김덕조",
          "note": "내부로직 -크레딧 / 후불시 사용 크레딧 / 다음 결제일"
        },
        {
          "id": "2-4-6",
          "group": "회원·결제·계약",
          "title": "계약관리 정책",
          "status": "pending",
          "owner": "—",
          "note": "법인·개인사업자 온라인 계약 + BackOffice 승인 / 개인은 즉시 사용"
        },
        {
          "id": "2-5-1",
          "group": "메시지 채널 정책",
          "title": "AI 문장 다듬기 기능",
          "status": "in_progress",
          "owner": "김덕조",
          "note": "발송창(알림톡 제외) AI검토 / 문자·RCS·이메일 적용",
          "targetDate": "5/12",
          "completionDate": "5/12"
        },
        {
          "id": "2-5-2",
          "group": "메시지 채널 정책",
          "title": "광고용 선택 시 수신거부 전화번호 이슈",
          "status": "pending",
          "owner": "김덕조",
          "note": "맨 마지막에 입력창 분리 / 재확인 후 설계"
        },
        {
          "id": "2-5-3",
          "group": "메시지 채널 정책",
          "title": "순차발송",
          "status": "in_progress",
          "owner": "김덕조",
          "note": "알림톡 미수신시 SMS/LMS 폴백 / 복합(플로우) Default 알림톡→SMS→이메일",
          "targetDate": "5/12",
          "completionDate": "5/12"
        },
        {
          "id": "2-5-4",
          "group": "메시지 채널 정책",
          "title": "랜딩페이지 만들기 추가",
          "status": "in_progress",
          "owner": "김덕조",
          "note": "기본형·확장형 화면 추가",
          "targetDate": "5/12",
          "completionDate": "5/12"
        },
        {
          "id": "2-5-5",
          "group": "메시지 채널 정책",
          "title": "발신번호 관리에 휴대폰번호 추가",
          "status": "in_progress",
          "owner": "김덕조",
          "note": "유선(증명서) + 휴대폰(본인인증 PASS)",
          "targetDate": "5/12",
          "completionDate": "5/12"
        },
        {
          "id": "2-6-1",
          "group": "캠페인 · 주소록 · 브랜드",
          "title": "캠페인 관리 — AB 테스트 기능",
          "status": "pending",
          "owner": "김덕조",
          "note": "캠페인 관리 기능 최종 정의 후"
        },
        {
          "id": "2-6-2",
          "group": "캠페인 · 주소록 · 브랜드",
          "title": "주소록 — CRM 기능 확대",
          "status": "in_progress",
          "owner": "김덕조",
          "note": "단건 발송 레이어 팝업 / 연락처·그룹 채널 바로가기 / CRM 예제 화면 수집",
          "targetDate": "5/12",
          "completionDate": "5/12"
        },
        {
          "id": "2-6-3",
          "group": "캠페인 · 주소록 · 브랜드",
          "title": "브랜드 네임",
          "status": "pending",
          "owner": "안병훈 외 전체"
        }
      ]
    },
    {
      "id": "step-3",
      "no": "Step 3",
      "emoji": "📋",
      "name": "서비스 기획 (화면설계)",
      "summary": "Front 프로토타입 대체 + BackOffice 1·2차 화면 명세",
      "weight": 20,
      "progress": 35,
      "tasks": [
        {
          "id": "3-1-1",
          "group": "Front",
          "title": "프로토타입으로 대체",
          "status": "in_progress",
          "owner": "김덕조·김경은",
          "href": "https://malgn-notifications.pages.dev/#/"
        },
        {
          "id": "3-1-2",
          "group": "Front",
          "title": "서비스 메뉴 콘텐츠",
          "status": "pending",
          "owner": "컨설팅팀·김경은"
        },
        {
          "id": "3-1-3",
          "group": "Front",
          "title": "운영가이드",
          "status": "pending",
          "owner": "김덕조·김경은",
          "note": "사용자단 /help 라이브 — 컨텐츠 보강 필요",
          "href": "https://malgn-noti.pages.dev/help"
        },
        {
          "id": "3-2-1",
          "group": "BackOffice 1차",
          "title": "공통 · 로그인 · 계정 관리",
          "status": "in_progress",
          "owner": "김경은",
          "targetDate": "5/22"
        },
        {
          "id": "3-2-2",
          "group": "BackOffice 1차",
          "title": "회원 · 고객사 관리",
          "status": "in_progress",
          "owner": "김경은",
          "note": "회원 발송 이력 / 결제 상세 / 환불신청 제외",
          "targetDate": "5/22"
        },
        {
          "id": "3-2-3",
          "group": "BackOffice 1차",
          "title": "시스템 관리",
          "status": "in_progress",
          "owner": "김경은",
          "note": "운영자 계정 / RBAC / 감사 로그",
          "targetDate": "5/22"
        },
        {
          "id": "3-2-4",
          "group": "BackOffice 1차",
          "title": "요금 · 단가 관리",
          "status": "in_progress",
          "owner": "김경은",
          "targetDate": "5/29"
        },
        {
          "id": "3-2-5",
          "group": "BackOffice 1차",
          "title": "고객지원",
          "status": "in_progress",
          "owner": "김경은",
          "note": "운영 가이드 관리 제외",
          "targetDate": "5/29"
        },
        {
          "id": "3-2-6",
          "group": "BackOffice 1차",
          "title": "발송 운영 모니터링",
          "status": "pending",
          "owner": "김경은",
          "note": "캠페인 제외",
          "targetDate": "6/12"
        },
        {
          "id": "3-2-7",
          "group": "BackOffice 1차",
          "title": "발신 정보 검수",
          "status": "pending",
          "owner": "김경은",
          "targetDate": "6/12"
        },
        {
          "id": "3-2-8",
          "group": "BackOffice 1차",
          "title": "결제 · 크레딧 관리 + 고객사 상세 결제 탭",
          "status": "pending",
          "owner": "김경은",
          "targetDate": "6/19"
        },
        {
          "id": "3-2-9",
          "group": "BackOffice 1차",
          "title": "템플릿 검수 · 관리",
          "status": "pending",
          "owner": "김경은",
          "note": "샘플·AI 템플릿 정책 제외",
          "targetDate": "6/24"
        },
        {
          "id": "3-2-10",
          "group": "BackOffice 1차",
          "title": "수신거부 (운영)",
          "status": "pending",
          "owner": "김경은",
          "targetDate": "6/24"
        },
        {
          "id": "3-3-1",
          "group": "BackOffice 2차",
          "title": "통계 · 리포트",
          "status": "pending",
          "owner": "김경은"
        },
        {
          "id": "3-3-2",
          "group": "BackOffice 2차",
          "title": "대시보드",
          "status": "pending",
          "owner": "김경은"
        },
        {
          "id": "3-3-3",
          "group": "BackOffice 2차",
          "title": "템플릿 검수 · 관리 (AI 템플릿 정책)",
          "status": "pending",
          "owner": "김경은"
        },
        {
          "id": "3-3-4",
          "group": "BackOffice 2차",
          "title": "발송 운영 모니터링 (캠페인)",
          "status": "pending",
          "owner": "김경은"
        },
        {
          "id": "3-3-5",
          "group": "BackOffice 2차",
          "title": "고객지원",
          "status": "pending",
          "owner": "김경은",
          "note": "운영 가이드 관리"
        },
        {
          "id": "3-3-6",
          "group": "BackOffice 2차",
          "title": "콘텐츠 · 사이트 관리",
          "status": "pending",
          "owner": "김경은",
          "note": "시스템 설정 / 점검 모드 / 외부 연동"
        },
        {
          "id": "3-3-7",
          "group": "BackOffice 2차",
          "title": "시스템 관리",
          "status": "pending",
          "owner": "김경은"
        },
        {
          "id": "3-3-8",
          "group": "BackOffice 2차",
          "title": "API 관리",
          "status": "pending",
          "owner": "김경은"
        }
      ]
    },
    {
      "id": "step-4",
      "no": "Step 4",
      "emoji": "🎨",
      "name": "디자인 / 퍼블리싱",
      "summary": "디자인 스타일 가이드 + 퍼블리싱 MD (개발 측 DESIGN.md + /guide 카탈로그로 대체 운영 중)",
      "weight": 10,
      "progress": 20,
      "tasks": [
        {
          "id": "4-1",
          "title": "디자인 스타일 가이드",
          "status": "pending",
          "owner": "김양현",
          "note": "(개발: doc/DESIGN.md Relay-inspired v1.0 + /guide 카탈로그 운영). 디자인팀 정식 산출물은 별도 필요.",
          "href": "https://malgn-noti.pages.dev/guide"
        },
        {
          "id": "4-2",
          "title": "퍼블리싱 MD 파일",
          "status": "pending",
          "owner": "김양현",
          "note": "(개발: Nuxt 3 + Nuxt UI v3 + Tailwind v4로 직접 퍼블리싱 중)"
        }
      ]
    },
    {
      "id": "step-5",
      "no": "Step 5",
      "emoji": "🛠️",
      "name": "서비스 개발",
      "summary": "6/4 §1~§5 + NHN OAuth 어댑터·Email 활성화·이메일 변경 라우트: UI 거의 완료 · API 약 72%(13 done) · 화면↔API 연동 약 40%(10 done) · 관리자단 핸드오프 17 페이지(화면만 ✅, API 연동 후속) · 통합·배포 Hyperdrive Tunnel + Email real",
      "weight": 45,
      "progress": 55,
      "tasks": [
        {
          "id": "5-1-1",
          "group": "설계 및 준비",
          "title": "아키텍처 설계",
          "status": "done",
          "owner": "김도형",
          "note": "STACK.md — 3 레포 책임 + Cloudflare/AWS 혼합 + NHN 통합",
          "href": "https://github.com/malgnsoft/malgn-noti/blob/main/docs/STACK.md",
          "targetDate": "5/14",
          "completionDate": "5/14"
        },
        {
          "id": "5-1-2",
          "group": "설계 및 준비",
          "title": "데이터 모델링",
          "status": "done",
          "owner": "김도형",
          "note": "49 테이블 + Mermaid ERD 9종 + 확장성 전략(파티셔닝·Hot/Warm/Cold·R2 오프로드)",
          "targetDate": "5/27",
          "completionDate": "5/27"
        },
        {
          "id": "5-1-3",
          "group": "설계 및 준비",
          "title": "사용자단 디자인 시스템",
          "status": "done",
          "owner": "김도형",
          "note": "Relay-inspired v1.0 — ink 11단 + 그린 #00DC82 + Inter/JetBrains Mono/Pretendard",
          "targetDate": "5/18",
          "completionDate": "5/18"
        },
        {
          "id": "5-1-4",
          "group": "설계 및 준비",
          "title": "사용자단 디자인 가이드 (라이브 카탈로그)",
          "status": "done",
          "owner": "김도형",
          "href": "https://malgn-noti.pages.dev/guide",
          "targetDate": "5/19",
          "completionDate": "5/19"
        },
        {
          "id": "5-1-5",
          "group": "설계 및 준비",
          "title": "관리자단 부트스트랩 + 셸 (LNB + TopBar)",
          "status": "done",
          "owner": "김도형",
          "note": "Nuxt 3 + Nuxt UI v3 + LNB 256px·8그룹 + TopBar 64px",
          "targetDate": "5/27",
          "completionDate": "5/27"
        },
        {
          "id": "5-1-6",
          "group": "설계 및 준비",
          "title": "관리자단 디자인 가이드",
          "status": "done",
          "owner": "김도형",
          "href": "https://malgn-noti-admin.pages.dev/guide",
          "targetDate": "5/27",
          "completionDate": "5/27"
        },
        {
          "id": "5-1-7",
          "group": "설계 및 준비",
          "title": "관리자단 페이지 기획 MD (33종)",
          "status": "done",
          "owner": "김도형",
          "note": "P0 14 / P1 13 / P2 5 — 8 그룹",
          "targetDate": "5/27",
          "completionDate": "5/27"
        },
        {
          "id": "5-2-A1",
          "group": "API 백엔드",
          "title": "기반 인프라",
          "status": "done",
          "owner": "김도형",
          "note": "Workers+Hyperdrive · DB 49테이블·파티션 · 기초 CRUD 14도메인 · OpenAPI/Scalar"
        },
        {
          "id": "5-2-A2",
          "group": "API 백엔드",
          "title": "인증·계정·문서",
          "status": "done",
          "owner": "김도형",
          "note": "signup/login/JWT/PBKDF2 · NICE 통합인증 · 계약·서류 R2 · WBS R2 · 이메일 변경"
        },
        {
          "id": "5-2-A3",
          "group": "API 백엔드",
          "title": "발송 엔진",
          "status": "in_progress",
          "owner": "김도형",
          "note": "producer 5채널 · 멱등성 · NHN 어댑터 · Queues+Consumer · NHN Hub OAuth · Webhook · 실모드 전환"
        },
        {
          "id": "5-2-A4",
          "group": "API 백엔드",
          "title": "발송 확장",
          "status": "in_progress",
          "owner": "김도형",
          "note": "Export 다운로드 잡 · Flow 복합발송 · 캠페인(스케줄·시뮬·테스트)"
        },
        {
          "id": "5-2-A5",
          "group": "API 백엔드",
          "title": "결제·크레딧",
          "status": "pending",
          "owner": "김도형",
          "note": "PG 어댑터 + 카드 등록·결제·취소"
        },
        {
          "id": "5-2-A6",
          "group": "API 백엔드",
          "title": "AI 템플릿",
          "status": "pending",
          "owner": "김도형",
          "note": "LLM 게이트웨이"
        },
        {
          "id": "5-3-1",
          "group": "사용자단 화면 UI (목업)",
          "title": "인증·계정 — 로그인 / 회원가입 5단계 / 비번 재설정 / 보안 인증",
          "status": "done",
          "owner": "김도형",
          "note": "/login · /login/security · /reset-password · /reset-password/new · /signup",
          "completionDate": "5/20",
          "targetDate": "5/20"
        },
        {
          "id": "5-3-2",
          "group": "사용자단 화면 UI (목업)",
          "title": "발송 6채널 (SMS/RCS/Kakao/Email/Push/Flow)",
          "status": "done",
          "owner": "김도형",
          "note": "/send/* + PU 풀세트(수신자·주소록·광고수신·컨펌·초기화)",
          "completionDate": "5/20",
          "targetDate": "5/20"
        },
        {
          "id": "5-3-3",
          "group": "사용자단 화면 UI (목업)",
          "title": "이력 / 통계 — 5채널 + 통계 대시보드",
          "status": "done",
          "owner": "김도형",
          "note": "/history/* + 비동기 다운로드 요청 패턴",
          "completionDate": "5/21",
          "targetDate": "5/21"
        },
        {
          "id": "5-3-4",
          "group": "사용자단 화면 UI (목업)",
          "title": "주소록 — 연락처 / 그룹 / 수신거부",
          "status": "done",
          "owner": "김도형",
          "note": "/contacts/{list,groups,optout}",
          "completionDate": "5/21",
          "targetDate": "5/21"
        },
        {
          "id": "5-3-5",
          "group": "사용자단 화면 UI (목업)",
          "title": "발신 정보 6종",
          "status": "done",
          "owner": "김도형",
          "note": "/sender/{numbers,brands,domains,push-cert,profiles,optout-080} + 등록 마법사",
          "completionDate": "5/22",
          "targetDate": "5/22"
        },
        {
          "id": "5-3-6",
          "group": "사용자단 화면 UI (목업)",
          "title": "템플릿 관리 — 5채널 + 발송 상세 설정",
          "status": "done",
          "owner": "김도형",
          "note": "/manage/{sms,rcs,kakao,email,push,settings}",
          "completionDate": "5/22",
          "targetDate": "5/22"
        },
        {
          "id": "5-3-7",
          "group": "사용자단 화면 UI (목업)",
          "title": "캠페인 — 본안 + 변형(v3)",
          "status": "done",
          "owner": "김도형",
          "note": "/campaign · /campaign3",
          "completionDate": "5/22",
          "targetDate": "5/22"
        },
        {
          "id": "5-3-8",
          "group": "사용자단 화면 UI (목업)",
          "title": "크레딧 / 결제 — 충전·결과·내역·영수증·카드 관리",
          "status": "done",
          "owner": "김도형",
          "note": "/charge · /charge/result · /account/{credit,cards}",
          "completionDate": "5/22",
          "targetDate": "5/22"
        },
        {
          "id": "5-3-9",
          "group": "사용자단 화면 UI (목업)",
          "title": "문의 — 작성 / 완료 / 내 문의 / 상세",
          "status": "done",
          "owner": "김도형",
          "note": "/inquiry · /inquiry/complete · /account/inquiries(/detail)",
          "completionDate": "5/22",
          "targetDate": "5/22"
        },
        {
          "id": "5-3-10",
          "group": "사용자단 화면 UI (목업)",
          "title": "나의 페이지 — 9 라우트",
          "status": "done",
          "owner": "김도형",
          "note": "AppMyPageShell + /account/{settings,cards,password,security,multi,contract,credit,billing,inquiries}",
          "completionDate": "5/22",
          "targetDate": "5/22"
        },
        {
          "id": "5-3-11",
          "group": "사용자단 화면 UI (목업)",
          "title": "메시지 관리 랜딩페이지",
          "status": "done",
          "owner": "김도형",
          "note": "목록 · 기본형/확장형 등록 폼 · 미리보기",
          "completionDate": "5/22",
          "targetDate": "5/22"
        },
        {
          "id": "5-3-12",
          "group": "사용자단 화면 UI (목업)",
          "title": "공개 랜딩페이지 + 운영 가이드",
          "status": "done",
          "owner": "김도형",
          "note": "/ (히어로·5채널·장점·단가 비교·CTA) + /help",
          "href": "https://malgn-noti.pages.dev/",
          "completionDate": "5/22",
          "targetDate": "5/22"
        },
        {
          "id": "5-3-13",
          "group": "사용자단 화면 UI (목업)",
          "title": "디자인 가이드 (라이브 카탈로그)",
          "status": "done",
          "owner": "김도형",
          "href": "https://malgn-noti.pages.dev/guide",
          "completionDate": "5/19",
          "targetDate": "5/19"
        },
        {
          "id": "5-3-14",
          "group": "사용자단 화면 UI (목업)",
          "title": "시스템 페이지 — 404 / system error",
          "status": "in_progress",
          "owner": "김도형",
          "note": "단독 일부 라이브. 점검 / 네트워크 / 인증 메일 템플릿 미",
          "targetDate": "6/11"
        },
        {
          "id": "5-3-15",
          "group": "사용자단 화면 UI (목업)",
          "title": "/wbs 페이지 — R2 정본 비동기 로드 + 인라인 편집 모달",
          "status": "done",
          "owner": "김도형",
          "note": "6/4 §5. 임베디드 STAGES 제거 → top-level await api(/wbs). AppModal 편집 다이얼로그(owner·note·href·targetDate·completionDate). 비로그인 읽기 전용 + \"로그인하면 편집 가능\" 힌트.",
          "targetDate": "6/4",
          "completionDate": "6/4"
        },
        {
          "id": "5-3C-A1",
          "group": "사용자단 ↔ API 연동",
          "title": "인증·계정",
          "status": "in_progress",
          "owner": "김도형",
          "note": "로그인·가입·/me·OTP·login-by-email·PATCH /me 완료 / 로그아웃·비번재설정·약관·companyType·비번변경·2FA·멀티계정 잔여"
        },
        {
          "id": "5-3C-A2",
          "group": "사용자단 ↔ API 연동",
          "title": "계약·승인",
          "status": "done",
          "owner": "김도형",
          "note": "승인 게이트 · 계약·R2 업로드 · reviewing 자동전이·배지 · 계약서 서명 · 담당자 이메일 변경"
        },
        {
          "id": "5-3C-A3",
          "group": "사용자단 ↔ API 연동",
          "title": "발송·이력·통계",
          "status": "pending",
          "owner": "김도형",
          "note": "발송 6채널 실 API(Idempotency-Key) · 이력/통계 라우트 연동"
        },
        {
          "id": "5-3C-A4",
          "group": "사용자단 ↔ API 연동",
          "title": "데이터 관리",
          "status": "pending",
          "owner": "김도형",
          "note": "주소록·발신정보·템플릿 CRUD 연동"
        },
        {
          "id": "5-3C-A5",
          "group": "사용자단 ↔ API 연동",
          "title": "크레딧·결제",
          "status": "pending",
          "owner": "김도형",
          "note": "PG 연동 — 블로커(PG 어댑터 미정)"
        },
        {
          "id": "5-3C-A6",
          "group": "사용자단 ↔ API 연동",
          "title": "문의",
          "status": "pending",
          "owner": "김도형",
          "note": "/inquiries 연동"
        },
        {
          "id": "5-4-A1",
          "group": "관리자단 화면",
          "title": "기반·셸·핸드오프",
          "status": "done",
          "owner": "김도형",
          "note": "셸 LNB 8그룹+TopBar+디자인가이드 · 기획 MD 33종 · 핸드오프 17페이지 · 진척 라벨 · 로고/브랜드"
        },
        {
          "id": "5-4-A2",
          "group": "관리자단 화면",
          "title": "회원·고객사",
          "status": "pending",
          "owner": "김도형",
          "note": "회원·고객사 관리 + 상세"
        },
        {
          "id": "5-4-A3",
          "group": "관리자단 화면",
          "title": "운영·검수",
          "status": "pending",
          "owner": "김도형",
          "note": "발송 모니터링 · 발신정보 검수 · 템플릿 검수 · 수신거부 운영"
        },
        {
          "id": "5-4-A4",
          "group": "관리자단 화면",
          "title": "요금·결제",
          "status": "pending",
          "owner": "김도형",
          "note": "요금·단가 관리 · 결제·크레딧 + 고객사 결제 탭"
        },
        {
          "id": "5-4-A5",
          "group": "관리자단 화면",
          "title": "고객지원",
          "status": "pending",
          "owner": "김도형",
          "note": "1:1 문의·FAQ·공지"
        },
        {
          "id": "5-4-A6",
          "group": "관리자단 화면",
          "title": "시스템·통계",
          "status": "pending",
          "owner": "김도형",
          "note": "운영자·RBAC·감사로그 · 통계·리포트·대시보드 · 콘텐츠·사이트·API 관리"
        },
        {
          "id": "5-5-1",
          "group": "통합 · 배포",
          "title": "사용자단 Cloudflare Pages 배포 #1~#69 + alias 다수",
          "status": "in_progress",
          "owner": "김도형",
          "note": "매 마일스톤 직후 배포 (6/4 누적 #80+ alias 다수)"
        },
        {
          "id": "5-5-2",
          "group": "통합 · 배포",
          "title": "관리자단 Cloudflare Pages 첫 Nuxt 배포",
          "status": "done",
          "owner": "김도형",
          "note": "정적 placeholder → 실 Nuxt 앱",
          "completionDate": "5/27",
          "targetDate": "5/27"
        },
        {
          "id": "5-5-3",
          "group": "통합 · 배포",
          "title": "API Workers 배포 #1~#19",
          "status": "in_progress",
          "owner": "김도형",
          "note": "6/4 최신 Version 1ca0446e-ed3f-4079-be5f-3407f4550ba7 (#25+)"
        },
        {
          "id": "5-5-4",
          "group": "통합 · 배포",
          "title": "DDL — 0001~0005 라이브 적용",
          "status": "done",
          "owner": "김도형",
          "note": "0001 idempotency / 0002 export_flow / 0003 loginid global unique / 0004 nice_auth / 0005 company_approval. TB_CONTRACT·TB_CONTRACT_FILE은 6/2 §11에서 schema.ts 정의(라이브에 이미 존재)",
          "targetDate": "6/2",
          "completionDate": "6/2"
        },
        {
          "id": "5-5-5",
          "group": "통합 · 배포",
          "title": "NHN Notification Hub 자격증명 + 어댑터 재작성",
          "status": "in_progress",
          "owner": "김도형",
          "note": "**6/4: SMS·Email 어댑터 Notification Hub로 재작성 완료** + Email real 발송 검증 통과. SMS는 NHN 콘솔 발신번호 등록 + SMS_FROM secret 대기. push/rcs/kakao 어댑터 마이그레이션 후속.",
          "targetDate": "6/19"
        },
        {
          "id": "5-5-6",
          "group": "통합 · 배포",
          "title": "NICE 통합인증 실 모드 전환",
          "status": "pending",
          "owner": "김도형",
          "note": "6/4 재시도 → 여전히 1007 (Workers outbound IPv6 vs NICE 콘솔 IPv4 등록). 사용자 콘솔 IP 정책 해결 대기.",
          "targetDate": "7/3"
        },
        {
          "id": "5-5-7",
          "group": "통합 · 배포",
          "title": "R2 bucket malgn-noti-files + FILES 바인딩",
          "status": "done",
          "owner": "김도형",
          "note": "6/2 §11. 사업자등록증·대부업등록증·보험증권 첨부용",
          "targetDate": "6/2",
          "completionDate": "6/2"
        },
        {
          "id": "5-5-8",
          "group": "통합 · 배포",
          "title": "PG 카드 결제 연동",
          "status": "pending",
          "owner": "김도형",
          "targetDate": "6/26"
        },
        {
          "id": "5-5-9",
          "group": "통합 · 배포",
          "title": "AI 템플릿 게이트웨이 연동",
          "status": "pending",
          "owner": "김도형",
          "targetDate": "7/2"
        },
        {
          "id": "5-5-10",
          "group": "통합 · 배포",
          "title": "Hyperdrive Cloudflare Tunnel(Access) 전환",
          "status": "done",
          "owner": "김도형",
          "note": "6/4 §2. id a2ba... → 439b... 신규 origin malgn-dev-db.apiserver.kr + access_client_id. Aurora SG egress IP 화이트리스트 운영 부담 해소. 정본 3개(API CLAUDE.md §3·§8·§12, SCALABILITY.md §6 신규 절, MIGRATION.md §1) 동기화. 라이브 검증 통과.",
          "targetDate": "6/4",
          "completionDate": "6/4"
        },
        {
          "id": "5-5-11",
          "group": "통합 · 배포",
          "title": "NHN Email 실 발송 활성화",
          "status": "done",
          "owner": "김도형",
          "note": "6/4. message@malgnsoft.com 발신 도메인 NHN Notification Hub 콘솔 등록 + EMAIL_FROM/EMAIL_FROM_NAME secret 등록. NHN 직접 호출 SUCCESS·messageId 발급 확인.",
          "targetDate": "6/4",
          "completionDate": "6/4"
        },
        {
          "id": "5-5-12",
          "group": "통합 · 배포",
          "title": "NHN SMS 실 발송 활성화",
          "status": "pending",
          "owner": "김도형",
          "note": "어댑터·인증·페이로드 검증 완료. NHN 콘솔 발신번호 등록 + SMS_FROM secret 설정 + 라이브 e2e 1건 대기.",
          "targetDate": "6/13"
        }
      ]
    }
  ]
}
