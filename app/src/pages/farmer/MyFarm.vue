<script setup>
// Team: the farm's workers, their contracts and confirmations. Click a worker for their CV and contract.
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import KpiCard from '../../components/KpiCard.vue'
import SimulatedNote from '../../components/SimulatedNote.vue'
import WorkerCvDialog from '../../components/WorkerCvDialog.vue'
import { buildTeamExport, buildTeamPdf, downloadJson } from '../../utils/teamExport.js'
import { sharePdf } from '../../utils/share.js'
import { state, teamStats, farm } from '../../data/store.js'

const $q = useQuasar()

// ---- Team
const columns = [
  { name: 'name', label: 'Worker', field: 'name', align: 'left', sortable: true },
  { name: 'type', label: 'Type', field: 'type', align: 'left', sortable: true },
  { name: 'role', label: 'Role', field: 'role', align: 'left' },
  { name: 'period', label: 'Period', field: 'period', align: 'left' },
  { name: 'hours', label: 'Hours', field: 'hours', align: 'right', sortable: true },
  { name: 'contract', label: 'Contract', field: 'contract', align: 'left', sortable: true },
  { name: 'confirmation', label: 'Worker confirmation', field: 'confirmation', align: 'left', sortable: true },
]
const contractColor = { Valid: 'primary', Ended: 'grey-7', 'Ends soon': 'warning', Missing: 'negative', 'Starts soon': 'accent' }
const confColor = { Confirmed: 'primary', Pending: 'warning', Disputed: 'negative', 'Not started': 'grey-6' }
const confIcon = { Confirmed: 'verified', Pending: 'o_schedule', Disputed: 'o_report', 'Not started': 'o_event' }
const filter = ref('')
const selected = ref(null) // team member whose CV + agreement is open

// ---- Export the team (e.g. for a tax consultant): PDF report or JSON data
const showExport = ref(false)
const exp = ref({ format: 'pdf', cv: true, contracts: true })
const exporting = ref(false)
async function doExport() {
  exporting.value = true
  try {
    const data = buildTeamExport(exp.value)
    const name = `Kuluri_team_${data.farm.id}_${data.exportedAt.slice(0, 10)}`
    if (exp.value.format === 'json') {
      downloadJson(data, `${name}.json`)
      $q.notify({ type: 'positive', message: 'Team data downloaded (JSON).' })
    } else {
      const res = await sharePdf(buildTeamPdf(data), `${name}.pdf`, 'Kuluri team records')
      if (res !== 'cancelled') $q.notify({ type: 'positive', message: res === 'shared' ? 'Team report ready to share.' : 'Team report downloaded (PDF).' })
    }
    showExport.value = false
  } finally { exporting.value = false }
}
function remind() {
  $q.notify({ type: 'positive', icon: 'o_sms', message: `Confirmation link sent to ${teamStats.value.pending} workers, each in their own language.` })
}

</script>

<template>
  <q-page class="page">
    <div class="page-header row items-end justify-between q-gutter-y-sm">
      <div>
        <h1 class="page-title">Team</h1>
        <div class="text-muted q-mt-xs">{{ farm.id }} · {{ farm.region }}</div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn outline color="primary" icon="o_file_download" label="Export" no-caps @click="showExport = true" />
        <q-btn unelevated color="primary" icon="o_send" label="Send confirmation links" no-caps @click="remind" />
      </div>
    </div>


        <SimulatedNote text="Regular workers and their hours come from the dataset (synthetic_labour, FARM-13079). Seasonal workers, contracts and confirmations are simulated." />
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-6 col-md-3"><KpiCard label="Workers" :value="teamStats.total" :sub="`${teamStats.hours.toLocaleString('en')} hours`" icon="o_groups" /></div>
          <div class="col-6 col-md-3"><KpiCard label="Confirmed" :value="teamStats.confirmed" sub="by the workers themselves" icon="verified" /></div>
          <div class="col-6 col-md-3"><KpiCard label="Pending / disputed" :value="`${teamStats.pending} / ${teamStats.disputed}`" sub="disputes are anonymous" icon="o_pending_actions" color="warning" /></div>
          <div class="col-6 col-md-3"><KpiCard label="Contract issues" :value="teamStats.contractIssues" sub="missing or ending soon" icon="o_description" color="negative" /></div>
        </div>
        <q-table flat bordered class="rounded cursor-pointer" :rows="state.team" :columns="columns" row-key="id" :filter="filter" :pagination="{ rowsPerPage: 0 }" hide-bottom @row-click="(_, row) => (selected = row)">
          <template #top>
            <div class="text-subtitle1 text-weight-bold">Team 2026</div>
            <q-space />
            <q-input dense outlined v-model="filter" placeholder="Search" style="width: 200px"><template #prepend><q-icon name="search" /></template></q-input>
          </template>
          <template #body-cell-name="p"><q-td :props="p"><span class="text-weight-bold text-primary">{{ p.value }}</span><q-icon name="o_badge" size="14px" color="grey-6" class="q-ml-xs" /></q-td></template>
          <template #body-cell-contract="p"><q-td :props="p"><q-badge outline :color="contractColor[p.value]" :label="p.value" /></q-td></template>
          <template #body-cell-confirmation="p">
            <q-td :props="p"><q-badge :color="confColor[p.value]" class="q-px-sm q-py-xs"><q-icon :name="confIcon[p.value]" size="13px" class="q-mr-xs" />{{ p.value }}</q-badge></q-td>
          </template>
        </q-table>
        <div class="row items-center q-mt-md text-caption text-muted">
          <q-icon name="o_shield" class="q-mr-xs" /> Click a worker to see their CV and contract. Workers confirm their own records.
        </div>
        <WorkerCvDialog :member="selected" @close="selected = null" />

        <!-- Export dialog -->
        <q-dialog v-model="showExport">
          <q-card style="width: 480px; max-width: 95vw" class="rounded">
            <q-card-section>
              <div class="text-h6 text-weight-bold">Export team</div>
              <div class="text-caption text-muted">All {{ state.team.length }} team members with their records – for example to share with your tax consultant.</div>
            </q-card-section>
            <q-card-section class="q-pt-none column q-gutter-sm">
              <div class="text-subtitle2 text-weight-bold">Format</div>
              <q-option-group v-model="exp.format" color="primary" inline
                :options="[{ label: 'PDF report', value: 'pdf' }, { label: 'JSON data', value: 'json' }]" />
              <div class="text-subtitle2 text-weight-bold q-mt-sm">Include</div>
              <q-checkbox v-model="exp.cv" color="primary" label="CVs (only what each worker shares)" />
              <q-checkbox v-model="exp.contracts" color="primary" label="Job agreements with confirmations and fingerprint" />
              <div class="text-caption text-muted">Always included: name, role, period, hours recorded, contract status, worker confirmation.</div>
              <q-banner dense rounded class="bg-surface-2 text-caption q-mt-sm">
                <template #avatar><q-icon name="o_lock" color="primary" /></template>
                Contains personal data. Share it only with your tax consultant or another authorised adviser, and store it securely.
              </q-banner>
            </q-card-section>
            <q-card-actions align="right" class="q-pa-md">
              <q-btn flat no-caps label="Cancel" v-close-popup />
              <q-btn unelevated no-caps color="primary" icon="o_file_download" :label="exp.format === 'pdf' ? 'Download PDF' : 'Download JSON'" :loading="exporting" @click="doExport" />
            </q-card-actions>
          </q-card>
        </q-dialog>
  </q-page>
</template>
