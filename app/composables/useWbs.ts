// malgn-noti-api 공개 WBS 엔드포인트(GET /wbs) 조회 + 파생 통계.
// 현황판(/board)과 대시보드(/)가 공유. read-only (편집은 malgn-noti /wbs 에서).

export type WbsStatus = 'done' | 'in_progress' | 'pending' | 'blocked'

export interface WbsTask {
  id: string
  group?: string
  title: string
  status: WbsStatus
  owner: string
  note?: string
  targetDate?: string
  completionDate?: string
  href?: string
}

export interface WbsStage {
  id: string
  no: string
  emoji: string
  name: string
  summary: string
  weight: number
  progress: number
  tasks: WbsTask[]
}

export interface WbsDocument {
  projectName: string
  lastUpdated: string
  stages: WbsStage[]
}

export const wbsStatusMeta: Record<WbsStatus, { label: string, dot: string, chip: string }> = {
  done: { label: '완료', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_progress: { label: '진행 중', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending: { label: '대기', dot: 'bg-neutral-300', chip: 'bg-neutral-50 text-neutral-600 border-neutral-200' },
  blocked: { label: '보류', dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
}

export function wbsProgressFill(pct: number) {
  if (pct >= 70) return 'bg-emerald-500'
  if (pct >= 30) return 'bg-amber-500'
  if (pct > 0) return 'bg-neutral-400'
  return 'bg-neutral-200'
}

/* 정본 저장 포맷: `YYYY.MM.DD`. 레거시(`5/8`)는 2026 기준 표시 변환만. */
export function wbsFormatYmd(raw?: string): string {
  if (!raw) return ''
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(raw)) return raw
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.replace(/-/g, '.')
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})$/)
  if (m) return `2026.${m[1]!.padStart(2, '0')}.${m[2]!.padStart(2, '0')}`
  return raw
}

export function wbsGroupedTasks(stage: WbsStage) {
  const groups: { name: string, tasks: WbsTask[] }[] = []
  for (const t of stage.tasks) {
    const name = t.group ?? ''
    let g = groups.find(x => x.name === name)
    if (!g) { g = { name, tasks: [] }; groups.push(g) }
    g.tasks.push(t)
  }
  return groups
}

/* ── Step 5 단순화 ───────────────────────────────────────────────────────────
 * 현황판 Step 5의 아래 영역을 큰 카테고리로 묶어 표시한다(라이브 데이터는 그대로,
 * 표시 단계에서만 변환). 대상: API 서버 + API 엔드포인트 → "API 백엔드", 사용자단 ↔
 * API 연동, 관리자단 화면. 나머지 그룹(설계·준비 / 사용자단 화면 UI 목업 / 통합·배포)은
 * 라이브 원본 유지. 카테고리 상태는 doc/BOARD.md 정의와 일치.
 */
const O = '김도형'
const API_BACKEND: WbsTask[] = [
  { id: '5-2-A1', group: 'API 백엔드', title: '기반 인프라', status: 'done', owner: O, note: 'Workers+Hyperdrive · DB 49테이블·파티션 · 기초 CRUD 14도메인 · OpenAPI/Scalar' },
  { id: '5-2-A2', group: 'API 백엔드', title: '인증·계정·문서', status: 'done', owner: O, note: 'signup/login/JWT/PBKDF2 · NICE 통합인증 · 계약·서류 R2 · WBS R2 · 이메일 변경' },
  { id: '5-2-A3', group: 'API 백엔드', title: '발송 엔진', status: 'in_progress', owner: O, note: 'producer 5채널 · 멱등성 · NHN 어댑터 · Queues+Consumer · NHN Hub OAuth · Webhook · 실모드 전환' },
  { id: '5-2-A4', group: 'API 백엔드', title: '발송 확장', status: 'in_progress', owner: O, note: 'Export 다운로드 잡 · Flow 복합발송 · 캠페인(스케줄·시뮬·테스트)' },
  { id: '5-2-A5', group: 'API 백엔드', title: '결제·크레딧', status: 'pending', owner: O, note: 'PG 어댑터 + 카드 등록·결제·취소' },
  { id: '5-2-A6', group: 'API 백엔드', title: 'AI 템플릿', status: 'pending', owner: O, note: 'LLM 게이트웨이' },
]
const USER_API: WbsTask[] = [
  { id: '5-3C-A1', group: '사용자단 ↔ API 연동', title: '인증·계정', status: 'in_progress', owner: O, note: '로그인·가입·/me·OTP·login-by-email·PATCH /me 완료 / 로그아웃·비번재설정·약관·companyType·비번변경·2FA·멀티계정 잔여' },
  { id: '5-3C-A2', group: '사용자단 ↔ API 연동', title: '계약·승인', status: 'done', owner: O, note: '승인 게이트 · 계약·R2 업로드 · reviewing 자동전이·배지 · 계약서 서명 · 담당자 이메일 변경' },
  { id: '5-3C-A3', group: '사용자단 ↔ API 연동', title: '발송·이력·통계', status: 'pending', owner: O, note: '발송 6채널 실 API(Idempotency-Key) · 이력/통계 라우트 연동' },
  { id: '5-3C-A4', group: '사용자단 ↔ API 연동', title: '데이터 관리', status: 'pending', owner: O, note: '주소록·발신정보·템플릿 CRUD 연동' },
  { id: '5-3C-A5', group: '사용자단 ↔ API 연동', title: '크레딧·결제', status: 'pending', owner: O, note: 'PG 연동 — 블로커(PG 어댑터 미정)' },
  { id: '5-3C-A6', group: '사용자단 ↔ API 연동', title: '문의', status: 'pending', owner: O, note: '/inquiries 연동' },
]
const ADMIN_SCREEN: WbsTask[] = [
  { id: '5-4-A1', group: '관리자단 화면', title: '기반·셸·핸드오프', status: 'done', owner: O, note: '셸 LNB 8그룹+TopBar+디자인가이드 · 기획 MD 33종 · 핸드오프 17페이지 · 진척 라벨 · 로고/브랜드' },
  { id: '5-4-A2', group: '관리자단 화면', title: '회원·고객사', status: 'pending', owner: O, note: '회원·고객사 관리 + 상세' },
  { id: '5-4-A3', group: '관리자단 화면', title: '운영·검수', status: 'pending', owner: O, note: '발송 모니터링 · 발신정보 검수 · 템플릿 검수 · 수신거부 운영' },
  { id: '5-4-A4', group: '관리자단 화면', title: '요금·결제', status: 'pending', owner: O, note: '요금·단가 관리 · 결제·크레딧 + 고객사 결제 탭' },
  { id: '5-4-A5', group: '관리자단 화면', title: '고객지원', status: 'pending', owner: O, note: '1:1 문의·FAQ·공지' },
  { id: '5-4-A6', group: '관리자단 화면', title: '시스템·통계', status: 'pending', owner: O, note: '운영자·RBAC·감사로그 · 통계·리포트·대시보드 · 콘텐츠·사이트·API 관리' },
]

// 라이브 Step 5 그룹 중 유지할 그룹은 원본 순서대로, 대상 3영역은 카테고리로 치환.
function consolidateStep5(tasks: WbsTask[]): WbsTask[] {
  const byGroup: Record<string, WbsTask[]> = {}
  for (const t of tasks) (byGroup[t.group ?? ''] ||= []).push(t)
  return [
    ...(byGroup['설계 및 준비'] ?? []),
    ...API_BACKEND,
    ...(byGroup['사용자단 화면 UI (목업)'] ?? []),
    ...USER_API,
    ...ADMIN_SCREEN,
    ...(byGroup['통합 · 배포'] ?? []),
  ]
}

export function useWbs() {
  const config = useRuntimeConfig()

  const { data, pending, error, refresh } = useFetch<{ data: WbsDocument }>('/wbs', {
    baseURL: config.public.apiBaseUrl,
    key: 'wbs',
  })

  const doc = computed<WbsDocument | null>(() => data.value?.data ?? null)
  const stages = computed<WbsStage[]>(() =>
    (doc.value?.stages ?? []).map(s =>
      s.id === 'step-5' ? { ...s, tasks: consolidateStep5(s.tasks) } : s,
    ),
  )
  const projectName = computed(() => doc.value?.projectName ?? '맑은 메시징')
  const lastUpdated = computed(() => doc.value?.lastUpdated ?? '—')

  const allTasks = computed(() => stages.value.flatMap(s => s.tasks))

  const totalCounts = computed(() => {
    const acc: Record<WbsStatus, number> = { done: 0, in_progress: 0, pending: 0, blocked: 0 }
    for (const t of allTasks.value) acc[t.status]++
    return acc
  })

  const weightedAverage = computed(() => {
    const s = stages.value
    if (s.length === 0) return 0
    const totalWeight = s.reduce((a, x) => a + x.weight, 0)
    const numerator = s.reduce((a, x) => a + x.weight * x.progress, 0)
    return Math.round((numerator / totalWeight) * 10) / 10
  })

  return {
    doc,
    stages,
    projectName,
    lastUpdated,
    allTasks,
    totalCounts,
    weightedAverage,
    pending,
    error,
    refresh,
  }
}
