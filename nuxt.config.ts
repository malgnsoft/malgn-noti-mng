export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  // malgn-noti와 동일 스택: Nuxt UI v3 (Reka UI + Tailwind v4).
  // @nuxt/content 는 docs/ 마크다운(문서·작업 이력) 렌더링용.
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/eslint',
    '@pinia/nuxt'
  ],

  css: ['~/assets/css/main.css', '~/assets/css/prose.css'],

  // Cloudflare Pages (Functions/SSR). 모든 라우트를 SSR(Functions)로 처리한다.
  // ⚠️ 인증 게이트(Task #2): 프리렌더를 끈다. 프리렌더 정적 HTML 은 워커를
  //    거치지 않아 세션 게이트를 우회해 비로그인자에게 노출되므로, 문서·이력·WBS
  //    페이지도 매 요청 SSR 하여 전역 미들웨어가 작동하게 한다.
  //    @nuxt/content 는 D1(_content_docs)에서 런타임 조회되므로 SSR 가능.
  nitro: {
    preset: 'cloudflare-pages',
    prerender: {
      crawlLinks: false,
      failOnError: false,
      routes: [],
      // ⚠️ 문서 덤프 인증 게이트(Task #8): @nuxt/content 는 sql_dump 를 prerender:true 로
      //   강제해 정적 파일로 떨궈 _routes.json exclude(워커 우회)에 올린다 → 비로그인 노출.
      //   prerender 를 막으면 등록된 서버 핸들러가 런타임(워커)에서 서빙 → 아래 서버
      //   미들웨어(server/middleware/auth.ts)가 세션 검사 가능. 콘텐츠는 깨지지 않음
      //   (로그인 사용자의 내부 시드 fetch 는 쿠키가 전달돼 통과).
      ignore: ['/__nuxt_content']
    }
  },

  // ⚠️ 문서 덤프 인증 게이트(Task #8) — 2경로 차단:
  //  1) `/__nuxt_content/**`(런타임 핸들러가 서빙) → server/middleware/auth.ts 가 세션 401 로 가드.
  //     내부 시드 fetch(event.$fetch)는 로그인 쿠키가 전달돼 통과하므로 /docs 가 안 깨진다.
  //  2) `/dump.docs.sql`(루트 정적 사본 = 문서 전체 덤프) → 이 경로는 실제 디스크 파일이라
  //     워커가 미들웨어 이전에 정적 에셋으로 단락 처리(isPublicAssetURL) → 미들웨어로 못 막는다.
  //     따라서 _redirects(엣지)로 비로그인 노출을 차단한다. 콘텐츠 런타임은 D1(_content_docs)을
  //     직접 조회하고, 덤프는 **체크섬 불일치 시에만**(문서 내용 변경 후) 시드용으로 읽으므로,
  //     D1 이 시드돼 있는 정상 운영 중에는 이 경로가 호출되지 않아 차단해도 /docs 가 정상이다.
  //     ⚠️ 단, docs/ 내용이 바뀐 배포에서는 원격 콘텐츠 D1 재시드가 선행돼야 한다(아래 §운영 메모).
  routeRules: {
    '/dump.docs.sql': { redirect: { to: '/login', statusCode: 302 } }
  },

  // 콘텐츠 소스(docs/) → content.config.ts 의 collections 에서 매핑.
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
