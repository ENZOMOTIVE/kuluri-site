<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import KpiCard from '../../components/KpiCard.vue'
import SimulatedNote from '../../components/SimulatedNote.vue'
import { state, teamStats } from '../../data/store.js'

const $q = useQuasar()
const columns = [
  { name: 'name', label: 'Worker', field: 'name', align: 'left', sortable: true },
  { name: 'type', label: 'Type', field: 'type', align: 'left', sortable: true },
  { name: 'role', label: 'Role', field: 'role', align: 'left' },
  { name: 'period', label: 'Period', field: 'period', align: 'left' },
  { name: 'hours', label: 'Hours', field: 'hours', align: 'right', sortable: true },
  { name: 'contract', label: 'Contract', field: 'contract', align: 'left', sortable: true },
  { name: 'confirmation', label: 'Worker confirmation', field: 'confirmation', align: 'left', sortable: true },
  { name: 'source', label: 'Data', field: 'source', align: 'left' },
]
const contractColor = { Valid: 'primary', Ended: 'grey-7', 'Ends soon': 'warning', Missing: 'negative' }
const confColor = { Confirmed: 'primary', Pending: 'warning', Disputed: 'negative' }
const confIcon = { Confirmed: 'verified', Pending: 'o_schedule', Disputed: 'o_report' }

const filter = ref('')
function remind() {
  $q.notify({ type: 'positive', icon: 'o_sms', message: `Confirmation link sent to ${teamStats.value.pending} workers, each in their own language.` })
}
</script>

<template>
  <q-page class="page">
    <div class="page-header row items-end justify-between q-gutter-y-sm">
      <div>
        <h1 class="page-title">My workers</h1>
        <div class="text-muted q-mt-xs">Everyone working on the farm this year, their contract status and whether they confirmed their records.</div>
      </div>
      <q-btn unelevated color="primary" icon="o_send" label="Send confirmation links" no-caps @click="remind" />
    </div>
    <SimulatedNote text="Regular workers and their hours come from the dataset (synthetic_labour, FARM-13079). Seasonal workers, contracts and confirmations are simulated." />

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3"><KpiCard label="Workers" :value="teamStats.total" :sub="`${teamStats.hours.toLocaleString('en')} hours`" icon="o_groups" /></div>
      <div class="col-6 col-md-3"><KpiCard label="Confirmed" :value="teamStats.confirmed" sub="by the workers themselves" icon="verified" /></div>
      <div class="col-6 col-md-3"><KpiCard label="Pending / disputed" :value="`${teamStats.pending} / ${teamStats.disputed}`" sub="disputes are anonymous" icon="o_pending_actions" color="warning" /></div>
      <div class="col-6 col-md-3"><KpiCard label="Contract issues" :value="teamStats.contractIssues" sub="missing or ending soon" icon="o_description" color="negative" /></div>
    </div>

    <q-table flat bordered class="rounded" :rows="state.team" :columns="columns" row-key="id" :filter="filter" :pagination="{ rowsPerPage: 0 }" hide-bottom>
      <template #top>
        <div class="text-subtitle1 text-weight-bold">Team 2026</div>
        <q-space />
        <q-input dense outlined v-model="filter" placeholder="Search" style="width: 200px"><template #prepend><q-icon name="search" /></template></q-input>
      </template>
      <template #body-cell-name="p"><q-td :props="p"><span class="text-weight-bold">{{ p.value }}</span></q-td></template>
      <template #body-cell-contract="p"><q-td :props="p"><q-badge outline :color="contractColor[p.value]" :label="p.value" /></q-td></template>
      <template #body-cell-confirmation="p">
        <q-td :props="p"><q-badge :color="confColor[p.value]" class="q-px-sm q-py-xs"><q-icon :name="confIcon[p.value]" size="13px" class="q-mr-xs" />{{ p.value }}</q-badge></q-td>
      </template>
      <template #body-cell-source="p"><q-td :props="p"><span class="mono text-muted">{{ p.value }}</span></q-td></template>
    </q-table>

    <div class="row items-center q-mt-md text-caption text-muted">
      <q-icon name="o_shield" class="q-mr-xs" /> Buyers only ever see totals from this table, never names or pay. Contracts are tracked here, not written by Kuluri.
    </div>
  </q-page>
</template>
