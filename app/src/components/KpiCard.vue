<script setup>
defineProps({ label: String, value: [String, Number], sub: String, icon: String, color: { type: String, default: 'primary' } })
</script>

<template>
  <div class="card q-pa-md full-height">
    <div class="row no-wrap items-start justify-between">
      <div>
        <div class="kpi-label">{{ label }}</div>
        <div class="kpi-value">{{ value }}</div>
        <div v-if="sub" class="text-caption text-muted">{{ sub }}</div>
      </div>
      <q-avatar v-if="icon" size="38px" rounded :class="`bg-sage-soft text-${color}`" :icon="icon" font-size="20px" />
    </div>
  </div>
</template>
