<script setup>
defineProps({ size: { type: Number, default: 28 }, light: Boolean, text: { type: Boolean, default: true } })
</script>

<template>
  <span class="logo" :style="{ color: light ? 'var(--side-text)' : 'var(--text)', fontSize: size * 0.8 + 'px' }">
    <svg viewBox="0 0 32 32" :width="size" :height="size" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#5f7556" />
      <path d="M9 23c0-8 5.5-13.5 14-13.5C22 18 17 23 9 23z" fill="#f5f2eb" />
      <path d="M9 23l7.5-7.5" stroke="#5f7556" stroke-width="1.8" stroke-linecap="round" />
    </svg>
    <span v-if="text">kuluri</span>
  </span>
</template>
