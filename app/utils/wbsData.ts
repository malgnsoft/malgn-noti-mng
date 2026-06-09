// 간트 WBS 데이터 — Step 1 · 3 · 5 (화면 단위 최대 분해).
// 종료일 = 기존 목표일. 시작일은 작업 기간 기준으로 부여. 날짜는 YYYY-MM-DD.

export interface GanttItem {
  step: 1 | 3 | 5
  group: string
  name: string
  owner: string
  start?: string // 미정이면 생략(간트 막대 없음)
  end?: string
  progress: number
  note?: string
  href?: string
}

const O = '김도형'

export const wbsSteps: Record<number, string> = {
  1: 'Step 1 · 프로젝트 준비',
  2: 'Step 2 · 주요 서비스 정책 이슈 정리',
  3: 'Step 3 · 서비스 기획 (화면설계)',
  4: 'Step 4 · 서비스 개발',
  5: 'Step 5 · QA',
}

// 단계 가중치·진행률 — 현황판(보드)과 동일 값. 전체 진척은 가중평균.
// (Step 4 = 서비스 개발. Step 5 = QA는 가중치 미포함(weight 0).)
export const wbsStageMeta: Record<number, { weight: number, progress: number }> = {
  1: { weight: 10, progress: 55 },
  2: { weight: 15, progress: 55 },
  3: { weight: 20, progress: 35 },
  4: { weight: 45, progress: 55 },
}

export const wbsGantt: GanttItem[] = [
  // ── Step 1 · 프로젝트 준비 ──────────────────────────────
  { step: 1, group: 'R&R 분배', name: '작업 R&R 분배', owner: '김덕조', start: '2026-05-08', end: '2026-05-08', progress: 100, note: '메모 확인' },
  { step: 1, group: '사업 기획', name: '경쟁 서비스 가격 분석', owner: '컨설팅팀', progress: 100, note: '경쟁사 단가표' },
  { step: 1, group: '사업 기획', name: '당사 원가 확인 및 가격 정책 결정 (단가 결정)', owner: '컨설팅팀', progress: 50, note: '(단가표) 참고하여 기본 단가 책정(고객 모수에 따른 할인률 정책 필요) · MMS는 이미지 3장까지 비용설계 · 단가표(기획안)' },
  { step: 1, group: '사업 준비', name: '특수한 유형의 메시징 사업자 신청', owner: '컨설팅팀', progress: 0, note: '프로젝트 추진 중간평가 이후 진행' },
  { step: 1, group: '사업 준비', name: '통신판매사업자 신청', owner: '컨설팅팀', progress: 0, note: '프로젝트 추진 중간평가 이후 진행' },
  { step: 1, group: '사업 준비', name: '자본 Up 방안', owner: '—', progress: 0, note: '프로젝트 추진 중간평가 이후 진행' },
  { step: 1, group: '사업 준비', name: '관련 계약서 작성', owner: '컨설팅팀', progress: 50, note: '필요 계약서 종류 및 초안 작성 · 경쟁사 계약서 분석 · NHN notification 가입신청서(검토 완료) · 2차 수정본(전무님 검토 필요) · 이용약관 초안 · 개인정보처리방침 · 요금신고내역' },
  { step: 1, group: '커뮤니케이션', name: '그룹 텔레그램 개설', owner: O, start: '2026-05-08', end: '2026-05-08', progress: 100, note: '맑은메시지 TF' },
  { step: 1, group: '커뮤니케이션', name: '화면설계 - 피그마 or 실제 화면생성으로 통일', owner: '김경은', start: '2026-05-11', end: '2026-05-11', progress: 100, note: '피그마' },
  { step: 1, group: '커뮤니케이션', name: '문서 공유 폴더', owner: '김덕조', progress: 0, note: '프로젝트 폴더' },
  { step: 1, group: '서비스 메타', name: '서비스도메인 결정', owner: '김덕조', progress: 0 },
  { step: 1, group: '서비스 메타', name: '브랜딩 (맑은메시지 외 함께 아이데이션)', owner: '김덕조', progress: 0 },
  { step: 1, group: '서비스 메타', name: '마케팅 기획 (향후 마케팅 방안 — 기존 고객군 & 메시징 only 고객군)', owner: '안병훈', progress: 0 },
  { step: 1, group: '프로젝트 환경 셋팅', name: '커뮤니케이션 문서 폴더 운영', owner: '김덕조', start: '2026-05-08', end: '2026-05-08', progress: 100, note: '폴더 셋팅' },
  { step: 1, group: '프로젝트 환경 셋팅', name: '깃허브(맑은소프트), Cloudflare 셋팅', owner: O, progress: 0 },
  { step: 1, group: '프로젝트 환경 셋팅', name: '사용자단', owner: O, start: '2026-05-11', end: '2026-05-11', progress: 100, href: 'https://malgn-noti.pages.dev/' },
  { step: 1, group: '프로젝트 환경 셋팅', name: '관리자단', owner: O, start: '2026-05-11', end: '2026-05-11', progress: 100, href: 'https://malgn-noti-admin.pages.dev/' },
  { step: 1, group: '프로젝트 환경 셋팅', name: 'API 서버', owner: O, start: '2026-05-11', end: '2026-05-11', progress: 100, href: 'https://malgn-noti-api.malgnsoft.workers.dev/' },

  // ── Step 3 · 서비스 기획 (화면설계 or 설계) ─────────────
  { step: 3, group: 'Front', name: '프로토타입으로 대체', owner: '김덕조, 김경은', progress: 90, href: 'https://malgn-notifications.pages.dev/#/' },
  { step: 3, group: 'Front', name: '서비스 메뉴 콘텐츠', owner: '컨설팅팀, 김경은', progress: 0 },
  { step: 3, group: 'Front', name: '운영가이드', owner: '김덕조, 김경은', progress: 0 },
  { step: 3, group: 'BackOffice 1차', name: '공통, 로그인, 계정 관리', owner: '김경은', start: '2026-05-18', end: '2026-05-22', progress: 70 },
  { step: 3, group: 'BackOffice 1차', name: '회원/고객사 관리', owner: '김경은', start: '2026-05-18', end: '2026-05-22', progress: 70, note: '회원 발송 이력 관리, 고객사 결제 상세, 환불신청 제외' },
  { step: 3, group: 'BackOffice 1차', name: '시스템 관리', owner: '김경은', start: '2026-05-19', end: '2026-05-22', progress: 70, note: '운영자 계정 관리, 권한/역할 관리(RBAC), 감사 로그' },
  { step: 3, group: 'BackOffice 1차', name: '요금/단가 관리', owner: '김경은', start: '2026-05-23', end: '2026-05-29', progress: 70 },
  { step: 3, group: 'BackOffice 1차', name: '고객지원', owner: '김경은', start: '2026-05-23', end: '2026-05-29', progress: 70, note: '운영 가이드 관리 제외' },
  { step: 3, group: 'BackOffice 1차', name: '발송 운영 모니터링', owner: '김경은', start: '2026-06-02', end: '2026-06-12', progress: 0, note: '캠페인 제외, 회원/고객사 관리의 회원 발송 이력 관리 포함' },
  { step: 3, group: 'BackOffice 1차', name: '발신 정보 검수', owner: '김경은', start: '2026-06-02', end: '2026-06-12', progress: 0 },
  { step: 3, group: 'BackOffice 1차', name: '결제/크레딧 관리, 고객사 상세 결제 탭', owner: '김경은', start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 3, group: 'BackOffice 1차', name: '템플릿 검수/관리', owner: '김경은', start: '2026-06-16', end: '2026-06-24', progress: 0, note: '샘플 템플릿 관리, AI 템플릿 정책 관리 제외' },
  { step: 3, group: 'BackOffice 1차', name: '수신거부 (운영)', owner: '김경은', start: '2026-06-16', end: '2026-06-24', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: '통계/리포트', owner: '김경은', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: '대시보드', owner: '김경은', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: '템플릿 검수/관리 (AI 템플릿 정책 관리)', owner: '김경은', progress: 0, note: '샘플 템플릿 관리, AI 템플릿 정책 관리 제외 진행' },
  { step: 3, group: 'BackOffice 2차', name: '발송 운영 모니터링 (캠페인)', owner: '김경은', progress: 0, note: '캠페인 진행' },
  { step: 3, group: 'BackOffice 2차', name: '고객지원', owner: '김경은', progress: 0, note: '운영 가이드 관리 진행' },
  { step: 3, group: 'BackOffice 2차', name: '콘텐츠/사이트 관리', owner: '김경은', progress: 0, note: '시스템 설정, 점검 모드 관리, 외부 연동 설정 진행' },
  { step: 3, group: 'BackOffice 2차', name: '시스템 관리', owner: '김경은', progress: 0 },
  { step: 3, group: 'BackOffice 2차', name: 'API 관리', owner: '김경은', progress: 0 },

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
  // 관리자단 — 화면별
  { step: 5, group: '관리자 · 회원/고객사', name: '대시보드', owner: O, start: '2026-06-16', end: '2026-06-29', progress: 10 },
  { step: 5, group: '관리자 · 회원/고객사', name: '고객사 목록', owner: O, start: '2026-06-16', end: '2026-06-29', progress: 10 },
  { step: 5, group: '관리자 · 회원/고객사', name: '고객사 상세', owner: O, start: '2026-06-16', end: '2026-06-29', progress: 10 },
  { step: 5, group: '관리자 · 회원/고객사', name: '회원 · 계정 관리', owner: O, start: '2026-06-16', end: '2026-06-29', progress: 5 },
  { step: 5, group: '관리자 · 운영/모니터링', name: '발송 운영 모니터링', owner: O, start: '2026-06-23', end: '2026-07-02', progress: 0 },
  { step: 5, group: '관리자 · 운영/모니터링', name: '통계 · 리포트', owner: O, start: '2026-06-23', end: '2026-07-02', progress: 0 },
  { step: 5, group: '관리자 · 검수', name: '발신번호 검수', owner: O, start: '2026-06-20', end: '2026-06-30', progress: 0 },
  { step: 5, group: '관리자 · 검수', name: '발신 프로필 검수', owner: O, start: '2026-06-20', end: '2026-06-30', progress: 0 },
  { step: 5, group: '관리자 · 검수', name: '템플릿 검수', owner: O, start: '2026-06-20', end: '2026-06-30', progress: 0 },
  { step: 5, group: '관리자 · 과금/결제', name: '결제 관리', owner: O, start: '2026-06-23', end: '2026-07-01', progress: 0 },
  { step: 5, group: '관리자 · 과금/결제', name: '채널 단가', owner: O, start: '2026-06-23', end: '2026-07-01', progress: 0 },
  { step: 5, group: '관리자 · 과금/결제', name: '충전 쿠폰', owner: O, start: '2026-06-23', end: '2026-07-01', progress: 0 },
  { step: 5, group: '관리자 · 고객지원', name: '1:1 문의', owner: O, start: '2026-06-23', end: '2026-07-03', progress: 0 },
  { step: 5, group: '관리자 · 고객지원', name: 'FAQ', owner: O, start: '2026-06-23', end: '2026-07-03', progress: 0 },
  { step: 5, group: '관리자 · 고객지원', name: '공지', owner: O, start: '2026-06-23', end: '2026-07-03', progress: 0 },
  { step: 5, group: '관리자 · 시스템', name: '운영자 관리', owner: O, start: '2026-06-25', end: '2026-07-03', progress: 0 },
  { step: 5, group: '관리자 · 시스템', name: '권한 그룹', owner: O, start: '2026-06-25', end: '2026-07-03', progress: 0 },
  { step: 5, group: '관리자 · 시스템', name: 'API 관리', owner: O, start: '2026-06-25', end: '2026-07-03', progress: 0 },

  // 사용자단 — 화면별
  { step: 5, group: '사용자 · 인증/계정', name: '로그인', owner: O, start: '2026-05-26', end: '2026-06-26', progress: 70 },
  { step: 5, group: '사용자 · 인증/계정', name: '보안 인증 (OTP/이메일)', owner: O, start: '2026-05-26', end: '2026-06-26', progress: 70 },
  { step: 5, group: '사용자 · 인증/계정', name: '비밀번호 재설정', owner: O, start: '2026-05-26', end: '2026-06-26', progress: 60 },
  { step: 5, group: '사용자 · 인증/계정', name: '새 비밀번호 설정', owner: O, start: '2026-05-26', end: '2026-06-26', progress: 60 },
  { step: 5, group: '사용자 · 인증/계정', name: '회원가입 (5단계)', owner: O, start: '2026-05-26', end: '2026-06-26', progress: 90 },
  { step: 5, group: '사용자 · 인증/계정', name: '계정 설정', owner: O, start: '2026-05-26', end: '2026-06-26', progress: 70 },
  { step: 5, group: '사용자 · 발송', name: 'SMS / LMS / MMS', owner: O, start: '2026-06-02', end: '2026-06-15', progress: 0 },
  { step: 5, group: '사용자 · 발송', name: 'RCS', owner: O, start: '2026-06-02', end: '2026-06-15', progress: 0 },
  { step: 5, group: '사용자 · 발송', name: '알림톡 / 친구톡', owner: O, start: '2026-06-02', end: '2026-06-15', progress: 0 },
  { step: 5, group: '사용자 · 발송', name: 'Email', owner: O, start: '2026-06-02', end: '2026-06-15', progress: 0 },
  { step: 5, group: '사용자 · 발송', name: 'Push', owner: O, start: '2026-06-02', end: '2026-06-15', progress: 0 },
  { step: 5, group: '사용자 · 발송', name: '복합 (Flow)', owner: O, start: '2026-06-02', end: '2026-06-15', progress: 0 },
  { step: 5, group: '사용자 · 이력/통계', name: '이력 — SMS', owner: O, start: '2026-06-09', end: '2026-06-18', progress: 0 },
  { step: 5, group: '사용자 · 이력/통계', name: '이력 — RCS', owner: O, start: '2026-06-09', end: '2026-06-18', progress: 0 },
  { step: 5, group: '사용자 · 이력/통계', name: '이력 — 알림톡/친구톡', owner: O, start: '2026-06-09', end: '2026-06-18', progress: 0 },
  { step: 5, group: '사용자 · 이력/통계', name: '이력 — Email', owner: O, start: '2026-06-09', end: '2026-06-18', progress: 0 },
  { step: 5, group: '사용자 · 이력/통계', name: '이력 — Push', owner: O, start: '2026-06-09', end: '2026-06-18', progress: 0 },
  { step: 5, group: '사용자 · 이력/통계', name: '통계 대시보드', owner: O, start: '2026-06-09', end: '2026-06-18', progress: 0 },
  { step: 5, group: '사용자 · 주소록', name: '연락처', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 주소록', name: '그룹', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 주소록', name: '수신거부', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 발신정보', name: '발신번호 (SMS)', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 발신정보', name: 'RCS 브랜드', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 발신정보', name: '이메일 도메인 (DKIM)', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 발신정보', name: 'PUSH 인증서 (FCM·APNs)', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 발신정보', name: '카카오 발신 프로필', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 발신정보', name: '080 수신거부 번호', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 템플릿', name: '문자 (SMS) 템플릿', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 템플릿', name: 'RCS 템플릿', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 템플릿', name: '알림톡 템플릿', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 템플릿', name: 'Email 템플릿', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 템플릿', name: 'Push 템플릿', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 템플릿', name: '발송 상세 설정', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 크레딧/결제', name: '크레딧 충전', owner: O, start: '2026-06-16', end: '2026-06-27', progress: 0 },
  { step: 5, group: '사용자 · 크레딧/결제', name: '충전 결과', owner: O, start: '2026-06-16', end: '2026-06-27', progress: 0 },
  { step: 5, group: '사용자 · 크레딧/결제', name: '크레딧 내역 / 영수증', owner: O, start: '2026-06-16', end: '2026-06-27', progress: 0 },
  { step: 5, group: '사용자 · 크레딧/결제', name: '결제 카드 관리', owner: O, start: '2026-06-16', end: '2026-06-27', progress: 0 },
  { step: 5, group: '사용자 · 문의', name: '1:1 문의 작성', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 문의', name: '문의 완료', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 문의', name: '내 문의 내역', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 문의', name: '문의 상세', owner: O, start: '2026-06-09', end: '2026-06-19', progress: 0 },
  { step: 5, group: '사용자 · 시스템', name: '404', owner: O, start: '2026-06-09', end: '2026-06-11', progress: 0 },
  { step: 5, group: '사용자 · 시스템', name: '시스템 에러', owner: O, start: '2026-06-09', end: '2026-06-11', progress: 0 },
  { step: 5, group: '사용자 · 시스템', name: '네트워크 에러', owner: O, start: '2026-06-09', end: '2026-06-11', progress: 0 },
  { step: 5, group: '사용자 · 시스템', name: '점검 (긴급)', owner: O, start: '2026-06-09', end: '2026-06-11', progress: 0 },
  { step: 5, group: '사용자 · 시스템', name: '점검 (정기)', owner: O, start: '2026-06-09', end: '2026-06-11', progress: 0 },
  { step: 5, group: '사용자 · 시스템', name: '인증 메일 템플릿', owner: O, start: '2026-06-09', end: '2026-06-11', progress: 0 },
]
