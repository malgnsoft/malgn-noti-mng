<template>
  <div>
    <div
      class="editor"
      :class="{ dragover: dragging }"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <textarea
        ref="el"
        class="editor-input"
        :class="{ mono }"
        :rows="rows"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :style="minHeight ? { minHeight } : undefined"
        @input="onInput"
        @paste="onPaste"
      />
      <div class="editor-bar">
        <button
          type="button"
          class="attach"
          :disabled="uploading || disabled"
          @click="fileEl?.click()"
        >
          <UIcon name="i-lucide-image-plus" class="attach-ico" />
          {{ uploading ? '업로드 중…' : '이미지 첨부' }}
        </button>
        <span class="attach-hint">PNG·JPG·GIF·WEBP · 5MB 이하 · 드래그/붙여넣기 · 마크다운 지원</span>
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
    <p v-if="uploadError" class="editor-error" role="alert">{{ uploadError }}</p>
  </div>
</template>

<script setup lang="ts">
// 마크다운 입력 + 이미지 첨부(버튼·드래그·붙여넣기) 공용 에디터.
// 이슈 본문(AppIssueForm)·이슈 답글에서 동일하게 사용 → 업로드/삽입 동작 일관.
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  mono?: boolean // 본문처럼 모노스페이스로
  minHeight?: string
}>(), {
  placeholder: '',
  rows: 6,
  disabled: false,
  mono: false,
  minHeight: '',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const el = ref<HTMLTextAreaElement>()
const fileEl = ref<HTMLInputElement>()
const uploading = ref(false)
const uploadError = ref('')
const dragging = ref(false)

const ALLOWED = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

// 커서 위치(또는 끝)에 텍스트 삽입 후 캐럿을 삽입 끝으로 이동.
function insertAtCursor(text: string) {
  const t = el.value
  const cur = props.modelValue
  if (!t) { emit('update:modelValue', cur + text); return }
  const start = t.selectionStart ?? cur.length
  const end = t.selectionEnd ?? cur.length
  emit('update:modelValue', cur.slice(0, start) + text + cur.slice(end))
  nextTick(() => {
    t.focus()
    const pos = start + text.length
    t.setSelectionRange(pos, pos)
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
  insertAtCursor(`\n![${safeAlt(res.data.name)}](${res.data.url})\n`)
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
</script>

<style scoped>
.editor {
  position: relative;
  border-radius: var(--r-md, 8px);
}
.editor.dragover {
  outline: 2px dashed var(--accent-ink);
  outline-offset: 2px;
}
.editor-input {
  display: block;
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--ink-900);
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--r-md, 8px);
  outline: none;
  resize: vertical;
  line-height: 1.55;
}
.editor-input.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}
.editor-input:focus {
  border-color: var(--accent-ink);
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.editor-input:disabled {
  background: var(--ink-50);
  cursor: not-allowed;
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
.editor-error {
  margin-top: 6px;
  font-size: 13px;
  color: #dc2626;
}
</style>
