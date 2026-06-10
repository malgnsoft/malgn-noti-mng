# 2026-05-13 — Smart Placement + 발송 페이지 풍부화

## 한 줄 요약

API Worker에 Smart Placement를 적용해 Aurora 가까이에서 실행되도록 했고, SMS/알림톡 발송 페이지가 21종 공용 컴포넌트 위에 풍부하게 구현되기 시작했다.

---

## 1. API Worker Smart Placement

`wrangler.toml`에 추가:

```toml
[placement]
mode = "smart"
```

- Cloudflare가 트래픽 패턴(외부 호출 빈도·지연)을 분석해 Worker 실행 위치를 자동 최적화
- Aurora MySQL(AWS) ↔ Hyperdrive 호출이 잦아지면 Aurora 리전에 가까운 데이터센터에서 실행
- 학습 기반이라 초기 며칠은 일반 placement, 트래픽 누적 후 최적 위치로 수렴
- `wrangler deploy` 즉시 적용 (Version `8583dd1e-f8a2-46b6-8704-944662f97175`)

## 2. 발송 페이지 공용 컴포넌트 21종 추가

SMS/알림톡 발송 페이지를 풍부하게 구현하면서 공용 컴포넌트가 정착.

### 2.1 수신자 영역
- `AppRecipientTable.vue` — 수신자 행 표시, 다중 선택
- `AppRecipientFormDialog.vue` — 수신자 직접 입력 / 수정 다이얼로그
- `AppRecipientActions.vue` — 추가/편집/삭제 액션바
- `AppAddressBookDialog.vue` — 주소록에서 연락처/그룹 선택 모달

### 2.2 발송 폼 영역
- `AppSendFormCard.vue` — 점진적 disclosure 카드(잠금 표시 포함)
- `AppSendOptionsCard.vue` — 발송 시점/대체 문자 등 옵션
- `AppSendActionsBar.vue` — 발송/예약/초기화 버튼 묶음
- `AppSendConfirmDialog.vue` — 발송 컨펌(수신자 수, 차감 크레딧, 잔여 등)
- `AppSenderSearchSelect.vue` — 발신 프로필/번호 검색·선택 콤보
- `AppDateTimePicker.vue` — 예약 발송 시각 선택

### 2.3 메시지 본문 영역
- `SmsMessageBody.vue` — SMS/LMS/MMS 본문 작성
- `KakaoMessageBody.vue` — 알림톡 템플릿 코드/강조형/변수
- `AppChannelMessageCard.vue` — 채널 공통 메시지 영역 래퍼
- `AppTemplateVariableTextarea.vue` — `#{name}` 같은 변수 토큰 입력
- `AppTemplatePickerDialog.vue` — 저장된 템플릿 선택 모달
- `AppSmsTemplateCard.vue` — SMS 템플릿 카드
- `AppAIRewriteDialog.vue` — AI 템플릿 재작성/생성 모달
- `AppAdNoticeSms080Dialog.vue` — 광고 수신 동의/080 안내 모달
- `AppFileUploader.vue` — 파일 업로드 공용 컴포넌트

### 2.4 미리보기 영역
- `AppPhonePreview.vue` — 휴대폰 모형 미리보기 컨테이너
- `AppPhonePreviewSmsBubble.vue` — SMS 말풍선
- `AppPhonePreviewKakaoBubble.vue` — 알림톡 말풍선

## 3. composable / 타입 추가

- `composables/useChannelMeta.ts` — 채널별 메타(가격·발신정보 형식·disclosure 단계 정의)
- `types/channel.ts` — Channel 타입, `isCardUnlocked`, `isSubstitutionActive` 헬퍼

이 단일 composable이 5채널(SMS/RCS/알림톡/이메일/PUSH) 발송 페이지의 공통 동작(점진적 disclosure·가격 계산·치환 변수 활성 여부)을 한 곳에 모음.

## 4. SMS 발송 페이지 (`/send/sms`)

- `useChannelMeta('sms')` 기반
- 발신 번호 검색 → 잠금 해제 → 수신자 등록 → 메시지 입력 → 발송
- 휴대폰 미리보기 실시간 반영
- 광고 수신 안내(080) 모달 트리거
- 발송 컨펌(수신자 수·차감 크레딧·잔여)

## 5. 알림톡 발송 페이지 (`/send/kakao`)

- `useChannelMeta('kakao')` 기반
- 발신 프로필(`@위캔디오` 등) 검색 → 템플릿 선택 → 수신자 → 발송
- 카카오 템플릿: 일반/추가 정보형/강조표기형, 버튼 4종(web/app/phone/message), 변수 치환
- 휴대폰 미리보기에 알림톡 말풍선 + 버튼 렌더

## 6. 작업 분석 / 워크플랜 정리

사용자 요청으로 작업 단계를 세분화. 4개 카테고리 → 세부 태스크 + 의존성 + 마일스톤 8개 (M1~M8) 정리.

- M1: 데이터 모델링 + 인증 API + 인증 UI 연결
- M2: 주소록/발신정보/템플릿 CRUD
- M3: SMS/알림톡 발송 + 이력 (MVP)
- M4: 충전 + PG 연동 (유료 전환 가능)
- M5: Flow + 캠페인 + 대량 발송
- M6: AI 템플릿 + ExportJob
- M7: 운영자단 전체
- M8: 통계/RBAC/Rate Limit/OpenAPI

---

## 산출물 (당일 추가)

- `wrangler.toml` Smart Placement
- 발송 페이지 공용 컴포넌트 21종
- `useChannelMeta` composable + `types/channel.ts`
- SMS/알림톡 발송 페이지 풍부 구현
- API Worker Version `8583dd1e-f8a2-46b6-8704-944662f97175` 배포

## 다음 단계

- RCS/이메일/PUSH/Flow 발송 페이지 (동일 패턴 재사용)
- 발송 조회/통계 페이지
- 주소록/발신 정보/템플릿 페이지 풍부 구현
- 데이터 모델링 + API 기초 (M1 시작)
