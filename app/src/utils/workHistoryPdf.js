// Builds a one-page "verified work history" PDF the worker can share (e.g. with a new farm).
// Contains only the jobs the worker selected. Text is kept in English for use across Europe.
import { jsPDF } from 'jspdf'
import { fingerprint } from '../data/store.js'

// Standard PDF fonts only cover Western European characters: strip accents/diacritics (ș -> s) and odd punctuation.
const clean = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[–—]/g, '-').replace(/[·•]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
  .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')

const SAGE = [95, 117, 86]
const DARK = [44, 51, 43]
const MUTED = [130, 123, 110]
const LINE = [220, 213, 200]

export async function buildWorkHistoryPdf({ worker, jobs, includeHours }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const M = 16
  let y = 0

  // Header band
  doc.setFillColor(...DARK)
  doc.rect(0, 0, W, 30, 'F')
  doc.setFillColor(...SAGE)
  doc.roundedRect(M, 8, 14, 14, 3, 3, 'F')
  doc.setTextColor(245, 242, 235)
  doc.setFont('helvetica', 'bold').setFontSize(18).text('kuluri', M + 18, 17.5)
  doc.setFont('helvetica', 'normal').setFontSize(10).text('Verified work history', M + 18, 23)
  doc.setFontSize(9).text(`Created ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, W - M, 17.5, { align: 'right' })
  y = 42

  // Worker block
  doc.setTextColor(...DARK).setFont('helvetica', 'bold').setFontSize(16).text(clean(worker.name), M, y)
  y += 6
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...MUTED).text(clean(worker.base), M, y)
  y += 8
  doc.setTextColor(...DARK).setFontSize(10)
  doc.setFont('helvetica', 'bold').text('Skills:', M, y)
  doc.setFont('helvetica', 'normal').text(clean(worker.skills.join(', ')), M + 16, y)
  y += 5.5
  doc.setFont('helvetica', 'bold').text('Languages:', M, y)
  doc.setFont('helvetica', 'normal').text(clean(worker.languages.join(', ')), M + 22, y)
  y += 9

  // Summary boxes
  const confirmed = jobs.filter((j) => j.confirmed)
  const hours = confirmed.reduce((a, j) => a + j.hours, 0)
  const boxes = [
    [String(confirmed.length), 'verified jobs'],
    ...(includeHours ? [[hours.toLocaleString('en'), 'confirmed hours']] : []),
    [String(new Set(confirmed.map((j) => j.farm)).size), 'farms'],
  ]
  const bw = (W - 2 * M - (boxes.length - 1) * 4) / boxes.length
  boxes.forEach(([v, l], i) => {
    const x = M + i * (bw + 4)
    doc.setDrawColor(...LINE).setFillColor(239, 235, 226).roundedRect(x, y, bw, 18, 2, 2, 'FD')
    doc.setTextColor(...DARK).setFont('helvetica', 'bold').setFontSize(15).text(v, x + bw / 2, y + 9, { align: 'center' })
    doc.setTextColor(...MUTED).setFont('helvetica', 'normal').setFontSize(8.5).text(l, x + bw / 2, y + 14.5, { align: 'center' })
  })
  y += 28

  // Table
  const cols = includeHours
    ? [['Season', 32], ['Crop', 30], ['Farm', 28], ['Hours', 16], ['Status', 34], ['Fingerprint (SHA-256)', 38]]
    : [['Season', 36], ['Crop', 34], ['Farm', 32], ['Status', 38], ['Fingerprint (SHA-256)', 38]]
  const rowH = 9
  doc.setFillColor(...SAGE).rect(M, y, W - 2 * M, rowH, 'F')
  doc.setTextColor(245, 242, 235).setFont('helvetica', 'bold').setFontSize(9)
  let x = M + 2
  cols.forEach(([h, w]) => { doc.text(h, x, y + 6); x += w })
  y += rowH

  for (const [i, j] of jobs.entries()) {
    const hash = j.confirmed ? await fingerprint({ worker: worker.id, farm: j.farm, crop: j.crop, season: j.season, hours: j.hours }) : ''
    if (i % 2) doc.setFillColor(245, 242, 235).rect(M, y, W - 2 * M, rowH, 'F')
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...DARK)
    x = M + 2
    const cells = [j.season, j.crop, j.farm, ...(includeHours ? [String(j.hours)] : []), j.confirmed ? 'Confirmed' : 'Not confirmed', hash ? `${hash.slice(0, 10)}...${hash.slice(-6)}` : '-']
    cells.forEach((c, k) => {
      const isStatus = k === cells.length - 2
      if (isStatus) doc.setTextColor(...(j.confirmed ? SAGE : MUTED))
      doc.setFont(k === cells.length - 1 ? 'courier' : 'helvetica', 'normal').setFontSize(k === cells.length - 1 ? 8 : 9)
      doc.text(clean(c), x, y + 6)
      doc.setTextColor(...DARK)
      x += cols[k][1]
    })
    y += rowH
  }
  doc.setDrawColor(...LINE).line(M, y, W - M, y)
  y += 10

  // How to read / verify
  doc.setTextColor(...DARK).setFont('helvetica', 'bold').setFontSize(10).text('About this document', M, y)
  y += 5.5
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED)
  const notes = [
    'Shared by the worker. It contains only the jobs they chose to include.',
    'A job marked "Confirmed" was confirmed in Kuluri by both the worker and the farm (days, hours and pay).',
    'The fingerprint is a SHA-256 hash of the confirmed record. If anyone changes the record, the fingerprint no longer matches.',
    'Farms are shown by their Kuluri ID. Personal pay amounts are not included.',
  ]
  notes.forEach((n) => {
    const lines = doc.splitTextToSize('- ' + n, W - 2 * M)
    doc.text(lines, M, y)
    y += lines.length * 4.6
  })

  // Footer
  const H = doc.internal.pageSize.getHeight()
  doc.setDrawColor(...LINE).line(M, H - 16, W - M, H - 16)
  doc.setFontSize(8).setTextColor(...MUTED)
  doc.text('Kuluri prototype - EU Agri-Hackathon 2026 - simulated data, not a legal document', M, H - 10)
  doc.text(clean(worker.id), W - M, H - 10, { align: 'right' })
  return doc
}
