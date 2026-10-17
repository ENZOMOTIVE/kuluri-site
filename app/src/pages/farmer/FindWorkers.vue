<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import SimulatedNote from '../../components/SimulatedNote.vue'
import { state, matchWorkers, SKILLS, LANGS, cropName, farm, fmtShort } from '../../data/store.js'

const $q = useQuasar()
const selectedId = ref(state.jobs[0]?.id)
const job = computed(() => state.jobs.find((j) => j.id === selectedId.value))
const matches = computed(() => (job.value ? matchWorkers(job.value) : []))

const inviteKey = (w) => `${job.value.id}:${w.id}`
function invite(w) {
  state.invitations[inviteKey(w)] = 'Invited'
  $q.notify({ type: 'positive', icon: 'o_send', message: `Invitation sent to ${w.name} – in ${w.languages[0]}, with pay, dates and housing.` })
}

// ---- Post a job dialog
const showPost = ref(false)
const empty = () => ({ title: '', crop: farm.crops[0], tasks: [], start: '', end: '', positions: 1, payPerHour: 12, hoursPerWeek: 40, housing: false, languages: ['Italian'] })
const draft = ref(empty())
function postJob() {
  const id = `J-${String(state.jobs.length + 1).padStart(2, '0')}`
  state.jobs.unshift({ ...draft.value, id, status: 'Open' })
  selectedId.value = id
  showPost.value = false
  draft.value = empty()
  $q.notify({ type: 'positive', message: 'Job posted. Matching workers are shown on the right.' })
}
const valid = computed(() => draft.value.title && draft.value.tasks.length && draft.value.start && draft.value.end)

// ---- Worker profile dialog
const profile = ref(null)
</script>

<template>
  <q-page class="page">
    <div class="page-header row items-end justify-between q-gutter-y-sm">
      <div>
        <h1 class="page-title">Find workers</h1>
        <div class="text-muted q-mt-xs">Post a job and see workers whose experience is confirmed by other farms.</div>
      </div>
      <q-btn unelevated color="primary" icon="add" label="Post a job" no-caps @click="showPost = true" />
    </div>
    <SimulatedNote />

    <div class="row q-col-gutter-lg">
      <!-- Jobs -->
      <div class="col-12 col-md-4">
        <div class="text-subtitle1 text-weight-bold q-mb-sm">Your jobs</div>
        <div class="column q-gutter-sm">
          <div v-for="j in state.jobs" :key="j.id" class="card q-pa-md cursor-pointer job-card" :class="{ selected: j.id === selectedId }" @click="selectedId = j.id">
            <div class="row no-wrap items-start justify-between">
              <div class="text-weight-bold">{{ j.title }}</div>
              <q-badge rounded color="primary" class="q-ml-sm" :label="j.status" />
            </div>
            <div class="text-caption text-muted q-mt-xs">{{ fmtShort(j.start) }} – {{ fmtShort(j.end) }} · {{ j.positions }} position{{ j.positions > 1 ? 's' : '' }}</div>
            <div class="row q-gutter-xs q-mt-sm">
              <q-chip dense square class="chip-soft" icon="o_euro">{{ j.payPerHour.toFixed(2) }}/h gross</q-chip>
              <q-chip dense square class="chip-soft" icon="o_schedule">{{ j.hoursPerWeek }} h/week</q-chip>
              <q-chip v-if="j.housing" dense square class="chip-soft" icon="o_home">Housing</q-chip>
            </div>
          </div>
        </div>
      </div>

      <!-- Matches -->
      <div class="col-12 col-md-8" v-if="job">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle1 text-weight-bold">{{ matches.length }} matching workers for “{{ job.title }}”</div>
        </div>
        <div class="row items-center text-caption text-muted q-mb-md">
          <q-icon name="o_balance" class="q-mr-xs" /> Matching uses skills, availability, languages and distance only – never nationality, age or gender.
        </div>

        <div class="column q-gutter-md">
          <div v-for="m in matches" :key="m.worker.id" class="card q-pa-md">
            <div class="row no-wrap items-start q-gutter-x-md">
              <q-avatar size="48px" class="bg-sage-soft text-primary text-weight-bold">{{ m.worker.name.split(' ').map((s) => s[0]).join('') }}</q-avatar>
              <div class="col">
                <div class="row items-center q-gutter-x-sm">
                  <span class="text-weight-bold text-body1">{{ m.worker.name }}</span>
                  <q-badge v-if="m.verifiedCount" outline color="primary"><q-icon name="verified" size="12px" class="q-mr-xs" />{{ m.verifiedCount }} verified · {{ m.verifiedHours }} h</q-badge>
                  <q-badge v-else outline color="grey-7">New – no verified jobs yet</q-badge>
                </div>
                <div class="text-caption text-muted">{{ m.worker.base }} · available {{ fmtShort(m.worker.available[0]) }} – {{ fmtShort(m.worker.available[1]) }}</div>
                <div class="row q-gutter-xs q-mt-sm">
                  <q-chip v-for="s in m.worker.skills" :key="s" dense square :class="job.tasks.includes(s) ? 'bg-sage-soft text-primary' : 'chip-soft'">{{ s }}</q-chip>
                  <q-chip v-for="l in m.worker.languages" :key="l" dense square class="chip-soft" icon="o_translate">{{ l }}</q-chip>
                </div>
                <div class="text-caption q-mt-sm"><span class="text-weight-bold">Why: </span><span class="text-muted">{{ m.reasons.join(' · ') }}</span></div>
              </div>
              <div class="column items-end q-gutter-y-sm" style="min-width: 128px">
                <div class="text-right"><div class="kpi-label">Match</div><div class="text-h6 text-weight-bold">{{ m.score }}%</div></div>
                <q-btn v-if="!state.invitations[inviteKey(m.worker)]" unelevated color="primary" size="sm" no-caps icon="o_send" label="Invite" @click="invite(m.worker)" />
                <q-badge v-else color="accent" class="q-pa-sm">{{ state.invitations[inviteKey(m.worker)] }}</q-badge>
                <q-btn flat dense size="sm" no-caps color="primary" label="View profile" @click="profile = m.worker" />
              </div>
            </div>
          </div>
          <div v-if="!matches.length" class="card q-pa-lg text-center text-muted">No matching workers yet. Try more languages or a longer period.</div>
        </div>
      </div>
    </div>

    <!-- Post a job -->
    <q-dialog v-model="showPost">
      <q-card style="width: 640px; max-width: 95vw" class="rounded">
        <q-card-section class="row items-center"><div class="text-h6 text-weight-bold">Post a job</div><q-space /><q-btn flat round dense icon="close" v-close-popup /></q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <q-input class="col-12" outlined dense v-model="draft.title" label="Job title" placeholder="e.g. Sunflower harvest – grain handling" />
            <q-select class="col-6" outlined dense v-model="draft.crop" :options="farm.crops" label="Crop" />
            <q-input class="col-6" outlined dense type="number" v-model.number="draft.positions" label="Positions" min="1" />
            <q-select class="col-12" outlined dense v-model="draft.tasks" :options="SKILLS" multiple use-chips label="Tasks / skills needed" />
            <q-input class="col-6" outlined dense type="date" v-model="draft.start" label="Start" stack-label />
            <q-input class="col-6" outlined dense type="date" v-model="draft.end" label="End" stack-label />
            <q-input class="col-6" outlined dense type="number" step="0.5" v-model.number="draft.payPerHour" label="Pay per hour (gross €)" />
            <q-input class="col-6" outlined dense type="number" v-model.number="draft.hoursPerWeek" label="Hours per week" />
            <q-select class="col-12" outlined dense v-model="draft.languages" :options="LANGS" multiple use-chips label="Languages spoken on the farm" />
            <q-toggle class="col-12" v-model="draft.housing" label="Housing provided" color="primary" />
          </div>
          <div class="text-caption text-muted q-mt-sm"><q-icon name="o_visibility" /> Pay, hours and housing are always shown to workers. Kuluri is free for workers – no fees.</div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn unelevated no-caps color="primary" label="Post job" :disable="!valid" @click="postJob" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Worker profile -->
    <q-dialog :model-value="!!profile" @update:model-value="profile = null">
      <q-card v-if="profile" style="width: 560px; max-width: 95vw" class="rounded">
        <q-card-section class="row items-center no-wrap">
          <q-avatar size="48px" class="bg-sage-soft text-primary text-weight-bold q-mr-md">{{ profile.name.split(' ').map((s) => s[0]).join('') }}</q-avatar>
          <div><div class="text-h6 text-weight-bold">{{ profile.name }}</div><div class="text-caption text-muted">{{ profile.base }}</div></div>
          <q-space /><q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-weight-bold q-mb-sm">Verified work history</div>
          <q-list bordered separator class="rounded">
            <q-item v-for="(h, i) in profile.history" :key="i">
              <q-item-section avatar><q-icon :name="h.confirmed ? 'verified' : 'o_hourglass_empty'" :color="h.confirmed ? 'primary' : 'grey-6'" /></q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ h.crop }} · {{ h.season }}</q-item-label>
                <q-item-label caption>{{ h.farm }} · {{ h.hours }} hours</q-item-label>
              </q-item-section>
              <q-item-section side><span class="text-caption" :class="h.confirmed ? 'verified' : 'text-muted'">{{ h.confirmed ? 'Confirmed by worker & farm' : 'Not confirmed' }}</span></q-item-section>
            </q-item>
            <q-item v-if="!profile.history.length"><q-item-section class="text-muted">No verified jobs yet – new to Kuluri.</q-item-section></q-item>
          </q-list>
          <div class="text-caption text-muted q-mt-md"><q-icon name="o_shield" /> The worker chose to make this history visible. Personal details stay private until they accept an invitation.</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.job-card { transition: border-color 0.15s; }
.job-card.selected { border-color: #90a484; box-shadow: inset 3px 0 0 #5f7556; }
</style>
