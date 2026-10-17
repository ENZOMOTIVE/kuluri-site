<script setup>
// Earnings, banking-app style: balance header, quick actions, weekly chart, alerts, activity by date.
// Kuluri does not hold or pay money – these are the hours and pay recorded by the worker and the farm.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { t, lang } from '../../data/i18n.js'
import { state } from '../../data/store.js'

const router = useRouter()
const $q = useQuasar()
const loc = computed(() => (lang.value === 'ro' ? 'ro-RO' : 'en-GB'))
const eur = (v) => '€' + v.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const hoursOf = (w) => w.days.reduce((a, d) => a + d.hours, 0)

const weeks = computed(() => [
  ...state.earnings.map((w) => ({ ...w, status: 'Confirmed' })),
  { ...state.week, received: state.week.paidEur },
].map((w) => {
  const hours = hoursOf(w)
  const expected = Math.round(hours * w.payPerHour * 100) / 100
  return { ...w, hours, expected, gap: Math.round((expected - w.received) * 100) / 100 }
}))
const pending = computed(() => weeks.value.find((w) => w.status === 'Pending'))
const gaps = computed(() => weeks.value.filter((w) => w.gap > 0.5))

const total = computed(() => weeks.value.reduce((a, w) => a + w.expected, 0))
const received = computed(() => weeks.value.reduce((a, w) => a + w.received, 0))
const open = computed(() => Math.max(0, total.value - received.value))
const hours = computed(() => weeks.value.reduce((a, w) => a + w.hours, 0))

// Weekly chart (Mon–Sun) with week switcher
const idx = ref(weeks.value.length - 1)
const shown = computed(() => weeks.value[idx.value])
const chartDays = computed(() => {
  const first = new Date(shown.value.days[0].date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(first); d.setDate(first.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    const h = shown.value.days.find((x) => x.date === iso)?.hours ?? 0
    return { label: d.toLocaleDateString(loc.value, { weekday: 'narrow' }), hours: h, eur: h * shown.value.payPerHour }
  })
})
const maxH = 10

// Activity, newest first, grouped by payment date
const activity = computed(() => [...weeks.value].sort((a, b) => b.paidOn.localeCompare(a.paidOn)))
const day = (d) => new Date(d).toLocaleDateString(loc.value, { day: 'numeric', month: 'long', year: 'numeric' })

const asked = ref({})
function askFarm(w) {
  asked.value[w.weekNo] = true
  $q.notify({ type: 'positive', icon: 'o_send', message: `${t('askSent')} ${w.farm} · ${t('week')} ${w.weekNo}: ${eur(w.gap)}` })
}
</script>

<template>
  <q-page class="earn">
    <!-- Balance header -->
    <div class="hero">
      <div class="text-caption hero-dim">{{ t('seasonEarnings') }} · 2026</div>
      <div class="hero-amount">{{ eur(total) }}</div>
      <div class="row q-gutter-x-lg q-mt-xs">
        <div><div class="hero-dim text-caption">{{ t('received') }}</div><div class="text-weight-bold">{{ eur(received) }}</div></div>
        <div><div class="hero-dim text-caption">{{ t('outstanding') }}</div><div class="text-weight-bold" :class="open > 0.5 ? 'text-amber' : ''">{{ eur(open) }}</div></div>
        <div><div class="hero-dim text-caption text-capitalize">{{ t('hours') }}</div><div class="text-weight-bold">{{ hours }}</div></div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="actions card">
      <div class="action" @click="router.push('/worker/confirm')">
        <q-avatar size="46px" class="bg-sage-soft text-primary" icon="o_fact_check"><q-badge v-if="pending" color="warning" floating rounded>1</q-badge></q-avatar>
        <span>{{ t('confirmWeekShort') }}</span>
      </div>
      <div class="action" @click="router.push('/worker/confirm')">
        <q-avatar size="46px" class="bg-sage-soft text-negative" icon="o_report" />
        <span>{{ t('reportShort') }}</span>
      </div>
      <div class="action" @click="router.push('/worker')">
        <q-avatar size="46px" class="bg-sage-soft text-primary" icon="o_picture_as_pdf" />
        <span>{{ t('statement') }}</span>
      </div>
      <div class="action" @click="router.push('/worker/jobs')">
        <q-avatar size="46px" class="bg-sage-soft text-primary" icon="o_work_outline" />
        <span>{{ t('jobs') }}</span>
      </div>
    </div>

    <div class="q-px-md column q-gutter-y-md q-pb-lg">
      <!-- To confirm -->
      <div v-if="pending" class="card q-pa-md row items-center no-wrap" style="border-color:#e6cf9c">
        <q-icon name="o_pending_actions" color="warning" size="26px" class="q-mr-md" />
        <div class="col">
          <div class="text-weight-bold">{{ t('week') }} {{ pending.weekNo }} · {{ pending.farm }}</div>
          <div class="text-caption text-muted">{{ pending.hours }} h · {{ eur(pending.expected) }} · {{ t('pendingConfirm') }}</div>
        </div>
        <q-btn unelevated dense no-caps color="primary" class="q-px-md" :label="t('confirm')" to="/worker/confirm" />
      </div>

      <!-- Paid less than recorded -->
      <div v-for="w in gaps" :key="w.weekNo" class="card q-pa-md row items-center no-wrap" style="background: var(--amber-soft); border-color:#e6cf9c">
        <q-icon name="o_warning_amber" color="warning" size="26px" class="q-mr-md" />
        <div class="col">
          <div class="text-weight-bold">{{ t('week') }} {{ w.weekNo }}: {{ eur(w.gap) }} {{ t('missingAmount') }}</div>
          <div class="text-caption text-muted">{{ t('recorded') }} {{ eur(w.expected) }} · {{ t('received') }} {{ eur(w.received) }}</div>
        </div>
        <q-btn v-if="!asked[w.weekNo]" outline dense no-caps color="primary" class="q-px-sm" :label="t('askFarm')" @click="askFarm(w)" />
        <q-badge v-else color="accent" :label="t('asked')" />
      </div>

      <!-- Weekly chart -->
      <div class="card q-pa-md">
        <div class="row items-center no-wrap">
          <q-btn flat round dense icon="chevron_left" :disable="idx === 0" @click="idx--" />
          <div class="col text-center">
            <div class="text-weight-bold">{{ t('week') }} {{ shown.weekNo }}</div>
            <div class="text-caption text-muted">{{ shown.farm }} · {{ shown.job }}</div>
          </div>
          <q-btn flat round dense icon="chevron_right" :disable="idx === weeks.length - 1" @click="idx++" />
        </div>
        <div class="text-center q-mt-sm">
          <span class="text-h5 text-weight-bold">{{ eur(shown.expected) }}</span>
          <span class="text-caption text-muted q-ml-sm">{{ shown.hours }} h · {{ eur(shown.payPerHour) }}/h</span>
        </div>
        <div class="bars q-mt-md">
          <div v-for="(d, i) in chartDays" :key="i" class="bar-col">
            <div class="bar-val text-caption">{{ d.hours ? d.hours + 'h' : '' }}</div>
            <div class="bar-track"><div class="bar" :style="{ height: (d.hours / maxH) * 100 + '%' }" /></div>
            <div class="text-caption text-muted text-uppercase">{{ d.label }}</div>
          </div>
        </div>
        <div class="row justify-center q-mt-sm">
          <q-badge :color="shown.status === 'Pending' ? 'warning' : 'primary'" :label="shown.status === 'Pending' ? t('pendingConfirm') : t('confirmedBoth')" />
        </div>
      </div>

      <!-- Activity -->
      <div>
        <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ t('activity') }}</div>
        <div class="card">
          <template v-for="(w, i) in activity" :key="w.weekNo">
            <div class="date-head">{{ day(w.paidOn) }}</div>
            <q-item>
              <q-item-section avatar><q-avatar size="38px" class="bg-sage-soft text-primary" icon="o_payments" /></q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ t('payReceived') }} · {{ w.farm }}</q-item-label>
                <q-item-label caption>{{ t('week') }} {{ w.weekNo }} · {{ w.hours }} h</q-item-label>
                <q-item-label v-if="w.gap > 0.5" caption class="text-warning">{{ eur(w.gap) }} {{ t('missingAmount') }}</q-item-label>
                <q-item-label v-else-if="w.status === 'Pending'" caption class="text-warning">{{ t('pendingConfirm') }}</q-item-label>
              </q-item-section>
              <q-item-section side class="text-weight-bold" style="color: var(--text)">+{{ eur(w.received) }}</q-item-section>
            </q-item>
            <q-separator v-if="i < activity.length - 1" />
          </template>
        </div>
      </div>

      <div class="text-caption text-muted"><q-icon name="o_info" class="q-mr-xs" />{{ t('notWallet') }}</div>
    </div>
  </q-page>
</template>

<style scoped>
.earn { background: var(--page-bg); }
.hero { background: linear-gradient(160deg, #2c332b 0%, #3b4439 100%); color: #ece6d8; padding: 22px 20px 54px; border-radius: 0 0 22px 22px; }
.hero-dim { color: #b3ad9f; }
.hero-amount { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; margin: 2px 0 6px; }
.text-amber { color: #e6cf9c; }
.actions { margin: -36px 16px 16px; padding: 14px 8px; display: flex; justify-content: space-around; box-shadow: 0 6px 18px rgba(44, 51, 43, 0.12); }
.action { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; cursor: pointer; width: 25%; text-align: center; }
.bars { display: flex; justify-content: space-between; align-items: flex-end; height: 150px; gap: 6px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.bar-track { flex: 1; width: 70%; display: flex; align-items: flex-end; background: var(--surface-2); border-radius: 8px; overflow: hidden; }
.bar { width: 100%; background: #5f7556; border-radius: 8px 8px 0 0; transition: height 0.3s; }
.bar-val { height: 18px; color: var(--muted); }
.date-head { padding: 8px 16px 2px; font-size: 12px; font-weight: 700; color: var(--muted); background: var(--surface-2); }
</style>
