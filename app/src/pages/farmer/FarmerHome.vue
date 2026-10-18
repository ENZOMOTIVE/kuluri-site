<script setup>
import { QPage } from 'quasar'
import { computed } from 'vue'
import KpiCard from '../../components/KpiCard.vue'
import SimulatedNote from '../../components/SimulatedNote.vue'
import { state, teamStats, fairRecord, matchWorkers, fmtShort } from '../../data/store.js'

defineProps({ embedded: Boolean }) // shown inside a TabbedPage

const openJobs = computed(() => state.jobs.filter((j) => j.status === 'Open'))
const matches = computed(() => openJobs.value.reduce((a, j) => a + matchWorkers(j).length, 0))
const invited = computed(() => Object.values(state.invitations).filter((v) => v === 'Invited').length)
const accepted = computed(() => Object.values(state.invitations).filter((v) => v === 'Accepted').length)

const todo = computed(() => [
  teamStats.value.pending && { icon: 'o_pending_actions', color: 'warning', text: `${teamStats.value.pending} work records waiting for worker confirmation`, to: '/farm/team' },
  teamStats.value.disputed && { icon: 'o_report', color: 'negative', text: `${teamStats.value.disputed} record disputed by a worker – please review`, to: '/farm/team' },
  teamStats.value.contractIssues && { icon: 'o_description', color: 'warning', text: `${teamStats.value.contractIssues} contracts missing or ending soon`, to: '/farm/team' },
].filter(Boolean))
</script>

<template>
  <component :is="embedded ? 'div' : QPage" class="page">
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <div class="text-muted q-mt-xs">Autumn 2026 · maize harvest and winter sowing</div>
    </div>
    <SimulatedNote />

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3"><KpiCard label="Open jobs" :value="openJobs.length" :sub="`${openJobs.reduce((a, j) => a + j.positions, 0)} positions`" icon="o_work_outline" /></div>
      <div class="col-6 col-md-3"><KpiCard label="Matching workers" :value="matches" :sub="`${invited} invited · ${accepted} accepted`" icon="o_person_search" /></div>
      <div class="col-6 col-md-3"><KpiCard label="Team this year" :value="teamStats.total" :sub="`${teamStats.hours.toLocaleString('en')} hours recorded`" icon="o_groups" /></div>
      <div class="col-6 col-md-3"><KpiCard label="Worker-confirmed" :value="`${teamStats.confirmed}/${teamStats.total}`" :sub="`${teamStats.pending} pending · ${teamStats.disputed} disputed`" icon="o_verified" /></div>
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-7">
        <div class="text-subtitle1 text-weight-bold q-mb-sm">To do</div>
        <div class="card">
          <q-list separator>
            <q-item v-for="t in todo" :key="t.text" clickable :to="t.to">
              <q-item-section avatar><q-icon :name="t.icon" :color="t.color" /></q-item-section>
              <q-item-section>{{ t.text }}</q-item-section>
              <q-item-section side><q-icon name="chevron_right" color="grey-6" /></q-item-section>
            </q-item>
          </q-list>
        </div>

        <div class="text-subtitle1 text-weight-bold q-mt-lg q-mb-sm">Open jobs</div>
        <div class="card">
          <q-list separator>
            <q-item v-for="j in openJobs" :key="j.id" clickable :to="{ path: '/farm/candidates', query: { job: j.id } }">
              <q-item-section avatar><q-avatar rounded class="bg-sage-soft text-primary" icon="o_grass" /></q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ j.title }}</q-item-label>
                <q-item-label caption>{{ fmtShort(j.start) }} – {{ fmtShort(j.end) }} · {{ j.positions }} position{{ j.positions > 1 ? 's' : '' }} · €{{ j.payPerHour.toFixed(2) }}/h</q-item-label>
              </q-item-section>
              <q-item-section side><q-badge rounded color="primary" :label="`${matchWorkers(j).length} matches`" /></q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>

      <div class="col-12 col-md-5">
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Your fair-employer record</div>
        <div class="card q-pa-lg">
          <div class="text-caption text-muted q-mb-md">What workers see about your farm. Built only from their own confirmations – no star ratings.</div>
          <div class="row items-center q-mb-md">
            <q-circular-progress show-value :value="fairRecord.confirmedShare" size="86px" :thickness="0.14" color="primary" track-color="grey-3" class="q-mr-lg text-weight-bold">{{ fairRecord.confirmedShare }}%</q-circular-progress>
            <div>
              <div class="text-weight-bold">Records confirmed by workers</div>
              <div class="text-caption text-muted">{{ fairRecord.confirmations }} confirmed · {{ fairRecord.disputes }} disputed</div>
            </div>
          </div>
          <q-separator class="q-my-md" />
          <div class="row q-col-gutter-md">
            <div class="col-6"><div class="kpi-label">Written terms</div><div class="text-h6 text-weight-bold">{{ fairRecord.writtenTerms }}%</div></div>
            <div class="col-6"><div class="kpi-label">Returning workers</div><div class="text-h6 text-weight-bold">{{ fairRecord.returning }}</div></div>
          </div>
          <div class="row items-center q-mt-md text-caption text-muted"><q-icon name="o_lock" class="q-mr-xs" /> Each confirmed record is fingerprinted, so it can’t be changed later.</div>
        </div>
      </div>
    </div>
  </component>
</template>
