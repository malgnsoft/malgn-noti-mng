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

  css: ['~/assets/css/main.css'],

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
