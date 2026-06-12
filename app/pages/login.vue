<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-head">
        <span class="auth-mark"><AppLogoMark /></span>
        <h1 class="auth-title">로그인</h1>
        <p class="auth-sub">맑은노티 프로젝트 관리</p>
      </div>

      <form class="auth-form" @submit.prevent="onSubmit">
        <label class="field">
          <span class="field-label">아이디</span>
          <input
            v-model.trim="form.loginId"
            class="field-input"
            type="text"
            autocomplete="username"
            placeholder="아이디"
            required
          >
        </label>
        <label class="field">
          <span class="field-label">비밀번호</span>
          <input
            v-model="form.password"
            class="field-input"
            type="password"
            autocomplete="current-password"
            placeholder="비밀번호"
            required
          >
        </label>

        <p v-if="error" class="auth-error" role="alert">{{ error }}</p>

        <button class="auth-submit" type="submit" :disabled="pending">
          {{ pending ? '로그인 중…' : '로그인' }}
        </button>
      </form>

      <p class="auth-foot">
        아직 계정이 없나요?
        <NuxtLink to="/signup" class="auth-link">회원가입</NuxtLink>
      </p>
      <p class="auth-note">
        맑은오피스 사용자는 별도 가입 없이 맑은오피스에서 바로 접속할 수 있습니다.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { member, login } = useAuth()

const form = reactive({ loginId: '', password: '' })
const pending = ref(false)
const error = ref('')

const redirectTo = computed(() => {
  const r = route.query.redirect
  // 오픈 리다이렉트(`//evil.com`, `/\evil.com`) 차단 — 내부 경로만 허용.
  if (typeof r !== 'string' || !r.startsWith('/') || r.startsWith('//') || r.startsWith('/\\')) return '/'
  return r
})

// 이미 로그인 상태면 진입 차단
if (member.value) {
  await navigateTo(redirectTo.value, { replace: true })
}

async function onSubmit() {
  if (pending.value) return
  pending.value = true
  error.value = ''
  try {
    await login(form.loginId, form.password)
    await navigateTo(redirectTo.value, { replace: true })
  }
  catch (e: unknown) {
    error.value = extractError(e, '로그인에 실패했습니다')
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
.auth-note {
  margin-top: 10px;
  text-align: center;
  font-size: 12px;
  color: var(--ink-400);
  line-height: 1.5;
}
</style>
