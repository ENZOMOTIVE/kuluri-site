<script setup>
// Worker Home: what needs attention now – next steps, this week's timesheet, the upcoming job, rights & support.
import { computed } from 'vue'
import { t } from '../../data/i18n.js'
import { state, fmtShort } from '../../data/store.js'
import { CHECKLIST } from '../../data/rights.js'

const me = computed(() => state.workers.find((w) => w.id === state.me))
const firstName = computed(() => me.value.name.split(' ')[0])
const weekHours = computed(() => state.week.days.reduce((a, d) => a + d.hours, 0))
const upcoming = computed(() => state.jobs.find((j) => state.invitations[`${j.id}:${state.me}`] === 'Accepted'))

const prepDone = computed(() => CHECKLIST.filter((k) => state.onboarding[k]).length)
const nextSteps = computed(() => [
  state.week.status === 'Pending' && { icon: 'o_pending_actions', color: 'warning', text: t('stepConfirm'), sub: state.week.label, to: '/worker/earnings?tab=confirm' },
  Object.entries(state.invitations).some(([k, v]) => k.endsWith(state.me) && v === 'Invited') && { icon: 'o_mail', color: 'negative', text: t('stepInvite'), to: '/worker/jobs' },
  upcoming.value && prepDone.value < CHECKLIST.length && { icon: 'o_shield', color: 'primary', text: t('stepPrepare'), sub: `${prepDone.value}/${CHECKLIST.length}`, to: `/worker/job/${upcoming.value.id}?tab=prepare` },
].filter(Boolean))
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-caption text-muted q-mb-sm"><q-icon name="o_info" /> {{ t('demo') }}</div>
    <div class="text-h6 text-weight-bold">{{ t('hello').replace('{n}', firstName) }}</div>
    <div class="text-caption text-muted q-mb-md">{{ me.base }}</div>

    <!-- Next steps -->
    <template v-if="nextSteps.length">
      <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ t('nextSteps') }}</div>
      <div class="card q-mb-md">
        <q-list separator>
          <q-item v-for="s in nextSteps" :key="s.to" clickable :to="s.to">
            <q-item-section avatar><q-icon :name="s.icon" :color="s.color" /></q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ s.text }}</q-item-label>
              <q-item-label v-if="s.sub" caption>{{ s.sub }}</q-item-label>
            </q-item-section>
            <q-item-section side><q-icon name="chevron_right" color="grey-6" /></q-item-section>
          </q-item>
        </q-list>
      </div>
    </template>

    <!-- This week -->
    <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ t('thisWeek') }}</div>
    <div class="card q-pa-md q-mb-md">
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="text-weight-medium">{{ state.week.job }}</div>
          <div class="text-caption text-muted">{{ state.week.label }} · {{ state.week.farm }}</div>
        </div>
        <div class="text-right">
          <div class="text-h6 text-weight-bold">{{ weekHours }}</div>
          <div class="text-caption text-muted" style="margin-top: -4px">{{ t('hours') }}</div>
        </div>
      </div>
      <q-btn v-if="state.week.status === 'Pending'" unelevated color="primary" no-caps icon="o_task_alt" :label="t('confirmWeek')" class="full-width q-mt-sm" to="/worker/earnings?tab=confirm" />
      <div v-else class="text-caption verified q-mt-sm"><q-icon name="verified" class="q-mr-xs" />{{ t('confirmedBoth') }}</div>
    </div>

    <!-- Upcoming job -->
    <template v-if="upcoming">
      <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ t('upcomingJob') }}</div>
      <div class="card q-pa-md q-mb-md cursor-pointer" @click="$router.push(`/worker/job/${upcoming.id}`)">
        <div class="row items-center no-wrap">
          <q-avatar rounded size="42px" class="bg-sage-soft text-primary q-mr-md" icon="o_grass" />
          <div class="col">
            <div class="text-weight-bold">{{ upcoming.title }}</div>
            <div class="text-caption text-muted">FARM-13079 · {{ fmtShort(upcoming.start) }} – {{ fmtShort(upcoming.end) }}</div>
          </div>
          <q-icon name="chevron_right" color="grey-6" />
        </div>
      </div>
    </template>

    <!-- Rights & support -->
    <div class="card q-pa-md bg-surface-2 cursor-pointer" @click="$router.push('/worker/rights')">
      <div class="row items-center no-wrap">
        <q-icon name="o_shield" color="primary" size="22px" class="q-mr-sm" />
        <div class="col">
          <div class="text-subtitle2 text-weight-bold">{{ t('rightsSupport') }}</div>
          <div class="text-caption text-muted">{{ t('rightsSupportSub') }}</div>
        </div>
        <q-icon name="chevron_right" color="grey-6" />
      </div>
    </div>
  </q-page>
</template>
