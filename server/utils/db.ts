import { drizzle } from 'drizzle-orm/d1'
import type { H3Event } from 'h3'
import * as schema from '../db/schema'

// D1(malgn-noti-project) 직접 연결 — Drizzle ORM. Pages Function 런타임에서만 바인딩 존재.
// 로컬 dev(바인딩 없음)에서는 null → 호출부가 시드로 폴백.
type D1Client = Parameters<typeof drizzle>[0]

export function useDb(event: H3Event) {
  const env = event.context.cloudflare?.env as { DB?: unknown } | undefined
  const d1 = env?.DB
  return d1 ? drizzle(d1 as D1Client, { schema }) : null
}
