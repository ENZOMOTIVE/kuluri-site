<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { t, lang } from '../../data/i18n.js'
import { state, fingerprint } from '../../data/store.js'

const $q = useQuasar()
const w = state.week
const loc = computed(() => (lang.value === 'ro' ? 'ro-RO' : 'en-GB'))
const dayLabel = (d) => new Date(d).toLocaleDateString(loc.value, { weekday: 'short', day: 'numeric', month: 'short' })
const total = computed(() => w.days.reduce((a, d) => a + d.hours, 0))
const expected = computed(() => total.value * w.payPerHour)

async function confirmWeek() {
  w.hash = await fingerprint({ worker: state.me, farm: w.farm, week: w.label, days: w.days, paidEur: w.paidEur })
  w.status = 'Confirmed'
}

const showDispute = ref(false)
const reason = ref('hours')
const note = ref('')
function sendDispute() {
  w.status = 'Disputed'
  w.dispute = { reason: reason.value, note: note.value }
  showDispute.value = false
  $q.notify({ type: 'warning', message: t('reportSent') })
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-sm">
      <q-btn flat dense round icon="arrow_back" class="q-mr-sm" @click="$router.push('/worker/earnings')" />
      <div class="text-subtitle1 text-weight-bold">{{ t('confirmWeek') }}</div>
    </div>

    <div class="card q-pa-md">
      <div class="text-caption text-muted">{{ t('week') }} {{ w.weekNo }} · {{ dayLabel(w.days[0].date) }} – {{ dayLabel(w.days[w.days.length - 1].date) }} · {{ w.farm }}</div>

      <div class="text-subtitle2 text-weight-bold q-mt-md q-mb-xs">{{ t('daysHours') }}</div>
      <q-list dense separator class="rounded" style="border: 1px solid var(--line)">
        <q-item v-for="d in w.days" :key="d.date">
          <q-item-section class="text-capitalize">{{ dayLabel(d.date) }}</q-item-section>
          <q-item-section side class="text-weight-bold" style="color: var(--text)">{{ d.hours }} h</q-item-section>
        </q-item>
      </q-list>

      <div class="row q-col-gutter-sm q-mt-md">
        <div class="col-4"><div class="card q-pa-sm bg-surface-2 text-center"><div class="text-subtitle1 text-weight-bold">{{ total }}</div><div class="text-caption text-muted">{{ t('totalHours') }}</div></div></div>
        <div class="col-4"><div class="card q-pa-sm bg-surface-2 text-center"><div class="text-subtitle1 text-weight-bold">€{{ expected.toFixed(2) }}</div><div class="text-caption text-muted">{{ t('expectedPay') }}</div></div></div>
        <div class="col-4"><div class="card q-pa-sm bg-surface-2 text-center"><div class="text-subtitle1 text-weight-bold">€{{ w.paidEur.toFixed(2) }}</div><div class="text-caption text-muted">{{ t('payReceived') }}</div></div></div>
      </div>

      <div v-if="w.status === 'Pending'" class="column q-gutter-sm q-mt-lg">
        <q-btn unelevated color="primary" size="lg" no-caps icon="check" :label="t('allCorrect')" @click="confirmWeek" />
        <q-btn outline color="negative" no-caps icon="o_report" :label="t('somethingWrong')" @click="showDispute = true" />
      </div>

      <div v-else-if="w.status === 'Confirmed'" class="q-mt-lg q-pa-md rounded bg-sage-soft">
        <div class="text-subtitle2 text-weight-bold text-primary"><q-icon name="verified" class="q-mr-xs" />{{ t('lockedTitle') }}</div>
        <div class="text-caption q-mt-xs">{{ t('lockedText') }}</div>
        <div class="text-caption text-muted q-mt-sm">{{ t('fingerprint') }} (SHA-256):</div>
        <div class="mono" style="word-break: break-all">{{ w.hash }}</div>
        <div class="text-caption text-muted q-mt-xs">Blockchain anchoring simulated in this prototype.</div>
      </div>

      <q-banner v-else rounded class="q-mt-lg" style="background: var(--amber-soft)">
        <template #avatar><q-icon name="o_report" color="warning" /></template>
        {{ t('disputed') }}
      </q-banner>
    </div>

    <q-dialog v-model="showDispute" position="bottom">
      <q-card style="width: 440px; max-width: 100vw" class="rounded">
        <q-card-section><div class="text-subtitle1 text-weight-bold">{{ t('whatWrong') }}</div></q-card-section>
        <q-card-section class="q-pt-none">
          <q-option-group v-model="reason" color="primary" :options="[{ label: t('hoursWrong'), value: 'hours' }, { label: t('payWrong'), value: 'pay' }, { label: t('other'), value: 'other' }]" />
          <q-input v-model="note" outlined autogrow class="q-mt-sm" placeholder="…" />
          <div class="text-caption text-muted q-mt-sm"><q-icon name="o_lock" /> {{ t('anonymous') }}</div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps :label="t('cancel')" v-close-popup />
          <q-btn unelevated no-caps color="negative" :label="t('sendReport')" @click="sendDispute" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
