// doc/ 콘텐츠 조회 공용 훅.
// 단일 'docs' 컬렉션을 한 번 읽어 일반 문서 / history 로 나눠 제공한다.

export interface DocItem {
  path: string
  title?: string
  description?: string
}

const HISTORY_PREFIX = '/history'

/** 모든 콘텐츠(문서 + history) — 서버 API 경유(클라 네비 시 빈 결과 방지). */
export function useAllDocs() {
  return useFetch<DocItem[]>('/api/docs', { key: 'docs:all' })
}

/** history 항목 여부 (path 가 /history/ 로 시작) */
export function isHistory(path: string) {
  return path.startsWith(HISTORY_PREFIX + '/') || path === HISTORY_PREFIX
}

/** history 파일명에서 yyyyMMdd 추출 (history.20260604 → 20260604) */
export function historyDate(path: string): string | null {
  const m = path.match(/(\d{8})/)
  return m ? m[1] ?? null : null
}

/** yyyyMMdd → yyyy.MM.dd */
export function formatYmd(ymd: string | null): string {
  if (!ymd || ymd.length !== 8) return ''
  return `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}`
}
