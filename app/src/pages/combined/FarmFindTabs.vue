<script setup>
// Farm: the hiring flow in one place – find workers, talk to them, agree the job.
// The season calendar moved to My farm (it shows the team's agreed periods).
import { computed } from 'vue'
import TabbedPage from '../../components/TabbedPage.vue'
import FindWorkers from '../farmer/FindWorkers.vue'
import FarmMessages from '../farmer/FarmMessages.vue'
import FarmAgreements from '../farmer/FarmAgreements.vue'
import { unreadFor } from '../../data/chats.js'

const unread = unreadFor('farm')
const tabs = computed(() => [
  { name: 'list', label: '1 · Matching workers', component: FindWorkers },
  { name: 'chats', label: `2 · Messages${unread.value ? ` (${unread.value})` : ''}`, component: FarmMessages },
  { name: 'agreements', label: '3 · Agreements', component: FarmAgreements },
])
</script>

<template><TabbedPage :tabs="tabs" /></template>
