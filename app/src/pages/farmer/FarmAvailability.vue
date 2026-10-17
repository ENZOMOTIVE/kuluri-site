<script setup>
// Season planner: when are workers with which skills available, compared with what the farm needs.
// Based on the availability workers set themselves (simulated pool).
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import SimulatedNote from '../../components/SimulatedNote.vue'
import { state, SKILLS } from '../../data/store.js'

const router = useRouter()

// ---- Week axis: Monday 5 Oct 2026 → 40 weeks (to early July 2027)
const START = new Date('2026-10-05')
const WEEKS = 40
const weeks = Array.from({ length: WEEKS }, (_, i) => {
  const s = new Date(START); s.setDate(START.getDate() + i * 7)
  const e = new Date(s); e.setDate(s.getDate() + 6)
  return { i, start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10), month: s.toLocaleDateString('en-GB', { month: 'short' }), firstOfMonth: s.getDate() <= 7, label: s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
})
const overlaps = (a1, a2, b1, b2) => a1 <= b2 && b1 <= a2

// ---- Filters
const nearOnly = ref(false)
const skill = ref(null) // null = all skills (rows), otherwise timeline for that skill
const pool = computed(() => state.workers.filter((w) => w.looking !== false && (!nearOnly.value || (w.distanceKm !== null && w.distanceKm <= 60))))
const skillsInUse = computed(() => SKILLS.filter((s) => state.workers.some((w) => w.skills.includes(s)) || state.jobs.some((j) => j.tasks.includes(s))))

const availableIn = (w, wk) => overlaps(w.available[0], w.available[1], wk.start, wk.end)
const supply = (s, wk) => pool.value.filter((w) => w.skills.includes(s) && availableIn(w, wk)).length
// Demand: positions of your open jobs that need this skill in this week
const demand = (s, wk) => state.jobs.filter((j) => j.status === 'Open' && j.tasks.includes(s) && overlaps(j.start, j.end, wk.start, wk.end)).reduce((a, j) => a + j.positions, 0)

function cellClass(s, wk) {
  const n = supply(s, wk), d = demand(s, wk)
  return [`lvl${Math.min(n, 4)}`, d ? (n >= d ? 'need-ok' : 'need-gap') : '']
}
const tip = (s, wk) => {
  const n = supply(s, wk), d = demand(s, wk)
  return `${s} · week of ${wk.label}: ${n} available${d ? ` · you need ${d}` : ''}`
}

// ---- Insights per open job: who is available for the whole job, per skill
const insights = computed(() => state.jobs.filter((j) => j.status === 'Open').flatMap((j) => j.tasks.map((s) => {
  const full = pool.value.filter((w) => w.skills.includes(s) && w.available[0] <= j.start && w.available[1] >= j.end).length
  const some = pool.value.filter((w) => w.skills.includes(s) && overlaps(w.available[0], w.available[1], j.start, j.end)).length
  const ok = full >= j.positions
  return { job: j.title, skill: s, positions: j.positions, full, some, ok, jobId: j.id }
})))

// ---- Timeline for one skill
const timeline = computed(() => (skill.value ? pool.value.filter((w) => w.skills.includes(skill.value)) : pool.value)
  .map((w) => {
    const from = Math.max(0, weeks.findIndex((wk) => wk.end >= w.available[0]))
    let to = weeks.findIndex((wk) => wk.start > w.available[1]); if (to === -1) to = WEEKS
    return { w, from, span: Math.max(0, to - from), verified: w.history.filter((h) => h.confirmed).length }
  })
  .filter((r) => r.span > 0)
  .sort((a, b) => a.from - b.from))
const jobBars = computed(() => state.jobs.filter((j) => j.status === 'Open' && (!skill.value || j.tasks.includes(skill.value))).map((j) => {
  const from = Math.max(0, weeks.findIndex((wk) => wk.end >= j.start))
  let to = weeks.findIndex((wk) => wk.start > j.end); if (to === -1) to = WEEKS
  return { j, from, span: to - from }
}))
const months = computed(() => weeks.filter((w) => w.firstOfMonth))
</script>

<template>
  <q-page class="page">
    <div class="page-header row items-end justify-between q-gutter-y-sm">
      <div>
        <h1 class="page-title">Availability</h1>
        <div class="text-muted q-mt-xs">When are workers with the skills you need available? Plan who to hire, and when, for the season.</div>
      </div>
      <q-btn unelevated color="primary" icon="o_person_search" label="Find workers" no-caps to="/farm/find" />
    </div>
    <SimulatedNote text="Based on the availability workers set in their app (simulated pool of workers). Workers can switch their visibility off at any time." />

    <!-- Insights -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div v-for="(x, i) in insights" :key="i" class="col-12 col-sm-6 col-md-4">
        <div class="card q-pa-md full-height" :style="x.ok ? '' : 'border-color:#e6cf9c; background: var(--amber-soft)'">
          <div class="row items-center no-wrap q-mb-xs">
            <q-icon :name="x.ok ? 'check_circle' : 'o_warning_amber'" :color="x.ok ? 'primary' : 'warning'" size="20px" class="q-mr-sm" />
            <span class="text-weight-bold">{{ x.skill }}</span>
          </div>
          <div class="text-caption text-muted ellipsis">{{ x.job }}</div>
          <div class="text-body2 q-mt-xs"><b>{{ x.full }}</b> available for the whole job · <b>{{ x.some }}</b> for part of it · you need <b>{{ x.positions }}</b></div>
          <div v-if="!x.ok" class="text-caption text-warning q-mt-xs">Invite early, or split the job into shorter periods.</div>
        </div>
      </div>
    </div>

    <!-- Heatmap: skills × weeks -->
    <div class="card q-pa-md q-mb-lg">
      <div class="row items-center q-mb-sm q-gutter-sm">
        <div class="text-subtitle1 text-weight-bold">Workers available per week</div>
        <q-space />
        <q-toggle v-model="nearOnly" dense label="Only within 60 km" color="primary" />
      </div>
      <div class="heat-scroll">
        <div class="heat">
          <div class="heat-row head">
            <div class="skill-cell" />
            <div v-for="wk in weeks" :key="wk.i" class="wk-head">{{ wk.firstOfMonth ? wk.month : '' }}</div>
          </div>
          <div v-for="s in skillsInUse" :key="s" class="heat-row" :class="{ active: skill === s }">
            <div class="skill-cell" @click="skill = skill === s ? null : s">{{ s }}</div>
            <div v-for="wk in weeks" :key="wk.i" class="cell" :class="cellClass(s, wk)" @click="skill = s">
              <span v-if="supply(s, wk)">{{ supply(s, wk) }}</span>
              <q-tooltip>{{ tip(s, wk) }}</q-tooltip>
            </div>
          </div>
        </div>
      </div>
      <div class="row items-center q-gutter-md q-mt-sm text-caption text-muted">
        <span class="row items-center"><span class="sw lvl0" />0</span>
        <span class="row items-center"><span class="sw lvl1" />1</span>
        <span class="row items-center"><span class="sw lvl2" />2</span>
        <span class="row items-center"><span class="sw lvl4" />4+</span>
        <span class="row items-center"><span class="sw need-ok" />your job · enough workers</span>
        <span class="row items-center"><span class="sw need-gap" />your job · not enough</span>
        <span>Click a skill to see the workers below.</span>
      </div>
    </div>

    <!-- Timeline -->
    <div class="card q-pa-md">
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle1 text-weight-bold">{{ skill ? `${skill} – who is available when` : 'All workers – who is available when' }}</div>
        <q-space />
        <q-btn v-if="skill" flat dense no-caps color="primary" icon="close" label="All skills" @click="skill = null" />
      </div>
      <div class="heat-scroll">
        <div class="tl" :style="{ '--weeks': WEEKS }">
          <div class="tl-row head">
            <div class="tl-name" />
            <div class="tl-track"><span v-for="m in months" :key="m.i" class="tl-month" :style="{ left: (m.i / WEEKS) * 100 + '%' }">{{ m.month }}</span></div>
          </div>
          <div v-for="b in jobBars" :key="b.j.id" class="tl-row">
            <div class="tl-name"><q-icon name="o_work_outline" color="secondary" class="q-mr-xs" /><span class="text-weight-bold ellipsis">{{ b.j.title }}</span></div>
            <div class="tl-track"><div class="bar job" :style="{ left: (b.from / WEEKS) * 100 + '%', width: (b.span / WEEKS) * 100 + '%' }">{{ b.j.positions }} needed</div></div>
          </div>
          <div v-for="r in timeline" :key="r.w.id" class="tl-row">
            <div class="tl-name">
              <q-avatar size="26px" class="bg-sage-soft text-primary text-weight-bold q-mr-sm" font-size="11px">{{ r.w.name.split(' ').map((x) => x[0]).join('') }}</q-avatar>
              <div class="col" style="min-width:0">
                <div class="text-weight-medium ellipsis">{{ r.w.name }} <q-icon v-if="r.verified" name="verified" color="primary" size="14px" /></div>
                <div class="text-caption text-muted ellipsis">{{ r.w.distanceKm !== null ? r.w.distanceKm + ' km' : 'can travel' }} · {{ r.w.languages.slice(0, 2).join(', ') }}</div>
              </div>
            </div>
            <div class="tl-track">
              <div class="bar worker" :style="{ left: (r.from / WEEKS) * 100 + '%', width: (r.span / WEEKS) * 100 + '%' }" @click="router.push('/farm/find')">
                <span class="ellipsis">{{ r.w.skills.join(' · ') }}</span>
                <q-tooltip>{{ r.w.name }} · available {{ r.w.available[0] }} → {{ r.w.available[1] }} · click to invite</q-tooltip>
              </div>
            </div>
          </div>
          <div v-if="!timeline.length" class="text-muted q-pa-md">No workers with this skill have set their availability yet.</div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.heat-scroll { overflow-x: auto; }
.heat { min-width: 1100px; }
.heat-row { display: grid; grid-template-columns: 170px repeat(40, 1fr); gap: 2px; margin-bottom: 2px; align-items: center; }
.heat-row.active .skill-cell { color: var(--sage); font-weight: 800; }
.skill-cell { font-size: 12.5px; font-weight: 600; cursor: pointer; padding-right: 8px; }
.wk-head { font-size: 11px; color: var(--muted); font-weight: 700; height: 18px; }
.cell { height: 26px; border-radius: 4px; font-size: 11px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text); box-sizing: border-box; }
.lvl0 { background: var(--surface-2); }
.lvl1 { background: #e0e6da; }
.lvl2 { background: #c6d1bd; }
.lvl3 { background: #a9b99e; color: #fff; }
.lvl4 { background: #728a67; color: #fff; }
.need-ok { outline: 2px solid #3e4c39; outline-offset: -2px; }
.need-gap { outline: 2px solid #b0553c; outline-offset: -2px; }
.sw { display: inline-block; width: 14px; height: 14px; border-radius: 3px; margin-right: 6px; }
.tl { min-width: 1100px; }
.tl-row { display: grid; grid-template-columns: 210px 1fr; gap: 8px; align-items: center; min-height: 40px; border-bottom: 1px solid var(--line); }
.tl-row.head { min-height: 24px; border-bottom: 0; }
.tl-name { display: flex; align-items: center; min-width: 0; font-size: 13px; }
.tl-track { position: relative; height: 26px; background: repeating-linear-gradient(90deg, transparent 0, transparent calc(100% / var(--weeks) - 1px), var(--line) calc(100% / var(--weeks) - 1px), var(--line) calc(100% / var(--weeks))); }
.tl-month { position: absolute; top: 4px; font-size: 11px; font-weight: 700; color: var(--muted); }
.bar { position: absolute; top: 3px; height: 20px; border-radius: 6px; font-size: 11px; padding: 0 8px; display: flex; align-items: center; white-space: nowrap; overflow: hidden; cursor: pointer; }
.bar.worker { background: #a9b99e; color: #2c332b; }
.bar.job { background: #3e4c39; color: #ece6d8; font-weight: 700; }
</style>
