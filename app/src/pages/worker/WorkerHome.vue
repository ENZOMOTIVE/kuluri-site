<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '../../data/i18n.js'
import { useAuthStore } from '../../stores/auth.js'
import { state, fmtShort } from '../../data/store.js'
import { agreements, visibleToWorker } from '../../data/agreements.js'
import { chats } from '../../data/chats.js'
import { userService } from '../../services/user.service.js'

const auth = useAuthStore()
const router = useRouter()

const workerProfile = ref(null)

onMounted(async () => {
  if (auth.user?.id) {
    workerProfile.value = await userService.getWorkerProfile(auth.user.id).catch(() => null)
  }
})

const firstName = computed(() => {
  const d = auth.displayName ?? ''
  if (!d) return 'there'
  const raw = d.includes('@') ? d.split('@')[0] : d.split(' ')[0]
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'there'
})

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

const profileSkills = computed(() => workerProfile.value?.skills ?? [])
const profileAvail  = computed(() => workerProfile.value?.availability_start)
const profileComplete = computed(() => profileSkills.value.length > 0 && !!profileAvail.value)

const openJobs = computed(() => state.jobs.filter((j) => j.status === 'Open').slice(0, 3))
</script>

<template>
  <q-page class="home-page">

    <!-- Greeting -->
    <div class="home-greeting">
      <div class="home-name">{{ t('hello').replace('{n}', firstName) }}</div>
    </div>

    <!-- ── ACTIVE JOB CARD ─────────────────────────────────────────── -->
    <div v-if="isActive && activeJob" class="home-job-card">
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
      <div class="hjc-terms">
        <span class="hjc-pill"><q-icon name="o_calendar_today" size="13px" /> {{ fmtShort(myAgreement.terms.start) }}</span>
        <span class="hjc-pill"><q-icon name="o_payments" size="13px" /> €{{ Number(myAgreement.terms.payPerHour).toFixed(2) }}/h</span>
        <span v-if="myAgreement.terms.housing" class="hjc-pill"><q-icon name="o_home" size="13px" /> Housing</span>
      </div>
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

    <!-- ── EMPTY STATE (no active job) ───────────────────────────────── -->
    <template v-else>

      <!-- Profile completeness card -->
      <div v-if="!profileComplete" class="home-card home-card--cta"
           @click="router.push('/worker/profile')">
        <div class="hcard-icon hcard-icon--orange">
          <q-icon name="o_person" size="20px" color="white" />
        </div>
        <div class="col">
          <div class="hcard-title">Complete your profile</div>
          <div class="hcard-sub">Add skills &amp; availability so farms can find you</div>
        </div>
        <q-icon name="chevron_right" size="18px" color="grey-4" />
      </div>
      <div v-else class="home-card home-card--green">
        <div class="hcard-icon hcard-icon--green">
          <q-icon name="o_visibility" size="20px" color="white" />
        </div>
        <div class="col">
          <div class="hcard-title">Profile visible to farms</div>
          <div class="hcard-sub">{{ profileSkills.slice(0,2).join(', ') }}{{ profileSkills.length > 2 ? ` +${profileSkills.length - 2} more` : '' }}</div>
        </div>
        <q-icon name="chevron_right" size="18px" color="grey-4" />
      </div>

      <!-- Open jobs -->
      <div class="home-section-label">Open positions near you</div>
      <div v-if="openJobs.length === 0" class="home-card">
        <div class="hcard-icon"><q-icon name="o_search_off" size="20px" color="white" /></div>
        <div class="col">
          <div class="hcard-title">No open positions right now</div>
          <div class="hcard-sub">Check back soon — new jobs are posted regularly</div>
        </div>
      </div>
      <div v-for="job in openJobs" :key="job.id"
           class="home-job-row"
           @click="router.push('/worker/jobs')">
        <div class="hjr-left">
          <div class="hjr-title">{{ job.title }}</div>
          <div class="hjr-meta">
            <span><q-icon name="o_calendar_today" size="11px" /> {{ fmtShort(job.start) }}</span>
            <span><q-icon name="o_payments" size="11px" /> €{{ Number(job.payPerHour).toFixed(2) }}/h</span>
            <span v-if="job.housing"><q-icon name="o_home" size="11px" /> Housing</span>
          </div>
        </div>
        <q-icon name="chevron_right" size="16px" color="grey-4" />
      </div>

      <button class="empty-cta" @click="router.push('/worker/jobs')">
        See all jobs
      </button>

    </template>

    <!-- ── SKILLS ─────────────────────────────────────────────────── -->
    <div class="home-section-label">Your skills</div>
    <div class="home-skills-card" @click="router.push('/worker/profile')">
      <template v-if="profileSkills.length">
        <span v-for="s in profileSkills" :key="s" class="skill-chip">{{ s }}</span>
        <span class="skill-chip skill-chip--edit"><q-icon name="o_edit" size="13px" /> Edit</span>
      </template>
      <template v-else>
        <div class="skills-empty">
          <q-icon name="o_add_circle_outline" size="16px" color="grey-5" class="q-mr-xs" />
          <span>Add your skills so farms can find you</span>
        </div>
      </template>
    </div>

    <!-- ── ACCOUNTABILITY ──────────────────────────────────────────── -->
    <div class="home-section-label">Accountability</div>
    <div class="home-account-row" @click="router.push('/worker/history')">
      <div class="acc-icon"><q-icon name="o_verified" size="20px" color="white" /></div>
      <div class="col">
        <div class="acc-title">Work history &amp; signed agreements</div>
        <div class="acc-sub">All your blockchain-verified records</div>
      </div>
      <q-icon name="chevron_right" size="18px" color="grey-4" />
    </div>
    <div class="home-account-row" @click="router.push('/worker/profile')">
      <div class="acc-icon acc-icon--blue"><q-icon name="o_person_pin" size="20px" color="white" /></div>
      <div class="col">
        <div class="acc-title">Public profile</div>
        <div class="acc-sub">What farms see when they find you</div>
      </div>
      <q-icon name="chevron_right" size="18px" color="grey-4" />
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
  gap: 12px;
}

/* Greeting */
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
.hjc-job-title { font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.3; }
.hjc-farm { font-size: 12px; color: var(--muted); margin-top: 2px; }
.hjc-countdown { text-align: center; flex-shrink: 0; }
.hjc-days { font-size: 22px; font-weight: 800; color: var(--sage); line-height: 1; }
.hjc-days-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
.hjc-terms { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.hjc-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; color: var(--muted);
  background: var(--surface-2); border-radius: 999px; padding: 4px 10px;
}
.hjc-actions { display: flex; gap: 8px; }
.hjc-action {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 10px 4px; background: var(--lime-soft); border: none; border-radius: 12px;
  cursor: pointer; position: relative; touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.hjc-action:active { opacity: 0.75; }
.hjc-action span { font-size: 11px; font-weight: 600; color: var(--sage); }

/* Pending */
.home-pending {
  display: flex; align-items: center; justify-content: space-between;
  background: #FFF8E1; border: 1.5px solid #F5C842; border-radius: 14px;
  padding: 14px; cursor: pointer; touch-action: manipulation;
}
.home-pending:active { opacity: 0.8; }
.hp-left { display: flex; align-items: center; flex: 1; }
.hp-title { font-size: 14px; font-weight: 700; color: #7a5000; }
.hp-sub { font-size: 12px; color: #9a6a00; margin-top: 2px; }

/* Generic cards */
.home-card {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border-radius: 14px;
  border: 1px solid var(--line); padding: 14px 14px;
  cursor: pointer; touch-action: manipulation;
}
.home-card:active { opacity: 0.8; }
.home-card--cta { border-color: #ff9500; background: #fff8f0; }
.home-card--green { border-color: #34c759; background: #f0fff4; }
.hcard-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--sage); display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.hcard-icon--orange { background: #ff9500; }
.hcard-icon--green  { background: #34c759; }
.hcard-title { font-size: 14px; font-weight: 700; color: var(--text); }
.hcard-sub   { font-size: 12px; color: var(--muted); margin-top: 2px; }

/* Section label */
.home-section-label {
  font-size: 13px; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: 0.04em;
  padding: 4px 2px 0;
}

/* Job rows */
.home-job-row {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border-radius: 12px;
  border: 1px solid var(--line); padding: 12px 14px;
  cursor: pointer; touch-action: manipulation;
}
.home-job-row:active { opacity: 0.8; }
.hjr-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
.hjr-meta { display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: var(--muted); align-items: center; }
.hjr-meta span { display: flex; align-items: center; gap: 3px; }

/* CTA button */
.empty-cta {
  background: var(--sage); color: #fff; border: none; border-radius: 14px;
  padding: 13px 0; font-size: 15px; font-weight: 700;
  cursor: pointer; touch-action: manipulation; width: 100%;
}
.empty-cta:active { opacity: 0.85; }

/* Skills card */
.home-skills-card {
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  padding: 12px 14px; display: flex; flex-wrap: wrap; gap: 8px;
  cursor: pointer; touch-action: manipulation; min-height: 48px; align-items: center;
}
.home-skills-card:active { opacity: 0.8; }
.skill-chip {
  font-size: 12px; font-weight: 600; color: var(--sage);
  background: var(--lime-soft); border-radius: 999px; padding: 5px 12px;
}
.skill-chip--edit {
  display: inline-flex; align-items: center; gap: 4px;
  color: var(--muted); background: var(--surface-2);
}
.skills-empty {
  display: flex; align-items: center; font-size: 13px; color: var(--muted);
}

/* Accountability rows */
.home-account-row {
  display: flex; align-items: center; gap: 12px;
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  padding: 14px; cursor: pointer; touch-action: manipulation;
}
.home-account-row:active { opacity: 0.8; }
.acc-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  background: var(--sage); display: flex; align-items: center; justify-content: center;
}
.acc-icon--blue { background: #007aff; }
.acc-title { font-size: 14px; font-weight: 700; color: var(--text); }
.acc-sub   { font-size: 12px; color: var(--muted); margin-top: 2px; }

/* Rights */
.home-rights {
  display: flex; align-items: center; gap: 10px;
  background: var(--surface-2); border-radius: 14px; padding: 14px;
  cursor: pointer; touch-action: manipulation; margin-top: auto;
}
.home-rights:active { opacity: 0.8; }
.hr-title { font-size: 14px; font-weight: 700; color: var(--text); }
.hr-sub { font-size: 12px; color: var(--muted); margin-top: 1px; }
</style>
