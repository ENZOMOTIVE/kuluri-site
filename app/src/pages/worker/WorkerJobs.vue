<script setup>
// Compact job list. Tapping a job opens its detail page (details · location · agreement).
import { computed } from 'vue'
import { t } from '../../data/i18n.js'
import { state, fmtShort } from '../../data/store.js'
import { agreements, visibleToWorker } from '../../data/agreements.js'

const key = (j) => `${j.id}:${state.me}`
const mine = computed(() => state.jobs.filter((j) => state.invitations[key(j)]))
const others = computed(() => state.jobs.filter((j) => !state.invitations[key(j)] && j.status === 'Open'))
const agreementFor = (j) => agreements.find((a) => a.workerId === state.me && a.jobId === j.id && visibleToWorker(a))

function chip(j) {
  const a = agreementFor(j)
  if (a?.state === 'sent') return { label: t('toConfirm'), color: 'warning', icon: 'o_handshake' }
  if (a?.state === 'agreed') return { label: t('st_Agreed'), color: 'primary', icon: 'o_handshake' }
  const s = state.invitations[key(j)]
  if (s === 'Invited') return { label: t('invitedChip'), color: 'negative', icon: 'o_mail' }
  if (s === 'Accepted') return { label: t('acceptedChip'), color: 'primary', icon: 'check' }
  if (s === 'Declined') return { label: t('declined'), color: 'grey-7', icon: 'close' }
  return null
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-caption text-muted q-mb-sm"><q-icon name="o_info" /> {{ t('demo') }}</div>

    <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ t('myJobs') }}</div>
    <div v-for="j in mine" :key="j.id" class="card q-pa-md q-mb-sm cursor-pointer job" @click="$router.push(`/worker/job/${j.id}`)">
      <div class="row no-wrap items-start">
        <q-avatar rounded size="42px" class="bg-sage-soft text-primary q-mr-md" icon="o_grass" />
        <div class="col">
          <div class="text-weight-bold">{{ j.title }}</div>
          <div class="text-caption text-muted">FARM-13079 · {{ fmtShort(j.start) }} – {{ fmtShort(j.end) }}</div>
          <div class="row items-center q-gutter-x-sm q-mt-xs">
            <span class="text-weight-bold">€{{ j.payPerHour.toFixed(2) }}</span><span class="text-caption text-muted">{{ t('perHour') }}</span>
            <q-icon v-if="j.housing" name="o_home" color="primary" size="16px" />
          </div>
        </div>
        <q-icon name="chevron_right" color="grey-6" size="22px" />
      </div>
      <q-badge v-if="chip(j)" :color="chip(j).color" class="q-mt-sm q-px-sm q-py-xs"><q-icon :name="chip(j).icon" size="13px" class="q-mr-xs" />{{ chip(j).label }}</q-badge>
    </div>

    <div class="text-subtitle2 text-weight-bold q-mb-sm q-mt-lg">{{ t('otherJobs') }}</div>
    <div v-for="j in others" :key="j.id" class="card q-pa-md q-mb-sm cursor-pointer job" @click="$router.push(`/worker/job/${j.id}`)">
      <div class="row no-wrap items-center">
        <div class="col">
          <div class="text-weight-bold">{{ j.title }}</div>
          <div class="text-caption text-muted">FARM-13079 · {{ fmtShort(j.start) }} – {{ fmtShort(j.end) }} · €{{ j.payPerHour.toFixed(2) }} {{ t('perHour') }}</div>
        </div>
        <q-icon name="chevron_right" color="grey-6" size="22px" />
      </div>
    </div>

    <div class="text-caption text-muted q-mt-lg"><q-icon name="o_paid" class="q-mr-xs" />{{ t('free') }}</div>
  </q-page>
</template>

<style scoped>
.job { transition: border-color 0.15s; }
.job:active, .job:hover { border-color: #a9b99e; }
</style>
