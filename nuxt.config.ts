import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// doc/ 트리를 재귀 순회해 모든 문서 라우트를 "정규 소문자"로 열거한다.
//  - Cloudflare 는 대소문자를 구분하므로, 앱 링크(소문자 /docs/design)와
//    프리렌더 산출 경로가 반드시 일치해야 한다.
//  - 크롤링(crawlLinks)을 끄면 마크다운 문서 안의 상대 링크(./FRONTEND.md →
//    /docs/FRONTEND)가 대문자 디렉터리를 만드는 문제도 사라진다.
//  - 파일명 점(history.20260604)으로 크롤러가 라우트를 건너뛰는 문제도 회피.
const docDir = fileURLToPath(new URL('./doc', import.meta.url))

function collectDocRoutes(dir: string, base = ''): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      out.push(...collectDocRoutes(join(dir, entry.name), `${base}${entry.name}/`))
    } else if (entry.name.endsWith('.md')) {
      const slug = (base + entry.name.replace(/\.md$/, '')).toLowerCase()
      out.push(`/docs/${slug}`)
    }
  }
  return out
}

// '/' 와 '/board' 는 런타임에 D1(/api/board)을 조회하므로 프리렌더하지 않고 SSR(Functions).
const prerenderRoutes = ['/docs', '/history', ...collectDocRoutes(docDir)]

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  // malgn-noti와 동일 스택: Nuxt UI v3 (Reka UI + Tailwind v4).
  // @nuxt/content 는 doc/ 마크다운(문서·작업 이력) 렌더링용.
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/eslint',
    '@pinia/nuxt'
  ],

  css: ['~/assets/css/main.css', '~/assets/css/prose.css'],

  // Cloudflare Pages (Functions/SSR) — /api/board 가 D1 바인딩(DB)을 런타임 조회.
  // 문서·이력 페이지는 프리렌더, '/'·'/board' 는 SSR.
  nitro: {
    preset: 'cloudflare-pages',
    prerender: {
      crawlLinks: false,
      failOnError: false,
      routes: prerenderRoutes
    }
  },

  // 콘텐츠 소스(doc/) → content.config.ts 의 collections 에서 매핑.
  content: {
    build: {
      markdown: {
        toc: { depth: 3, searchDepth: 3 }
      }
    }
  },

  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      title: '맑은노티 관리',
      titleTemplate: '%s · 맑은노티 관리',
      meta: [
        { name: 'description', content: '맑은노티(맑은 메시징) 프로젝트 문서·작업 이력 관리' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        // malgn-noti 와 동일한 Relay-inspired 폰트 (design_handoff 정본)
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif&display=swap'
        },
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css'
        }
      ]
    }
  },

  typescript: {
    strict: true,
    typeCheck: false
  },

  vite: {
    server: {
      hmr: { overlay: true }
    }
  }
})
