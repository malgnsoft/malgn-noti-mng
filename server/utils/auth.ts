import type { H3Event } from 'h3'

// 회원 인증 유틸 — 비밀번호 해시(PBKDF2)와 세션 쿠키(HMAC 서명).
// Web Crypto(subtle)만 사용 → Cloudflare Workers·Node 양쪽에서 동작.

// Cloudflare Pages Functions CPU 한도 내에서 동작하도록 100,000회로 설정.
// verifyPassword 는 저장된 해시의 iter 로 검증하므로 하위호환 문제 없음.
const PBKDF2_ITER = 100_000
const SESSION_COOKIE = 'mng_session'
const SESSION_TTL_SEC = 60 * 60 * 24 * 7 // 7일

const enc = new TextEncoder()

function toB64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ''
  for (const b of arr) bin += String.fromCharCode(b)
  return btoa(bin)
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// 상수시간 비교 (타이밍 공격 완화)
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// ─── 비밀번호 ──────────────────────────────────────────────
// 저장 포맷: `pbkdf2$<iter>$<saltB64>$<hashB64>`
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(password, salt, PBKDF2_ITER)
  return `pbkdf2$${PBKDF2_ITER}$${toB64(salt)}$${toB64(hash)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
  const iter = Number(parts[1])
  const saltB64 = parts[2]
  const expected = parts[3]
  if (!saltB64 || !expected) return false
  const salt = fromB64(saltB64)
  const hash = await pbkdf2(password, salt, iter)
  return timingSafeEqual(toB64(hash), expected)
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    256,
  )
}

// ─── 세션 (HMAC 서명 쿠키) ─────────────────────────────────
// 토큰 포맷: `<memberId>.<expSec>.<sigB64url>`
function getSecret(event: H3Event): string {
  const cfEnv = event.context.cloudflare?.env as { NUXT_SESSION_SECRET?: string } | undefined
  const s = cfEnv?.NUXT_SESSION_SECRET || process.env.NUXT_SESSION_SECRET
  if (s) return s
  // 프로덕션에서 시크릿 미설정 → 알려진 폴백으로 서명하면 세션 위조가 가능하므로 하드 실패.
  if (!import.meta.dev) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_SESSION_SECRET 가 설정되지 않았습니다' })
  }
  return 'dev-insecure-session-secret-change-me'
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return toB64(sig).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function setSession(event: H3Event, memberId: number): Promise<void> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC
  const payload = `${memberId}.${exp}`
  const sig = await sign(payload, getSecret(event))
  setCookie(event, SESSION_COOKIE, `${payload}.${sig}`, {
    httpOnly: true,
    secure: !import.meta.dev, // 프로덕션(https)만 secure. dev(http)는 쿠키 미저장 방지.
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SEC,
  })
}

export function clearAuthSession(event: H3Event): void {
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

// 유효한 세션이면 memberId, 아니면 null
export async function getSessionMemberId(event: H3Event): Promise<number | null> {
  const raw = getCookie(event, SESSION_COOKIE)
  if (!raw) return null
  const idx = raw.lastIndexOf('.')
  if (idx < 0) return null
  const payload = raw.slice(0, idx)
  const sig = raw.slice(idx + 1)
  const expected = await sign(payload, getSecret(event))
  if (!timingSafeEqual(sig, expected)) return null
  const [idStr, expStr] = payload.split('.')
  const exp = Number(expStr)
  if (!exp || exp < Math.floor(Date.now() / 1000)) return null
  const id = Number(idStr)
  return Number.isInteger(id) && id > 0 ? id : null
}

// ─── 맑은오피스 연동 ───────────────────────────────────────
// 맑은오피스와 공유하는 시크릿. 서버 간 푸시(upsert)·SSO 토큰 양쪽에 사용.
// ⚠️ 실제 연동 규약(서명 방식·필드 매핑)은 맑은오피스 스펙 확정 후 조정 필요.
function getOfficeSecret(event: H3Event): string {
  const cfEnv = event.context.cloudflare?.env as { OFFICE_SHARED_SECRET?: string } | undefined
  const s = cfEnv?.OFFICE_SHARED_SECRET || process.env.OFFICE_SHARED_SECRET
  if (s) return s
  if (!import.meta.dev) {
    throw createError({ statusCode: 500, statusMessage: 'OFFICE_SHARED_SECRET 가 설정되지 않았습니다' })
  }
  return 'dev-insecure-office-secret-change-me'
}

// 안전한 내부 리다이렉트 경로만 허용 — 오픈 리다이렉트(`//evil.com`, `/\evil.com`) 차단.
export function safeRedirectPath(raw: unknown, fallback = '/'): string {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return fallback
  if (raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  return raw
}

// 서버 간 프로비저닝 요청 인증 — `x-office-secret` 헤더를 공유 시크릿과 상수시간 비교.
export function verifyOfficeSecret(event: H3Event): boolean {
  const provided = getHeader(event, 'x-office-secret') ?? ''
  return provided.length > 0 && timingSafeEqual(provided, getOfficeSecret(event))
}

export interface OfficeTokenPayload {
  officeId: string
  loginId: string
  name: string
  company?: string
  role?: string
  email?: string
  phone?: string
  exp: number
}

// SSO 핸드오프 토큰 검증 — 포맷 `<payloadB64url>.<sigB64url>` (payload=JSON, HMAC-SHA256).
// 가입 없이 사이트 진입: 맑은오피스가 이 토큰으로 리다이렉트 → 검증 후 회원 upsert + 세션 발급.
export async function verifyOfficeToken(event: H3Event, token: string): Promise<OfficeTokenPayload | null> {
  const idx = token.lastIndexOf('.')
  if (idx < 0) return null
  const payloadB64 = token.slice(0, idx)
  const sig = token.slice(idx + 1)
  const expected = await sign(payloadB64, getOfficeSecret(event))
  if (!timingSafeEqual(sig, expected)) return null
  let payload: OfficeTokenPayload
  try {
    const json = new TextDecoder().decode(fromB64(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    payload = JSON.parse(json)
  }
  catch {
    return null
  }
  if (!payload.officeId || !payload.loginId) return null
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}
