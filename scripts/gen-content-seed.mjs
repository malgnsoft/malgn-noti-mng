// 콘텐츠 D1 시드 SQL 생성 (Task #8 운영 보조).
//
// 배경: 문서 덤프 인증 게이트(#8)는 `/dump.docs.sql`(문서 전체 덤프)을 _redirects 로 차단한다.
//   @nuxt/content 런타임은 D1(_content_docs)을 직접 조회하고, 이 덤프는 **체크섬 불일치 시에만**
//   (= docs/ 내용이 바뀐 배포 직후) D1 재시드용으로 읽는다. 차단돼 있으면 그 재시드가 실패해
//   /docs 가 빈다. 따라서 **docs/ 내용이 바뀐 배포에서는 원격 콘텐츠 D1 을 미리 시드**해야 한다.
//
// 사용:
//   1) pnpm build            # dist/dump.docs.sql 생성
//   2) pnpm content:seed:gen # 이 스크립트 → dist/content-seed.sql (압축 덤프 복원)
//   3) wrangler d1 execute malgn-noti-project --remote --file=dist/content-seed.sql
//      → 원격 D1 의 _content_docs/_content_info 를 현재 빌드 체크섬으로 갱신 → 런타임이 덤프를
//        요청하지 않음 → 차단해도 /docs 정상.
//   (docs/ 내용이 그대로면 체크섬이 동일하므로 이 단계는 생략 가능.)
import { readFile, writeFile } from 'node:fs/promises'
import zlib from 'node:zlib'

const IN = 'dist/dump.docs.sql'
const OUT = 'dist/content-seed.sql'

const b64 = (await readFile(IN, 'utf8')).trim()
const json = zlib.gunzipSync(Buffer.from(b64, 'base64')).toString('utf8')
const arr = JSON.parse(json)

// 각 항목은 `<SQL문> -- <hash>` 형식. 마지막 ` -- ` 이후(해시 주석)를 떼고 세미콜론으로 연결.
const stmts = arr
  .map((s) => {
    const i = s.lastIndexOf(' -- ')
    // 각 문은 이미 `;` 로 끝나므로 후행 세미콜론을 떼고 join 에서 단일 `;` 로 다시 붙인다
    // (안 떼면 `;;` 빈 statement 가 생겨 wrangler d1 execute 가 "SQL code did not contain a statement" 로 실패).
    return (i >= 0 ? s.slice(0, i) : s).trim().replace(/;+\s*$/, '')
  })
  .filter(Boolean)

await writeFile(OUT, stmts.join(';\n') + ';\n')
console.log(`[gen-content-seed] ${stmts.length} statements → ${OUT}`)
