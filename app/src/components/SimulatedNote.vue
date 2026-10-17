<script setup>
defineProps({ text: { type: String, default: 'Worker and job data on this screen are simulated – the organisers’ dataset has no seasonal workers or job posts.' } })
</script>

<template>
  <div class="row no-wrap items-center q-gutter-x-sm q-px-md q-py-sm rounded bg-surface-2 text-caption text-muted q-mb-lg" style="border: 1px dashed var(--line)">
    <q-icon name="o_info" size="18px" />
    <span>{{ text }}</span>
  </div>
</template>
