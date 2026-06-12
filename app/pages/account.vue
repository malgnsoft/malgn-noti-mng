<template>
  <div class="page">
    <section class="head">
      <h1 class="title">내 정보</h1>
      <p class="desc">계정 프로필과 비밀번호를 관리합니다.</p>
    </section>

    <div v-if="member" class="cards">
      <!-- 프로필 -->
      <form class="card" @submit.prevent="onSaveProfile">
        <div class="card-head">
          <h2 class="card-title">프로필</h2>
          <span class="src-badge" :class="member.source === 'office' ? 'src-office' : 'src-direct'">
            {{ member.source === 'office' ? '맑은오피스 연동' : '직접가입' }}
          </span>
        </div>

        <div class="ro-row">
          <span class="ro-label">아이디</span>
          <span class="ro-value mono">{{ member.loginId }}</span>
        </div>

        <div class="grid2">
          <label class="field">
            <span class="field-label">성명 <em>*</em></span>
            <input v-model.trim="profile.name" class="field-input" type="text" required>
          </label>
          <label class="field">
            <span class="field-label">회사명</span>
            <input v-model.trim="profile.company" class="field-input" type="text">
          </label>
        </div>
        <div class="grid2">
          <label class="field">
            <span class="field-label">역할</span>
            <input v-model.trim="profile.role" class="field-input" type="text">
          </label>
          <label class="field">
            <span class="field-label">휴대전화번호</span>
            <input v-model.trim="profile.phone" class="field-input" type="tel" placeholder="010-0000-0000">
          </label>
        </div>
        <label class="field">
          <span class="field-label">이메일</span>
          <input v-model.trim="profile.email" class="field-input" type="email" placeholder="name@example.com">
        </label>

        <p v-if="profileError" class="form-error" role="alert">{{ profileError }}</p>

        <div class="card-foot">
          <button class="btn-primary" type="submit" :disabled="profileSaving">
            {{ profileSaving ? '저장 중…' : '프로필 저장' }}
          </button>
        </div>
      </form>

      <!-- 비밀번호 변경 -->
      <form class="card" @submit.prevent="onChangePassword">
        <div class="card-head">
          <h2 class="card-title">비밀번호 변경</h2>
        </div>

        <template v-if="member.source === 'office'">
          <p class="office-note">
            맑은오피스 연동 계정은 비밀번호를 사용하지 않습니다. 맑은오피스를 통해 로그인하세요.
          </p>
        </template>
        <template v-else>
          <label class="field">
            <span class="field-label">현재 비밀번호 <em>*</em></span>
            <input v-model="pw.current" class="field-input" type="password" autocomplete="current-password" required>
          </label>
          <div class="grid2">
            <label class="field">
              <span class="field-label">새 비밀번호 <em>*</em></span>
              <input v-model="pw.next" class="field-input" type="password" autocomplete="new-password" placeholder="8자 이상" required>
            </label>
            <label class="field">
              <span class="field-label">새 비밀번호 확인 <em>*</em></span>
              <input v-model="pw.confirm" class="field-input" type="password" autocomplete="new-password" required>
              <span
                v-if="pw.confirm"
                class="field-hint"
                :class="pwMatch ? 'hint-ok' : 'hint-bad'"
              >{{ pwMatch ? '새 비밀번호가 일치합니다' : '새 비밀번호가 일치하지 않습니다' }}</span>
            </label>
          </div>

          <p v-if="pwError" class="form-error" role="alert">{{ pwError }}</p>

          <div class="card-foot">
            <button class="btn-primary" type="submit" :disabled="pwSaving">
              {{ pwSaving ? '변경 중…' : '비밀번호 변경' }}
            </button>
          </div>
        </template>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { member, updateProfile, changePassword } = useAuth()
const toast = useToast()

const profile = reactive({
  name: member.value?.name ?? '',
  company: member.value?.company ?? '',
  role: member.value?.role ?? '',
  email: member.value?.email ?? '',
  phone: member.value?.phone ?? '',
})
const profileSaving = ref(false)
const profileError = ref('')

const pw = reactive({ current: '', next: '', confirm: '' })
const pwSaving = ref(false)
const pwError = ref('')
const pwMatch = computed(() => pw.next === pw.confirm)

async function onSaveProfile() {
  if (profileSaving.value) return
  profileError.value = ''
  if (!profile.name) {
    profileError.value = '성명을 입력하세요'
    return
  }
  profileSaving.value = true
  try {
    await updateProfile({ ...profile })
    toast.add({ title: '프로필을 저장했습니다', color: 'success' })
  }
  catch (e: unknown) {
    profileError.value = extractError(e, '프로필 저장에 실패했습니다')
  }
  finally {
    profileSaving.value = false
  }
}

async function onChangePassword() {
  if (pwSaving.value) return
  pwError.value = ''
  if (pw.next.length < 8) {
    pwError.value = '새 비밀번호는 8자 이상이어야 합니다'
    return
  }
  if (!pwMatch.value) {
    pwError.value = '새 비밀번호가 일치하지 않습니다'
    return
  }
  pwSaving.value = true
  try {
    await changePassword(pw.current, pw.next)
    pw.current = pw.next = pw.confirm = ''
    toast.add({ title: '비밀번호를 변경했습니다', color: 'success' })
  }
  catch (e: unknown) {
    pwError.value = extractError(e, '비밀번호 변경에 실패했습니다')
  }
  finally {
    pwSaving.value = false
  }
}
</script>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 24px 64px;
}
.head {
  margin-bottom: 24px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.01em;
}
.desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--ink-400);
}
.cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-lg, 12px);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink-900);
}
.src-badge {
  padding: 2px 8px;
  border-radius: var(--r-full, 999px);
  font-size: 11px;
  font-weight: 600;
}
.src-direct {
  background: var(--ink-100);
  color: var(--ink-600);
}
.src-office {
  background: var(--accent-soft);
  color: var(--accent-ink);
}
.ro-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--ink-50);
  border-radius: var(--r-md, 8px);
}
.ro-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-500);
  width: 64px;
}
.ro-value {
  font-size: 13px;
  color: var(--ink-900);
}
.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 520px) {
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
.office-note {
  font-size: 13px;
  color: var(--ink-500);
  line-height: 1.6;
  background: var(--ink-50);
  border-radius: var(--r-md, 8px);
  padding: 12px 14px;
}
.form-error {
  font-size: 13px;
  color: #dc2626;
}
.card-foot {
  display: flex;
  justify-content: flex-end;
}
.btn-primary {
  height: 40px;
  padding: 0 18px;
  background: var(--ink-900);
  color: var(--white);
  border-radius: var(--r-md, 8px);
  font-size: 14px;
  font-weight: 600;
  transition: opacity .15s ease;
}
.btn-primary:hover:not(:disabled) {
  opacity: 0.88;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
</style>
