<script setup>
// Worker: Timesheets – confirm the week, and earnings
import { computed } from 'vue'
import TabbedPage from '../../components/TabbedPage.vue'
import WorkerEarnings from '../worker/WorkerEarnings.vue'
import WorkerConfirm from '../worker/WorkerConfirm.vue'
import { t } from '../../data/i18n.js'

const tabs = computed(() => [
  { name: 'confirm', label: t('confirmWeekShort'), icon: 'o_task_alt', component: WorkerConfirm },
  { name: 'earnings', label: t('earnings'), icon: 'o_account_balance_wallet', component: WorkerEarnings },
])
</script>

<template><TabbedPage :tabs="tabs" phone /></template>
