<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { agreements, visibleToWorker, statusColor } from '../../data/agreements.js'
import { state } from '../../data/store.js'

const router = useRouter()

const myAgreements = computed(() =>
  agreements
    .filter((a) => a.workerId === state.me && visibleToWorker(a))
    .slice()
    .sort((a, b) => new Date(b.terms.start) - new Date(a.terms.start))
)

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const stateLabel = {
  sent:      'Pending your confirmation',
  agreed:    'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const stateIcon = {
  sent:      'o_pending',
  agreed:    'o_check_circle',
  completed: 'o_verified',
  cancelled: 'o_cancel',
}
</script>

<template>
  <q-page class="hist-page">

    <!-- Header row -->
    <div class="hist-header">
      <q-btn flat round dense icon="arrow_back" color="grey-6" @click="router.back()" />
      <span class="hist-title">History</span>
    </div>

    <!-- Empty state -->
    <div v-if="myAgreements.length === 0" class="hist-empty">
      <q-icon name="o_handshake" size="48px" color="grey-4" class="q-mb-sm" />
      <div class="hist-empty-title">No agreements yet</div>
      <div class="hist-empty-sub">Agreements you confirm with farms will appear here.</div>
    </div>

    <!-- Agreement cards -->
    <div v-else class="hist-list">
      <div
        v-for="a in myAgreements"
        :key="a.id"
        class="hist-card"
        @click="router.push(`/worker/job/${a.jobId}?tab=agreement`)"
      >
        <!-- Status bar -->
        <div class="hist-card-status" :class="`hist-status--${a.state}`">
          <q-icon :name="stateIcon[a.state] ?? 'o_handshake'" size="15px" class="q-mr-xs" />
          {{ stateLabel[a.state] ?? a.state }}
        </div>

        <!-- Job title -->
        <div class="hist-job">{{ a.terms.job ?? a.jobId }}</div>

        <!-- Farm -->
        <div class="hist-farm">
          <q-icon name="o_agriculture" size="14px" class="q-mr-xs" />
          {{ a.farmId }}
        </div>

        <!-- Key terms row -->
        <div class="hist-terms">
          <span class="hist-term">
            <q-icon name="o_calendar_today" size="13px" />
            {{ fmtDate(a.terms.start) }}
          </span>
          <span v-if="a.terms.payPerHour" class="hist-term">
            <q-icon name="o_payments" size="13px" />
            €{{ Number(a.terms.payPerHour).toFixed(2) }}/h
          </span>
          <span v-if="a.terms.housing" class="hist-term">
            <q-icon name="o_home" size="13px" />
            Housing
          </span>
        </div>

        <!-- Fingerprint -->
        <div v-if="a.hash" class="hist-hash">
          <q-icon name="o_fingerprint" size="12px" class="q-mr-xs" />
          {{ a.hash.slice(0, 24) }}…
        </div>

        <q-icon name="chevron_right" size="18px" color="grey-4" class="hist-chevron" />
      </div>
    </div>

  </q-page>
</template>

<style scoped>
.hist-page {
  background: #f2f2f7;
  min-height: 100%;
}

/* Header */
.hist-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 12px 8px;
  background: #f2f2f7;
}
.hist-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.02em;
}

/* Empty */
.hist-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  text-align: center;
}
.hist-empty-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
}
.hist-empty-sub {
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}

/* List */
.hist-list {
  padding: 8px 16px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Card */
.hist-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 14px 12px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
}
.hist-card:active { opacity: 0.85; }

/* Status stripe */
.hist-card-status {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-radius: 6px;
  padding: 4px 9px;
  margin-bottom: 10px;
}
.hist-status--agreed    { background: #e9f7ee; color: #163300; }
.hist-status--completed { background: #EBF9E0; color: #163300; }
.hist-status--sent      { background: #FFF8E1; color: #8a6000; }
.hist-status--cancelled { background: #FADADD; color: #8a0000; }

.hist-job {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
  padding-right: 24px;
}
.hist-farm {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 10px;
}

/* Terms pills row */
.hist-terms {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.hist-term {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: var(--muted);
  background: #f2f2f7;
  border-radius: 999px;
  padding: 3px 9px;
}

/* Fingerprint */
.hist-hash {
  display: flex;
  align-items: center;
  font-size: 10px;
  font-family: 'SF Mono', 'Courier New', monospace;
  color: #bbb;
  letter-spacing: 0.02em;
}

/* Chevron */
.hist-chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
