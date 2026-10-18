// Shared app state for the prototype.
// REAL (synthetic dataset): farm profile, parcels, inputs, certificate, regular workers' hours (FARM-13079).
// SIMULATED: job posts, worker pool, seasonal workers, invitations, confirmations (the dataset has no such data).
import { reactive, computed } from 'vue'
import profile from './profile_farm13079.json'
import salesData from './sales_farm13079.json'

const CROP = { COWT: 'Common wheat', BARL: 'Barley', MAIZ: 'Maize', SUNF: 'Sunflower', RAPE: 'Rapeseed', OLIV: 'Olives', HAY: 'Hay' }
export const cropName = (c) => CROP[c] ?? c

const y2025 = profile.yearly.find((y) => y.year === 2025)
const cert = salesData.certificates[0]

export const farm = {
  id: 'FARM-13079',
  region: 'Milano (IT) · NUTS3 ITC4C',
  areaHa: profile.holding.uaa_ha,
  parcels: profile.parcels,
  crops: [...new Set(profile.parcels.map((p) => cropName(p.crop))), 'Olives'],
  organic: profile.holding.organic === 1,
  certificate: cert,
  yearly: profile.yearly,
  y2025,
  regularWorkers: profile.labour.filter((l) => l.category === 'PAID_REGULAR'),
  familyWorkers: profile.labour.filter((l) => l.category !== 'PAID_REGULAR'),
  // The dataset has no geographic coordinates (lat/lon excluded). DEMO pin in rural Milano province;
  // in the product the farmer sets the exact farmyard pin.
  location: { lat: 45.40, lng: 8.95, approximate: true, label: 'Farmyard (approximate)' },
}

// Simple SHA-256 fingerprint of a record (real hash; anchoring on a chain is simulated in the prototype)
export async function fingerprint(obj) {
  const text = JSON.stringify(obj)
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return '0x' + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  let h = 0
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0
  return '0x' + (h >>> 0).toString(16).padStart(8, '0') + '…'
}
export const shortHash = (h) => (h ? `${h.slice(0, 8)}…${h.slice(-4)}` : '')

export const SKILLS = ['Combine harvester', 'Tractor driving', 'Grain handling', 'Sowing', 'Spraying (certified)', 'Hand harvest', 'Machinery repair', 'Irrigation', 'Forklift', 'Sorting & packing']
export const LANGS = ['Italian', 'English', 'Romanian', 'Polish', 'Bulgarian', 'Albanian', 'Spanish', 'Greek', 'Arabic', 'Punjabi']

// ---- Simulated worker pool -------------------------------------------------------------
// Matching uses skills, availability, languages and distance only. Never nationality, age or gender.
// `available`: the period the worker says they can work; `looking`: worker is visible to farms as available
const pool = [
  // --- Strong matches for J-01 (Maize harvest, Oct–Nov, Combine+Grain, IT/RO/EN) ---
  { id: 'W-1042', name: 'Andrei P.', base: 'Can travel · based in Iași (RO)', distanceKm: null, languages: ['Romanian', 'Italian', 'English'], skills: ['Combine harvester', 'Tractor driving', 'Grain handling'], available: ['2026-10-01', '2026-12-15'],
    history: [
      { farm: 'FARM-06127', crop: 'Maize', season: '2025 autumn', hours: 412, confirmed: true, skills: ['Combine harvester', 'Grain handling'] },
      { farm: 'FARM-02408', crop: 'Common wheat', season: '2025 summer', hours: 356, confirmed: true, skills: ['Combine harvester', 'Tractor driving'] },
      { farm: 'FARM-06127', crop: 'Maize', season: '2024 autumn', hours: 388, confirmed: true, skills: ['Grain handling'] },
    ] },
  { id: 'W-4401', name: 'Ion D.', base: 'Can travel · based in Chișinău (MD)', distanceKm: null, languages: ['Romanian', 'English'], skills: ['Combine harvester', 'Grain handling'], available: ['2026-10-15', '2026-11-30'],
    history: [
      { farm: 'FARM-05649', crop: 'Sunflower', season: '2025 autumn', hours: 260, confirmed: true, skills: ['Combine harvester'] },
      { farm: 'FARM-05649', crop: 'Maize', season: '2025 autumn', hours: 140, confirmed: false, skills: ['Grain handling'] },
    ] },
  { id: 'W-8562', name: 'Radu T.', base: 'Can travel · based in Brașov (RO)', distanceKm: null, languages: ['Romanian', 'Italian'], skills: ['Combine harvester', 'Grain handling', 'Tractor driving'], available: ['2026-10-01', '2026-11-25'],
    history: [
      { farm: 'FARM-05649', crop: 'Sunflower', season: '2026 summer', hours: 300, confirmed: true, skills: ['Combine harvester', 'Grain handling'] },
      { farm: 'FARM-11203', crop: 'Maize', season: '2025 autumn', hours: 270, confirmed: true, skills: ['Combine harvester'] },
    ] },
  { id: 'W-2210', name: 'Marta K.', base: 'Lodi (IT) · 38 km', distanceKm: 38, languages: ['Polish', 'Italian'], skills: ['Grain handling', 'Forklift', 'Sorting & packing'], available: ['2026-10-10', '2026-11-30'],
    history: [
      { farm: 'FARM-09902', crop: 'Barley', season: '2026 summer', hours: 298, confirmed: true, skills: ['Grain handling', 'Forklift'] },
      { farm: 'FARM-09902', crop: 'Barley', season: '2025 summer', hours: 305, confirmed: true, skills: ['Grain handling'] },
    ] },
  { id: 'W-8341', name: 'Giulia R.', base: 'Abbiategrasso (IT) · 9 km', distanceKm: 9, languages: ['Italian', 'English'], skills: ['Grain handling', 'Forklift', 'Machinery repair'], available: ['2026-10-15', '2027-02-28'],
    history: [] },

  // --- Good matches for J-02 (Winter wheat sowing, Oct–Nov, Tractor+Sowing, IT) ---
  { id: 'W-3175', name: 'Luca B.', base: 'Pavia (IT) · 41 km', distanceKm: 41, languages: ['Italian', 'English'], skills: ['Tractor driving', 'Machinery repair', 'Sowing'], available: ['2026-09-01', '2027-04-30'],
    history: [
      { farm: 'FARM-13079', crop: 'Common wheat', season: '2026 summer', hours: 340, confirmed: true, skills: ['Tractor driving', 'Sowing'] },
    ] },
  { id: 'W-6033', name: 'Gurpreet S.', base: 'Cremona (IT) · 64 km', distanceKm: 64, languages: ['Punjabi', 'Italian', 'English'], skills: ['Tractor driving', 'Irrigation', 'Spraying (certified)'], available: ['2026-10-01', '2027-03-31'],
    history: [
      { farm: 'FARM-15904', crop: 'Maize', season: '2026 summer', hours: 420, confirmed: true, skills: ['Tractor driving', 'Irrigation'] },
      { farm: 'FARM-15904', crop: 'Maize', season: '2025 summer', hours: 401, confirmed: true, skills: ['Tractor driving'] },
      { farm: 'FARM-03306', crop: 'Common wheat', season: '2024 summer', hours: 310, confirmed: true, skills: ['Tractor driving', 'Sowing'] },
    ] },
  { id: 'W-8233', name: 'Paweł N.', base: 'Can travel · based in Poznań (PL)', distanceKm: null, languages: ['Polish', 'English'], skills: ['Tractor driving', 'Sowing', 'Spraying (certified)'], available: ['2026-10-20', '2026-12-15'],
    history: [
      { farm: 'FARM-02408', crop: 'Barley', season: '2026 spring', hours: 290, confirmed: true, skills: ['Tractor driving', 'Sowing'] },
      { farm: 'FARM-07712', crop: 'Common wheat', season: '2025 autumn', hours: 320, confirmed: true, skills: ['Sowing', 'Spraying (certified)'] },
    ] },
  { id: 'W-9014', name: 'Vasile M.', base: 'Can travel · based in Timișoara (RO)', distanceKm: null, languages: ['Romanian', 'Italian'], skills: ['Tractor driving', 'Sowing', 'Grain handling'], available: ['2026-10-10', '2026-12-01'],
    history: [
      { farm: 'FARM-06127', crop: 'Maize', season: '2026 autumn', hours: 350, confirmed: true, skills: ['Tractor driving', 'Grain handling'] },
      { farm: 'FARM-04421', crop: 'Common wheat', season: '2025 autumn', hours: 290, confirmed: true, skills: ['Sowing', 'Tractor driving'] },
    ] },

  // --- Partial / limited matches ---
  { id: 'W-5120', name: 'Sara M.', base: 'Milano (IT) · 12 km', distanceKm: 12, languages: ['Italian', 'Arabic', 'English'], skills: ['Sorting & packing', 'Grain handling'], available: ['2026-10-01', '2026-10-31'],
    history: [] },
  { id: 'W-8455', name: 'Arben H.', base: 'Can travel · based in Tirana (AL)', distanceKm: null, languages: ['Albanian', 'Italian'], skills: ['Hand harvest', 'Grain handling', 'Irrigation'], available: ['2026-11-01', '2026-12-31'],
    history: [{ farm: 'FARM-09902', crop: 'Maize', season: '2026 summer', hours: 410, confirmed: true, skills: ['Grain handling'] }] },
  { id: 'W-9201', name: 'Oksana B.', base: 'Can travel · based in Lviv (UA)', distanceKm: null, languages: ['English'], skills: ['Grain handling', 'Sorting & packing', 'Forklift'], available: ['2026-10-15', '2026-12-15'],
    history: [
      { farm: 'FARM-10293', crop: 'Sunflower', season: '2026 summer', hours: 240, confirmed: true, skills: ['Grain handling', 'Sorting & packing'] },
    ] },
  { id: 'W-9340', name: 'Dimitar G.', base: 'Can travel · based in Sofia (BG)', distanceKm: null, languages: ['Bulgarian', 'Italian', 'English'], skills: ['Combine harvester', 'Tractor driving'], available: ['2026-11-05', '2026-12-31'],
    history: [
      { farm: 'FARM-08811', crop: 'Sunflower', season: '2025 autumn', hours: 310, confirmed: true, skills: ['Combine harvester'] },
    ] },
  { id: 'W-9412', name: 'Fatima O.', base: 'Brescia (IT) · 55 km', distanceKm: 55, languages: ['Arabic', 'Italian'], skills: ['Hand harvest', 'Sorting & packing'], available: ['2026-10-01', '2026-11-30'],
    history: [] },
  { id: 'W-9530', name: 'Jakub W.', base: 'Can travel · based in Kraków (PL)', distanceKm: null, languages: ['Polish', 'English', 'Romanian'], skills: ['Tractor driving', 'Grain handling', 'Machinery repair'], available: ['2026-09-15', '2026-11-30'],
    history: [
      { farm: 'FARM-02408', crop: 'Common wheat', season: '2026 spring', hours: 360, confirmed: true, skills: ['Tractor driving', 'Grain handling'] },
      { farm: 'FARM-07712', crop: 'Barley', season: '2025 spring', hours: 280, confirmed: true, skills: ['Machinery repair'] },
    ] },

  // --- Not available for current jobs (future availability / wrong season) ---
  { id: 'W-7088', name: 'Elena V.', base: 'Can travel · based in Plovdiv (BG)', distanceKm: null, languages: ['Bulgarian', 'English'], skills: ['Hand harvest', 'Sorting & packing'], available: ['2027-06-01', '2027-08-31'],
    history: [{ farm: 'FARM-09536', crop: 'Rapeseed', season: '2026 summer', hours: 220, confirmed: true, skills: ['Hand harvest'] }] },
  { id: 'W-8120', name: 'Mihai C.', base: 'Can travel · based in Cluj (RO)', distanceKm: null, languages: ['Romanian', 'Italian'], skills: ['Combine harvester', 'Tractor driving', 'Sowing'], available: ['2027-06-15', '2027-08-15'],
    history: [
      { farm: 'FARM-06629', crop: 'Common wheat', season: '2026 summer', hours: 380, confirmed: true, skills: ['Combine harvester', 'Tractor driving'] },
      { farm: 'FARM-06629', crop: 'Barley', season: '2025 summer', hours: 290, confirmed: true, skills: ['Sowing'] },
    ] },
  { id: 'W-9611', name: 'Tomáš H.', base: 'Can travel · based in Brno (CZ)', distanceKm: null, languages: ['English'], skills: ['Combine harvester', 'Grain handling', 'Spraying (certified)'], available: ['2027-07-01', '2027-09-30'],
    history: [
      { farm: 'FARM-03901', crop: 'Common wheat', season: '2026 summer', hours: 445, confirmed: true, skills: ['Combine harvester', 'Grain handling'] },
      { farm: 'FARM-03901', crop: 'Barley', season: '2025 summer', hours: 390, confirmed: true, skills: ['Spraying (certified)'] },
      { farm: 'FARM-03901', crop: 'Rapeseed', season: '2024 spring', hours: 310, confirmed: true, skills: ['Combine harvester'] },
    ] },
  { id: 'W-9720', name: 'Cristina L.', base: 'Can travel · based in București (RO)', distanceKm: null, languages: ['Romanian', 'English', 'Spanish'], skills: ['Hand harvest', 'Irrigation', 'Sorting & packing'], available: ['2027-04-01', '2027-07-31'],
    history: [
      { farm: 'FARM-12045', crop: 'Rapeseed', season: '2026 spring', hours: 200, confirmed: true, skills: ['Hand harvest', 'Irrigation'] },
    ] },
  { id: 'W-9881', name: 'Nadir B.', base: 'Bergamo (IT) · 48 km', distanceKm: 48, languages: ['Arabic', 'Italian', 'English'], skills: ['Forklift', 'Grain handling', 'Machinery repair'], available: ['2027-01-15', '2027-04-30'],
    history: [] },
]

// ---- Shared reactive state ---------------------------------------------------------------
export const state = reactive({
  jobs: [
    { id: 'J-01', title: 'Maize harvest – combine & grain handling', crop: 'Maize', tasks: ['Combine harvester', 'Grain handling'], start: '2026-10-20', end: '2026-11-20', positions: 3, payPerHour: 12.5, hoursPerWeek: 40, housing: true, languages: ['Italian', 'Romanian', 'English'], status: 'Open' },
    { id: 'J-02', title: 'Winter wheat sowing – tractor operator', crop: 'Common wheat', tasks: ['Tractor driving', 'Sowing'], start: '2026-10-25', end: '2026-11-30', positions: 1, payPerHour: 13, hoursPerWeek: 38, housing: false, languages: ['Italian'], status: 'Open' },
  ],
  // Each job in the history lists the skills the farm confirmed for it (simulated: first two declared skills if not set)
  // `share`: what the worker lets farms see (the worker decides; see farmView below)
  workers: pool.map((w) => ({
    looking: true, ...w,
    history: w.history.map((h) => ({ skills: w.skills.slice(0, 2), ...h })),
    share: { audience: 'region', history: true, hidden: [], hours: true, skills: true, languages: true, availability: true },
  })),
  // What this farm lets workers see (the farm decides). Pay, hours and housing yes/no of a job are always shown.
  farmShare: { fairRecord: true, housing: true, returning: true, location: true },
  invitations: { 'J-01:W-1042': 'Accepted' }, // `${jobId}:${workerId}` -> 'Invited' | 'Accepted' | 'Declined'
  // Worker app persona (W-1042) – invitation & weekly confirmation
  me: 'W-1042',
  onboarding: {}, // "Before you go" checklist ticks of the worker (key -> true)
  // Current week waiting for the worker's confirmation (previous short job at FARM-06127, before the maize harvest)
  week: {
    label: 'Week 41 · 5–11 Oct 2026', weekNo: 41, farm: 'FARM-06127', job: 'Grain drying & handling', crop: 'Maize',
    days: [
      { date: '2026-10-05', hours: 9 }, { date: '2026-10-06', hours: 9 }, { date: '2026-10-07', hours: 8.5 },
      { date: '2026-10-08', hours: 9 }, { date: '2026-10-09', hours: 8 }, { date: '2026-10-10', hours: 5 },
    ],
    payPerHour: 11.8, paidEur: 572.3, paidOn: '2026-10-12', status: 'Pending', hash: null, dispute: null,
  },
  // Earlier weeks this season, already confirmed (simulated). Week 40 was paid less than recorded.
  earnings: [
    { weekNo: 39, farm: 'FARM-06127', job: 'Grain drying & handling', crop: 'Maize', payPerHour: 11.8, paidOn: '2026-09-30', received: 531.0,
      days: [{ date: '2026-09-21', hours: 8 }, { date: '2026-09-22', hours: 8 }, { date: '2026-09-23', hours: 8 }, { date: '2026-09-24', hours: 8 }, { date: '2026-09-25', hours: 8 }, { date: '2026-09-26', hours: 5 }] },
    { weekNo: 40, farm: 'FARM-06127', job: 'Grain drying & handling', crop: 'Maize', payPerHour: 11.8, paidOn: '2026-10-07', received: 520.0,
      days: [{ date: '2026-09-28', hours: 9 }, { date: '2026-09-29', hours: 8 }, { date: '2026-09-30', hours: 9 }, { date: '2026-10-01', hours: 8 }, { date: '2026-10-02', hours: 8 }, { date: '2026-10-03', hours: 5 }] },
  ],
  // Team this season: 4 regular workers (REAL hours from synthetic_labour) + seasonal (simulated)
  team: [
    ...profile.labour.filter((l) => l.category === 'PAID_REGULAR').map((l, i) => ({
      id: `R-${i + 1}`, name: `Regular worker ${i + 1}`, type: 'Regular', role: 'Farm worker', period: 'All year',
      hours: l.annual_hours, contract: 'Valid', confirmation: i === 2 ? 'Pending' : 'Confirmed', source: 'synthetic_labour',
    })),
    { id: 'W-3175', name: 'Luca B.', type: 'Seasonal', role: 'Tractor operator', period: '01 Jun – 31 Jul 2026', hours: 340, contract: 'Ended', confirmation: 'Confirmed', source: 'simulated' },
    { id: 'S-201', name: 'Nicu R.', type: 'Seasonal', role: 'Grain handling', period: '15 Jun – 31 Jul 2026', hours: 268, contract: 'Ended', confirmation: 'Confirmed', source: 'simulated' },
    { id: 'S-202', name: 'Petra L.', type: 'Seasonal', role: 'Combine operator', period: '15 Jun – 31 Jul 2026', hours: 301, contract: 'Ended', confirmation: 'Disputed', source: 'simulated' },
    { id: 'W-1042', name: 'Andrei P.', type: 'Seasonal', role: 'Combine operator', period: '20 Oct – 20 Nov 2026', hours: 0, contract: 'Starts soon', confirmation: 'Not started', source: 'simulated' },
    { id: 'S-203', name: 'Ahmed T.', type: 'Seasonal', role: 'Grain handling', period: '01 Oct – 20 Nov 2026', hours: 96, contract: 'Ends soon', confirmation: 'Pending', source: 'simulated' },
    { id: 'S-204', name: 'Kasia W.', type: 'Seasonal', role: 'Sorting', period: '05 Oct – 20 Nov 2026', hours: 72, contract: 'Missing', confirmation: 'Pending', source: 'simulated' },
  ],
})

export const teamStats = computed(() => {
  const t = state.team
  const count = (k, v) => t.filter((w) => w[k] === v).length
  return {
    total: t.length,
    confirmed: count('confirmation', 'Confirmed'),
    pending: count('confirmation', 'Pending'),
    disputed: count('confirmation', 'Disputed'),
    contractIssues: t.filter((w) => ['Missing', 'Ends soon'].includes(w.contract)).length,
    hours: t.reduce((a, w) => a + w.hours, 0),
  }
})

// Fair-employer record of the farm, built only from worker confirmations (shown to workers)
export const fairRecord = computed(() => {
  const s = teamStats.value
  const answered = s.confirmed + s.disputed
  return {
    confirmedShare: answered ? Math.round((s.confirmed / answered) * 100) : 0,
    confirmations: s.confirmed,
    disputes: s.disputed,
    writtenTerms: Math.round((state.team.filter((w) => w.contract !== 'Missing').length / s.total) * 100),
    returning: 2, // workers who came back for another season (simulated)
  }
})

// ---- Sharing: what a farm sees of a worker ------------------------------------------------
// Only what the worker chose to share. `audience: 'applied'` = only farms the worker is in contact with.
export const inContact = (w) => Object.keys(state.invitations).some((k) => k.endsWith(`:${w.id}`))
export function farmView(w) {
  const s = w.share
  const shown = s.history ? w.history.filter((_, i) => !s.hidden.includes(i)) : []
  return {
    ...w,
    visible: w.looking !== false && (s.audience === 'region' || inContact(w)),
    history: shown.map((h) => (s.hours ? h : { ...h, hours: null })),
    hiddenJobs: w.history.length - shown.length,
    skills: s.skills ? w.skills : [],
    languages: s.languages ? w.languages : [],
    available: s.availability ? w.available : null,
    share: s,
  }
}

// ---- Matching -----------------------------------------------------------------------------
const daysBetween = (a, b) => Math.max(0, (new Date(b) - new Date(a)) / 86400000)

export function matchWorkers(job) {
  const jobDays = daysBetween(job.start, job.end)

  return state.workers
    .map(farmView)
    .filter((w) => w.visible || inContact(w))
    .map((w) => {
      // ── 1. Skill match (0–40 pts) ────────────────────────────────────────
      const skillHits = job.tasks.filter((t) => w.skills.includes(t))
      const skillRatio = skillHits.length / Math.max(job.tasks.length, 1)
      // Depth bonus: extra pts per skill confirmed in past work history
      const confirmedSkills = new Set(w.history.filter((h) => h.confirmed).flatMap((h) => h.skills ?? []))
      const depthBonus = skillHits.filter((s) => confirmedSkills.has(s)).length * 4
      const skillScore = Math.min(skillRatio * 36 + depthBonus, 40)

      // ── 2. Availability quality (0–25 pts) ───────────────────────────────
      let availability = null
      let availScore = 0
      if (w.available) {
        const [wStart, wEnd] = w.available
        const overlapStart = wStart <= job.end && wEnd >= job.start
        if (overlapStart) {
          const coverStart = wStart <= job.start ? job.start : wStart
          const coverEnd = wEnd >= job.end ? job.end : wEnd
          const coverDays = daysBetween(coverStart, coverEnd)
          const coverRatio = jobDays > 0 ? coverDays / jobDays : 0
          availability = coverRatio >= 0.95 ? 'full' : 'part'
          // Penalise partial coverage quadratically — 60% coverage = 36% of full score
          availScore = Math.round(coverRatio ** 1.5 * 25)
        }
      }

      // ── 3. Language fit (0–15 pts) ───────────────────────────────────────
      const langHits = job.languages.filter((l) => w.languages.includes(l))
      // Primary language (first in job list) worth more
      const primaryLang = job.languages[0]
      const langScore = langHits.includes(primaryLang) ? 15 : langHits.length ? 8 : 0

      // ── 4. Verified reputation (0–12 pts) ────────────────────────────────
      const verified = w.history.filter((h) => h.confirmed)
      // Diminishing returns: 1→5, 2→8, 3→10, 4+→12
      const repScore = [0, 5, 8, 10, 12][Math.min(verified.length, 4)]

      // ── 5. Proximity (0–8 pts) ────────────────────────────────────────────
      // Exponential decay; housing offered removes the distance barrier
      let proxScore = 0
      if (job.housing) {
        proxScore = 8 // housing = distance irrelevant
      } else if (w.distanceKm !== null) {
        proxScore = Math.round(Math.exp(-w.distanceKm / 60) * 8)
      }

      const score = Math.round(skillScore + availScore + langScore + repScore + proxScore)

      // ── Hard filter ───────────────────────────────────────────────────────────
      // Must be available. Skill coverage: 1 task needed → must match it; 2+ tasks → must match at least half
      const minSkillsRequired = job.tasks.length <= 1 ? 1 : Math.ceil(job.tasks.length / 2)
      if (skillHits.length < minSkillsRequired || !availability) return null
      // Minimum total score — keeps list to ~5-6 strong matches
      if (score < 38) return null

      const hours = w.share.hours ? verified.reduce((a, h) => a + (h.hours ?? 0), 0) : null
      const reasons = []
      if (skillHits.length) reasons.push(`Skills: ${skillHits.join(', ')}`)
      if (langHits.length) reasons.push(`Speaks ${langHits.join(' & ')}`)
      if (availability === 'full') reasons.push('Available the whole period')
      else if (availability === 'part') reasons.push('Available for part of the job')
      if (verified.length) reasons.push(`${verified.length} verified job${verified.length > 1 ? 's' : ''}`)
      if (proxScore >= 6) reasons.push('Lives nearby')
      else if (job.housing) reasons.push('Housing provided')

      return { worker: w, score, reasons, availability, verifiedCount: verified.length, verifiedHours: hours }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
}

// ---- Skills record -------------------------------------------------------------------------
// Skills confirmed by farms in confirmed jobs (evidence of skills learned at work), vs. skills the worker only declared.
export function skillRecord(worker) {
  const confirmed = worker.history.filter((h) => h.confirmed)
  const all = [...new Set([...worker.skills, ...confirmed.flatMap((h) => h.skills ?? [])])]
  return all.map((skill) => {
    const jobs = confirmed.filter((h) => h.skills?.includes(skill))
    return { skill, jobs: jobs.length, farms: new Set(jobs.map((h) => h.farm)).size, hours: jobs.reduce((a, h) => a + h.hours, 0), verified: jobs.length > 0 }
  }).sort((a, b) => b.jobs - a.jobs || b.hours - a.hours)
}

export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtShort = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
