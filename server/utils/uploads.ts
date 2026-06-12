import type { H3Event } from 'h3'

// 이슈 첨부 이미지 저장소 — 프로덕션 R2(FILES 바인딩), dev(바인딩 없음)는 인메모리 폴백.
// dev 인메모리는 `pnpm dev` 프로세스가 살아있는 동안만 유지(재시작 시 초기화).
// 키는 UUID 기반 단일 세그먼트(`<uuid>.<ext>`) → 서빙 라우트 `/api/uploads/[key]` 와 1:1.

export interface StoredFile {
  body: ArrayBuffer
  contentType: string
}

export interface FileStore {
  put(key: string, body: ArrayBuffer, contentType: string): Promise<void>
  get(key: string): Promise<StoredFile | null>
}

interface R2Like {
  put(key: string, value: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
  get(key: string): Promise<{
    arrayBuffer(): Promise<ArrayBuffer>
    httpMetadata?: { contentType?: string }
  } | null>
}

// ─── dev 인메모리 폴백 ─────────────────────────────────────
const memFiles = new Map<string, StoredFile>()

const memStore: FileStore = {
  put: (key, body, contentType) => {
    memFiles.set(key, { body, contentType })
    return Promise.resolve()
  },
  get: key => Promise.resolve(memFiles.get(key) ?? null),
}

export function useFileStore(event: H3Event): FileStore {
  const env = event.context.cloudflare?.env as { FILES?: R2Like } | undefined
  const r2 = env?.FILES
  if (!r2) return memStore

  return {
    put: async (key, body, contentType) => {
      await r2.put(key, body, { httpMetadata: { contentType } })
    },
    get: async (key) => {
      const obj = await r2.get(key)
      if (!obj) return null
      return {
        body: await obj.arrayBuffer(),
        contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
      }
    },
  }
}

// 허용 이미지 MIME → 확장자. 화이트리스트 외에는 업로드 거부(스크립트/SVG 차단).
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // 5MB
