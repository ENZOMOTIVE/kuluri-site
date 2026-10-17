<script setup>
import { QPage } from 'quasar'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { state, matchWorkers, fmtShort } from '../../data/store.js'

defineProps({ embedded: Boolean }) // shown inside a TabbedPage

const $q = useQuasar()
const route = useRoute()
const openJobs = computed(() => state.jobs.filter((j) => j.status === 'Open'))
const selectedId = ref(route.query.job || openJobs.value[0]?.id)
watch(() => route.query.job, (id) => { if (id) selectedId.value = id }) // opened from Job postings
const job = computed(() => state.jobs.find((j) => j.id === selectedId.value))
const all = computed(() => (job.value ? matchWorkers(job.value) : []))
// Availability filter (replaces the season calendar): whole job / part of it / everyone
const avail = ref('all')
const matches = computed(() => all.value.filter((m) => avail.value === 'all' || m.availability === avail.value))
const countBy = (a) => all.value.filter((m) => a === 'all' || m.availability === a).length

const jobOptions = computed(() => openJobs.value.map((j) => ({ label: j.title, value: j.id })))
const initials = (name) => name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()
const matchedSkills = (m) => m.worker.skills.filter((sk) => job.value.tasks.includes(sk))
const otherSkills = (m) => m.worker.skills.length - matchedSkills(m).length
const matchedLangs = (m) => m.worker.languages.filter((l) => job.value.languages.includes(l))

const inviteKey = (w) => `${job.value.id}:${w.id}`
function invite(w) {
  state.invitations[inviteKey(w)] = 'Invited'
  $q.notify({ type: 'positive', icon: 'o_send', message: `Invitation sent to ${w.name}${w.languages[0] ? ` – in ${w.languages[0]}` : ''}, with pay, dates and housing.` })
}

// ---- Worker profile dialog
const profile = ref(null)
</script>

<template>
  <component :is="embedded ? 'div' : QPage" class="page">
    <div class="page-header row items-end justify-between q-gutter-y-sm">
      <div>
        <h1 class="page-title">Candidates</h1>
        <div class="text-muted q-mt-xs">Workers matching your open jobs, with experience confirmed by other farms.</div>
      </div>
      <q-btn outline color="primary" icon="o_work_outline" label="Job postings" no-caps to="/farm/jobs" />
    </div>

    <!-- Job bar: which job you are hiring for -->
    <div class="card q-pa-md q-mb-lg row items-center q-col-gutter-md">
      <div class="col-12 col-md-5">
        <q-select outlined dense v-model="selectedId" :options="jobOptions" emit-value map-options label="Hiring for" />
      </div>
      <div v-if="job" class="col-12 col-md-7 row items-center q-gutter-x-lg q-gutter-y-xs text-body2">
        <span><q-icon name="o_event" color="primary" class="q-mr-xs" />{{ fmtShort(job.start) }} – {{ fmtShort(job.end) }}</span>
        <span v-if="job.housing"><q-icon name="o_home" color="primary" class="q-mr-xs" />Housing</span>
      </div>
    </div>

    <template v-if="job">
      <!-- List header + filter -->
      <div class="row items-center q-mb-sm q-gutter-y-sm">
        <div class="text-subtitle1 text-weight-bold">{{ matches.length }} matching workers</div>
        <q-icon name="o_balance" color="grey-6" size="18px" class="q-ml-sm cursor-pointer">
          <q-tooltip max-width="260px">Matching uses skills, availability, languages and distance only – never nationality, age or gender.</q-tooltip>
        </q-icon>
        <q-space />
        <q-btn-toggle v-model="avail" dense no-caps unelevated rounded toggle-color="primary" color="grey-3" text-color="dark" size="sm"
          :options="[{ label: `All (${countBy('all')})`, value: 'all' }, { label: `Whole job (${countBy('full')})`, value: 'full' }, { label: `Part of it (${countBy('part')})`, value: 'part' }]" />
      </div>

      <!-- Workers -->
      <div class="card">
        <q-list separator>
          <q-item v-for="m in matches" :key="m.worker.id" class="q-py-md">
            <q-item-section avatar>
              <q-avatar size="40px" class="bg-sage-soft text-primary text-weight-bold" font-size="15px">{{ initials(m.worker.name) }}</q-avatar>
            </q-item-section>

            <!-- who -->
            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ m.worker.name }}<q-icon v-if="m.verifiedCount" name="verified" color="primary" size="16px" class="q-ml-xs" />
              </q-item-label>
              <q-item-label caption>{{ m.worker.base }}</q-item-label>
              <q-item-label class="q-mt-xs">
                <q-chip v-for="sk in matchedSkills(m)" :key="sk" dense square size="sm" class="bg-sage-soft text-primary q-ml-none">{{ sk }}</q-chip>
                <span v-if="otherSkills(m)" class="text-caption text-muted q-ml-xs">+{{ otherSkills(m) }} other skill{{ otherSkills(m) > 1 ? 's' : '' }}</span>
                <span v-if="!m.worker.skills.length" class="text-caption text-muted"><q-icon name="o_visibility_off" /> Skills not shared</span>
              </q-item-label>
            </q-item-section>

            <!-- availability + record -->
            <q-item-section class="gt-xs" style="max-width: 230px">
              <q-item-label>
                <q-badge v-if="m.availability" outline :color="m.availability === 'full' ? 'primary' : 'warning'" :label="m.availability === 'full' ? 'Available whole job' : 'Available part of it'" />
                <q-badge v-else outline color="grey-6" :label="m.worker.available ? 'Not available' : 'Availability not shared'" />
              </q-item-label>
              <q-item-label caption class="q-mt-xs">
                <template v-if="m.verifiedCount">{{ m.verifiedCount }} verified job{{ m.verifiedCount > 1 ? 's' : '' }}{{ m.verifiedHours !== null ? ` · ${m.verifiedHours} h` : '' }}</template>
                <template v-else-if="!m.worker.hiddenJobs">New – no verified jobs yet</template>
                <span v-if="m.worker.hiddenJobs"> · {{ m.worker.hiddenJobs }} hidden</span>
              </q-item-label>
              <q-item-label v-if="matchedLangs(m).length" caption><q-icon name="o_translate" class="q-mr-xs" />{{ matchedLangs(m).join(', ') }}</q-item-label>
            </q-item-section>

            <!-- match + actions -->
            <q-item-section side style="min-width: 150px">
              <div class="row items-center no-wrap q-gutter-x-sm">
                <div class="text-right cursor-pointer">
                  <div class="text-subtitle1 text-weight-bold text-dark">{{ m.score }}%</div>
                  <div class="text-caption text-muted" style="margin-top: -4px">match</div>
                  <q-tooltip max-width="280px">{{ m.reasons.join(' · ') }}</q-tooltip>
                </div>
                <q-btn v-if="!state.invitations[inviteKey(m.worker)]" unelevated color="primary" size="sm" no-caps icon="o_send" label="Invite" @click="invite(m.worker)" />
                <q-badge v-else color="accent" class="q-pa-sm">{{ state.invitations[inviteKey(m.worker)] }}</q-badge>
              </div>
              <q-btn flat dense size="sm" no-caps color="primary" label="View profile" class="q-mt-xs" @click="profile = m.worker" />
            </q-item-section>
          </q-item>
          <q-item v-if="!matches.length"><q-item-section class="text-muted text-center q-pa-md">No matching workers yet. Try more languages or a longer period.</q-item-section></q-item>
        </q-list>
      </div>
      <div class="text-caption text-muted q-mt-sm"><q-icon name="o_shield" class="q-mr-xs" />You only see what each worker chose to share with employers.</div>
    </template>

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
                <q-item-label caption>{{ h.farm }}{{ h.hours !== null ? ` · ${h.hours} hours` : '' }}</q-item-label>
              </q-item-section>
              <q-item-section side><span class="text-caption" :class="h.confirmed ? 'verified' : 'text-muted'">{{ h.confirmed ? 'Confirmed by worker & farm' : 'Not confirmed' }}</span></q-item-section>
            </q-item>
            <q-item v-if="!profile.history.length"><q-item-section class="text-muted">{{ profile.hiddenJobs ? 'The worker does not share their work history.' : 'No verified jobs yet – new to Kuluri.' }}</q-item-section></q-item>
          </q-list>
          <div class="text-caption text-muted q-mt-md"><q-icon name="o_shield" /> You see only what {{ profile.name }} chose to share<span v-if="profile.hiddenJobs"> – {{ profile.hiddenJobs }} job{{ profile.hiddenJobs > 1 ? 's' : '' }} hidden</span><span v-if="!profile.share.hours"> – hours hidden</span>. Phone number, documents and pay amounts are never shown.</div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </component>
</template>
