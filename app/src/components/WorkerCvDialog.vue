<script setup>
// A team member's CV and their work agreement, opened from My farm → Team.
// The CV shows only what the worker chose to share (farmView). Team members without a Kuluri profile
// (e.g. regular staff from the dataset) get a short CV built from their record at this farm.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { state, farm, farmView, skillRecord } from '../data/store.js'
import { agreements, statusOf, statusColor } from '../data/agreements.js'
import { chats } from '../data/chats.js'

const props = defineProps({ member: { type: Object, default: null } }) // a row of state.team
const emit = defineEmits(['close'])
const router = useRouter()

const worker = computed(() => {
  const w = props.member && state.workers.find((x) => x.id === props.member.id)
  return w ? farmView(w) : null
})
const skills = computed(() => (worker.value ? skillRecord(worker.value).filter((s) => worker.value.skills.includes(s.skill) || s.verified) : []))
const history = computed(() => (worker.value
  ? worker.value.history
  : [{ farm: farm.id, crop: props.member?.role, season: props.member?.period, hours: props.member?.hours, confirmed: props.member?.confirmation === 'Confirmed' }]))

const agreement = computed(() => props.member && agreements.find((a) => (a.workerId === props.member.id || a.workerName === props.member.name) && !['withdrawn', 'cancelled'].includes(a.state)))
const chat = computed(() => props.member && chats.find((c) => c.workerId === props.member.id))
const initials = computed(() => props.member?.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase())
const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function go(to) { emit('close'); router.push(to) }
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
            <q-btn flat dense no-caps color="primary" icon-right="chevron_right" label="Open contract" class="q-mt-sm" @click="go({ path: '/farm/contracts', query: { id: agreement.id } })" />
          </div>
          <div v-else class="card q-pa-md row items-center no-wrap">
            <div class="col text-body2 text-muted">No contract in Kuluri. Status: <b>{{ member.contract }}</b> (tracked outside Kuluri).</div>
            <q-btn v-if="chat" unelevated dense no-caps color="primary" icon="o_handshake" label="Create contract" class="q-px-sm" @click="go({ path: '/farm/contracts', query: { chat: chat.id } })" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
