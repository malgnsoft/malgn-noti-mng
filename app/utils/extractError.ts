// $fetch 에러에서 서버가 보낸 statusMessage(한국어)를 뽑아낸다.
export function extractError(e: unknown, fallback = '요청을 처리하지 못했습니다'): string {
  if (e && typeof e === 'object') {
    const err = e as { statusMessage?: string, data?: { statusMessage?: string, message?: string }, message?: string }
    return (
      err.data?.statusMessage
      || err.data?.message
      || err.statusMessage
      || err.message
      || fallback
    )
  }
  return fallback
}
