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
      <div
        class="editor"
        :class="{ dragover: dragging }"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <textarea
          ref="bodyEl"
          v-model="form.body"
          class="field-input field-textarea"
          rows="14"
          placeholder="내용을 입력하세요. # 제목, **굵게**, - 목록, `코드`, [링크](https://…) 등 마크다운을 쓸 수 있습니다.&#10;이미지는 아래 ‘이미지 첨부’ 버튼·드래그·붙여넣기로 추가됩니다."
          @paste="onPaste"
        />
        <div class="editor-bar">
          <button
            type="button"
            class="attach"
            :disabled="uploading || pending"
            @click="fileEl?.click()"
          >
            <UIcon name="i-lucide-image-plus" class="attach-ico" />
            {{ uploading ? '업로드 중…' : '이미지 첨부' }}
          </button>
          <span class="attach-hint">PNG·JPG·GIF·WEBP · 5MB 이하 · 드래그/붙여넣기 가능</span>
        </div>
        <input
          ref="fileEl"
          class="file-input"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          @change="onPick"
        >
      </div>
      <p v-if="uploadError" class="form-error" role="alert">{{ uploadError }}</p>
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

// ── 이미지 첨부 ────────────────────────────────────────────
const bodyEl = ref<HTMLTextAreaElement>()
const fileEl = ref<HTMLInputElement>()
const uploading = ref(false)
const uploadError = ref('')
const dragging = ref(false)

const ALLOWED = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

// 커서 위치(또는 끝)에 텍스트 삽입 후 캐럿을 삽입 끝으로 이동.
function insertAtCursor(text: string) {
  const el = bodyEl.value
  if (!el) { form.body += text; return }
  const start = el.selectionStart ?? form.body.length
  const end = el.selectionEnd ?? form.body.length
  form.body = form.body.slice(0, start) + text + form.body.slice(end)
  nextTick(() => {
    el.focus()
    const pos = start + text.length
    el.setSelectionRange(pos, pos)
  })
}

// alt 텍스트의 마크다운 특수문자 제거(링크/이미지 구문 깨짐 방지).
function safeAlt(name: string): string {
  return name.replace(/[[\]()]/g, '').trim() || '이미지'
}

async function uploadOne(file: File): Promise<void> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error('PNG·JPG·GIF·WEBP 이미지만 첨부할 수 있습니다')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('이미지는 5MB 이하만 첨부할 수 있습니다')
  }
  const fd = new FormData()
  fd.append('file', file)
  const res = await $fetch<{ data: { url: string, name: string } }>('/api/uploads', {
    method: 'POST',
    body: fd,
  })
  const alt = safeAlt(res.data.name)
  insertAtCursor(`\n![${alt}](${res.data.url})\n`)
}

async function uploadFiles(files: File[]) {
  const imgs = files.filter(f => f.type.startsWith('image/'))
  if (!imgs.length) return
  uploadError.value = ''
  uploading.value = true
  try {
    for (const f of imgs) await uploadOne(f)
  }
  catch (e) {
    uploadError.value = extractError(e, '이미지 업로드에 실패했습니다')
  }
  finally {
    uploading.value = false
  }
}

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  uploadFiles([...(input.files ?? [])])
  input.value = '' // 같은 파일 재선택 허용
}

function onDrop(e: DragEvent) {
  dragging.value = false
  uploadFiles([...(e.dataTransfer?.files ?? [])])
}

function onPaste(e: ClipboardEvent) {
  const files = [...(e.clipboardData?.items ?? [])]
    .filter(it => it.kind === 'file')
    .map(it => it.getAsFile())
    .filter((f): f is File => !!f && f.type.startsWith('image/'))
  if (files.length) {
    e.preventDefault()
    uploadFiles(files)
  }
}

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
.field-textarea {
  resize: vertical;
  min-height: 220px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  display: block;
}
.editor {
  position: relative;
  border-radius: var(--r-md, 8px);
}
.editor.dragover {
  outline: 2px dashed var(--accent-ink);
  outline-offset: 2px;
}
.editor-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.attach {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-700);
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-md, 8px);
  cursor: pointer;
}
.attach:hover:not(:disabled) {
  background: var(--ink-50);
}
.attach:disabled {
  opacity: 0.6;
  cursor: default;
}
.attach-ico {
  width: 15px;
  height: 15px;
}
.attach-hint {
  font-size: 12px;
  color: var(--ink-400);
}
.file-input {
  display: none;
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
