// Team export for the farm's records (e.g. to share with a tax consultant): every team member with their
// record at this farm, their CV (only what the worker shares with farms) and their job agreement with both
// confirmations and the fingerprint. As JSON (machine-readable) or as a PDF report.
import { jsPDF } from 'jspdf'
import { state, farm, farmView, skillRecord } from '../data/store.js'
import { agreements, statusOf } from '../data/agreements.js'

const clean = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[–—]/g, '-').replace(/[·•]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/€/g, 'EUR ')
  .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
const d = (x) => (x ? new Date(x).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-')
const dt = (x) => (x ? new Date(x).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'not yet')

export function buildTeamExport({ cv = true, contracts = true } = {}) {
  const members = state.team.map((m) => {
    const w = state.workers.find((x) => x.id === m.id)
    const v = w ? farmView(w) : null
    const a = agreements.find((x) => (x.workerId === m.id || x.workerName === m.name) && !['withdrawn'].includes(x.state))
    return {
      id: m.id, name: m.name, type: m.type, role: m.role, period: m.period,
      hoursRecorded: m.hours, contractStatus: m.contract, workerConfirmation: m.confirmation,
      ...(cv && {
        cv: v ? {
          base: v.base,
          skills: skillRecord(v).filter((s) => v.skills.includes(s.skill) || s.verified).map((s) => ({ skill: s.skill, confirmedByFarms: s.verified, jobs: s.jobs })),
          languages: v.languages,
          workHistory: v.history.map((h) => ({ farm: h.farm, crop: h.crop, season: h.season, hours: h.hours, confirmed: h.confirmed })),
          hiddenByWorker: v.hiddenJobs,
        } : null,
      }),
      ...(contracts && {
        agreement: a ? {
          id: a.id, status: statusOf(a), job: a.terms.job, start: a.terms.start, end: a.terms.end,
          payPerHourGrossEur: a.terms.payPerHour, hoursPerWeek: a.terms.hoursPerWeek, housing: a.terms.housing,
          confirmedByFarm: a.signed.farm?.at ?? null, confirmedByWorker: a.signed.worker?.at ?? null,
          fingerprintSha256: a.hash, cancelReason: a.cancelReason ?? null,
        } : null,
      }),
    }
  })
  return {
    exportedAt: new Date().toISOString(),
    farm: { id: farm.id, region: farm.region },
    note: 'Contains personal data of workers. Share only with your tax consultant or other authorised adviser. CVs contain only what each worker shares with farms. Agreements record agreed terms; they do not replace the employment contract required by national law.',
    summary: { members: members.length, hoursRecorded: members.reduce((s, m) => s + (m.hoursRecorded || 0), 0) },
    members,
  }
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename })
  a.click()
  URL.revokeObjectURL(a.href)
}

const SAGE = [95, 117, 86], DARK = [44, 51, 43], MUTED = [130, 123, 110], LINE = [220, 213, 200]

export function buildTeamPdf(data) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 16
  let y = 0
  const need = (h) => { if (y + h > H - 20) { doc.addPage(); y = 20 } }
  const para = (text, size = 9.5, color = DARK, style = 'normal', indent = 0) => {
    doc.setFont('helvetica', style).setFontSize(size).setTextColor(...color)
    const lines = doc.splitTextToSize(clean(text), W - 2 * M - indent)
    need(lines.length * size * 0.45 + 1)
    doc.text(lines, M + indent, y)
    y += lines.length * size * 0.45 + 1.5
  }
  const kv = (k, v, indent = 4) => {
    need(5.5)
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED).text(clean(k), M + indent, y)
    const lines = doc.splitTextToSize(clean(v), W - 2 * M - 52)
    doc.setTextColor(...DARK).text(lines, M + 50, y)
    y += Math.max(5, lines.length * 4.2)
  }

  // Header
  doc.setFillColor(...DARK).rect(0, 0, W, 28, 'F')
  doc.setTextColor(245, 242, 235).setFont('helvetica', 'bold').setFontSize(17).text('kuluri', M, 14)
  doc.setFont('helvetica', 'normal').setFontSize(10).text(clean(`Team records - ${data.farm.id}`), M, 21)
  doc.setFontSize(9).text(`Exported ${dt(data.exportedAt)}`, W - M, 14, { align: 'right' })
  y = 38
  para(`${data.farm.id} - ${data.farm.region}`, 12, DARK, 'bold')
  para(data.note, 8.5, MUTED)
  y += 2

  // Summary table
  const cols = [['Worker', 38], ['Type', 20], ['Period', 44], ['Hours', 16], ['Contract', 24], ['Confirmation', 26]]
  need(10)
  doc.setFillColor(...SAGE).rect(M, y, W - 2 * M, 8, 'F')
  doc.setTextColor(245, 242, 235).setFont('helvetica', 'bold').setFontSize(8.5)
  let x = M + 2
  cols.forEach(([h, w]) => { doc.text(h, x, y + 5.5); x += w })
  y += 8
  data.members.forEach((m, i) => {
    need(7)
    if (i % 2) doc.setFillColor(245, 242, 235).rect(M, y, W - 2 * M, 7, 'F')
    doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...DARK)
    x = M + 2
    ;[m.name, m.type, m.period, String(m.hoursRecorded), m.contractStatus, m.workerConfirmation].forEach((c, k) => { doc.text(clean(c), x, y + 5); x += cols[k][1] })
    y += 7
  })
  doc.setDrawColor(...LINE).line(M, y, W - M, y)
  y += 4
  para(`${data.summary.members} team members - ${data.summary.hoursRecorded.toLocaleString('en')} hours recorded`, 9, MUTED)

  // One section per member
  for (const m of data.members) {
    y += 4; need(16)
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...SAGE).text(clean(`${m.name} (${m.id})`), M, y)
    y += 2; doc.setDrawColor(...LINE).line(M, y, W - M, y); y += 5
    kv('Role', `${m.type} - ${m.role}`)
    kv('Period at the farm', m.period)
    kv('Hours recorded', String(m.hoursRecorded))
    kv('Worker confirmation', m.workerConfirmation)
    if ('cv' in m) {
      if (m.cv) {
        kv('Based', m.cv.base)
        kv('Skills', m.cv.skills.map((s) => (s.confirmedByFarms ? `${s.skill} (confirmed, ${s.jobs} job${s.jobs > 1 ? 's' : ''})` : s.skill)).join(', ') || 'not shared')
        kv('Languages', m.cv.languages.join(', ') || 'not shared')
        kv('Work history', m.cv.workHistory.map((h) => `${h.season}: ${h.crop} at ${h.farm}${h.hours !== null ? `, ${h.hours} h` : ''}${h.confirmed ? ' (confirmed)' : ''}`).join('; ') || 'not shared')
        if (m.cv.hiddenByWorker) kv('', `${m.cv.hiddenByWorker} job(s) hidden by the worker`)
      } else kv('CV', 'No Kuluri profile - record at this farm only')
    }
    if ('agreement' in m) {
      const a = m.agreement
      if (a) {
        kv('Agreement', `${a.id} - ${a.status}`)
        kv('Job', a.job)
        kv('Agreed period', `${d(a.start)} - ${d(a.end)}`)
        kv('Pay / hours', `EUR ${Number(a.payPerHourGrossEur).toFixed(2)} gross per hour - ${a.hoursPerWeek} h/week - housing ${a.housing ? 'included' : 'not included'}`)
        kv('Confirmed by farm', dt(a.confirmedByFarm))
        kv('Confirmed by worker', dt(a.confirmedByWorker))
        if (a.cancelReason) kv('Cancel reason', a.cancelReason)
        doc.setFont('courier', 'normal').setFontSize(7.5).setTextColor(...MUTED)
        need(5); doc.text(clean(`SHA-256 ${a.fingerprintSha256}`), M + 4, y); y += 5
      } else kv('Agreement', `None in Kuluri - contract status: ${m.contractStatus}`)
    }
  }

  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setDrawColor(...LINE).line(M, H - 14, W - M, H - 14)
    doc.setFontSize(7.5).setTextColor(...MUTED).setFont('helvetica', 'normal')
    doc.text('Kuluri - Confidential: contains personal data', M, H - 9)
    doc.text(`${data.farm.id} - page ${p}/${pages}`, W - M, H - 9, { align: 'right' })
  }
  return doc
}
