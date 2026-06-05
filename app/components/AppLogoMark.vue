<script setup lang="ts">
// 브랜드 마크 — 말풍선 + 스파클 (이미지 로고 재현). currentColor 상속.
withDefaults(defineProps<{ size?: number }>(), { size: 15 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M7 18.5A7 7 0 1 0 4 15.2L2.5 20Z" />
    <path
      d="M19 3l.75 1.95L21.7 5.7l-1.95.75L19 8.4l-.75-1.95L16.3 5.7l1.95-.75z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
</template>
