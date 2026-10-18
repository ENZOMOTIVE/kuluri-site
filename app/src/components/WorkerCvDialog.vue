<script setup>
// A team member's CV and their work agreement, opened from My farm → Team.
// The CV shows only what the worker chose to share (farmView). Team members without a Kuluri profile
// (e.g. regular staff from the dataset) get a short CV built from their record at this farm.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { state, farm, farmView, skillRecord, shortHash } from '../data/store.js'
import { agreements, statusOf, statusColor } from '../data/agreements.js'
import { chats } from '../data/chats.js'
import { buildAgreementPdf } from '../utils/agreementPdf.js'
import { sharePdf } from '../utils/share.js'

const props = defineProps({ member: { type: Object, default: null } }) // a row of state.team
const emit = defineEmits(['close'])
const router = useRouter()
const $q = useQuasar()
const pdfBusy = ref(false)

const worker = computed(() => {
  const w = props.member && state.workers.find((x) => x.id === props.member.id)
  return w ? farmView(w) : null
})
const skills = computed(() => (worker.value ? skillRecord(worker.value).filter((s) => worker.value.skills.includes(s.skill) || s.verified) : []))
const history = computed(() => (worker.value
  ? worker.value.history
  : [{ farm: farm.id, crop: props.member?.role, season: props.member?.period, hours: props.member?.hours, confirmed: props.member?.confirmation === 'Confirmed' }]))

const agreement = computed(() => props.member && agreements.find((a) =>
  (a.workerId === props.member.id || a.workerName === props.member.name || a.workerName?.startsWith(props.member.name?.split(' ')[0])) &&
  !['withdrawn', 'cancelled'].includes(a.state)
))
const chat = computed(() => props.member && chats.find((c) => c.workerId === props.member.id))
const initials = computed(() => props.member?.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase())
const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const verifyUrl = computed(() => agreement.value ? `https://kuluri.eu/verify/?id=${agreement.value.id}&hash=${shortHash(agreement.value.hash)}` : null)

function go(to) { emit('close'); router.push(to) }

async function downloadPdf() {
  if (!agreement.value) return
  pdfBusy.value = true
  try {
    const chatObj = chats.find((c) => c.id === agreement.value.chatId)
    const doc = buildAgreementPdf(agreement.value, chatObj)
    const res = await sharePdf(doc, `Kuluri_agreement_${agreement.value.id}.pdf`, `Kuluri agreement ${agreement.value.id}`)
    if (res !== 'cancelled') $q.notify({ type: 'positive', message: res === 'shared' ? 'Agreement shared.' : 'Agreement PDF downloaded.' })
  } finally {
    pdfBusy.value = false
  }
}

function copyVerifyLink() {
  $q.copyToClipboard(verifyUrl.value)
    .then(() => $q.notify({ icon: 'o_link', message: 'Verification link copied', timeout: 1500 }))
}
</script>

<template>
  <q-dialog :model-value="!!member" @update:model-value="emit('close')">
    <q-card v-if="member" style="width: 640px; max-width: 95vw" class="rounded">
      <!-- Header -->
      <q-card-section class="row items-center no-wrap">
        <q-avatar size="52px" class="bg-sage-soft text-primary text-weight-bold q-mr-md">{{ initials }}</q-avatar>
        <div class="col">
          <div class="text-h6 text-weight-bold">{{ member.name }}</div>
          <div class="text-caption text-muted">{{ member.type }} · {{ member.role }} · {{ member.period }}</div>
          <div v-if="worker" class="text-caption text-muted">{{ worker.base }}</div>
        </div>
        <q-btn flat round dense icon="close" @click="emit('close')" />
      </q-card-section>
      <q-separator />

      <q-card-section class="q-gutter-y-md">
        <!-- CV -->
        <div>
          <div class="text-subtitle1 text-weight-bold q-mb-xs"><q-icon name="o_badge" class="q-mr-xs" />CV</div>
          <div v-if="worker" class="row q-gutter-xs q-mb-sm">
            <q-chip v-for="s in skills" :key="s.skill" dense square :class="s.verified ? 'bg-sage-soft text-primary' : 'chip-soft'" :icon="s.verified ? 'verified' : undefined">
              {{ s.skill }}<span v-if="s.verified" class="q-ml-xs text-caption">· {{ s.jobs }} job{{ s.jobs > 1 ? 's' : '' }}</span>
            </q-chip>
            <q-chip v-for="l in worker.languages" :key="l" dense square class="chip-soft" icon="o_translate">{{ l }}</q-chip>
            <span v-if="!worker.skills.length" class="text-caption text-muted self-center"><q-icon name="o_visibility_off" /> Skills not shared</span>
          </div>
          <q-list bordered separator class="rounded">
            <q-item v-for="(h, i) in history" :key="i">
              <q-item-section avatar><q-icon :name="h.confirmed ? 'verified' : 'o_hourglass_empty'" :color="h.confirmed ? 'primary' : 'grey-6'" /></q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ h.crop }} · {{ h.season }}</q-item-label>
                <q-item-label caption>{{ h.farm }}<template v-if="h.hours !== null && h.hours !== undefined"> · {{ h.hours }} hours</template></q-item-label>
              </q-item-section>
              <q-item-section side><span class="text-caption" :class="h.confirmed ? 'verified' : 'text-muted'">{{ h.confirmed ? 'Confirmed by worker & farm' : 'Not confirmed yet' }}</span></q-item-section>
            </q-item>
            <q-item v-if="!history.length"><q-item-section class="text-muted">{{ worker?.hiddenJobs ? 'The worker does not share their work history.' : 'No verified jobs yet – new to Kuluri.' }}</q-item-section></q-item>
          </q-list>
          <div class="text-caption text-muted q-mt-xs">
            <q-icon name="o_shield" class="q-mr-xs" />
            <template v-if="worker">Only what {{ member.name }} chose to share<span v-if="worker.hiddenJobs"> – {{ worker.hiddenJobs }} job{{ worker.hiddenJobs > 1 ? 's' : '' }} hidden</span>. Phone number, documents and pay amounts are never shown.</template>
            <template v-else>No Kuluri profile – this is their record at your farm.</template>
          </div>
        </div>

        <!-- Work agreement -->
        <div>
          <div class="text-subtitle1 text-weight-bold q-mb-xs"><q-icon name="o_handshake" class="q-mr-xs" />Contract</div>
          <div v-if="agreement" class="card q-pa-md">
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-weight-bold">{{ agreement.id }} · {{ agreement.terms.job }}</div>
                <div class="text-caption text-muted">{{ fmt(agreement.terms.start) }} – {{ fmt(agreement.terms.end) }} · €{{ Number(agreement.terms.payPerHour).toFixed(2) }}/h gross · {{ agreement.terms.hoursPerWeek }} h/week · housing {{ agreement.terms.housing ? 'included' : 'not included' }}</div>
              </div>
              <q-badge :color="statusColor(agreement)" :label="statusOf(agreement)" class="q-ml-sm" />
            </div>
            <div class="row q-gutter-sm q-mt-sm">
              <q-btn flat dense no-caps color="primary" icon-right="chevron_right" label="Open contract" @click="go({ path: '/farm/contracts', query: { id: agreement.id } })" />
              <template v-if="['agreed', 'completed'].includes(agreement.state)">
                <q-btn flat dense no-caps color="primary" icon="o_picture_as_pdf" label="Download PDF" :loading="pdfBusy" @click="downloadPdf" />
                <q-btn flat dense no-caps color="primary" icon="o_verified" label="Verify link" @click="copyVerifyLink">
                  <q-tooltip>{{ verifyUrl }}</q-tooltip>
                </q-btn>
              </template>
            </div>
            <!-- Verification banner for signed agreements -->
            <div v-if="['agreed', 'completed'].includes(agreement.state)" class="verify-banner q-mt-sm">
              <q-icon name="o_verified" color="positive" size="16px" class="q-mr-xs" />
              <span>Both parties signed · </span>
              <a :href="verifyUrl" target="_blank" class="verify-link">kuluri.eu/verify/?id={{ agreement.id }}</a>
              <q-btn flat round dense size="xs" icon="o_copy" color="grey-6" class="q-ml-xs" @click="copyVerifyLink" />
            </div>
          </div>
          <div v-else class="card q-pa-md">
            <div class="row items-center no-wrap q-mb-sm">
              <q-icon name="o_info" color="grey-5" size="18px" class="q-mr-sm" />
              <div class="col text-body2 text-muted">
                Status: <b>{{ member.contract }}</b>
                <span v-if="member.source === 'synthetic_labour'"> — tracked outside Kuluri</span>
              </div>
            </div>
            <div class="row q-gutter-sm">
              <q-btn v-if="chat" unelevated dense no-caps color="primary" icon="o_handshake" label="Open contract" class="q-px-sm" @click="go({ path: '/farm/contracts', query: { chat: chat.id } })" />
              <q-btn unelevated dense no-caps :color="chat ? 'grey-3' : 'primary'" :text-color="chat ? 'dark' : 'white'" icon="o_add" label="Create in Kuluri" class="q-px-sm" @click="go({ path: '/farm/contracts' })" />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.verify-banner {
  display: flex;
  align-items: center;
  background: #f0fff4;
  border: 1px solid #34c759;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: #1a5c30;
}
.verify-link {
  color: #163300;
  font-weight: 600;
  text-decoration: underline;
  word-break: break-all;
}
</style>
