<script setup>
// Season calendar: a month grid with each job's period and each worker's agreed period as bars across the days.
// Replaces the simple timeline (FarmTimeline.vue) and the heatmap planner (FarmAvailability.vue), both kept for later.
import { QPage } from 'quasar'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { state, fmtShort } from '../../data/store.js'
import { agreements, statusOf } from '../../data/agreements.js'

defineProps({ embedded: Boolean }) // shown inside a TabbedPage

const router = useRouter()
const TODAY = '2026-10-17'
const SHOWN = ['draft', 'sent', 'agreed', 'completed']
const LANE = 24 // px per bar row

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

const month = ref(new Date(2026, 9, 1)) // October 2026 (demo "today")
const title = computed(() => month.value.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }))
const shift = (n) => { month.value = new Date(month.value.getFullYear(), month.value.getMonth() + n, 1) }
const goToday = () => { const t = new Date(TODAY); month.value = new Date(t.getFullYear(), t.getMonth(), 1) }

// Job filter
const jobFilter = ref('all')
const jobOptions = computed(() => [{ label: 'All jobs', value: 'all' }, ...state.jobs.map((j) => ({ label: j.title.split(' – ')[0], value: j.id }))])

// Events: each job's period, then the agreements for that job
const events = computed(() => state.jobs
  .filter((j) => jobFilter.value === 'all' || j.id === jobFilter.value)
  .flatMap((j) => {
    const list = agreements.filter((a) => a.jobId === j.id && SHOWN.includes(a.state))
    const agreed = list.filter((a) => ['agreed', 'completed'].includes(a.state)).length
    return [
      { id: j.id, kind: 'job', start: j.start, end: j.end, label: `${j.title.split(' – ')[0]} · ${agreed}/${j.positions} agreed`, tip: `${j.title} · ${fmtShort(j.start)} – ${fmtShort(j.end)}` },
      ...list.map((a) => ({ id: a.id, kind: a.state === 'completed' ? 'agreed' : a.state, start: a.terms.start, end: a.terms.end, label: a.workerName, tip: `${a.workerName} · ${statusOf(a)} · ${fmtShort(a.terms.start)} – ${fmtShort(a.terms.end)}`, agreement: a.id })),
    ]
  }))

// Staffing per day: workers needed (open positions of active jobs) vs. workers agreed / waiting.
// Drafts don't count. This colours each day so gaps are visible at first sight.
const jobsShown = computed(() => state.jobs.filter((j) => jobFilter.value === 'all' || j.id === jobFilter.value))
function coverage(day) {
  const active = (s, e) => s <= day && e >= day
  const jobs = jobsShown.value.filter((j) => active(j.start, j.end))
  const needed = jobs.reduce((a, j) => a + j.positions, 0)
  const ags = agreements.filter((a) => jobs.some((j) => j.id === a.jobId) && active(a.terms.start, a.terms.end))
  const agreed = ags.filter((a) => ['agreed', 'completed'].includes(a.state)).length
  const waiting = ags.filter((a) => a.state === 'sent').length
  const level = !needed ? 'none' : agreed >= needed ? 'full' : agreed + waiting > 0 ? 'partial' : 'empty'
  return { needed, agreed, waiting, level }
}
const initials = (name) => name.split(' ').map((s) => s[0]).join('').slice(0, 2)

// Weeks of the month (Monday first), each with its bars packed into lanes
const weeks = computed(() => {
  const first = month.value
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  let start = addDays(first, -((first.getDay() + 6) % 7))
  const out = []
  while (start <= last) {
    const days = Array.from({ length: 7 }, (_, i) => { const d = addDays(start, i); return { iso: iso(d), n: d.getDate(), inMonth: d.getMonth() === first.getMonth(), cov: coverage(iso(d)) } })
    const ws = days[0].iso, we = days[6].iso
    const lanes = []
    // earliest first (job before its workers on the same day), so bars stack without gaps
    const inWeek = events.value.filter((e) => e.start <= we && e.end >= ws)
      .sort((x, y) => (x.start < ws ? ws : x.start).localeCompare(y.start < ws ? ws : y.start) || (x.kind === 'job' ? -1 : y.kind === 'job' ? 1 : 0))
    const bars = inWeek.map((e) => {
      const s = e.start > ws ? e.start : ws, en = e.end < we ? e.end : we
      const col = days.findIndex((d) => d.iso === s), endCol = days.findIndex((d) => d.iso === en)
      let lane = lanes.findIndex((free) => free < col)
      if (lane === -1) { lane = lanes.length; lanes.push(endCol) } else lanes[lane] = endCol
      return { ...e, col, span: endCol - col + 1, lane, cutLeft: e.start < ws, cutRight: e.end > we }
    })
    out.push({ days, bars, height: 34 + Math.max(lanes.length, 1) * LANE + 8 })
    start = addDays(start, 7)
  }
  return out
})

const barStyle = (b) => ({ left: `calc(${(b.col / 7) * 100}% + 3px)`, width: `calc(${(b.span / 7) * 100}% - 6px)`, top: `${32 + b.lane * LANE}px` })

// Month summary: how many working days are fully staffed, short, or have nobody yet
const summary = computed(() => {
  const days = weeks.value.flatMap((w) => w.days).filter((d) => d.inMonth && d.cov.needed)
  const n = (l) => days.filter((d) => d.cov.level === l).length
  return [['full', 'Fully staffed', n('full')], ['partial', 'Short of workers', n('partial')], ['empty', 'Nobody agreed yet', n('empty')]]
})
const covTip = (c) => (c.needed ? `${c.agreed} of ${c.needed} workers agreed${c.waiting ? ` · ${c.waiting} waiting` : ''}` : 'No job this day')
const open = (b) => { if (b.agreement) router.push({ path: '/farm/contracts', query: { id: b.agreement } }) }
</script>

<template>
  <component :is="embedded ? 'div' : QPage" class="page">
    <div class="page-header">
      <h1 class="page-title">Schedule</h1>
      <div class="text-muted q-mt-xs">The season day by day: your jobs and the workers with an agreement.</div>
    </div>

    <!-- Toolbar -->
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-btn flat round dense icon="chevron_left" aria-label="Previous month" @click="shift(-1)" />
      <div class="text-h6 text-weight-bold" style="min-width: 170px; text-align: center">{{ title }}</div>
      <q-btn flat round dense icon="chevron_right" aria-label="Next month" @click="shift(1)" />
      <q-btn outline dense no-caps color="primary" label="Today" class="q-px-sm" @click="goToday" />
      <q-space />
      <q-btn-toggle v-model="jobFilter" dense no-caps unelevated rounded toggle-color="primary" color="grey-3" text-color="dark" size="sm" :options="jobOptions" />
    </div>

    <!-- At a glance: staffing this month -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div v-for="[lvl, label, n] in summary" :key="lvl" class="col-12 col-sm-4">
        <div class="card q-pa-sm row items-center no-wrap" :class="`sum-${lvl}`">
          <div class="sum-dot q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold q-mr-sm">{{ n }}</div>
          <div class="text-caption">days · {{ label }}</div>
        </div>
      </div>
    </div>

    <div class="row items-center q-gutter-md text-caption text-muted q-mb-sm">
      <span class="row items-center"><span class="key cov-full" />Day fully staffed</span>
      <span class="row items-center"><span class="key cov-partial" />Short</span>
      <span class="row items-center"><span class="key cov-empty" />Nobody yet</span>
      <span class="q-mx-xs">|</span>
      <span class="row items-center"><span class="key job" />Job period</span>
      <span class="row items-center"><span class="key agreed" />Agreed by both</span>
      <span class="row items-center"><span class="key sent" />Waiting for the worker</span>
      <span class="row items-center"><span class="key draft" />Draft</span>
    </div>

    <div class="card cal">
      <div class="dow"><div v-for="d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="d">{{ d }}</div></div>
      <div v-for="(w, i) in weeks" :key="i" class="week" :style="{ height: `${w.height}px` }">
        <div v-for="d in w.days" :key="d.iso" class="day" :class="[`cov-${d.cov.level}`, { out: !d.inMonth, today: d.iso === TODAY }]">
          <div class="row items-center no-wrap">
            <span class="num">{{ d.n }}</span>
            <q-space />
            <span v-if="d.cov.needed" class="count"><q-icon name="person" size="13px" />{{ d.cov.agreed }}/{{ d.cov.needed }}<span v-if="d.cov.waiting" class="wait">+{{ d.cov.waiting }}</span></span>
          </div>
          <q-tooltip v-if="d.cov.needed">{{ covTip(d.cov) }}</q-tooltip>
        </div>
        <div v-for="b in w.bars" :key="b.id" class="bar" :class="[b.kind, { cl: b.cutLeft, cr: b.cutRight, link: b.agreement }]" :style="barStyle(b)" @click="open(b)">
          <span v-if="b.agreement" class="ini">{{ initials(b.label) }}</span>
          <span class="ellipsis">{{ b.label }}</span>
          <q-tooltip>{{ b.tip }}<template v-if="b.agreement"> · click to open the agreement</template></q-tooltip>
        </div>
      </div>
    </div>
  </component>
</template>

<style scoped>
.cal { overflow: hidden; }
.dow { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid var(--line); background: var(--surface-2); }
.dow > div { padding: 8px 10px; font-size: 12px; font-weight: 700; color: var(--muted); }
.week { position: relative; display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid var(--line); }
.week:last-child { border-bottom: 0; }
.day { border-right: 1px solid var(--line); padding: 5px 8px; }
.day:last-child { border-right: 0; }
.day.out { opacity: 0.5; }
.num { font-size: 13px; font-weight: 600; }
.day.today .num { color: #b0553c; border: 1.5px solid #b0553c; border-radius: 999px; padding: 0 6px; }
/* staffing of the day: calm signal – thin line at the bottom + soft count label, neutral background */
.day.cov-full { box-shadow: inset 0 -2px 0 #9fb394; }
.day.cov-partial { box-shadow: inset 0 -2px 0 #dcc28a; }
.day.cov-empty { box-shadow: inset 0 -2px 0 #d9a593; }
.count { font-size: 11px; font-weight: 700; padding: 0 6px; border-radius: 999px; display: inline-flex; align-items: center; gap: 2px; }
.cov-full .count { background: #e6ece1; color: #4b5e44; }
.cov-partial .count { background: #f3ecdb; color: #7a6230; }
.cov-empty .count { background: #f3e4de; color: #8a4a36; }
.count .wait { margin-left: 3px; opacity: 0.75; font-weight: 600; }
.bar { position: absolute; height: 20px; border-radius: 6px; font-size: 12px; line-height: 20px; padding: 0 6px; display: flex; align-items: center; gap: 5px; overflow: hidden; z-index: 1; }
.bar.cl { border-top-left-radius: 0; border-bottom-left-radius: 0; }
.bar.cr { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.bar.link { cursor: pointer; }
.bar.link:hover { filter: brightness(0.97); }
.bar.job { border: 1px dashed #b7c6ad; color: #55644f; background: transparent; font-weight: 600; }
.bar.agreed { background: #dfe7da; color: #3e4c39; border: 1px solid #b7c6ad; font-weight: 600; }
.bar.sent { background: #f5eedd; color: #6b5420; border: 1px solid #e0cfa3; font-weight: 600; }
.bar.draft { border: 1px dashed #cfc8ba; color: var(--muted); background: transparent; }
.ini { flex: none; width: 16px; height: 16px; border-radius: 999px; font-size: 9px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.7); color: #55644f; }
.sum-dot { width: 12px; height: 12px; border-radius: 999px; flex: none; }
.sum-full .sum-dot { background: #9fb394; }
.sum-partial .sum-dot { background: #dcc28a; }
.sum-empty .sum-dot { background: #d9a593; }
.key.cov-full { border-bottom: 2px solid #9fb394; border-radius: 0; }
.key.cov-partial { border-bottom: 2px solid #dcc28a; border-radius: 0; }
.key.cov-empty { border-bottom: 2px solid #d9a593; border-radius: 0; }
.key { display: inline-block; width: 18px; height: 10px; border-radius: 3px; margin-right: 6px; }
.key.job { border: 1px dashed #b7c6ad; }
.key.agreed { background: #dfe7da; border: 1px solid #b7c6ad; }
.key.sent { background: #f5eedd; border: 1px solid #e0cfa3; }
.key.draft { border: 1px dashed #cfc8ba; }
@media (max-width: 700px) { .day { padding: 2px 4px; } .bar { font-size: 10px; padding: 0 3px; } }
</style>
