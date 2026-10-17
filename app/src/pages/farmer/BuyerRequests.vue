<script setup>
import { computed, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { farm, teamStats, fmtDate } from '../../data/store.js'

const $q = useQuasar()
const y = farm.y2025
const cert = farm.certificate

const requests = ref([
  { id: 'R-3', buyer: 'BUYER-027', file: 'Supplier_Info_Update.xlsx', received: '11 Oct 2026', status: 'Open' },
  { id: 'R-2', buyer: 'BUYER-033', file: 'Social_Compliance_SAQ.pdf', received: '18 Sep 2026', status: 'Answered' },
  { id: 'R-1', buyer: 'BUYER-007', file: 'Sustainability_Questionnaire_2025.xlsx', received: '02 Sep 2026', status: 'Answered' },
])
const open = ref('R-3')

// Suggested answers from farm data (real, synthetic dataset) and from My workers (labour)
const questions = reactive([
  { q: 'Do you hold a recognised certification?', a: `Yes – Organic, body ${cert.body}, valid ${fmtDate(cert.from)} – ${fmtDate(cert.to)}`, src: 'synthetic_traceability', kind: 'data' },
  { q: 'Average nitrogen applied per hectare (2025)', a: `${y.n_kg_ha} kg N/ha (${y.n_mineral_kg_ha} mineral, ${y.n_organic_kg_ha} organic)`, src: 'synthetic_fertilisation · 2025', kind: 'data' },
  { q: 'Plant protection applications (2025)', a: `${y.pp_applications} applications on ${y.pp_parcels} of ${farm.parcels.length} parcels`, src: 'synthetic_plant_protection · 2025', kind: 'data' },
  { q: 'How many workers did you employ this year?', a: '', src: 'My workers', kind: 'labour', live: () => `${teamStats.value.total} (${farm.regularWorkers.length} regular, ${teamStats.value.total - farm.regularWorkers.length} seasonal)` },
  { q: 'Have workers confirmed their hours and pay?', a: '', src: 'My workers · worker confirmations', kind: 'labour', live: () => `${teamStats.value.confirmed} of ${teamStats.value.total} confirmed by the workers; ${teamStats.value.disputed} dispute under review` },
  { q: 'Do workers have a way to raise complaints anonymously?', a: 'Yes – through their personal Kuluri link, in their own language', src: 'Worker app', kind: 'labour' },
].map((x) => ({ ...x, status: 'open', editing: false, draft: '' })))

const answerOf = (x) => x.a || (x.live ? x.live() : '')
const done = computed(() => questions.filter((x) => x.status !== 'open').length)

function use(x) { x.final = answerOf(x); x.status = 'accepted' }
function edit(x) { x.draft = x.final || answerOf(x); x.editing = true }
function save(x) { x.final = x.draft; x.status = 'edited'; x.editing = false }
function finish() {
  requests.value.find((r) => r.id === open.value).status = 'Answered'
  $q.notify({ type: 'positive', message: 'Answers shared with BUYER-027 – only totals, never personal worker data.' })
}
</script>

<template>
  <q-page class="page">
    <div class="page-header row items-end justify-between q-gutter-y-sm">
      <div>
        <h1 class="page-title">Buyer requests</h1>
        <div class="text-muted q-mt-xs">Buyers ask for proof of how you farm and treat your workers. Kuluri suggests answers from your records; you check them.</div>
      </div>
      <q-btn unelevated color="primary" icon="o_upload_file" label="Upload request" no-caps @click="$q.notify({ message: 'Upload Excel or PDF – questions are extracted automatically (demo).' })" />
    </div>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-4">
        <div class="column q-gutter-sm">
          <div v-for="r in requests" :key="r.id" class="card q-pa-md cursor-pointer" :style="r.id === open ? 'border-color:#90a484; box-shadow: inset 3px 0 0 #5f7556' : ''" @click="open = r.id">
            <div class="row items-center no-wrap">
              <q-icon name="o_description" color="primary" size="20px" class="q-mr-sm" />
              <div class="col ellipsis text-weight-bold">{{ r.file }}</div>
              <q-badge :color="r.status === 'Open' ? 'warning' : 'primary'" :label="r.status" />
            </div>
            <div class="text-caption text-muted q-mt-xs">{{ r.buyer }} · received {{ r.received }}</div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-8">
        <div class="row items-center q-mb-md">
          <div class="text-subtitle1 text-weight-bold">Check the suggested answers</div>
          <q-space />
          <span class="text-caption text-muted q-mr-md">{{ done }} / {{ questions.length }} checked</span>
          <q-btn unelevated color="primary" no-caps label="Share answers" :disable="done < questions.length" @click="finish" />
        </div>
        <q-linear-progress :value="done / questions.length" rounded size="6px" color="primary" track-color="grey-3" class="q-mb-md" />

        <div class="column q-gutter-sm">
          <div v-for="(x, i) in questions" :key="i" class="card q-pa-md" :style="x.status !== 'open' ? 'border-color:#a9b99e' : ''">
            <div class="row no-wrap items-start">
              <div class="col text-weight-bold">{{ i + 1 }}. {{ x.q }}</div>
              <q-badge :color="x.status === 'open' ? 'warning' : x.status === 'edited' ? 'accent' : 'primary'" :label="x.status === 'open' ? 'To check' : x.status === 'edited' ? 'Edited by you' : 'Suggestion used'" />
            </div>

            <div v-if="x.editing" class="q-mt-sm">
              <q-input outlined autogrow v-model="x.draft" autofocus input-style="font-size:15px; line-height:1.6" />
              <div class="row q-gutter-sm q-mt-sm">
                <q-btn unelevated color="primary" no-caps label="Save answer" icon="check" @click="save(x)" />
                <q-btn flat no-caps label="Cancel" @click="x.editing = false" />
              </div>
            </div>
            <template v-else>
              <div class="q-mt-sm q-pa-sm rounded bg-surface-2" style="border: 1px solid var(--line)">
                <div class="text-caption text-weight-bold" :class="x.kind === 'labour' ? 'text-accent' : 'text-primary'">
                  <q-icon :name="x.status === 'open' ? 'o_auto_awesome' : 'check'" class="q-mr-xs" />{{ x.status === 'open' ? 'Suggested answer' : 'Your answer' }}
                </div>
                <div class="text-body2 text-weight-medium q-mt-xs">{{ x.final || answerOf(x) }}</div>
                <q-chip dense square class="q-ml-none q-mt-sm" :class="x.kind === 'labour' ? 'bg-teal-soft' : 'bg-sage-soft'" :icon="x.kind === 'labour' ? 'verified' : 'o_storage'">{{ x.src }}</q-chip>
              </div>
              <div class="row q-gutter-sm q-mt-sm">
                <q-btn v-if="x.status === 'open'" unelevated color="primary" no-caps size="sm" icon="check" label="Use suggestion" @click="use(x)" />
                <q-btn outline color="primary" no-caps size="sm" icon="o_edit" label="Edit" @click="edit(x)" />
                <q-btn v-if="x.status !== 'open'" flat color="grey-7" no-caps size="sm" icon="undo" label="Undo" @click="x.status = 'open'; x.final = ''" />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.bg-teal-soft { background: var(--teal-soft); }
</style>
