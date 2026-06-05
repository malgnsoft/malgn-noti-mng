# 2026-05-14 — 변경사항 GitHub 푸시 + history 폴더 정리

## 한 줄 요약

그동안의 디자인·발송 페이지·Smart Placement 변경 전체를 세 레포에 일괄 커밋·푸시하고, 작업 내역을 `doc/history/`에 날짜별로 분리해 기록했다.

---

## 1. GitHub 푸시 (세 레포 일괄)

이전 첫 커밋 이후 누적된 변경 전부를 main에 커밋·푸시.

| 레포 | 이전 → 새 커밋 | 변경 |
| --- | --- | --- |
| `malgn-noti` | `0b444f5 → 8d68005` | 디자인 시스템 적용, GNB+Footer 추가, 콘텐츠 폭 1200px, 발송 페이지 공용 컴포넌트 21종, 문서 3종 |
| `malgn-noti-api` | `ac45973 → decfaf0` | Hono Worker 부트스트랩, Smart Placement |
| `malgn-noti-admin` | `0166ffa → 89abceb` | placeholder 정적 페이지, `.wrangler` ignore |

### 사전 작업
- `malgn-noti-admin/.gitignore`에 `.wrangler` / `.dev.vars` 추가 (wrangler 빌드 캐시가 git에 포함되지 않도록)

### 커밋 메시지
- 한국어 본문, 변경 항목 불릿
- Claude co-author trailer 일관 포함

## 2. `doc/history/` 폴더 신설

날짜별 작업 내역을 별도 폴더에 누적하도록 구조화.

```
doc/
├── CLAUDE.md (루트 — 큰 그림 / 결정)
├── STACK.md
├── DESIGN.md
├── FRONTEND.md
└── history/
    ├── history.20260511.md   # 프로젝트 착수
    ├── history.20260512.md   # 시안 매칭 + 문서화
    ├── history.20260513.md   # Smart Placement + 발송 페이지
    └── history.20260514.md   # 이 문서
```

### 파일명 규칙
- `history.yyyyMMdd.md` — 한 날짜 한 파일
- 작업이 있는 날만 생성

### 각 파일 구조 (공통)
1. **한 줄 요약** — 그 날의 가장 큰 변화
2. **번호별 작업 섹션** — 결정 / 코드 변경 / 배포
3. **산출물** — 추가/수정된 파일·문서·배포 버전
4. **다음 단계 / 알려진 한계**

---

## 산출물 (당일 추가)

- 세 레포 GitHub 동기화 완료 (`origin/main` 일치)
- `doc/history/` 폴더 + 4개 history 파일

## 다음 단계

- 마일스톤 **M1**: 데이터 모델링(`malgn-noti-api/db/schema.ts`) + 인증 API + 사용자단 인증 흐름 연결
- 또는 RCS/이메일/PUSH/Flow 발송 페이지 (이미 잡힌 공용 컴포넌트 재사용)
