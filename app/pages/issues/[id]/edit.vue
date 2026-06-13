<template>
  <div class="page">
    <NuxtLink :to="`/issues/${id}`" class="back">
      <UIcon name="i-lucide-arrow-left" class="back-ico" />
      이슈 상세
    </NuxtLink>

    <h1 class="title">이슈 수정</h1>

    <div v-if="pending" class="state">불러오는 중…</div>
    <div v-else-if="!issue" class="state">이슈를 찾을 수 없습니다.</div>
    <AppIssueForm
      v-else
      :initial="initial"
      :pending="saving"
      :error="error"
      submit-label="수정 저장"
      @submit="onSubmit"
      @cancel="navigateTo(`/issues/${id}`)"
    />
  </div>
</template>

<script setup lang="ts">
import type { IssueDetail } from '~/utils/issueMeta'
import type { IssueFormValue } from '~/components/AppIssueForm.vue'

const route = useRoute()
const id = computed(() => Number(route.params.id))

const { data, pending } = await useFetch<{ data: IssueDetail }>(
  () => `/api/issues/${id.value}`,
  { key: () => `issue-edit-${id.value}` },
)
const issue = computed(() => data.value?.data ?? null)

const { member, isAdmin } = useAuth()

// 작성자 본인 또는 관리자가 아니면 상세로 리다이렉트(서버 403 + 클라 이중 차단).
watchEffect(() => {
  if (issue.value && member.value && member.value.id !== issue.value.authorId && !isAdmin.value) {
    navigateTo(`/issues/${id.value}`)
  }
})

const initial = computed<Partial<IssueFormValue>>(() => ({
  type: issue.value?.type,
  title: issue.value?.title,
  body: issue.value?.body,
  priority: issue.value?.priority ?? '',
}))

const saving = ref(false)
const error = ref('')

async function onSubmit(value: IssueFormValue) {
  saving.value = true
  error.value = ''
  try {
    await $fetch(`/api/issues/${id.value}`, {
      method: 'PATCH',
      body: {
        type: value.type,
        title: value.title,
        body: value.body,
        priority: value.priority || null,
      },
    })
    await navigateTo(`/issues/${id.value}`)
  }
  catch (e) {
    error.value = extractError(e, '이슈를 수정하지 못했습니다')
    saving.value = false
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
.state {
  padding: 48px 0;
  text-align: center;
  font-size: 14px;
  color: var(--ink-400);
}
</style>
