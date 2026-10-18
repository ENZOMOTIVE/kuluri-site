<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import JobFormDialog from '../../components/JobFormDialog.vue'
import { state, matchWorkers, fmtShort } from '../../data/store.js'
import { agreements } from '../../data/agreements.js'

const $q = useQuasar()
const showForm = ref(false)
const editing = ref(null)

const rows = computed(() => state.jobs.map((j) => {
  const inv = Object.entries(state.invitations).filter(([k]) => k.startsWith(`${j.id}:`)).map(([, v]) => v)
  return {
    job: j,
    candidates: j.status === 'Open' ? matchWorkers(j).length : 0,
    invited: inv.filter((v) => v === 'Invited').length,
    accepted: inv.filter((v) => v === 'Accepted').length,
    agreed: agreements.filter((a) => a.jobId === j.id && ['agreed', 'completed'].includes(a.state)).length,
  }
}))

function openNew() { editing.value = null; showForm.value = true }
function openEdit(j) { editing.value = j; showForm.value = true }
function save(data) {
  if (editing.value) {
    Object.assign(editing.value, data)
    $q.notify({ type: 'positive', message: 'Job posting updated.' })
  } else {
    const id = `J-${String(state.jobs.length + 1).padStart(2, '0')}`
    state.jobs.unshift({ ...data, id, status: 'Open' })
    $q.notify({ type: 'positive', message: 'Job published – matching candidates are ready.' })
  }
}
function toggle(j) { j.status = j.status === 'Open' ? 'Closed' : 'Open' }
</script>

<template>
  <q-page class="page">
    <div class="page-header row items-center justify-between q-gutter-y-sm">
      <div>
        <h1 class="page-title">Job postings</h1>
        <div class="text-muted q-mt-xs">Pay, hours and housing are always visible to workers.</div>
      </div>
      <q-btn unelevated color="primary" icon="add" label="New job" no-caps @click="openNew" />
    </div>

    <!-- Mobile card list -->
    <div v-if="$q.screen.lt.md" class="q-col-gutter-md">
      <div v-if="!rows.length" class="text-muted text-center q-pa-xl">No job postings yet.</div>
      <div v-for="r in rows" :key="r.job.id" class="job-card">
        <div class="job-card-top">
          <q-avatar rounded size="40px" class="bg-sage-soft text-primary q-mr-sm" icon="o_grass" />
          <div class="col">
            <div class="job-card-title">{{ r.job.title }}</div>
            <div class="job-card-meta">{{ fmtShort(r.job.start) }} – {{ fmtShort(r.job.end) }}</div>
          </div>
          <q-badge :color="r.job.status === 'Open' ? 'primary' : 'grey-6'" :label="r.job.status" class="q-ml-sm" />
        </div>

        <div class="job-card-pills">
          <span class="pill">€{{ r.job.payPerHour.toFixed(2) }}/h</span>
          <span class="pill">{{ r.job.hoursPerWeek }}h/wk</span>
          <span class="pill">{{ r.job.positions }} pos.</span>
          <span v-if="r.job.housing" class="pill pill--green">Housing</span>
        </div>

        <div v-if="r.job.status === 'Open'" class="job-card-stats">
          <span>{{ r.candidates }} candidates</span>
          <span>{{ r.invited }} invited</span>
          <span :class="r.agreed >= r.job.positions ? 'text-positive' : ''">{{ r.agreed }}/{{ r.job.positions }} agreed</span>
        </div>

        <div class="job-card-actions">
          <q-btn v-if="r.job.status === 'Open'" unelevated dense no-caps color="primary" label="View candidates" icon-right="chevron_right" class="q-px-sm col" :to="{ path: '/farm/candidates', query: { job: r.job.id } }" />
          <q-btn flat round dense icon="o_edit" color="grey-7" @click="openEdit(r.job)" />
          <q-btn flat round dense :icon="r.job.status === 'Open' ? 'o_block' : 'o_replay'" color="grey-7" @click="toggle(r.job)">
            <q-tooltip>{{ r.job.status === 'Open' ? 'Close posting' : 'Reopen posting' }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Desktop table list -->
    <div v-else class="card">
      <q-list separator>
        <q-item v-for="r in rows" :key="r.job.id" class="q-py-md">
          <q-item-section avatar><q-avatar rounded size="42px" class="bg-sage-soft text-primary" icon="o_grass" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">{{ r.job.title }}</q-item-label>
            <q-item-label caption>{{ fmtShort(r.job.start) }} – {{ fmtShort(r.job.end) }} · {{ r.job.positions }} position{{ r.job.positions > 1 ? 's' : '' }} · €{{ r.job.payPerHour.toFixed(2) }}/h gross · {{ r.job.hoursPerWeek }} h/week<template v-if="r.job.housing"> · housing</template></q-item-label>
          </q-item-section>
          <q-item-section style="max-width: 300px">
            <q-item-label caption>{{ r.candidates }} candidates · {{ r.invited }} invited · {{ r.accepted }} accepted</q-item-label>
            <q-item-label caption :class="r.agreed >= r.job.positions ? 'text-positive' : ''">{{ r.agreed }} of {{ r.job.positions }} contracts agreed</q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row items-center no-wrap q-gutter-x-sm">
              <q-badge :color="r.job.status === 'Open' ? 'primary' : 'grey-6'" :label="r.job.status" />
              <q-btn v-if="r.job.status === 'Open'" unelevated dense no-caps color="primary" label="Candidates" icon-right="chevron_right" class="q-px-sm" :to="{ path: '/farm/candidates', query: { job: r.job.id } }" />
              <q-btn flat round dense icon="more_vert" color="grey-7">
                <q-menu auto-close>
                  <q-list dense style="min-width: 160px">
                    <q-item clickable @click="openEdit(r.job)"><q-item-section avatar><q-icon name="o_edit" /></q-item-section><q-item-section>Edit</q-item-section></q-item>
                    <q-item clickable @click="toggle(r.job)"><q-item-section avatar><q-icon :name="r.job.status === 'Open' ? 'o_block' : 'o_replay'" /></q-item-section><q-item-section>{{ r.job.status === 'Open' ? 'Close posting' : 'Reopen posting' }}</q-item-section></q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
        <q-item v-if="!rows.length"><q-item-section class="text-muted text-center q-pa-md">No job postings yet.</q-item-section></q-item>
      </q-list>
    </div>

    <JobFormDialog v-model="showForm" :job="editing" @save="save" />
  </q-page>
</template>

<style scoped>
.job-card {
  background: #fff;
  border-radius: 14px;
  margin: 0 0 12px;
  padding: 14px 14px 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.job-card-top {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.job-card-title {
  font-size: 15px;
  font-weight: 600;
  color: #111;
  line-height: 1.3;
}
.job-card-meta {
  font-size: 12px;
  color: #8e8e93;
  margin-top: 1px;
}
.job-card-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.pill {
  font-size: 12px;
  font-weight: 500;
  background: #f0f0f5;
  color: #444;
  border-radius: 20px;
  padding: 3px 10px;
}
.pill--green {
  background: #e0f5d5;
  color: #163300;
}
.job-card-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #8e8e93;
  margin-bottom: 10px;
}
.job-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  border-top: 0.5px solid #f0f0f0;
  padding-top: 8px;
  margin-top: 2px;
}
</style>
