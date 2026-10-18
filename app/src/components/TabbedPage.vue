<script setup>
// Combines several existing screens into one, as tabs. Each screen is rendered with `embedded`
// (no own q-page). The active tab follows ?tab= so old links can point at a tab.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  tabs: { type: Array, required: true }, // [{ name, label, icon, component }]
  phone: { type: Boolean, default: false }, // worker app (compact tabs)
})
const route = useRoute()
const router = useRouter()
const tab = computed({
  get: () => (props.tabs.some((x) => x.name === route.query.tab) ? route.query.tab : props.tabs[0].name),
  set: (name) => router.replace({ query: { tab: name } }),
})
const current = computed(() => props.tabs.find((x) => x.name === tab.value))
</script>

<template>
  <q-page>
    <div v-if="tabs.length > 1" :class="phone ? 'q-px-md q-pt-md' : 'tabbed-bar'">
      <q-tabs v-model="tab" dense no-caps :align="phone ? 'justify' : 'left'" active-color="primary" indicator-color="primary" class="text-grey-8" :class="{ card: phone }">
        <q-tab v-for="x in tabs" :key="x.name" :name="x.name" :icon="phone ? x.icon : undefined" :label="x.label" />
      </q-tabs>
    </div>
    <keep-alive>
      <component :is="current.component" :key="current.name" embedded />
    </keep-alive>
  </q-page>
</template>

<style scoped>
.tabbed-bar { max-width: 1240px; margin: 0 auto; padding: 16px 32px 0; border-bottom: 1px solid var(--line); }
</style>
