// All data here is synthetic, modelled on the organisers' hackathon dataset.
// Table names in `source` fields refer to that dataset's views.

import profile from './profile_farm13079.json'
import salesData from './sales_farm13079.json'

const CROP = { COWT: 'Common wheat', BARL: 'Barley', MAIZ: 'Maize', SUNF: 'Sunflower', RAPE: 'Rapeseed', OLIV: 'Olives', HAY: 'Hay' }
export const cropName = (c) => CROP[c] ?? c

const y2025 = profile.yearly.find((y) => y.year === 2025)
const cert = salesData.certificates[0]
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

// Real synthetic farm from the organisers' dataset (see app/scripts/extract_farm.py).
export const farm = {
  name: 'FARM-13079',
  holdingId: 'FARM-13079',
  region: profile.holding.nuts3,
  regionLabel: 'NUTS3 ITC4C · Milano (Italy)',
  address: 'Milano province, Italy (synthetic holding, no address in dataset)',
  contact: 'Not in dataset – farmer to add',
  areaHa: profile.holding.uaa_ha,
  parcels: profile.parcels.length,
  farmType: 'Arable: cereals & oilseeds',
  organic: profile.holding.organic === 1,
  season: 2025,
  y2025,
}

export const parcels = [...profile.parcels]
  .sort((a, b) => b.area_ha - a.area_ha)
  .map((p) => ({ id: p.id, crop: cropName(p.crop), areaHa: p.area_ha, lastOp: p.tenure.charAt(0) + p.tenure.slice(1).toLowerCase() }))

export const yearly = profile.yearly

export const certificates = salesData.certificates.map((c) => ({
  name: c.scheme === 'ORGANIC' ? 'Organic farming (EU)' : c.scheme,
  scope: `Whole holding · body ${c.body} · lot prefix ${c.lot_prefix}`,
  validUntil: fmtDate(c.to),
  status: new Date(c.to) >= new Date('2026-10-17') ? 'Valid' : 'Expired',
}))

// ---- Labour records -------------------------------------------------------
const roles = ['Harvest worker', 'Harvest worker', 'Tractor driver', 'Packing', 'Harvest worker']
const langs = ['Italian', 'Romanian', 'Polish', 'Arabic', 'Albanian', 'Punjabi', 'Bulgarian']

export const workers = Array.from({ length: 40 }, (_, i) => {
  const n = i + 1
  let status = 'Confirmed'
  if (n === 17) status = 'Pending'
  if (n === 31) status = 'Disputed'
  const days = 18 + ((n * 7) % 30)
  return {
    id: `W-${String(n).padStart(3, '0')}`,
    role: roles[n % roles.length],
    language: langs[n % langs.length],
    days,
    hours: days * 8 - ((n * 3) % 12),
    writtenTerms: true,
    minWage: true,
    safety: n !== 23,
    status,
  }
})

export function labourSummary() {
  const total = workers.length
  const confirmed = workers.filter((w) => w.status === 'Confirmed').length
  const pct = (k) => Math.round((workers.filter((w) => w[k]).length / total) * 1000) / 10
  return {
    total,
    confirmed,
    pending: workers.filter((w) => w.status === 'Pending').length,
    disputed: workers.filter((w) => w.status === 'Disputed').length,
    writtenTerms: pct('writtenTerms'),
    minWage: pct('minWage'),
    safety: pct('safety'),
    hours: workers.reduce((s, w) => s + w.hours, 0),
  }
}

// ---- Demo buyer questionnaire ---------------------------------------------
// type: 'data' (answered from farm data), 'worker' (worker-confirmed labour data),
// 'input' (missing -> farmer must answer). mandatory: buyer requires it.
const L = labourSummary()

export const demoQuestionnaire = {
  fileName: 'Supplier_Self-Assessment_FreshCo.xlsx',
  buyer: 'BUYER-013',
  formId: 'SSA-2025 · Rev 3',
  sections: [
    {
      title: 'General information',
      questions: [
        { q: 'Farm / company name', a: farm.name, type: 'data', source: 'synthetic_holding', mandatory: true },
        { q: 'Region', a: farm.regionLabel, type: 'data', source: 'synthetic_holding · nuts3', mandatory: true },
        { q: 'Contact person / e-mail', a: '', type: 'input', source: 'Not in your data', mandatory: true },
        { q: 'Total utilised agricultural area (ha)', a: `${farm.areaHa} ha`, type: 'data', source: `synthetic_parcel · ${farm.parcels} parcels`, mandatory: false },
      ],
    },
    {
      title: 'Certifications',
      questions: [
        { q: 'Do you hold a recognised certification (organic, PDO, PGI, GLOBALG.A.P.)?', a: `Yes – Organic, certification body ${cert.body}, valid ${fmtDate(cert.from)} – ${fmtDate(cert.to)}`, type: 'data', source: 'synthetic_traceability', mandatory: true },
        { q: 'Is the farm certified organic?', a: farm.organic ? 'Yes' : 'No', type: 'data', source: 'synthetic_holding · organic flag', mandatory: false },
        { q: 'Are products traceable to the parcel of origin?', a: 'Partly – every sale is linked to holding, crop and buyer; batch and parcel lineage are not recorded', type: 'data', source: 'combined_sale_certificate_link', mandatory: true },
      ],
    },
    {
      title: 'Inputs & crop protection',
      questions: [
        { q: 'Average nitrogen applied per hectare (2025 season)', a: `${y2025.n_kg_ha} kg N/ha (${y2025.n_mineral_kg_ha} mineral, ${y2025.n_organic_kg_ha} organic)`, type: 'data', source: 'synthetic_fertilisation · 2025', mandatory: false },
        { q: 'Number of plant protection applications (2025 season)', a: `${y2025.pp_applications} applications on ${y2025.pp_parcels} of ${farm.parcels} parcels`, type: 'data', source: 'synthetic_plant_protection · 2025', mandatory: true },
        { q: 'Are all applications recorded per parcel with product and dose?', a: 'Yes', type: 'data', source: 'combined_challenge2_parcel_operations_ready', mandatory: true },
        { q: 'Irrigation water used (2025 season)', a: `${y2025.irrigation_m3.toLocaleString('en')} m³`, type: 'data', source: 'synthetic_irrigation · 2025', mandatory: false },
      ],
    },
    {
      title: 'Environment',
      questions: [
        { q: 'Is crop rotation practised on arable land?', a: '', type: 'input', source: 'Not in your data (dataset keeps one crop per parcel)', mandatory: false },
        { q: 'Share of renewable energy in total energy use', a: '', type: 'input', source: 'Not in your data', mandatory: false },
        { q: 'Which measures do you take to promote biodiversity?', a: '', type: 'input', source: 'Not in your data', mandatory: false },
      ],
    },
    {
      title: 'Working conditions',
      questions: [
        { q: 'Number of seasonal workers employed (2025)', a: `${L.total}`, type: 'worker', source: `Labour records · ${L.confirmed}/${L.total} worker-confirmed`, mandatory: true },
        { q: 'Share of workers with written terms of employment', a: `${L.writtenTerms}%`, type: 'worker', source: `Labour records · ${L.confirmed}/${L.total} worker-confirmed`, mandatory: true },
        { q: 'Are all workers paid at least the legal minimum wage?', a: `Yes – ${L.minWage}% of workers`, type: 'worker', source: `Labour records · ${L.confirmed}/${L.total} worker-confirmed`, mandatory: true },
        { q: 'Share of workers who received a safety briefing', a: `${L.safety}%`, type: 'worker', source: `Labour records · ${L.confirmed}/${L.total} worker-confirmed`, mandatory: false },
        { q: 'Are working hours recorded for every worker?', a: `Yes – ${L.hours.toLocaleString('en')} hours recorded in 2025`, type: 'worker', source: 'Labour records · timesheets', mandatory: true },
        { q: 'Can workers raise complaints anonymously?', a: 'Yes – via their personal Kuluri link, in their own language', type: 'worker', source: 'Worker links', mandatory: false },
      ],
    },
  ],
}

export const initialHistory = [
  { id: 1, file: 'Sustainability_Questionnaire_2025.xlsx', buyer: 'BUYER-007', date: '02 Oct 2026', questions: 31, shared: 27, status: 'Answered' },
  { id: 2, file: 'Social_Compliance_SAQ.pdf', buyer: 'BUYER-033', date: '18 Sep 2026', questions: 44, shared: 40, status: 'Answered' },
  { id: 3, file: 'Supplier_Info_Update.xlsx', buyer: 'BUYER-027', date: '11 Sep 2026', questions: 12, shared: 0, status: 'In progress' },
]
