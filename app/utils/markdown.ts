// 경량 마크다운 → HTML 렌더러 (외부 의존 없음).
// 이슈 본문(§5.7)은 D1 데이터이므로 @nuxt/content 런타임 쿼리를 쓰지 않고 여기서 렌더한다.
// 출력은 `.doc-prose`(prose.css) 안에 v-html 로 주입 → 문서 뷰어와 동일 스타일.
//
// ⚠️ 보안: 원문을 먼저 HTML 이스케이프한 뒤 서식만 입힌다(저장은 마크다운 원문).
//   링크는 http/https/mailto/내부경로만 허용(javascript: 등 차단).

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeHref(url: string): string | null {
  const u = url.trim()
  if (/^https?:\/\//i.test(u) || /^mailto:/i.test(u) || u.startsWith('/') || u.startsWith('#')) {
    return u
  }
  return null
}

// 인라인 코드 외 서식(링크·굵게·기울임)을 입력(이미 이스케이프됨)에 적용.
function formatSpans(text: string): string {
  let out = text
  // 이미지 `![alt](url)` — 반드시 링크보다 먼저 처리(앞의 `!` 를 소비). src 는 safeHref 로 제한.
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt, url) => {
    const src = safeHref(url)
    if (!src) return ''
    return `<img src="${src}" alt="${alt}" loading="lazy">`
  })
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, url) => {
    const href = safeHref(url)
    if (!href) return label
    const ext = /^https?:/i.test(href)
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`
  })
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_])_([^_\s][^_]*?)_/g, '$1<em>$2</em>')
  return out
}

// 인라인 렌더 — 코드 스팬(`code`)을 먼저 분리해 내부 서식을 무력화한 뒤 나머지에 서식 적용.
function renderInline(text: string): string {
  return text
    .split(/(`[^`]+`)/g)
    .map((part) => {
      if (part.length >= 2 && part.startsWith('`') && part.endsWith('`')) {
        return `<code>${part.slice(1, -1)}</code>`
      }
      return formatSpans(part)
    })
    .join('')
}

export function renderMarkdown(src: string): string {
  const lines = escapeHtml(src ?? '').replace(/\r\n?/g, '\n').split('\n')
  const html: string[] = []
  let i = 0
  let para: string[] = []
  let list: { type: 'ul' | 'ol', items: string[] } | null = null

  const flushPara = () => {
    if (para.length) {
      html.push(`<p>${renderInline(para.join(' ')).trim()}</p>`)
      para = []
    }
  }
  const flushList = () => {
    if (list) {
      const items = list.items.map(it => `<li>${renderInline(it)}</li>`).join('')
      html.push(`<${list.type}>${items}</${list.type}>`)
      list = null
    }
  }
  const flushAll = () => {
    flushPara()
    flushList()
  }

  while (i < lines.length) {
    const line = lines[i] ?? ''

    // 펜스 코드 블록
    if (/^```/.test(line)) {
      flushAll()
      i++
      const buf: string[] = []
      while (i < lines.length && !/^```/.test(lines[i] ?? '')) {
        buf.push(lines[i] ?? '')
        i++
      }
      i++ // 닫는 펜스
      html.push(`<pre><code>${buf.join('\n')}</code></pre>`)
      continue
    }

    // 빈 줄 → 단락/리스트 종료
    if (/^\s*$/.test(line)) {
      flushAll()
      i++
      continue
    }

    // 수평선
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushAll()
      html.push('<hr>')
      i++
      continue
    }

    // 제목
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (h) {
      flushAll()
      const level = (h[1] ?? '').length
      html.push(`<h${level}>${renderInline((h[2] ?? '').trim())}</h${level}>`)
      i++
      continue
    }

    // 인용
    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      flushAll()
      const buf: string[] = [quote[1] ?? '']
      i++
      while (i < lines.length && /^>\s?(.*)$/.test(lines[i] ?? '')) {
        buf.push((lines[i] ?? '').replace(/^>\s?/, ''))
        i++
      }
      html.push(`<blockquote>${renderInline(buf.join(' '))}</blockquote>`)
      continue
    }

    // 순서 없는 목록
    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    if (ul) {
      flushPara()
      if (!list || list.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      list.items.push(ul[1] ?? '')
      i++
      continue
    }

    // 순서 있는 목록
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      flushPara()
      if (!list || list.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(ol[1] ?? '')
      i++
      continue
    }

    // 일반 단락 라인
    flushList()
    para.push(line.trim())
    i++
  }

  flushAll()
  return html.join('\n')
}
