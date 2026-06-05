# NICE 통합인증(휴대폰 본인확인) — 적용 가이드

> **정본 출처**: <https://auth-guide.niceid.co.kr/> — NICE 통합인증 API 가이드 / 명세서 / 응답코드
> **우리 적용 범위**: 회원가입 Step 4 "휴대폰 본인 인증"을 자체 SMS OTP에서 NICE **휴대폰(M)** 으로 교체.
> **연관**: [./MEMBERSHIP.md](./MEMBERSHIP.md) §6.7·§6.8, [./SIGNUP.md](./pages/SIGNUP.md) §8 #4b·#8, [./history/history.20260602.md](./history/history.20260602.md) §5·§16
>
> **마지막 현행화**: 2026-06-02 (§9.1 자격증명 등록 시도 + 1007 IP 미해결로 mock 복귀 반영)
>
> **마지막 현행화**: 2026-06-02

---

## 1. 무엇이 다른가 (자체 SMS OTP vs NICE 본인확인)

| 항목 | **자체 SMS OTP** (현재 구현) | **NICE 휴대폰 본인확인 (M)** (도입 예정) |
| --- | --- | --- |
| 확인하는 것 | "이 휴대폰 번호를 누가 가지고 있는가" | "이 사람이 진짜 본인인가 (실명·생년월일·CI)" |
| 필요한 정보 | 휴대폰 번호 | 통신사 + 이름 + 주민등록번호 + 휴대폰 번호 |
| 응답 데이터 | 검증 통과 여부(boolean) | 이름 · 생년월일 · 성별 · CI · DI · 통신사 · 휴대폰 |
| 외부 비용 | 0 (자체 SMS 발송) | NICE 건당 과금 (계약별) |
| 실명 확인 효력 | ❌ 없음 | ✅ 법적 본인 확인 |
| 중복 가입 방지 (DI) | ❌ | ✅ |
| 통신3사 PASS 앱 | ❌ | ❌ (NICE 통합인증에서는 미지원 — 표준창 내 직접 입력) |

→ **자체 SMS OTP는 비밀번호 재설정·이메일 변경 등 단순 검증에 유지**. 회원가입의 본인 확인은 NICE로 분리.

---

## 2. NICE 통합인증 인증 수단 종류

NICE 통합인증 API는 4종 수단을 선택형으로 제공 (한 표준창에서 사용자가 선택).

| 코드 | 수단 | 우리 적용 |
| --- | --- | --- |
| `M` | 휴대폰 본인확인 | ✅ **회원가입 Step 4 기본** |
| `F` | 금융인증서 | 선택 노출 가능 |
| `U` | 공동인증서 | 선택 노출 가능 |
| `I` | 아이핀 | 노출 안 함 (사용률 낮음) |

우리 `svc_types`는 처음에 `["M"]` 단독으로 출시 → 사용자 피드백 보고 `["M", "F", "U"]`로 확장.

---

## 3. 전체 시퀀스 (5 단계)

```
[ 우리 워커 ]              [ NICE 서버 ]            [ 사용자 브라우저 ]
   │                          │                          │
   │ 1. POST /auth/token     ─►│                          │
   │ ◄── access_token, ticket │                          │
   │                          │                          │
   │ 2. POST /auth/url       ─►│                          │
   │ ◄── auth_url             │                          │
   │                          │                          │
   │ ──── auth_url 응답 ────────────────────────────────►│
   │                          │                          │
   │                          │ 3. 표준창 팝업 (사용자)  ◄┤
   │                          │     사용자 본인 입력      │
   │                          │ ── 인증 완료 ──────────► │
   │                          │                          │
   │                          │       4. return_url callback │
   │ ◄────────────────── web_transaction_id ─────────────┤
   │                          │                          │
   │ 5. POST /auth/result    ─►│                          │
   │ ◄── enc_data, integrity  │                          │
   │     (AES-256-GCM 복호화)  │                          │
   │     name·birthdate·CI·DI·mobile_no·mobile_co       │
```

---

## 4. API 엔드포인트 3종

모두 `https://auth.niceid.co.kr` 호스트 (단일).

| # | 메서드 | 경로 | 인증 |
| --- | --- | --- | --- |
| 1 | POST | `/ido/intc/v1.0/auth/token` | Basic (`client_id:client_secret`) |
| 2 | POST | `/ido/intc/v1.0/auth/url` | Bearer (token 1에서 발급) |
| 3 | POST | `/ido/intc/v1.0/auth/result` | Bearer (token 1에서 발급) |

---

## 5. 단계별 명세

### 5.1 토큰 발급 — `POST /ido/intc/v1.0/auth/token`

**Request Headers**
```
Authorization: Basic {Base64UrlEncoding(client_id:client_secret)}
Content-Type: application/json
X-Intc-DevLang: Cloudflare-Workers/TypeScript
```

**Request Body**
```json
{
  "grant_type": "client_credentials",
  "request_no": "A1234567890123456789"
}
```
- `request_no`: 회원사 요청 고유번호. 20~50자. **각 인증 세션마다 새로 생성** (uuid 또는 timestamp+nonce).

**Response**
```json
{
  "result_code": "0000",
  "result_message": "응답성공",
  "access_token": "eyJhbGciOiJIUzUxMiJ9...",
  "expires_in": 1762940529000,
  "token_type": "Bearer",
  "iterators": 66,
  "ticket": "UzEyMDI1MTEx..."
}
```

⚠️ **`ticket`, `iterators`는 복호화 단계에서 다시 사용** — 세션 상태에 보관.

### 5.2 인증 URL 요청 — `POST /ido/intc/v1.0/auth/url`

**Request Headers**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body**
```json
{
  "request_no": "A1234567890123456789",
  "return_url": "https://malgn-noti-api.malgnsoft.workers.dev/auth/nice/callback",
  "close_url": "https://malgn-noti.pages.dev/signup?nice=closed",
  "svc_types": ["M"],
  "method_type": "POST",
  "exp_mods": ["closeButtonOn"]
}
```
- `return_url`: NICE가 인증 완료 후 호출할 우리 콜백. **HTTPS 필수**.
- `close_url`: 표준창에서 사용자가 X 닫으면 이동할 URL.
- `svc_types`: 노출할 인증 수단. 1단계는 `["M"]`.
- `method_type`: 콜백을 `GET` 또는 `POST`로. `POST` 권장(URL에 토큰 노출 방지).
- `exp_mods`: 옵션. `closeButtonOn` 등 표준창 UI 옵션.

**Response**
```json
{
  "result_code": "0000",
  "auth_url": "https://auth.niceid.co.kr/ido/cert/request/S1afc40674-b094-44e7-be4b-3e42011b5f81",
  "transaction_id": "UzE0MUQyNkFDOEQ3NzYyMDIwMjUxMTEzMTAwMjM3MzM4OTQ5QUMwMkU"
}
```

⚠️ **`transaction_id`도 복호화 단계에서 salt로 사용** — 세션 상태에 보관.

### 5.3 표준창 팝업 (프런트)

```ts
window.open(
  auth_url,
  'niceAuth',
  'width=480,height=812,top=100,scrollbars=no'
)
```
- 권장 크기 **480 × 812px**.
- 모바일 환경에서는 `target="_blank"` 또는 same-tab 이동도 가능.

### 5.4 콜백 — `return_url` 수신

**Request from NICE** (위 `method_type`에 따라)
```
POST /auth/nice/callback
Content-Type: application/x-www-form-urlencoded

web_transaction_id=ZGIxOGZkYjUtMjE4NC00MDZmLTkxZjgtM2ZhNjA0OTdiZTY2
```

우리 콜백 핸들러는 `web_transaction_id`만 받음. **이 값으로 결과를 따로 조회**(다음 단계).

### 5.5 인증 결과 요청 — `POST /ido/intc/v1.0/auth/result`

**Request Headers**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body**
```json
{
  "web_transaction_id": "ZGIxOGZkYjUtMjE4NC00MDZmLTkxZjgtM2ZhNjA0OTdiZTY2",
  "transaction_id":     "UzE0MUQyNkFDOEQ3NzYyMDIwMjUxMTEzMTAwMjM3MzM4OTQ5QUMwMkU",
  "request_no":         "A1234567890123456789"
}
```

**Response (암호화됨)**
```json
{
  "result_code": "0000",
  "enc_data":    "{Base64UrlEncoded(AES-256-GCM)}",
  "integrity_value": "neSKi1jaqTBd_uly-1-FYS-A7euPHPajR0HCODnC3HA"
}
```

---

## 6. 암복호화 — AES-256-GCM + PBKDF2

### 키 유도 (PBKDF2-HMAC-SHA256)
```
input  = ticket (5.1 응답)
salt   = transaction_id (5.2 응답)
iter   = iterators (5.1 응답)
output = 64 bytes

대칭키   = output[0..32]      // 32 bytes
무결성키 = output[48..80]     // 32 bytes (48번째 byte부터)
```

### 복호화
```
cipher_bytes  = Base64UrlDecode(enc_data)
iv            = cipher_bytes[0..16]                      // 16 bytes
cipher_tag    = cipher_bytes[16..]                       // 나머지
tag           = cipher_tag[-16..]                        // 끝 16 bytes
cipher_text   = cipher_tag[..-16]                        // 나머지
plaintext     = AES-256-GCM-Decrypt(cipher_text, key=대칭키, iv=iv, tag=tag)
```

### 무결성 검증
```
expected = HMAC-SHA256(enc_data, key=무결성키)
expected_base64url = Base64UrlEncode(expected).rstrip('=')
assert expected_base64url == integrity_value  // 일치하지 않으면 위변조
```

### Workers(TypeScript) 구현 메모

- `crypto.subtle.importKey('raw', key, {name:'AES-GCM'}, false, ['decrypt'])`
- `crypto.subtle.decrypt({name:'AES-GCM', iv, tagLength:128}, key, cipher_tag)` — Web Crypto의 `decrypt`는 tag를 cipher_tag 끝에 붙인 형태로 받음 (별도 분리 불필요).
- `crypto.subtle.importKey('raw', key, {name:'HMAC', hash:'SHA-256'}, false, ['verify'])` + `crypto.subtle.verify` 또는 직접 `crypto.subtle.sign` 후 비교.
- PBKDF2: `crypto.subtle.importKey('raw', ticket, 'PBKDF2', ...)` + `deriveBits({name:'PBKDF2', salt, iterations, hash:'SHA-256'}, ..., 512)`.

→ 별도 라이브러리 불필요. Workers 표준 Web Crypto로 모두 처리.

---

## 7. 복호화 후 받는 데이터 (휴대폰 본인확인 M 기준)

| 키 | 타입 | 설명 | 우리 사용 |
| --- | --- | --- | --- |
| `name` | string | 성명 | `TB_USER.name` 갱신 |
| `birthdate` | string | `yyyymmdd` | `TB_USER.birthdate` 신규 (스키마 추가) |
| `gender` | string | `0`=여, `1`=남 | (선택) `TB_USER.gender` |
| `national_info` | string | `0`=내국인, `1`=외국인 | (선택) `TB_USER.national_info` |
| `ci` | string | 연계정보 (사이트 간 동일인 식별) | `TB_USER.ci` 신규 + UNIQUE — 중복 가입 방지 |
| `di` | string | 중복가입 확인정보 (사이트 내 동일인 식별) | (선택) 보조 |
| `mobile_co` | string | 통신사 코드 | `TB_USER.mobile_co` |
| `mobile_no` | string | 인증된 휴대폰 번호 | `TB_USER.phone` 갱신 (기존 입력값 덮어쓰기) |

### CI(연계정보) 운영 원칙

- **CI = 한 사람당 고유 88byte 문자열**. 사이트 간(여러 서비스) 동일인 식별의 표준.
- 동일 CI로 이미 가입된 사용자가 있으면 **중복 가입 차단**. (signup 시 `TB_USER.ci` UNIQUE 검사)
- DI도 사용 가능하나 사이트 내(우리 서비스 한정) 식별이라 CI가 더 강력.

---

## 8. 우리 적용 계획

### 8.1 백엔드 (`malgn-noti-api`) — 신규 라우트 3종

| 라우트 | 역할 |
| --- | --- |
| `POST /auth/nice/init` | 5.1 + 5.2 통합 → 프런트에 `auth_url` 반환 + session state 발급 |
| `POST /auth/nice/callback` | NICE의 5.4 콜백 수신 → 5.5 호출 → 복호화 → `TB_NICE_AUTH` 적재 → 프런트로 redirect (성공/실패) |
| `GET /auth/nice/status?session=…` | 프런트가 폴링으로 인증 완료 여부 확인 → 완료면 검증 결과(이름·생년월일·CI·DI·휴대폰)를 한 번에 반환 |

### 8.2 신규 DB 테이블 — `TB_NICE_AUTH`

```sql
CREATE TABLE TB_NICE_AUTH (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  request_no      VARCHAR(50)  NOT NULL,         -- 우리 요청 고유번호
  transaction_id  VARCHAR(120) NOT NULL,         -- NICE 응답
  ticket          VARCHAR(255) NOT NULL,         -- 복호화용
  iterators       INT          NOT NULL,         -- 복호화용
  state           VARCHAR(20)  NOT NULL DEFAULT 'pending',
                  -- pending → completed / failed / expired
  name            VARCHAR(60),
  birthdate       VARCHAR(8),
  gender          CHAR(1),
  national_info   CHAR(1),
  ci              VARCHAR(255),                  -- 88byte지만 여유
  di              VARCHAR(255),
  mobile_co       VARCHAR(10),
  mobile_no       VARCHAR(20),
  expires_at      DATETIME NOT NULL,             -- access_token 만료
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME,
  UNIQUE KEY uq_nice_request (request_no),
  KEY idx_nice_state (state, created_at)
);
```

### 8.3 `TB_USER` 스키마 확장

```sql
ALTER TABLE TB_USER
  ADD COLUMN birthdate  VARCHAR(8),
  ADD COLUMN gender     CHAR(1),
  ADD COLUMN ci         VARCHAR(255),
  ADD COLUMN mobile_co  VARCHAR(10),
  ADD UNIQUE KEY uq_user_ci (ci);  -- 중복 가입 차단
```

### 8.4 wrangler secrets

```
NICE_CLIENT_ID
NICE_CLIENT_SECRET
NICE_RETURN_URL       (예: https://malgn-noti-api.malgnsoft.workers.dev/auth/nice/callback)
NICE_CLOSE_URL        (예: https://malgn-noti.pages.dev/signup?nice=closed)
```

### 8.5 프런트 — `signup.vue` Step 4 교체

기존 흐름(통신사 select + 이름 + 주민번호 + 휴대폰 3분할 입력 + 자체 OTP 발송) → 단일 **"본인 인증하기"** 버튼:

```ts
async function startNiceAuth() {
  const { authUrl, session } = await useApi()('/auth/nice/init', { method: 'POST' })
  niceSession.value = session
  window.open(authUrl, 'niceAuth', 'width=480,height=812,top=100')
  // 폴링 시작
  pollUntilDone()
}

async function pollUntilDone() {
  for (let i = 0; i < 60; i++) {  // 5분(5초 × 60)
    await sleep(5000)
    const res = await useApi()('/auth/nice/status', {
      params: { session: niceSession.value },
    })
    if (res.data.state === 'completed') {
      niceResult.value = res.data  // {name, birthdate, ci, mobile_no, ...}
      verified.value = true
      return
    }
    if (res.data.state === 'failed' || res.data.state === 'expired') {
      // 토스트 + 다시 시도 UI
      return
    }
  }
}
```

### 8.6 `/auth/signup` 라우트 확장

NICE 결과를 받아 검증 후 signup:

```ts
const signupB = z.object({
  // 기존 필드 +
  niceSession: z.string(),  // /auth/nice/status가 반환한 session 또는 request_no
})

// signup 처리 안:
// 1. TB_NICE_AUTH에서 state='completed' + 같은 session 조회
// 2. ci로 TB_USER 중복 검사 → 있으면 409 "이미 가입된 사용자"
// 3. signup 진행 + TB_USER.ci/birthdate/gender/mobile_co 적재
// 4. consumed 표시 (한 번 쓰면 다시 못 씀)
```

---

## 9. 인프라 고려사항 (중요)

### 9.1 Outbound IP 화이트리스트 — Workers 환경 이슈 → **검증됨 (6/2 §16)**

NICE는 **이용기관 서버의 Outbound IP를 사전 등록**해야 API 호출이 가능합니다 (가이드 §13).

**문제**: Cloudflare Workers는 동적 데이터센터 IP를 사용 → 고정 IP 없음.

**라이브 시도 결과 (2026-06-02)**: 자격증명을 정상 등록한 상태에서 `POST /auth/nice/init` 호출 시 NICE 응답 `1007 허용되지 않은 IP 접근` 발생. 사전 예측대로 IP 화이트리스트가 막힘. 즉시 `NICE_MOCK=1` 복원해 가입 흐름은 정상 동작 유지. 자격증명 3 secret(CLIENT_ID/CLIENT_SECRET/RETURN_URL)은 해결 시점까지 등록 상태로 보관 — `wrangler secret delete NICE_MOCK` 한 번이면 real 전환.

**선택지** (6/2 우선순위 재정렬):

| 안 | 설명 | 트레이드오프 | 사용자 의사 |
| --- | --- | --- | --- |
| **A. NICE 콘솔 IP 검사 OFF** | 콘솔 → API 설정에서 IP 인증 토글 해제 | 가장 단순. 보안 등급은 다소 낮아짐 | **권장 1순위** |
| **B. NICE 콘솔에 Cloudflare egress IP 대역 등록** | Cloudflare 공식 IP 목록을 NICE 영업담당에 송부 후 콘솔 반영 | NICE 정책상 거절 가능성 | — |
| **C. 자체 프록시 EC2 + Workers → EC2 → NICE** | EC2 고정 IP를 NICE에 등록, Workers는 EC2로 프록시 | 인프라 추가. 운영 안정성 ↑. 월 ~$4 + 약간의 코드 | A·B 실패 시 fallback |
| **D. Cloudflare Workers Smart Placement + dedicated egress IP** | Cloudflare enterprise 등급의 고정 egress IP | 비용 큼 | — |

**현재 결정 (6/2)**: 사용자 의사로 IP 정책은 **보류**. mock 모드 유지하면서 다른 작업 진행.

### 9.2 NICE 방화벽 호스트

운영 시점 outbound 허용 호스트:
```
auth.niceid.co.kr        (121.162.155.181) : 443  ← 통합인증 (우리 사용)
nice.checkplus.co.kr     (121.131.196.215) : 443  ← 휴대폰 인증 (자동 fallback)
```

### 9.3 보안 위생

- `client_id`/`client_secret`은 **Workers secret으로만**. 코드/저장소·로그·에러 응답에 절대 노출 금지.
- `access_token`은 짧은 TTL — 캐시 시 expires_in 안에서만.
- `ci`는 PII이지만 그 자체로는 복호화 불가능한 해시 형태 → DB 저장 OK. 단 로그·외부 응답에 직접 노출 금지.
- `request_no`는 매 세션 새로 생성 + 재사용 차단.

---

## 10. NICE측 계약·등록 절차 (사용자 작업 필요)

| 단계 | 작업자 | 비고 |
| --- | --- | --- |
| 1. NICE평가정보 영업 담당 컨택 (`niceid_support@nice.co.kr` / 02-2122-4872~3) | **사용자(영업/대표)** | 통합인증 서비스 가입 요청 |
| 2. 사이트 등록 + 단가표 확정 | 사용자 | 휴대폰 본인확인 건당 단가 협의 |
| 3. Outbound IP 등록 (위 §9.1) | 사용자 + 김도형 | Cloudflare 대역 등록 협의 결과 따라 |
| 4. `client_id` · `client_secret` 발급 | NICE → 사용자 | 비공개 보관 |
| 5. 우리 Workers에 secret 등록 + 코드 배포 | 김도형 | 1~2시간 작업 |
| 6. NICE 테스트 페이지에서 e2e 검증 | 김도형 | 본인 휴대폰으로 1회 |
| 7. 운영 전환 + signup.vue 교체 배포 | 김도형 | |

→ **NICE 발급 완료(4단계) 후 5~7은 약 반나절 작업**.

---

## 11. 알려진 한계 / 후속 작업

| # | 항목 | 비고 |
| --- | --- | --- |
| 1 | **외국인 가입** | NICE 휴대폰 본인확인은 외국인 등록증 지원. `national_info='1'`로 분기 가능. UI에 외국인 선택지 추가 필요 |
| 2 | **법인 계정의 대표자 인증** | 법인사업자 가입 시 대표자 본인 인증으로 대체 가능. 정책 결정 후 적용 |
| 3 | **PASS 앱 직접 연동** | NICE 통합인증에선 미지원. PASS 직접 연동은 통신3사 별도 계약 필요 — 후순위 |
| 4 | **NICE 통합인증 외 수단** (금융인증서 F, 공동인증서 U) | 1단계는 M만, 2단계에서 `svc_types` 확장 |
| 5 | **CI 중복 검사 UX** | 이미 가입된 사용자가 다른 이메일로 재가입 시도 → 409 후 "이미 가입된 계정이 있습니다. 비밀번호 재설정으로 진행해 주세요" 안내 |
| 6 | **자체 SMS OTP 유지 영역** | 비밀번호 재설정·이메일/휴대폰 변경 등 단순 보유 확인은 자체 OTP 유지 (NICE 비용 절감) |
| 7 | **본인 인증 결과 보관 기간** | `TB_NICE_AUTH`는 가입 직후 30~90일 후 PII만 마스킹 처리 검토 (CI는 유지) |
| 8 | **모바일웹 UX** | 표준창이 팝업이라 모바일에서 차단 가능성 — `redirect` 모드 검토 |
| 9 | **테스트 환경 분리** | NICE에서 테스트 서버 별도 발급 시 우리도 sandbox/production 환경 분리 |

---

## 12. 다음 단계 추천

이번주 회원·인증 트랙 P0 항목과 별개로 — NICE 연동은 **사용자 영업 작업(계약) 선행** → 그 다음 1일 작업으로 정리 가능.

- 사용자 → NICE 영업 컨택 (이번주~다음주)
- 김도형 → 계약 완료 후 secret 받으면 반나절 작업으로 백엔드 3 라우트 + 프런트 Step 4 교체 + 라이브 검증
- 그 사이는 현재 자체 SMS OTP로 가입 흐름 유지 (mock 노출은 NICE 적용 시 영구 제거)
