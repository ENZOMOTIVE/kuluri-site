<script setup>
// Farm side: manage all agreements – draft from a chat, edit terms, agree & send (appears in the worker's chat),
// withdraw, mark completed, cancel.
import { QPage } from 'quasar'
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import AgreementView from '../../components/AgreementView.vue'
import SimulatedNote from '../../components/SimulatedNote.vue'
import { tIn } from '../../data/i18n.js'
import { agreements, createAgreement, forChat, statusOf, statusColor, intentLabel, updateTerms } from '../../data/agreements.js'
import { chats } from '../../data/chats.js'
import { state, fmtShort } from '../../data/store.js'

defineProps({ embedded: Boolean }) // shown inside a TabbedPage

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const tr = (k) => tIn('en', k)

// ---- filter tabs
const FILTERS = [
  { name: 'all', label: 'All', test: () => true },
  { name: 'draft', label: 'Drafts', test: (a) => a.state === 'draft' },
  { name: 'sent', label: 'Waiting for worker', test: (a) => a.state === 'sent' },
  { name: 'agreed', label: 'Agreed', test: (a) => a.state === 'agreed' },
  { name: 'closed', label: 'Closed', test: (a) => ['completed', 'withdrawn', 'cancelled'].includes(a.state) },
]
const filter = ref('all')
const list = computed(() => [...agreements].filter(FILTERS.find((f) => f.name === filter.value).test).sort((x, y) => y.updated.localeCompare(x.updated)))
const count = (f) => agreements.filter(f.test).length

const openId = ref(null)
const open = computed(() => agreements.find((a) => a.id === openId.value))
watch(list, (l) => { if (!l.find((a) => a.id === openId.value)) openId.value = l[0]?.id ?? null }, { immediate: true })

// ---- new agreement
const showNew = ref(false)
const newChat = ref(null)
const newJob = ref(null)
const chatOptions = computed(() => chats.map((c) => ({ label: `${c.workerName} · ${c.job}`, value: c.id, disable: !!forChat(c.id) })))
const jobOptions = computed(() => state.jobs.map((j) => ({ label: j.title, value: j.id })))
function openNew(chatId = null) {
  newChat.value = chatId ?? chatOptions.value.find((o) => !o.disable)?.value ?? null
  newJob.value = state.jobs[0]?.id
  showNew.value = true
}
async function createNew() {
  const a = await createAgreement(newChat.value, newJob.value)
  showNew.value = false
  filter.value = 'all'
  openId.value = a.id
  $q.notify({ type: 'positive', message: `Draft ${a.id} created from the job offer and the chat. Check the terms, then agree & send.` })
}

// ---- edit draft terms
const showEdit = ref(false)
const draft = ref({})
function openEdit() {
  const t = open.value.terms
  draft.value = { start: t.start, end: t.end, arrival: t.arrival, payPerHour: t.payPerHour, hoursPerWeek: t.hoursPerWeek, housing: t.housing, meeting: t.meeting }
  showEdit.value = true
}
async function saveEdit() {
  await updateTerms(open.value, { ...draft.value, payPerHour: Number(draft.value.payPerHour), hoursPerWeek: Number(draft.value.hoursPerWeek) })
  showEdit.value = false
  $q.notify({ type: 'positive', message: 'Terms updated.' })
}

// Watch for worker confirming an agreement → notify farm + jump to calendar
const notifiedAgreed = new Set()
onMounted(() => {
  // Seed set with already-agreed ones so we only fire for NEW transitions
  agreements.filter((a) => a.state === 'agreed').forEach((a) => notifiedAgreed.add(a.id))
})
watch(agreements, () => {
  agreements.forEach((a) => {
    if (a.state === 'agreed' && !notifiedAgreed.has(a.id)) {
      notifiedAgreed.add(a.id)
      $q.notify({
        icon: 'o_event_available',
        color: 'primary',
        message: `${a.workerName} confirmed the agreement — it's now on your calendar.`,
        timeout: 8000,
        actions: [
          { label: 'View calendar', color: 'lime', noCaps: true, handler: () => router.push('/farm/schedule') },
          { label: 'Dismiss', color: 'white', noCaps: true, flat: true },
        ],
      })
    }
  })
}, { deep: true })

// Opened from Messages: ?chat=C-x or ?id=AG-x
// Opened from Candidates: ?worker=<privyDid>&job=<jobId>
watch(() => route.query, (q) => {
  if (q.id) { filter.value = 'all'; openId.value = q.id }
  else if (q.chat) {
    const existing = forChat(q.chat)
    if (existing) { filter.value = 'all'; openId.value = existing.id } else openNew(q.chat)
  } else if (q.worker && q.job) {
    // Pre-fill from Candidates "Send contract" button
    newJob.value = q.job
    // Find a chat for this worker+job if one exists, otherwise open the dialog
    const existingChat = chats.find((c) => c.workerId === q.worker)
    newChat.value = existingChat?.id ?? chatOptions.value[0]?.value ?? null
    showNew.value = true
  }
}, { immediate: true })
</script>

<template>
  <component :is="embedded ? 'div' : QPage" class="page">
    <div class="page-header row items-end justify-between q-gutter-y-sm">
      <div>
        <h1 class="page-title">Contracts</h1>
        <div class="text-muted q-mt-xs">Job agreements with your workers: draft from a chat, check the terms, then agree &amp; send.</div>
      </div>
      <q-btn unelevated color="primary" icon="add" label="New agreement" no-caps @click="openNew()" />
    </div>
    <SimulatedNote text="Agreements, chats and the intent analysis are simulated (rule-based) in this prototype. Not a substitute for the employment contract required by national law." />

    <q-tabs v-model="filter" dense no-caps align="left" active-color="primary" indicator-color="primary" class="text-grey-8 q-mb-md">
      <q-tab v-for="f in FILTERS" :key="f.name" :name="f.name">
        <div class="row items-center no-wrap">{{ f.label }}<q-badge rounded color="grey-5" text-color="dark" class="q-ml-xs" :label="count(f)" /></div>
      </q-tab>
    </q-tabs>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-md-5">
        <div class="card">
          <q-list separator>
            <q-item v-for="a in list" :key="a.id" clickable :active="a.id === openId" active-class="bg-sage-soft" @click="openId = a.id">
              <q-item-section>
                <q-item-label class="text-weight-bold">{{ a.id }} · {{ a.workerName }}</q-item-label>
                <q-item-label caption lines="1">{{ a.terms.job }}</q-item-label>
                <q-item-label caption>{{ fmtShort(a.terms.start) }} – {{ fmtShort(a.terms.end) }} · €{{ Number(a.terms.payPerHour).toFixed(2) }}/h</q-item-label>
              </q-item-section>
              <q-item-section side class="items-end">
                <q-badge :color="statusColor(a)" :label="statusOf(a)" />
                <q-badge outline color="primary" class="q-mt-xs" :label="`Intent ${intentLabel(a).score}%`" />
              </q-item-section>
            </q-item>
            <q-item v-if="!list.length"><q-item-section class="text-muted">Nothing here.</q-item-section></q-item>
          </q-list>
        </div>
      </div>
      <div class="col-12 col-md-7">
        <AgreementView v-if="open" :key="open.id" :agreement="open" side="farm" :tr="tr" locale="en"
          @edit="openEdit" @removed="openId = null" @change="router.push('/farm/inbox')" />
      </div>
    </div>

    <!-- New agreement -->
    <q-dialog v-model="showNew">
      <q-card style="width: 520px; max-width: 95vw" class="rounded">
        <q-card-section><div class="text-h6 text-weight-bold">New agreement</div>
          <div class="text-caption text-muted">Kuluri drafts the terms from the job offer and what you agreed in the chat. Nothing is sent until you agree &amp; send.</div></q-card-section>
        <q-card-section class="q-pt-none column q-gutter-md">
          <q-select outlined dense v-model="newChat" :options="chatOptions" emit-value map-options label="Worker (chat)" />
          <q-select outlined dense v-model="newJob" :options="jobOptions" emit-value map-options label="Job offer" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn unelevated no-caps color="primary" label="Create draft" :disable="!newChat || !newJob" @click="createNew" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Edit draft terms -->
    <q-dialog v-model="showEdit">
      <q-card style="width: 560px; max-width: 95vw" class="rounded">
        <q-card-section><div class="text-h6 text-weight-bold">Edit terms · {{ open?.id }}</div></q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <q-input class="col-6" outlined dense type="date" v-model="draft.start" label="Start" stack-label />
            <q-input class="col-6" outlined dense type="date" v-model="draft.end" label="End" stack-label />
            <q-input class="col-6" outlined dense type="date" v-model="draft.arrival" label="Arrival" stack-label />
            <q-input class="col-6" outlined dense v-model="draft.meeting" label="Meeting point" />
            <q-input class="col-6" outlined dense type="number" step="0.5" v-model="draft.payPerHour" label="Pay per hour (gross €)" />
            <q-input class="col-6" outlined dense type="number" v-model="draft.hoursPerWeek" label="Hours per week" />
            <q-toggle class="col-12" v-model="draft.housing" label="Housing included" color="primary" />
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Cancel" v-close-popup />
          <q-btn unelevated no-caps color="primary" label="Save" @click="saveEdit" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </component>
</template>
