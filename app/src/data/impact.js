// Social impact indicators, grouped by the ESF+ specific objectives they provide evidence for
// (Regulation (EU) 2021/1057, Art. 4(1)). Aggregated and anonymous: no names, no nationality, age or gender.
// SIMULATED in the prototype – computed from the demo worker pool and this farm's team.
import { computed } from 'vue'
import { state, teamStats, fairRecord, skillRecord } from './store.js'

const NON_EU = /\((MD|AL|UA|RS|BA|ME|MK|GE|TR|MA|TN|IN|PK)\)/ // worker's base location, not nationality

export const impact = computed(() => {
  const pool = state.workers
  const seasonal = state.team.filter((w) => w.type === 'Seasonal')
  const verifiedJobs = pool.flatMap((w) => w.history.filter((h) => h.confirmed))
  const skills = pool.map(skillRecord)
  const skillConfirmations = skills.flat().reduce((a, s) => a + s.jobs, 0)
  const withVerifiedSkill = skills.filter((r) => r.some((s) => s.verified)).length
  const noRecordYet = pool.filter((w) => !w.history.some((h) => h.confirmed)).length
  const nonEuBase = pool.filter((w) => NON_EU.test(w.base)).length
  const languages = new Set(pool.flatMap((w) => w.languages)).size

  return [
    { key: 'b', objective: '(a)(b)', title: 'Access to work & matching', icon: 'o_handshake',
      text: 'Farms find workers by skills, availability, languages and distance; workers find legal seasonal jobs.',
      kpis: [
        ['Seasonal workers employed this year', seasonal.length],
        ['Workers available in the planner', pool.filter((w) => w.looking !== false).length],
        ['Open positions', state.jobs.filter((j) => j.status === 'Open').reduce((a, j) => a + j.positions, 0)],
      ] },
    { key: 'e', objective: '(e)(g)', title: 'Skills learned at work', icon: 'o_school',
      text: 'Skills confirmed by farms in real jobs – evidence of skills learned on the job that workers carry to the next job, training or employer.',
      kpis: [
        ['Skill confirmations by farms', skillConfirmations],
        ['Workers with at least one farm-confirmed skill', `${withVerifiedSkill} / ${pool.length}`],
        ['Verified jobs in workers’ histories', verifiedJobs.length],
      ] },
    { key: 'h', objective: '(h)', title: 'Inclusion & equal opportunities', icon: 'o_diversity_3',
      text: 'Free for workers. Matching never uses nationality, age or gender. People without a work record get visible through their skills and availability.',
      kpis: [
        ['Workers without a verified record yet', noRecordYet],
        ['Matching criteria using nationality, age or gender', 0],
        ['Fee charged to workers', '€0'],
      ] },
    { key: 'i', objective: '(i)', title: 'Integration of workers from outside the EU', icon: 'o_translate',
      text: 'Chat and the worker app in the worker’s own language; job terms visible before arrival.',
      kpis: [
        ['Workers based outside the EU', nonEuBase],
        ['Languages in the worker pool', languages],
        ['Worker app languages', 2],
      ] },
    { key: 'd', objective: '(d)', title: 'Fair & healthy working conditions', icon: 'o_health_and_safety',
      text: 'Workers confirm their own hours and pay each week; problems are reported and visible to the farm.',
      kpis: [
        ['Records confirmed by workers', `${fairRecord.value.confirmedShare}%`],
        ['Records disputed (to resolve)', teamStats.value.disputed],
        ['Team members with written terms', `${fairRecord.value.writtenTerms}%`],
      ] },
  ]
})

export function impactCsv(rows) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`
  const lines = [['ESF+ objective (Art. 4(1))', 'Area', 'Indicator', 'Value'].map(esc).join(',')]
  for (const g of rows) for (const [k, v] of g.kpis) lines.push([g.objective, g.title, k, v].map(esc).join(','))
  return lines.join('\n')
}
