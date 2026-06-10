import { defineContentConfig, defineCollection } from '@nuxt/content'
import { fileURLToPath } from 'node:url'

// 콘텐츠 소스는 이 레포의 docs/ 트리 전체(일반 문서 + history).
// 단일 컬렉션으로 두고, history 타임라인은 path 프리픽스(/history/...)로 필터한다.
const docCwd = fileURLToPath(new URL('./docs', import.meta.url))

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: {
        cwd: docCwd,
        include: '**/*.md'
      }
    })
  }
})
