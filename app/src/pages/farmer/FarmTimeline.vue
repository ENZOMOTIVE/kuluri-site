<script setup>
// Season timeline: for each job, which workers the farm has an agreement with, and for which period.
// One simple timeline instead of the skills × weeks heatmap (FarmAvailability.vue, kept for later).
import { QPage } from 'quasar'
import { computed } from 'vue'
import { state, fmtShort } from '../../data/store.js'
import { agreements, statusOf } from '../../data/agreements.js'

defineProps({ embedded: Boolean }) // shown inside a TabbedPage

const TODAY = '2026-10-17'
const COUNTED = ['agreed', 'completed'] // positions count as filled only when both sides agreed
const SHOWN = ['draft', 'sent', 'agreed', 'completed']

const rows = computed(() => state.jobs.map((job) => {
  const list = agreements.filter((a) => a.jobId === job.id && SHOWN.includes(a.state))
    .sort((x, y) => x.terms.start.localeCompare(y.terms.start))
  return { job, list, filled: list.filter((a) => COUNTED.includes(a.state)).length, waiting: list.filter((a) => a.state === 'sent').length }
}))

// Range: from the first month to the last month of all jobs and agreements
const range = computed(() => {
  const dates = rows.value.flatMap((r) => [r.job.start, r.job.end, ...r.list.flatMap((a) => [a.terms.start, a.terms.end])])
  const min = new Date(dates.reduce((a, b) => (a < b ? a : b)))
  const max = new Date(dates.reduce((a, b) => (a > b ? a : b)))
  return { from: new Date(min.getFullYear(), min.getMonth(), 1), to: new Date(max.getFullYear(), max.getMonth() + 1, 1) }
})
const pct = (d) => ((new Date(d) - range.value.from) / (range.value.to - range.value.from)) * 100
const bar = (start, end) => ({ left: `${pct(start)}%`, width: `${Math.max(pct(end) - pct(start), 1.5)}%` })
const months = computed(() => {
  const out = []
  for (let d = new Date(range.value.from); d < range.value.to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    out.push({ label: d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), ...bar(d, next) })
  }
  return out
})
const todayLeft = computed(() => `${pct(TODAY)}%`)
</script>

<template>
  <component :is="embedded ? 'div' : QPage" class="page">
    <div class="page-header">
      <h1 class="page-title">Season timeline</h1>
      <div class="text-muted q-mt-xs">For each job: which workers you have an agreement with, and when they work.</div>
    </div>

    <div class="row items-center q-gutter-md text-caption text-muted q-mb-md">
      <span class="row items-center"><span class="key job" />Job period</span>
      <span class="row items-center"><span class="key agreed" />Agreed by both</span>
      <span class="row items-center"><span class="key sent" />Waiting for the worker</span>
      <span class="row items-center"><span class="key draft" />Draft</span>
      <span class="row items-center"><span class="key today" />Today</span>
    </div>

    <div class="card q-pa-md">
      <!-- month axis -->
      <div class="tl-row axis">
        <div class="tl-label" />
        <div class="tl-track">
          <div v-for="m in months" :key="m.label" class="month" :style="{ left: m.left, width: m.width }">{{ m.label }}</div>
        </div>
      </div>

      <template v-for="r in rows" :key="r.job.id">
        <!-- job -->
        <div class="tl-row job-row">
          <div class="tl-label">
            <div class="text-weight-bold ellipsis">{{ r.job.title }}</div>
            <div class="text-caption" :class="r.filled >= r.job.positions ? 'verified' : 'text-muted'">
              {{ r.filled }} of {{ r.job.positions }} agreed<span v-if="r.waiting"> · {{ r.waiting }} waiting</span>
            </div>
          </div>
          <div class="tl-track">
            <div v-for="m in months" :key="m.label" class="grid" :style="{ left: m.left }" />
            <div class="today" :style="{ left: todayLeft }" />
            <div class="bar job" :style="bar(r.job.start, r.job.end)"><span>{{ fmtShort(r.job.start) }} – {{ fmtShort(r.job.end) }}</span></div>
          </div>
        </div>
        <!-- workers with an agreement for this job -->
        <div v-for="a in r.list" :key="a.id" class="tl-row">
          <div class="tl-label q-pl-md">
            <div class="ellipsis">{{ a.workerName }}</div>
            <div class="text-caption text-muted">{{ a.id }} · {{ statusOf(a) }}</div>
          </div>
          <div class="tl-track">
            <div v-for="m in months" :key="m.label" class="grid" :style="{ left: m.left }" />
            <div class="today" :style="{ left: todayLeft }" />
            <router-link class="bar" :class="a.state === 'completed' ? 'agreed' : a.state" :style="bar(a.terms.start, a.terms.end)" :to="{ path: '/farm/contracts', query: { id: a.id } }">
              <span>{{ fmtShort(a.terms.start) }} – {{ fmtShort(a.terms.end) }}</span>
              <q-tooltip>{{ a.workerName }} · {{ statusOf(a) }} · open agreement</q-tooltip>
            </router-link>
          </div>
        </div>
        <div v-if="!r.list.length" class="tl-row">
          <div class="tl-label q-pl-md text-caption text-muted">No agreements yet</div>
          <div class="tl-track"><div class="today" :style="{ left: todayLeft }" /></div>
        </div>
      </template>
    </div>
  </component>
</template>

<style scoped>
.tl-row { display: flex; align-items: center; min-height: 44px; border-bottom: 1px solid var(--line); }
.tl-row:last-child { border-bottom: 0; }
.tl-row.axis { min-height: 26px; }
.job-row { background: var(--surface-2); }
.tl-label { width: 240px; flex: none; padding-right: 12px; min-width: 0; }
.tl-track { position: relative; flex: 1; height: 44px; }
.axis .tl-track { height: 26px; }
.month { position: absolute; top: 4px; font-size: 11px; color: var(--muted); padding-left: 4px; border-left: 1px solid var(--line); }
.grid { position: absolute; top: 0; bottom: 0; border-left: 1px solid var(--line); }
.today { position: absolute; top: 0; bottom: 0; border-left: 2px solid #b0553c; z-index: 2; }
.bar { position: absolute; top: 11px; height: 22px; border-radius: 6px; font-size: 11px; display: flex; align-items: center; padding: 0 6px; overflow: hidden; white-space: nowrap; text-decoration: none; z-index: 1; }
.bar.job { border: 2px dashed #90a484; background: transparent; color: var(--muted); }
.bar.agreed { background: #5f7556; color: #f5f2eb; }
.bar.sent { background: #e9d9b0; color: #6b5420; border: 1px solid #c29438; }
.bar.draft { background: transparent; border: 1px dashed #a39c8e; color: var(--muted); }
.key { display: inline-block; width: 18px; height: 10px; border-radius: 3px; margin-right: 6px; }
.key.job { border: 2px dashed #90a484; }
.key.agreed { background: #5f7556; }
.key.sent { background: #e9d9b0; border: 1px solid #c29438; }
.key.draft { border: 1px dashed #a39c8e; }
.key.today { width: 2px; background: #b0553c; }
@media (max-width: 700px) { .tl-label { width: 130px; } }
</style>
