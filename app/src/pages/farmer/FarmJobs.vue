<script setup>
// Job postings: the farm's jobs – publish, edit, close or reopen, and jump to the candidates for a job.
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
    <div class="page-header row items-end justify-between q-gutter-y-sm">
      <div>
        <h1 class="page-title">Job postings</h1>
        <div class="text-muted q-mt-xs">Publish seasonal jobs. Pay, hours and housing are always visible to workers.</div>
      </div>
      <q-btn unelevated color="primary" icon="add" label="New job posting" no-caps @click="openNew" />
    </div>

    <div class="card">
      <q-list separator>
        <q-item v-for="r in rows" :key="r.job.id" class="q-py-md">
          <q-item-section avatar><q-avatar rounded size="42px" class="bg-sage-soft text-primary" icon="o_grass" /></q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">{{ r.job.title }}</q-item-label>
            <q-item-label caption>{{ fmtShort(r.job.start) }} – {{ fmtShort(r.job.end) }} · {{ r.job.positions }} position{{ r.job.positions > 1 ? 's' : '' }} · €{{ r.job.payPerHour.toFixed(2) }}/h gross · {{ r.job.hoursPerWeek }} h/week<template v-if="r.job.housing"> · housing</template></q-item-label>
          </q-item-section>
          <q-item-section class="gt-sm" style="max-width: 300px">
            <q-item-label caption>{{ r.candidates }} candidates · {{ r.invited }} invited · {{ r.accepted }} accepted</q-item-label>
            <q-item-label caption :class="r.agreed >= r.job.positions ? 'verified' : ''">{{ r.agreed }} of {{ r.job.positions }} contracts agreed</q-item-label>
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
