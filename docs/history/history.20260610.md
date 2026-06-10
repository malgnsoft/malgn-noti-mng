# 2026-06-10 작업 이력

> **한 줄 요약**: `malgn-noti-mng` WBS 전체 화면 스크롤 동작을 solsol 방식(GNB·상단 접힘)으로 교체 + 스텝별 비중 표시·기준일 클릭 오늘 점프 + 블루프린트 현행화·스타터 zip 재패키징 + `/docs/board` 빈 본문 버그 수정. `malgn-noti-admin` 고객사 상세에 **발신정보 6테이블 섹션**(Figma `Deatail.png` 매칭) 추가·배포.

---

## 1. mng — WBS 풀스크린 스크롤을 solsol 방식으로 교체

**결정**: 직전에 적용한 이중 스크롤(sticky pane: 페이지 스크롤로 GNB·topbar를 밀어낸 뒤 간트 내부 스크롤로 전환)은 두 스크롤 컨텍스트 전환이 어색. 로컬 `solsol-mng` 소스를 직접 확인해 **간트 단일 스크롤 + 스크롤 다운 시 GNB·상단 부드럽게 접힘** 방식으로 교체.

**코드**:
- `app/pages/wbs.vue`: `.wbs-pane`(sticky) 제거 → `.wbsx` full-height(`calc(100vh - 56px)`) 단일 내부 스크롤 복원. 간트 `scrollTop > 72`에서 공유 상태 `useState('wbsChromeHidden')` 토글, 스크롤 업(4px) 시 해제. `.chrome-collapsed`에서 `topbar`(`max-height`)·`.wbsx`(`height:100vh`) transition 접힘.
- `app/layouts/default.vue`: `/wbs`에서 GNB도 `wbsChromeHidden` 연동으로 `height` transition 접힘(`gnb-hidden`), 푸터 숨김 유지.

## 2. mng — WBS 스텝 비중 표시 + 기준일 클릭 오늘 점프

- **스텝 비중**: 스텝 행 표기를 현황판 단계 헤더와 동일하게 `개수 · 비중 N% · 진행 N%`로 변경(`stepWeight()` = `wbsStageMeta.weight`).
- **기준일 점프**: 부제 기준일(`todayDot`) 클릭 시 오늘선(`.todayline`) 위치 기준으로 간트를 가로 스크롤(타임라인 좌측 1/3 지점에 오늘 배치, `behavior:'smooth'`).

## 3. mng — 블루프린트 현행화 + 스타터 zip 재패키징

- `docs/PROJECT_MANAGEMENT_BLUEPRINT.md`: WBS CRUD·전체화면 스크롤·실시간 기준일(KST)·호버 툴팁/메모·단계 관리(가중치) 반영, §6에 날짜 ISO 저장 필수, §9 함정 4종 추가(날짜 ISO 통일·FK `defer_foreign_keys` 재명명·인라인 코드 줄바꿈·풀스크린 스크롤 패턴), 마지막 갱신일 표기.
- `project-mng-starter.zip` 삭제 후 최신 워킹트리로 재패키징(43파일, 236K — wbs CRUD/스크롤·schema·API·블루프린트 반영).

## 4. mng — `/docs/board` 빈 본문 버그 수정

**증상**: `/docs/board`에서 `.prose-wrap` 카드만 그려지고 본문이 비어 보임(직접 로드 HTML·payload에는 본문 정상 → 클라이언트 이동 시점 정황).
**원인/조치**: 문서 상세(`app/pages/docs/[...slug].vue`)의 `useAsyncData` 키를 **함수(`() => 'doc:'+경로`) → 문자열(`'doc:'+경로`)** 로 정정. SSR↔클라이언트 payload 키 일치로 본문 누락 방지. 새 빌드로 산출물 재생성.

## 5. admin — 고객사 상세 발신정보 섹션 추가 (Figma `Deatail.png`)

**배경**: `/Users/dotype/ProjectHandoff/figma_noti` 핸드오프 18장(운영자 콘솔 카테고리 1:1). 회원/고객사부터 매칭 시작 — 목록은 이미 일치, 상세에 발신정보 섹션이 누락.

**코드** (`malgn-noti-admin` `app/pages/customers/[id].vue`): 계약 섹션 아래 **6개 테이블**(발신번호·브랜드RCS·도메인·PUSH 인증서·알림톡 발신 프로필·080 수신거부) 추가. 상태 배지는 `정보.png` 범례 반영(신청/심사중/승인/반려/취소·완료/실패·정상/사용불가·개통완료/신청중/해지 등), 각 카드 우측 "~ 관리" 버튼 + "발신정보" 그룹 헤딩.
**데이터**: 상세 API(`opsFetch` → `malgn-noti-api`) 응답에 `senderInfo` 미포함 → 백엔드 연동 전까지 데모 데이터, 추후 `data.senderInfo.*`로 교체(주석). typecheck 통과(기존 `server/utils/ops.ts` 제네릭 오류는 무관).

---

## 산출물

- `malgn-noti-mng` Pages 배포 다수 — WBS 스크롤(`32118503`)·비중·기준일 점프·블루프린트·`/docs/board` 수정(`1cddc81f`). 라이브 <https://malgn-noti-mng.pages.dev>.
- `malgn-noti-admin` Pages 배포 — 고객사 상세 발신정보 섹션(alias `4520c8ab`). 라이브 <https://malgn-noti-admin.pages.dev>. 커밋 push 완료.
- `docs/PROJECT_MANAGEMENT_BLUEPRINT.md` 현행화, `project-mng-starter.zip` 재생성.

## 다음 단계 · 한계

- 발신정보 6테이블은 **데모 데이터** — `malgn-noti-api` 운영자 응답(`senderInfo`) 확장 후 실데이터 연동 필요.
- 일부 컬럼 라벨은 캔버스(22393px) 해상도 한계로 추정 — 실제 Figma 대비 검수 필요.
- 회원/고객사 잔여 요소(단가 모달·등록 폼 3탭·상태변경 모달 등) 및 다음 카테고리(대시보드 등) 매칭은 후속.
