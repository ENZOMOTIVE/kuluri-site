<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '../../data/i18n.js'
import { useAuthStore } from '../../stores/auth.js'
import { state, fmtShort } from '../../data/store.js'
import { agreements, visibleToWorker } from '../../data/agreements.js'
import { chats } from '../../data/chats.js'

const auth = useAuthStore()
const router = useRouter()

const firstName = computed(() => {
  const d = auth.displayName ?? ''
  if (!d) return 'there'
  const raw = d.includes('@') ? d.split('@')[0] : d.split(' ')[0]
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'there'
})

// Active or pending agreement for this worker
const myAgreement = computed(() =>
  agreements.find((a) => a.workerId === state.me && visibleToWorker(a) &&
    ['sent', 'agreed'].includes(a.state))
)

const activeJob = computed(() =>
  myAgreement.value ? state.jobs.find((j) => j.id === myAgreement.value.jobId) : null
)

const myChat = computed(() =>
  myAgreement.value
    ? chats.find((c) => c.id === myAgreement.value.chatId)
    : chats.find((c) => c.workerId === state.me)
)

const daysUntilStart = computed(() => {
  if (!myAgreement.value?.terms?.start) return null
  const diff = new Date(myAgreement.value.terms.start) - new Date()
  return Math.ceil(diff / 86400000)
})

const isPending = computed(() => myAgreement.value?.state === 'sent')
const isActive  = computed(() => myAgreement.value?.state === 'agreed')
</script>

<template>
  <q-page class="home-page">

    <!-- Greeting -->
    <div class="home-greeting">
      <div class="home-name">{{ t('hello').replace('{n}', firstName) }}</div>
    </div>

    <!-- ── ACTIVE JOB CARD ─────────────────────────────────────────── -->
    <div v-if="isActive && activeJob" class="home-job-card">

      <!-- Farm + job -->
      <div class="hjc-top">
        <div class="hjc-farm-icon"><q-icon name="o_agriculture" size="20px" color="white" /></div>
        <div class="col">
          <div class="hjc-job-title">{{ activeJob.title }}</div>
          <div class="hjc-farm">{{ myAgreement.farmId }}</div>
        </div>
        <div v-if="daysUntilStart !== null" class="hjc-countdown">
          <div class="hjc-days">{{ daysUntilStart > 0 ? daysUntilStart : 'Today' }}</div>
          <div class="hjc-days-label" v-if="daysUntilStart > 0">days to go</div>
        </div>
      </div>

      <!-- Key terms row -->
      <div class="hjc-terms">
        <span class="hjc-pill"><q-icon name="o_calendar_today" size="13px" /> {{ fmtShort(myAgreement.terms.start) }}</span>
        <span class="hjc-pill"><q-icon name="o_payments" size="13px" /> €{{ Number(myAgreement.terms.payPerHour).toFixed(2) }}/h</span>
        <span v-if="myAgreement.terms.housing" class="hjc-pill"><q-icon name="o_home" size="13px" /> Housing</span>
      </div>

      <!-- Quick actions -->
      <div class="hjc-actions">
        <button class="hjc-action" @click="router.push('/worker/chat?id=' + myChat?.id)">
          <q-icon name="o_chat_bubble_outline" size="20px" color="primary" />
          <span>Message farm</span>
          <q-badge v-if="myChat?.unread?.worker > 0" color="negative" floating rounded>{{ myChat.unread.worker }}</q-badge>
        </button>
        <button class="hjc-action" @click="router.push(`/worker/job/${activeJob.id}?tab=agreement`)">
          <q-icon name="o_handshake" size="20px" color="primary" />
          <span>Agreement</span>
        </button>
        <button class="hjc-action" @click="router.push('/worker/earnings')">
          <q-icon name="o_schedule" size="20px" color="primary" />
          <span>Hours</span>
        </button>
      </div>
    </div>

    <!-- ── PENDING AGREEMENT ALERT ─────────────────────────────────── -->
    <div v-else-if="isPending && activeJob" class="home-pending"
         @click="router.push(`/worker/job/${activeJob.id}?tab=agreement`)">
      <div class="hp-left">
        <q-icon name="o_handshake" size="22px" color="warning" class="q-mr-sm" style="flex-shrink:0" />
        <div>
          <div class="hp-title">Agreement waiting for you</div>
          <div class="hp-sub">{{ activeJob.title }} · {{ myAgreement.farmId }}</div>
        </div>
      </div>
      <q-icon name="chevron_right" size="20px" color="grey-5" />
    </div>

    <!-- ── EMPTY STATE ─────────────────────────────────────────────── -->
    <div v-else class="home-empty">
      <q-icon name="o_grass" size="48px" color="grey-4" class="q-mb-sm" />
      <div class="empty-title">Ready for your next job?</div>
      <div class="empty-sub">Browse available positions and apply — farms will reach out to you directly.</div>
      <button class="empty-cta" @click="router.push('/worker/jobs')">Browse jobs</button>
    </div>

    <!-- ── RIGHTS & SUPPORT ────────────────────────────────────────── -->
    <div class="home-rights" @click="router.push('/worker/rights')">
      <q-icon name="o_shield" color="primary" size="20px" />
      <div class="col">
        <div class="hr-title">{{ t('rightsSupport') }}</div>
        <div class="hr-sub">{{ t('rightsSupportSub') }}</div>
      </div>
      <q-icon name="chevron_right" color="grey-5" size="18px" />
    </div>

  </q-page>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 20px 16px 24px;
  gap: 16px;
}

/* Greeting */
.home-greeting { }
.home-name {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text);
}

/* Active job card */
.home-job-card {
  background: #fff;
  border-radius: 18px;
  border: 1px solid var(--line);
  padding: 16px;
  box-shadow: 0 2px 12px rgba(22,51,0,.07);
}
.hjc-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}
.hjc-farm-icon {
  width: 38px; height: 38px;
  background: var(--sage);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hjc-job-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
}
.hjc-farm {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}
.hjc-countdown {
  text-align: center;
  flex-shrink: 0;
}
.hjc-days {
  font-size: 22px;
  font-weight: 800;
  color: var(--sage);
  line-height: 1;
}
.hjc-days-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.hjc-terms {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.hjc-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--muted);
  background: var(--surface-2);
  border-radius: 999px;
  padding: 4px 10px;
}

.hjc-actions {
  display: flex;
  gap: 8px;
}
.hjc-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 4px;
  background: var(--lime-soft);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.hjc-action:active { opacity: 0.75; }
.hjc-action span {
  font-size: 11px;
  font-weight: 600;
  color: var(--sage);
}

/* Pending alert */
.home-pending {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #FFF8E1;
  border: 1.5px solid #F5C842;
  border-radius: 14px;
  padding: 14px 14px;
  cursor: pointer;
  touch-action: manipulation;
}
.home-pending:active { opacity: 0.8; }
.hp-left {
  display: flex;
  align-items: center;
  flex: 1;
}
.hp-title {
  font-size: 14px;
  font-weight: 700;
  color: #7a5000;
}
.hp-sub {
  font-size: 12px;
  color: #9a6a00;
  margin-top: 2px;
}

/* Empty state */
.home-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  min-height: 240px;
}
.empty-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}
.empty-sub {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
  max-width: 260px;
  margin-bottom: 20px;
}
.empty-cta {
  background: var(--sage);
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 13px 28px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
}
.empty-cta:active { opacity: 0.85; }

/* Rights */
.home-rights {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-2);
  border-radius: 14px;
  padding: 14px;
  cursor: pointer;
  touch-action: manipulation;
  margin-top: auto;
}
.home-rights:active { opacity: 0.8; }
.hr-title { font-size: 14px; font-weight: 700; color: var(--text); }
.hr-sub { font-size: 12px; color: var(--muted); margin-top: 1px; }
</style>
