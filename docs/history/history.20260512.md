# 2026-05-12 — 시안 정밀 매칭 + 문서화

## 한 줄 요약

콘텐츠 폭 1200px 통일, GNB를 utility bar + main 2단으로 분리, 메뉴 8개로 정돈했고 디자인·기술 문서 3종을 `doc/`에 추가했다.

---

## 1. 콘텐츠 폭 1200px 통일

스크린샷 검수에서 시안 톤보다 본문이 약간 넓다는 결정.

| 영역 | 이전 | 이후 |
| --- | ---: | ---: |
| 본문 (`.app-container`) | 1320px | **1200px** |
| 푸터 (`.footer-container`) | 1600px / pad 60 | **1200px / pad 24** |
| GNB (`.gnb-inner`) | 화면 폭 | **1200px** (max-width 추가) |

CSS 변수 한 줄(`--content-max: 1200px`)로 일괄 적용. `doc/FRONTEND.md §3.4`도 갱신.

## 2. GNB 메뉴 시안 정합

이전 추정 메뉴를 시안 스크린샷의 실제 9개로 교체:

**서비스 ▾ · 메시지 발송 ▾ · 발송 조회/통계 ▾ · 주소록 ▾ · 발신 정보 ▾ · 메시지관리 ▾ · 캠페인 관리1 · 캠페인 관리2 · 운영가이드**

- 발송과 발송 조회/통계를 별도 메뉴로 분리
- 캠페인 관리 변형 2개를 별도 메뉴로 노출
- 메뉴 자식 라벨도 시안 정본의 카테고리 표현으로 정돈

## 3. GNB 메뉴 8개로 통합

스크린샷에서 캠페인 관리1/2를 따로 두기보단 단일 "캠페인 관리"로 통합 결정. `/campaign3`은 변형 디자인 검토용으로 라우트만 유지하고 메뉴에서 제외.

## 4. Utility Bar 분리 (헤더 2단 구조)

GNB가 메뉴 9개 + 우측 액션으로 한 줄에 답답한 문제를 분리로 해결.

```
┌───────────────────────────────────────────────────────────┐
│  Utility Bar (h 32, bg gray-50)                           │
│                          문의  충전  관 관리자 ▾           │
├───────────────────────────────────────────────────────────┤
│  Main GNB (h 64, bg white)                                │
│   로고     서비스 ▾  메시지 발송 ▾  ...   운영가이드        │
└───────────────────────────────────────────────────────────┘
```

- `.gnb-wrapper`(sticky) 안에 `.gnb-utility` + `.gnb`(main) 2단
- 두 줄 모두 sticky → 사용자 메뉴 상시 접근
- `< 1024px`에서 utility bar 숨김, 햄버거 슬라이드 메뉴에서 액션 접근

## 5. 헤더 사이즈 미세 조정

- Main GNB 높이 64 → 52로 일시 줄였다가, 사용자 피드백으로 **64로 복원**
- Utility Bar 높이는 44 → **32** 유지
- Utility Bar 내부 pill 버튼·아바타·텍스트는 12px / 22×22로 컴팩트 유지

## 6. GNB 메뉴 오른쪽 정렬

`.gnb-nav-wrap`의 `justify-content: center` → `flex-end`, `.gnb-nav`의 `margin: 0 auto` → `margin: 0`. 로고와 메뉴 사이 시각적 여백 확보.

## 7. 로고 정렬 수정

스크린샷 검수에서 "맑은"(22px/900)이 "메시징"(20px/300)보다 약간 아래로 처져 보이는 이슈.

원인: 한국어 폰트(Noto Sans KR)의 ascender가 SVG 아이콘 박스보다 비대칭으로 커서 `align-items: center`만으로는 시각 중앙이 안 맞음.

해결:
- 로고 전체는 `align-items: center` (아이콘과 텍스트 그룹)
- 텍스트 그룹은 별도 wrapper(`.gnb-logo-text-group`)에 `align-items: baseline`으로 묶음
- 자식 모두 `line-height: 1` 통일, `display: inline-flex` 적용
- 아이콘 28 → 24로 축소(텍스트 22와 시각 비례)

## 8. 페이지 폭 1200px 적용

`AppPagePlaceholder`가 화면 전체 폭을 쓰고 있어 GNB·푸터와 폭 정렬 불일치. `p-6 lg:p-8` → `app-container py-8 lg:py-10`로 갱신해 47개 placeholder 페이지가 모두 1200px 안에 정렬.

## 9. 푸터 이메일 변경

`MALGN@MALGNSOFT.COM` → `massage@malgnsoft.com` (실제 메시징 서비스 메일 주소). 단순 텍스트 교체.

## 10. 문서 3종 추가 (`doc/`)

### 10.1 [FRONTEND.md](../FRONTEND.md)
- 프론트엔드 코딩 컨벤션 (Vue/CSS/TS), Nuxt UI 매핑, 아이콘 사용, 레이아웃 컴포넌트, 빌드/배포, PR 체크리스트, base.css 섹션 카탈로그
- 12개 섹션

### 10.2 [STACK.md](../STACK.md)
- 전체 토폴로지 ASCII 다이어그램, 사용자/운영자/API 스택, 데이터/스토리지/큐, 외부 서비스, 개발·운영 도구, 배포, 선택 이유/대안 비교, 버전 호환 표, 미정 항목
- 12개 섹션

### 10.3 [DESIGN.md](../DESIGN.md)
- 디자인 원칙, 컬러 시스템, 타이포그래피, 간격·그리드·레이아웃, 라운드·그림자·보더, 컴포넌트 패턴, 아이콘, 레이아웃 패턴, 반응형, 접근성, 톤·마이크로카피, 시안 매핑(base.css ↔ 우리 구현 매핑 + 페이지별 라인 번호 33개)
- 14개 섹션

### 10.4 문서 분담

| 문서 | 관점 | 시기 |
| --- | --- | --- |
| `CLAUDE.md` | **Why** — 결정 사항, 큰 그림 | AI 에이전트 + 신규 합류자 첫 읽기 |
| `doc/STACK.md` | **What** — 무엇을 쓰는가 | 외부 검토, 의존성 업데이트 |
| `doc/DESIGN.md` | **Visual How** — 토큰·컴포넌트·톤 | 새 화면 그리기 |
| `doc/FRONTEND.md` | **Code How** — Vue/CSS/TS 컨벤션 | 코딩 중 매번 |

`README.md` 없이 4개 문서가 보완하는 구조.

## 11. doc 폴더 재배치

`FRONTEND.md`를 루트에서 `doc/FRONTEND.md`로 이동하면서 내부 상대 경로 8건을 한 단계 위로 갱신 (`](./CLAUDE.md)` → `](../CLAUDE.md)` 등).

---

## 산출물 (당일 추가)

- `doc/FRONTEND.md` · `doc/STACK.md` · `doc/DESIGN.md`
- `AppGnb.vue` 구조 개편 (utility bar + main 2단)
- 콘텐츠 폭 1200 통일 (main.css + AppFooter + AppGnb + AppPagePlaceholder)
- 로고 baseline 정렬

## 알려진 한계

- 인증 흐름 미연결 (auth.global.ts는 항상 통과 스텁)
- 발송 페이지는 placeholder만
- 캠페인/AI 템플릿 페이지 미착수
