// 간트 WBS 데이터 — Step 1 · 3 · 5 (화면 단위 최대 분해).
// 종료일 = 기존 목표일. 시작일은 작업 기간 기준으로 부여. 날짜는 YYYY-MM-DD.

export interface GanttItem {
  step: 1 | 3 | 5
  group: string
  name: string
  owner: string
  start: string
  end: string
  progress: number
  note?: string
  href?: string
}

const O = '김도형'

export const wbsSteps: Record<number, string> = {
  1: 'Step 1 · 프로젝트 준비',
  3: 'Step 3 · 서비스 기획 (화면설계)',
  5: 'Step 5 · 서비스 개발',
}

export const wbsGantt: GanttItem[] = [
  // ── Step 1 · 프로젝트 준비 ──────────────────────────────
  { step: 1, group: 'R&R · 사업 기획', name: '작업 R&R 분배', owner: O, start: '2026-05-04', end: '2026-05-08', progress: 100 },
  { step: 1, group: 'R&R · 사업 기획', name: '경쟁 서비스 가격 분석', owner: '컨설팅팀', start: '2026-05-08', end: '2026-05-14', progress: 100 },
  { step: 1, group: 'R&R · 사업 기획', name: '당사 원가 확인 및 가격 정책 결정 (단가)', owner: '컨설팅팀', start: '2026-05-12', end: '2026-05-30', progress: 60 },
  { step: 1, group: '사업 준비', name: '특수 유형의 메시징 사업자 신청', owner: '컨설팅팀', start: '2026-06-16', end: '2026-06-27', progress: 0 },
  { step: 1, group: '사업 준비', name: '통신판매사업자 신청', owner: '컨설팅팀', start: '2026-06-16', end: '2026-06-27', progress: 0 },
  { step: 1, group: '사업 준비', name: '관련 계약서 작성', owner: '컨설팅팀', start: '2026-05-19', end: '2026-06-13', progress: 40 },
  { step: 1, group: '커뮤니케이션', name: '그룹 텔레그램 개설', owner: O, start: '2026-05-08', end: '2026-05-08', progress: 100 },
  { step: 1, group: '커뮤니케이션', name: '화면설계 · 피그마 정본', owner: O, start: '2026-05-08', end: '2026-05-11', progress: 100 },
  { step: 1, group: '서비스 메타', name: '서비스 도메인 결정', owner: O, start: '2026-06-02', end: '2026-06-13', progress: 0 },
  { step: 1, group: '서비스 메타', name: '브랜딩 (맑은메시지 외 아이데이션)', owner: O, start: '2026-06-02', end: '2026-06-20', progress: 0 },
  { step: 1, group: '서비스 메타', name: '마케팅 기획', owner: O, start: '2026-06-09', end: '2026-06-27', progress: 0 },
  { step: 1, group: '환경 셋팅', name: 'GitHub(malgnsoft) · Cloudflare 셋팅', owner: O, start: '2026-05-09', end: '2026-05-11', progress: 100 },
  { step: 1, group: '환경 셋팅', name: '사용자단 부트스트랩', owner: O, start: '2026-05-11', end: '2026-05-11', progress: 100 },
  { step: 1, group: '환경 셋팅', name: '관리자단 부트스트랩', owner: O, start: '2026-05-11', end: '2026-05-11', progress: 100 },
  { step: 1, group: '환경 셋팅', name: 'API 서버 부트스트랩', owner: O, start: '2026-05-11', end: '2026-05-11', progress: 100 },

  // ── Step 3 · 서비스 기획 (화면설계) ─────────────────────
  { step: 3, group: 'Front', name: '프로토타입으로 대체', owner: O, start: '2026-05-13', end: '2026-05-22', progress: 70 },
  { step: 3, group: 'Front', name: '서비스 메뉴 콘텐츠', owner: O, start: '2026-05-26', end: '2026-06-06', progress: 0 },
  { step: 3, group: 'Front', name: '운영가이드', owner: O, start: '2026-05-26', end: '2026-06-06', progress: 0 },
  { step: 3, group: 'BackOffice 1차', name: '공통 · 로그인 · 계정 관리', owner: O, start: '2026-05-18', end: '2026-05-22', progress: 60 },
  { step: 3, group: 'BackOffice 1차', name: '회원 · 고객사 관리', owner: O, start: '2026-05-18', end: '2026-05-22', progress: 60 },
  { step: 3, group: 'BackOffice 1차', name: '시스템 관리', owner: O, start: '2026-05-19', end: '2026-05-22', progress: 50 },
  { step: 3, group: 'BackOffice 1차', name: '요금 · 단가 관리', owner: O, start: '2026-05-23', end: '2026-05-29', progress: 40 },
  { step: 3, group: 'BackOffice 1차', name: '고객지원', owner: O, start: '2026-05-23', end: '2026-05-29', progress: 40 },
  { step: 3, group: 'BackOffice 1차', name: '발송 운영 모니터링', owner: O, start: '2026-06-02', end: '2026-06-12', progress: 0 },
  { step: 3, group: 'BackOffice 1차', name: '발신 정보 검수', owner: O, start: '2026-06-02', end: '2026-06-12', progress: 0 },
  { step: 3, group: 'BackOffice 1차', name: '결제 · 크레딧 관리 + 고객사 결제 탭', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 3, group: 'BackOffice 1차', name: '템플릿 검수 · 관리', owner: O, start: '2026-06-16', end: '2026-06-24', progress: 0 },
  { step: 3, group: 'BackOffice 1차', name: '수신거부 (운영)', owner: O, start: '2026-06-16', end: '2026-06-24', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: '통계 · 리포트', owner: O, start: '2026-06-23', end: '2026-07-03', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: '대시보드', owner: O, start: '2026-06-23', end: '2026-07-03', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: '템플릿 검수 (AI 템플릿 정책)', owner: O, start: '2026-06-23', end: '2026-07-03', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: '발송 운영 모니터링 (캠페인)', owner: O, start: '2026-06-23', end: '2026-07-03', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: '콘텐츠 · 사이트 관리', owner: O, start: '2026-06-23', end: '2026-07-03', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: '시스템 관리', owner: O, start: '2026-06-23', end: '2026-07-03', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: 'API 관리', owner: O, start: '2026-06-23', end: '2026-07-03', progress: 0 },

  // ── Step 5 · 서비스 개발 (화면 단위) ────────────────────
  { step: 5, group: '설계 및 준비', name: '아키텍처 설계', owner: O, start: '2026-05-12', end: '2026-05-14', progress: 100, href: 'https://github.com/malgnsoft/malgn-noti/blob/main/doc/STACK.md' },
  { step: 5, group: '설계 및 준비', name: '데이터 모델링', owner: O, start: '2026-05-15', end: '2026-05-22', progress: 80 },
  { step: 5, group: '설계 및 준비', name: '사용자단 레이아웃 설계', owner: O, start: '2026-05-13', end: '2026-05-20', progress: 100, href: 'https://malgn-noti.pages.dev/guide' },
  { step: 5, group: '설계 및 준비', name: '사용자단 화면 개발', owner: O, start: '2026-05-14', end: '2026-05-22', progress: 95, href: 'https://malgn-noti.pages.dev/sitemap' },
  { step: 5, group: '설계 및 준비', name: '관리자단 레이아웃 설계', owner: O, start: '2026-05-22', end: '2026-05-27', progress: 20, href: 'https://malgn-noti-admin.pages.dev/guide' },
  { step: 5, group: '설계 및 준비', name: '관리자단 화면 개발', owner: O, start: '2026-05-27', end: '2026-07-03', progress: 40 },
  { step: 5, group: 'API 서버', name: '기초 API 개발', owner: O, start: '2026-05-24', end: '2026-05-29', progress: 100, href: 'https://malgn-noti-api.malgnsoft.workers.dev/doc' },
  { step: 5, group: 'API 서버', name: '발송 API 개발', owner: O, start: '2026-05-29', end: '2026-06-09', progress: 85 },
  { step: 5, group: 'API 서버', name: '고도화 API 개발', owner: O, start: '2026-06-09', end: '2026-06-25', progress: 35 },
  { step: 5, group: 'API 서버', name: '외부 연동 개발 (NHN · PG)', owner: O, start: '2026-06-16', end: '2026-07-03', progress: 30 },
  { step: 5, group: '관리자단', name: '테넌트 / 사용자 관리 화면 개발', owner: O, start: '2026-06-16', end: '2026-06-29', progress: 10 },
  { step: 5, group: '관리자단', name: '운영 · 모니터링 화면 개발', owner: O, start: '2026-06-23', end: '2026-07-02', progress: 0 },
  { step: 5, group: '관리자단', name: '과금 · 정산 화면 개발', owner: O, start: '2026-06-23', end: '2026-07-01', progress: 0 },
  { step: 5, group: '사용자단', name: '인증 / 계정 화면 개발', owner: O, start: '2026-05-26', end: '2026-06-26', progress: 70 },
  { step: 5, group: '사용자단', name: '발송 화면 개발', owner: O, start: '2026-06-02', end: '2026-06-15', progress: 0 },
  { step: 5, group: '사용자단', name: '이력 / 통계 화면 개발', owner: O, start: '2026-06-09', end: '2026-06-18', progress: 0 },
  { step: 5, group: '사용자단', name: '주소록 화면 개발', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자단', name: '발신 정보 화면 개발', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자단', name: '템플릿 관리 화면 개발', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자단', name: '크레딧 · 결제 화면 개발', owner: O, start: '2026-06-16', end: '2026-06-27', progress: 0 },
  { step: 5, group: '사용자단', name: '문의 화면 개발', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자단', name: '시스템 페이지 개발', owner: O, start: '2026-06-09', end: '2026-06-11', progress: 0 },
]
