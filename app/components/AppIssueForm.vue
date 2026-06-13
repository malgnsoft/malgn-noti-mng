<template>
  <form class="issue-form" @submit.prevent="onSubmit">
    <div class="row two">
      <label class="field">
        <span class="field-label">분류</span>
        <select v-model="form.type" class="field-input">
          <option v-for="o in ISSUE_TYPE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
      <label class="field">
        <span class="field-label">우선순위 <span class="opt">(선택)</span></span>
        <select v-model="form.priority" class="field-input">
          <option value="">지정 안 함</option>
          <option v-for="o in ISSUE_PRIORITY_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </label>
    </div>

    <label class="field">
      <span class="field-label">제목</span>
      <input
        v-model.trim="form.title"
        class="field-input"
        type="text"
        placeholder="제목을 입력하세요"
        maxlength="200"
        required
      >
    </label>

    <div class="field">
      <span class="field-label">
        본문 <span class="opt">(마크다운 지원 · 이미지 첨부 가능)</span>
      </span>
      <AppMarkdownEditor
        v-model="form.body"
        mono
        :rows="14"
        min-height="220px"
        :disabled="pending"
        placeholder="내용을 입력하세요. # 제목, **굵게**, - 목록, `코드`, [링크](https://…) 등 마크다운을 쓸 수 있습니다.&#10;이미지는 ‘이미지 첨부’ 버튼·드래그·붙여넣기로 추가됩니다."
      />
    </div>

    <p v-if="error" class="form-error" role="alert">{{ error }}</p>

    <div class="actions">
      <button type="button" class="btn btn-ghost" :disabled="pending" @click="emit('cancel')">취소</button>
      <button type="submit" class="btn btn-primary" :disabled="pending">
        {{ pending ? '저장 중…' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ISSUE_PRIORITY_OPTIONS, ISSUE_TYPE_OPTIONS } from '~/utils/issueMeta'

export interface IssueFormValue {
  type: string
  title: string
  body: string
  priority: string
}

const props = withDefaults(defineProps<{
  initial?: Partial<IssueFormValue>
  pending?: boolean
  error?: string
  submitLabel?: string
}>(), {
  initial: () => ({}),
  pending: false,
  error: '',
  submitLabel: '저장',
})

const emit = defineEmits<{
  submit: [value: IssueFormValue]
  cancel: []
}>()

const form = reactive<IssueFormValue>({
  type: props.initial.type ?? 'issue',
  title: props.initial.title ?? '',
  body: props.initial.body ?? '',
  priority: props.initial.priority ?? '',
})

function onSubmit() {
  if (!form.title.trim()) return
  emit('submit', { ...form, title: form.title.trim() })
}
</script>

<style scoped>
.issue-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.row.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-700);
}
.opt {
  font-weight: 400;
  color: var(--ink-400);
}
.field-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--ink-900);
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-md, 8px);
  outline: none;
}
.field-input:focus {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.form-error {
  font-size: 13px;
  color: #dc2626;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.btn {
  padding: 9px 18px;
  border-radius: var(--r-md, 8px);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.btn-ghost {
  color: var(--ink-600);
  background: transparent;
  border: 1px solid var(--line);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--ink-50);
}
.btn-primary {
  color: var(--ink-900);
  background: var(--accent);
  border: 1px solid var(--accent);
}
.btn-primary:hover:not(:disabled) {
  filter: brightness(0.97);
}
@media (max-width: 560px) {
  .row.two {
    grid-template-columns: 1fr;
  }
}
</style>
