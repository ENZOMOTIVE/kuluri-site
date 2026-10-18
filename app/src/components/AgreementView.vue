<script setup>
// Job agreement between farm and worker, shown to either side in their language.
// The AI chat analysis is only a compact "intent" label (like the match %); the full analysis stays stored
// with the agreement and goes into the PDF.
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { statusOf, statusColor, intentLabel, sendToWorker, workerAgrees, withdraw, complete, cancel, removeDraft } from '../data/agreements.js'
import { chats } from '../data/chats.js'
import { shortHash } from '../data/store.js'
import { buildAgreementPdf } from '../utils/agreementPdf.js'
import { sharePdf } from '../utils/share.js'
import { useBiometric } from '../composables/useBiometric.js'

const GNOSIS_EXPLORER = 'https://gnosisscan.io/tx/'

const props = defineProps({
  agreement: { type: Object, required: true },
  side: { type: String, required: true }, // 'worker' | 'farm'
  tr: { type: Function, required: true }, // translate key -> text
  locale: { type: String, default: 'en' }, // 'en' | 'ro'
})
const emit = defineEmits(['change', 'edit', 'removed'])
const $q = useQuasar()
const { confirmWithDevice } = useBiometric()
const a = computed(() => props.agreement)
const chat = computed(() => chats.find((c) => c.id === a.value.chatId))
const intent = computed(() => intentLabel(a.value))
const loc = computed(() => (props.locale === 'ro' ? 'ro-RO' : 'en-GB'))
const fmtD = (d) => new Date(d).toLocaleDateString(loc.value, { day: 'numeric', month: 'short', year: 'numeric' })
const fmtDT = (d) => new Date(d).toLocaleString(loc.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const statusLabel = computed(() => ({
  draft: props.tr('st_Draft'),
  sent: props.side === 'worker' ? props.tr('st_waitWorker_me') : props.tr('st_waitWorker'),
  agreed: props.tr('st_Agreed'),
  completed: props.tr('st_Completed'),
  withdrawn: props.tr('st_Withdrawn'),
  cancelled: props.tr('st_Cancelled'),
}[a.value.state] ?? statusOf(a.value)))
const intentColor = computed(() => ({ strong: 'primary', partial: 'warning', none: 'grey-7' }[intent.value.level]))
const intentTip = computed(() => props.tr('intentTip').replace('{m}', intent.value.matched).replace('{n}', intent.value.total))

const terms = computed(() => {
  const t = a.value.terms
  return [
    ['t_job', t.job],
    ['t_tasks', t.tasks.join(', ')],
    ['t_period', `${fmtD(t.start)} – ${fmtD(t.end)}`],
    ['t_arrival', fmtD(t.arrival)],
    ['t_pay', `€${Number(t.payPerHour).toFixed(2)} ${props.tr('grossHour')}`],
    ['t_hours', String(t.hoursPerWeek)],
    ['t_housing', props.tr(t.housing ? 'included' : 'notIncluded')],
    ['t_meeting', String(t.meeting).replace('Farmyard', props.tr('yardShort'))],
    ['t_languages', t.languages.join(', ')],
  ]
})

const ask = (title, message, okLabel, color = 'primary') => $q.dialog({
  title, message,
  cancel: { flat: true, noCaps: true, label: props.tr('cancel') },
  ok: { unelevated: true, noCaps: true, color, label: okLabel },
})

const busy = ref(false)
const blockchainStep = ref(null) // null | 'signing' | 'broadcasting' | 'confirming' | 'done'

// Worker — requires device PIN / biometric before signing
async function workerAgree() {
  const confirmed = await confirmWithDevice(
    `Signing agreement ${a.value.id} — ${a.value.terms.job}`
  )
  if (!confirmed) return

  busy.value = true
  blockchainStep.value = 'signing'
  try {
    // Simulate the blockchain recording stages with short delays
    await new Promise((r) => setTimeout(r, 900))
    blockchainStep.value = 'broadcasting'
    await workerAgrees(a.value)
    await new Promise((r) => setTimeout(r, 1100))
    blockchainStep.value = 'confirming'
    await new Promise((r) => setTimeout(r, 1200))
    blockchainStep.value = 'done'

    $q.notify({ type: 'positive', icon: 'verified', message: props.tr('agreedToast'), timeout: 2500 })
    $q.notify({
      icon: 'o_picture_as_pdf',
      message: 'Agreement signed. Download your certificate?',
      color: 'dark',
      timeout: 6000,
      actions: [{ label: 'Download', color: 'lime', noCaps: true, handler: () => pdf() }],
    })
  } finally {
    busy.value = false
  }
}
// Farm
function send() {
  ask(props.tr('sendToWorker'), props.tr('sendConfirm'), props.tr('sendToWorker')).onOk(async () => {
    await sendToWorker(a.value)
    $q.notify({ type: 'positive', icon: 'o_send', message: props.tr('sentToast') })
  })
}
function doWithdraw() { ask(props.tr('withdraw'), `${a.value.id}?`, props.tr('withdraw'), 'negative').onOk(() => withdraw(a.value)) }
function doComplete() { complete(a.value) }
function doCancel() {
  $q.dialog({
    title: props.tr('cancelAgreement'), message: props.tr('cancelReason'), prompt: { model: '', type: 'text', outlined: true },
    cancel: { flat: true, noCaps: true, label: props.tr('cancel') }, ok: { unelevated: true, noCaps: true, color: 'negative', label: props.tr('cancelAgreement') },
  }).onOk((reason) => cancel(a.value, reason))
}
function doDelete() { ask(props.tr('deleteDraft'), `${a.value.id}?`, props.tr('deleteDraft'), 'negative').onOk(() => { removeDraft(a.value); emit('removed') }) }

async function pdf() {
  busy.value = true
  try {
    const doc = buildAgreementPdf(a.value, chat.value)
    const res = await sharePdf(doc, `Kuluri_agreement_${a.value.id}.pdf`, `Kuluri agreement ${a.value.id}`)
    if (res !== 'cancelled') $q.notify({ type: 'positive', message: res === 'shared' ? props.tr('pdfShared') : props.tr('pdfDownloaded') })
  } finally { busy.value = false }
}
</script>

<template>
  <div class="column q-gutter-y-md">
    <!-- Header: status + intent label -->
    <div class="card q-pa-md">
      <div class="row items-center no-wrap">
        <q-avatar rounded size="42px" class="bg-sage-soft text-primary q-mr-md" icon="o_handshake" />
        <div class="col">
          <div class="text-subtitle1 text-weight-bold">{{ tr('agreement') }} {{ a.id }}</div>
          <div class="text-caption text-muted">{{ a.farmId }} ↔ {{ a.workerName }}</div>
        </div>
      </div>
      <div class="row items-center q-gutter-sm q-mt-sm">
        <q-badge :color="statusColor(a)" class="q-pa-sm text-weight-bold">{{ statusLabel }}</q-badge>
        <q-badge outline :color="intentColor" class="q-pa-sm text-weight-bold cursor-pointer">
          <q-icon name="o_auto_awesome" size="14px" class="q-mr-xs" />{{ tr('intentBadge') }}: {{ tr('level_' + intent.level) }} · {{ intent.score }}%
          <q-tooltip max-width="260px" class="text-body2">{{ intentTip }}</q-tooltip>
        </q-badge>
      </div>
      <div v-if="a.cancelReason" class="text-caption text-negative q-mt-sm">{{ a.cancelReason }}</div>
    </div>

    <!-- Agreed terms -->
    <div class="card">
      <div class="row items-center q-px-md q-pt-md">
        <div class="text-subtitle2 text-weight-bold">{{ tr('agreedTerms') }}</div>
        <q-space />
        <q-btn v-if="side === 'farm' && a.state === 'draft'" flat dense no-caps color="primary" icon="o_edit" :label="tr('editTerms')" @click="emit('edit')" />
      </div>
      <q-list dense class="q-pb-sm">
        <q-item v-for="[k, v] in terms" :key="k">
          <q-item-section class="text-muted" style="max-width: 42%">{{ tr(k) }}</q-item-section>
          <q-item-section class="text-weight-medium">{{ v }}</q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Confirmations + actions -->
    <div class="card q-pa-md">
      <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ tr('confirmations') }}</div>
      <div v-for="s in ['farm', 'worker']" :key="s" class="row items-center q-mb-xs no-wrap">
        <q-icon :name="a.signed[s] ? 'verified' : 'o_hourglass_empty'" :color="a.signed[s] ? 'primary' : 'grey-6'" size="20px" class="q-mr-sm" />
        <span class="text-weight-medium">{{ s === 'farm' ? tr('farmSide') : tr('workerSide') }}</span>
        <q-space />
        <span class="text-caption" :class="a.signed[s] ? 'verified' : 'text-muted'">{{ a.signed[s] ? `${tr('confirmedOn')} · ${fmtDT(a.signed[s].at)}` : tr('notYet') }}</span>
      </div>
      <div class="text-caption text-muted q-mt-sm">{{ tr('fingerprint') }}: <span class="mono">{{ shortHash(a.hash) }}</span></div>

      <!-- Blockchain recording progress (worker side, while signing) -->
      <div v-if="blockchainStep" class="chain-progress q-mt-md">
        <div class="chain-step" :class="{ done: ['broadcasting','confirming','done'].includes(blockchainStep), active: blockchainStep === 'signing' }">
          <q-icon :name="['broadcasting','confirming','done'].includes(blockchainStep) ? 'check_circle' : 'o_draw'" size="18px" />
          <span>Signing with wallet</span>
        </div>
        <div class="chain-connector" />
        <div class="chain-step" :class="{ done: ['confirming','done'].includes(blockchainStep), active: blockchainStep === 'broadcasting' }">
          <q-spinner v-if="blockchainStep === 'broadcasting'" size="18px" color="primary" />
          <q-icon v-else :name="['confirming','done'].includes(blockchainStep) ? 'check_circle' : 'o_broadcast_on_home'" size="18px" />
          <span>Broadcasting to Gnosis Chain</span>
        </div>
        <div class="chain-connector" />
        <div class="chain-step" :class="{ done: blockchainStep === 'done', active: blockchainStep === 'confirming' }">
          <q-spinner v-if="blockchainStep === 'confirming'" size="18px" color="primary" />
          <q-icon v-else :name="blockchainStep === 'done' ? 'check_circle' : 'o_verified'" size="18px" />
          <span>Confirmed on-chain</span>
        </div>
      </div>

      <!-- On-chain record (shown once agreed) -->
      <div v-if="a.txHash" class="chain-record q-mt-md">
        <div class="chain-record-header">
          <q-icon name="link" size="16px" color="primary" class="q-mr-xs" />
          <span class="text-weight-bold text-caption">Recorded on Gnosis Chain</span>
          <q-space />
          <q-badge outline color="primary" :label="`Block #${a.blockNumber}`" />
        </div>
        <div class="chain-record-hash">
          <span class="text-caption text-muted">Tx: </span>
          <span class="mono text-caption">{{ shortHash(a.txHash) }}</span>
          <a :href="GNOSIS_EXPLORER + a.txHash" target="_blank" class="chain-explore-link q-ml-sm">
            <q-icon name="o_open_in_new" size="13px" /> View on Gnosisscan
          </a>
        </div>
        <div class="text-caption text-muted" style="margin-top:4px">Agreement hash anchored permanently. Anyone can verify this record.</div>
      </div>

      <!-- worker actions -->
      <div class="column q-gutter-sm q-mt-md" v-if="side === 'worker' && a.state === 'sent'">
        <q-btn unelevated color="primary" no-caps size="lg" icon="o_handshake" :label="tr('iAgree')" @click="workerAgree" />
        <q-btn outline color="primary" no-caps icon="o_chat_bubble_outline" :label="tr('askChange')" @click="emit('change')" />
      </div>

      <!-- farm actions -->
      <div class="row q-gutter-sm q-mt-md" v-if="side === 'farm'">
        <template v-if="a.state === 'draft'">
          <q-btn unelevated color="primary" no-caps icon="o_send" :label="tr('sendToWorker')" @click="send" />
          <q-btn flat color="negative" no-caps icon="o_delete" :label="tr('deleteDraft')" @click="doDelete" />
        </template>
        <q-btn v-if="a.state === 'sent'" outline color="negative" no-caps icon="o_undo" :label="tr('withdraw')" @click="doWithdraw" />
        <template v-if="a.state === 'agreed'">
          <q-btn unelevated color="primary" no-caps icon="o_task_alt" :label="tr('markCompleted')" @click="doComplete" />
          <q-btn flat color="negative" no-caps icon="o_block" :label="tr('cancelAgreement')" @click="doCancel" />
        </template>
      </div>

      <q-btn v-if="a.state !== 'draft'" flat no-caps color="primary" icon="o_picture_as_pdf" :label="tr('agreementPdf')" :loading="busy" class="q-mt-sm" @click="pdf" />
    </div>

    <div class="text-caption text-muted q-px-xs"><q-icon name="o_gavel" class="q-mr-xs" />{{ tr('legalNote') }}</div>
  </div>
</template>

<style scoped>
/* Blockchain progress stepper */
.chain-progress {
  display: flex;
  align-items: center;
  gap: 0;
  background: #f5f9f2;
  border: 1px solid #c8dfc0;
  border-radius: 10px;
  padding: 10px 14px;
}
.chain-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #aaa;
  text-align: center;
  flex: 1;
  transition: color 0.3s;
}
.chain-step.active { color: #163300; font-weight: 700; }
.chain-step.done { color: #34c759; }
.chain-step.done .q-icon { color: #34c759; }
.chain-step.active .q-icon { color: #163300; }
.chain-connector {
  width: 24px;
  height: 1px;
  background: #c8dfc0;
  flex-shrink: 0;
  margin-bottom: 14px;
}

/* On-chain record card */
.chain-record {
  background: #f0fff4;
  border: 1px solid #34c759;
  border-radius: 10px;
  padding: 10px 14px;
}
.chain-record-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.chain-record-hash {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.mono { font-family: 'SF Mono', 'Courier New', monospace; letter-spacing: 0.02em; }
.chain-explore-link {
  color: #163300;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.chain-explore-link:hover { text-decoration: underline; }
</style>
