# 페이지 목록 (malgn-noti 사용자단)

전체 65 페이지. 인증 정책은 [`app/middleware/auth.global.ts`](../app/middleware/auth.global.ts) 글로벌 가드 — `definePageMeta({ auth: false })`로 명시한 페이지만 공개, 나머지는 모두 로그인 필수.

로그인 필요 페이지에 토큰 쿠키 없이 진입하면 `/login?redirect=<원래경로>` 로 리다이렉트. 토큰 검증은 [`app/plugins/auth.client.ts`](../app/plugins/auth.client.ts)에서 `/me` 호출로 수행.

범례: 🔒 = 로그인 필요 · 🌐 = 공개

---

## 인증 / 가입 (8)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/` | [index.vue](../app/pages/index.vue) — 비로그인 공개 랜딩 | 🌐 |
| `/login` | [login/index.vue](../app/pages/login/index.vue) | 🌐 |
| `/login/security` | [login/security.vue](../app/pages/login/security.vue) — OTP/이메일 보안인증 | 🌐 |
| `/signup` | [signup.vue](../app/pages/signup.vue) — 회원가입 5스텝 | 🌐 |
| `/reset-password` | [reset-password/index.vue](../app/pages/reset-password/index.vue) — 재설정 요청 | 🌐 |
| `/reset-password/new` | [reset-password/new.vue](../app/pages/reset-password/new.vue) — 새 비밀번호 입력 | 🌐 |
| `/invite` | [invite.vue](../app/pages/invite.vue) — 초대 링크 등록 | 🌐 |
| `/home` | [home.vue](../app/pages/home.vue) — 로그인 후 대시보드 | 🔒 |

## 발송 (6)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/send/sms` | [send/sms.vue](../app/pages/send/sms.vue) | 🔒 |
| `/send/rcs` | [send/rcs.vue](../app/pages/send/rcs.vue) | 🔒 |
| `/send/kakao` | [send/kakao.vue](../app/pages/send/kakao.vue) | 🔒 |
| `/send/email` | [send/email.vue](../app/pages/send/email.vue) | 🔒 |
| `/send/push` | [send/push.vue](../app/pages/send/push.vue) | 🔒 |
| `/send/flow` | [send/flow.vue](../app/pages/send/flow.vue) — 복합(플로우) | 🔒 |

## 이력 / 통계 (6)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/history/sms` | [history/sms.vue](../app/pages/history/sms.vue) | 🔒 |
| `/history/rcs` | [history/rcs.vue](../app/pages/history/rcs.vue) | 🔒 |
| `/history/kakao` | [history/kakao.vue](../app/pages/history/kakao.vue) | 🔒 |
| `/history/email` | [history/email.vue](../app/pages/history/email.vue) | 🔒 |
| `/history/push` | [history/push.vue](../app/pages/history/push.vue) | 🔒 |
| `/history/stats` | [history/stats.vue](../app/pages/history/stats.vue) | 🔒 |

## 주소록 (5)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/contacts/list` | [contacts/list.vue](../app/pages/contacts/list.vue) | 🔒 |
| `/contacts/groups` | [contacts/groups.vue](../app/pages/contacts/groups.vue) | 🔒 |
| `/contacts/optout` | [contacts/optout.vue](../app/pages/contacts/optout.vue) — 휴대폰 거부 | 🔒 |
| `/contacts/optout-email` | [contacts/optout-email.vue](../app/pages/contacts/optout-email.vue) | 🔒 |
| `/contacts/optout-token` | [contacts/optout-token.vue](../app/pages/contacts/optout-token.vue) — PUSH 토큰 | 🔒 |

## 발신 정보 (6)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/sender/numbers` | [sender/numbers.vue](../app/pages/sender/numbers.vue) — 발신번호 | 🔒 |
| `/sender/brands` | [sender/brands.vue](../app/pages/sender/brands.vue) — RCS 브랜드 | 🔒 |
| `/sender/domains` | [sender/domains.vue](../app/pages/sender/domains.vue) — 이메일 도메인 + DKIM | 🔒 |
| `/sender/push-cert` | [sender/push-cert.vue](../app/pages/sender/push-cert.vue) — FCM/APNs | 🔒 |
| `/sender/profiles` | [sender/profiles.vue](../app/pages/sender/profiles.vue) — 카카오 발신 프로필 | 🔒 |
| `/sender/optout-080` | [sender/optout-080.vue](../app/pages/sender/optout-080.vue) — 080 수신거부 | 🔒 |

## 메시지 관리 (7)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/manage/sms` | [manage/sms.vue](../app/pages/manage/sms.vue) | 🔒 |
| `/manage/rcs` | [manage/rcs.vue](../app/pages/manage/rcs.vue) | 🔒 |
| `/manage/kakao` | [manage/kakao.vue](../app/pages/manage/kakao.vue) | 🔒 |
| `/manage/email` | [manage/email.vue](../app/pages/manage/email.vue) | 🔒 |
| `/manage/push` | [manage/push.vue](../app/pages/manage/push.vue) | 🔒 |
| `/manage/landing` | [manage/landing.vue](../app/pages/manage/landing.vue) — 랜딩페이지 | 🔒 |
| `/manage/settings` | [manage/settings.vue](../app/pages/manage/settings.vue) — 메시지 발송 상세 설정 | 🔒 |

## 크레딧 / 결제 (2)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/charge` | [charge/index.vue](../app/pages/charge/index.vue) — 충전 | 🔒 |
| `/charge/result` | [charge/result.vue](../app/pages/charge/result.vue) — 충전 결과 | 🔒 |

## 나의 페이지 / 계정 (8)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/account/settings` | [account/settings.vue](../app/pages/account/settings.vue) — 회원 정보 | 🔒 |
| `/account/password` | [account/password.vue](../app/pages/account/password.vue) — 비밀번호 변경 | 🔒 |
| `/account/security` | [account/security.vue](../app/pages/account/security.vue) — 보안 로그인 | 🔒 |
| `/account/multi` | [account/multi.vue](../app/pages/account/multi.vue) — 멀티 계정 | 🔒 |
| `/account/contract` | [account/contract.vue](../app/pages/account/contract.vue) — 사업자등록증 제출·이용계약 전자서명·미승인 사용자 메인 진입점. 상세는 [pages/CONTRACT.md](./pages/CONTRACT.md) | 🔒 |
| `/account/billing` | [account/billing.vue](../app/pages/account/billing.vue) — 결제 정보 | 🔒 |
| `/account/cards` | [account/cards.vue](../app/pages/account/cards.vue) — 결제 카드 | 🔒 |
| `/account/credit` | [account/credit.vue](../app/pages/account/credit.vue) — 크레딧 내역 | 🔒 |

## 문의 (4)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/account/inquiries` | [account/inquiries/index.vue](../app/pages/account/inquiries/index.vue) — 내 문의 목록 | 🔒 |
| `/account/inquiries/detail` | [account/inquiries/detail.vue](../app/pages/account/inquiries/detail.vue) — 문의 상세 | 🔒 |
| `/account/inquiry` | [account/inquiry/index.vue](../app/pages/account/inquiry/index.vue) — 1:1 문의 작성 | 🔒 |
| `/account/inquiry/complete` | [account/inquiry/complete.vue](../app/pages/account/inquiry/complete.vue) | 🔒 |

## 운영 가이드 / 메타 (4)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/guide` | [guide.vue](../app/pages/guide.vue) — 디자인 가이드 18섹션 | 🔒 |
| `/help` | [help.vue](../app/pages/help.vue) — 운영 가이드 | 🔒 |
| `/sitemap` | [sitemap.vue](../app/pages/sitemap.vue) | 🔒 |
| `/wbs` | [wbs.vue](../app/pages/wbs.vue) — WBS 진척률 | 🌐 |

## 시스템 페이지 (9)

| URL | 페이지 | 인증 |
| --- | --- | --- |
| `/404` | [404.vue](../app/pages/404.vue) | 🌐 |
| `/error` | [error.vue](../app/pages/error.vue) — 시스템 에러 | 🌐 |
| `/templete/error/system` | [templete/error/system.vue](../app/pages/templete/error/system.vue) | 🌐 |
| `/templete/error/not-found` | [templete/error/not-found.vue](../app/pages/templete/error/not-found.vue) | 🌐 |
| `/templete/error/network` | [templete/error/network.vue](../app/pages/templete/error/network.vue) | 🌐 |
| `/templete/inspection/emergency` | [templete/inspection/emergency.vue](../app/pages/templete/inspection/emergency.vue) | 🌐 |
| `/templete/inspection/scheduled` | [templete/inspection/scheduled.vue](../app/pages/templete/inspection/scheduled.vue) | 🌐 |
| `/templete/email/verify` | [templete/email/verify.vue](../app/pages/templete/email/verify.vue) — 이메일 인증 메일 템플릿 | 🌐 |
| `/templete/email/reset-password` | [templete/email/reset-password.vue](../app/pages/templete/email/reset-password.vue) | 🌐 |

---

## 요약

| 구분 | 페이지 수 |
| --- | --- |
| **총** | **65** |
| 🌐 공개 (auth: false) | 17 |
| 🔒 로그인 필요 (기본 가드) | 48 |

**공개 페이지 정책 — 인증 가드 통과 규칙:**
- 가입·로그인·재설정 흐름 7종 (`/login`, `/signup`, `/reset-password`, `/invite` 등)
- 비로그인 랜딩 `/` + WBS `/wbs`
- 시스템/에러/점검 템플릿 8종 + `/404`·`/error`
