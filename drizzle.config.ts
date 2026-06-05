import { defineConfig } from 'drizzle-kit'

// 현황판 D1 스키마 → 마이그레이션 생성.
//   pnpm db:generate  → server/db/migrations/*.sql 생성
//   적용(원격): wrangler d1 migrations apply malgn-noti-project --remote
export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
})
