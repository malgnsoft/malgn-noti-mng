<template>
  <div class="page">
    <NuxtLink to="/issues" class="back">
      <UIcon name="i-lucide-arrow-left" class="back-ico" />
      이슈 목록
    </NuxtLink>

    <h1 class="title">새 이슈 작성</h1>

    <AppIssueForm
      :pending="pending"
      :error="error"
      submit-label="등록"
      @submit="onSubmit"
      @cancel="navigateTo('/issues')"
    />
  </div>
</template>

<script setup lang="ts">
import type { IssueFormValue } from '~/components/AppIssueForm.vue'

const pending = ref(false)
const error = ref('')

async function onSubmit(value: IssueFormValue) {
  pending.value = true
  error.value = ''
  try {
    const res = await $fetch<{ data: { id: number } }>('/api/issues', {
      method: 'POST',
      body: {
        type: value.type,
        title: value.title,
        body: value.body,
        priority: value.priority || null,
      },
    })
    await navigateTo(`/issues/${res.data.id}`)
  }
  catch (e) {
    error.value = extractError(e, '이슈를 등록하지 못했습니다')
    pending.value = false
  }
}
</script>

<style scoped>
.page {
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  font-size: 13px;
  color: var(--ink-500);
}
.back:hover {
  color: var(--ink-900);
}
.back-ico {
  width: 15px;
  height: 15px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.01em;
  margin-bottom: 22px;
}
</style>
