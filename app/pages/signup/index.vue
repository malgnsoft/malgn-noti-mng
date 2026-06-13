<template>
  <div class="auth-page">
    <div class="auth-card auth-card-wide">
      <div class="auth-head">
        <span class="auth-mark"><AppLogoMark /></span>
        <h1 class="auth-title">회원가입</h1>
        <p class="auth-sub">프로젝트 참여자 등록</p>
      </div>

      <form class="auth-form" @submit.prevent="onSubmit">
        <!-- 아이디 + 중복확인 -->
        <div class="field">
          <span class="field-label">아이디 <em>*</em></span>
          <div class="id-row">
            <input
              v-model.trim="form.loginId"
              class="field-input"
              type="text"
              autocomplete="username"
              placeholder="영문/숫자 3~32자"
              required
              @input="resetIdCheck"
            >
            <button class="id-check-btn" type="button" :disabled="idCheck.state === 'checking'" @click="checkId">
              {{ idCheck.state === 'checking' ? '확인 중…' : '중복확인' }}
            </button>
          </div>
          <span
            v-if="idCheck.message"
            class="field-hint"
            :class="idCheck.state === 'ok' ? 'hint-ok' : 'hint-bad'"
          >{{ idCheck.message }}</span>
        </div>

        <div class="grid2">
          <label class="field">
            <span class="field-label">비밀번호 <em>*</em></span>
            <input
              v-model="form.password"
              class="field-input"
              type="password"
              autocomplete="new-password"
              placeholder="8자 이상"
              required
            >
          </label>
          <label class="field">
            <span class="field-label">비밀번호 확인 <em>*</em></span>
            <input
              v-model="form.passwordConfirm"
              class="field-input"
              type="password"
              autocomplete="new-password"
              placeholder="비밀번호 재입력"
              required
            >
            <span
              v-if="form.passwordConfirm"
              class="field-hint"
              :class="passwordMatch ? 'hint-ok' : 'hint-bad'"
            >{{ passwordMatch ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다' }}</span>
          </label>
        </div>

        <div class="grid2">
          <label class="field">
            <span class="field-label">성명 <em>*</em></span>
            <input v-model.trim="form.name" class="field-input" type="text" placeholder="홍길동" required>
          </label>
          <label class="field">
            <span class="field-label">회사명</span>
            <input v-model.trim="form.company" class="field-input" type="text" placeholder="맑은소프트">
          </label>
        </div>

        <div class="grid2">
          <label class="field">
            <span class="field-label">역할</span>
            <input v-model.trim="form.role" class="field-input" type="text" placeholder="기획 / 개발 / 디자인 …">
          </label>
          <label class="field">
            <span class="field-label">휴대전화번호</span>
            <input v-model.trim="form.phone" class="field-input" type="tel" placeholder="010-0000-0000">
          </label>
        </div>

        <label class="field">
          <span class="field-label">이메일</span>
          <input v-model.trim="form.email" class="field-input" type="email" placeholder="name@example.com">
        </label>

        <!-- 개인정보 수집·이용 동의 (내부 시스템 — 이용약관 동의는 두지 않음) -->
        <div class="terms">
          <div class="agree-row">
            <label class="agree">
              <input v-model="form.agreedPrivacy" type="checkbox">
              <span><b class="req">(필수)</b> 개인정보 수집·이용 동의</span>
            </label>
            <button class="terms-view" type="button" @click="showPrivacy = !showPrivacy">
              보기
            </button>
          </div>
          <p v-if="showPrivacy" class="terms-body">{{ privacyText }}</p>
        </div>

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

        <button class="auth-submit" type="submit" :disabled="pending">
          {{ pending ? '가입 중…' : '가입하고 시작하기' }}
        </button>
      </form>

      <p class="auth-foot">
        이미 계정이 있나요?
        <NuxtLink to="/login" class="auth-link">로그인</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const { member, signup } = useAuth()

const form = reactive({
  loginId: '',
  password: '',
  passwordConfirm: '',
  name: '',
  company: '',
  role: '',
  email: '',
  phone: '',
  agreedPrivacy: false,
})
const pending = ref(false)
const error = ref('')
const showPrivacy = ref(false)
const idCheck = reactive<{ state: 'idle' | 'checking' | 'ok' | 'bad', message: string }>({
  state: 'idle',
  message: '',
})

const passwordMatch = computed(() => form.password === form.passwordConfirm)

// 가입 신청자 이름을 완료 화면으로 전달(승인 대기 안내용).
const pendingName = useState<string>('signup:pendingName', () => '')

const privacyText = '맑은노티 프로젝트 관리 사이트는 회원 식별 및 프로젝트 참여자 관리를 위해 아이디·성명·회사명·역할·이메일·휴대전화번호를 수집·이용합니다. 수집 항목은 회원 탈퇴 시까지 보관하며, 법령에 따른 경우를 제외하고 제3자에게 제공하지 않습니다. (상세 처리방침은 추후 확정)'

if (member.value) {
  await navigateTo('/', { replace: true })
}

function resetIdCheck() {
  idCheck.state = 'idle'
  idCheck.message = ''
}

async function checkId() {
  if (idCheck.state === 'checking') return
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(form.loginId)) {
    idCheck.state = 'bad'
    idCheck.message = '아이디는 영문/숫자 3~32자로 입력하세요'
    return
  }
  idCheck.state = 'checking'
  idCheck.message = ''
  try {
    const res = await $fetch<{ available: boolean, reason: string }>('/api/auth/check-id', {
      query: { loginId: form.loginId },
    })
    idCheck.state = res.available ? 'ok' : 'bad'
    idCheck.message = res.reason
  }
  catch (e: unknown) {
    idCheck.state = 'bad'
    idCheck.message = extractError(e, '중복확인에 실패했습니다')
  }
}

async function onSubmit() {
  if (pending.value) return
  error.value = ''

  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(form.loginId)) {
    error.value = '아이디는 영문/숫자 3~32자로 입력하세요'
    return
  }
  if (idCheck.state !== 'ok') {
    error.value = '아이디 중복확인을 해주세요'
    return
  }
  if (form.password.length < 8) {
    error.value = '비밀번호는 8자 이상이어야 합니다'
    return
  }
  if (!passwordMatch.value) {
    error.value = '비밀번호가 일치하지 않습니다'
    return
  }
  if (!form.name) {
    error.value = '성명을 입력하세요'
    return
  }
  if (!form.agreedPrivacy) {
    error.value = '개인정보 수집·이용에 동의해야 합니다'
    return
  }

  pending.value = true
  try {
    const res = await signup({
      loginId: form.loginId,
      password: form.password,
      name: form.name,
      company: form.company,
      role: form.role,
      email: form.email,
      phone: form.phone,
      agreedPrivacy: form.agreedPrivacy,
    })
    pendingName.value = res.name || form.name
    await navigateTo('/signup/complete', { replace: true })
  }
  catch (e: unknown) {
    error.value = extractError(e, '회원가입에 실패했습니다')
  }
  finally {
    pending.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 56px);
  display: grid;
  place-items: center;
  padding: 48px 20px;
}
.auth-card {
  width: 100%;
  max-width: 380px;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-lg, 12px);
  padding: 32px 28px;
}
.auth-card-wide {
  max-width: 520px;
}
.auth-head {
  text-align: center;
  margin-bottom: 24px;
}
.auth-mark {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  background: var(--ink-900);
  color: var(--white);
  border-radius: var(--r-md, 8px);
  margin-bottom: 12px;
}
.auth-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.01em;
}
.auth-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--ink-400);
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 480px) {
  .grid2 { grid-template-columns: 1fr; }
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-600);
}
.field-label em {
  color: var(--accent-ink);
  font-style: normal;
}
.field-input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md, 8px);
  font-size: 14px;
  color: var(--ink-900);
  background: var(--white);
}
.field-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.field-hint {
  font-size: 12px;
}
.hint-ok {
  color: var(--accent-ink);
}
.hint-bad {
  color: #dc2626;
}
/* 아이디 + 중복확인 */
.id-row {
  display: flex;
  gap: 8px;
}
.id-row .field-input {
  flex: 1;
  min-width: 0;
}
.id-check-btn {
  flex-shrink: 0;
  padding: 0 14px;
  height: 40px;
  border: 1px solid var(--ink-300);
  border-radius: var(--r-md, 8px);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-700);
  background: var(--white);
}
.id-check-btn:hover:not(:disabled) {
  background: var(--ink-50);
}
.id-check-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
/* 약관 동의 */
.terms {
  border: 1px solid var(--line);
  border-radius: var(--r-md, 8px);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.agree {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-700);
  cursor: pointer;
}
.agree input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}
.agree-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.req {
  color: var(--accent-ink);
  font-weight: 600;
}
.terms-view {
  font-size: 12px;
  color: var(--ink-400);
  text-decoration: underline;
}
.terms-body {
  font-size: 12px;
  line-height: 1.6;
  color: var(--ink-500);
  background: var(--ink-50);
  border-radius: var(--r-sm, 6px);
  padding: 10px 12px;
  max-height: 120px;
  overflow-y: auto;
}
.auth-error {
  font-size: 13px;
  color: #dc2626;
}
.auth-submit {
  height: 42px;
  margin-top: 4px;
  background: var(--ink-900);
  color: var(--white);
  border-radius: var(--r-md, 8px);
  font-size: 14px;
  font-weight: 600;
  transition: opacity .15s ease;
}
.auth-submit:hover:not(:disabled) {
  opacity: 0.88;
}
.auth-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.auth-foot {
  margin-top: 18px;
  text-align: center;
  font-size: 13px;
  color: var(--ink-500);
}
.auth-link {
  color: var(--accent-ink);
  font-weight: 600;
}
</style>
