<template>
  <div class="auth-page">
    <div class="auth-card complete">
      <span class="complete-icon">
        <UIcon name="i-lucide-clock" />
      </span>
      <h1 class="complete-title">가입 신청이 접수되었습니다</h1>
      <p class="complete-sub">
        <template v-if="pendingName">{{ pendingName }}님, </template>관리자 승인 후 로그인할 수 있습니다.
        승인이 완료되면 입력하신 아이디·비밀번호로 로그인해 주세요.
      </p>

      <NuxtLink to="/login" class="complete-btn">로그인 화면으로</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// 가입 신청 직후에만 표시(직접 진입 방지). 이름은 signup 화면에서 전달.
const pendingName = useState<string>('signup:pendingName', () => '')
if (!pendingName.value) {
  await navigateTo('/signup', { replace: true })
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
  max-width: 400px;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-lg, 12px);
  padding: 36px 28px;
}
.complete {
  text-align: center;
}
.complete-icon {
  display: inline-grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  border-radius: var(--r-full, 999px);
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-size: 24px;
}
.complete-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.01em;
}
.complete-sub {
  margin-top: 8px;
  font-size: 13px;
  color: var(--ink-500);
  line-height: 1.5;
}
.complete-info {
  margin: 22px 0;
  text-align: left;
  border: 1px solid var(--line);
  border-radius: var(--r-md, 8px);
  overflow: hidden;
}
.complete-info > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--line);
}
.complete-info > div:last-child {
  border-bottom: none;
}
.complete-info dt {
  color: var(--ink-500);
  font-weight: 600;
}
.complete-info dd {
  color: var(--ink-900);
}
.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}
.complete-btn {
  display: block;
  height: 42px;
  line-height: 42px;
  background: var(--ink-900);
  color: var(--white);
  border-radius: var(--r-md, 8px);
  font-size: 14px;
  font-weight: 600;
  transition: opacity .15s ease;
}
.complete-btn:hover {
  opacity: 0.88;
}
</style>
