// Agreement PDF: agreed terms, both confirmations with fingerprint, QR verify link, and AI chat memorandum.
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { statusOf, consistency } from '../data/agreements.js'

const VERIFY_BASE = 'https://kuluri.eu/verify'

async function qrDataUrl(text) {
  return QRCode.toDataURL(text, { width: 180, margin: 1, color: { dark: '#163300', light: '#FFFFFF' } })
}

const clean = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[–—]/g, '-').replace(/[·•]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/↔/g, '<->').replace(/€/g, 'EUR ')
  .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')

const SAGE = [95, 117, 86], DARK = [44, 51, 43], MUTED = [130, 123, 110], LINE = [220, 213, 200]
const d = (x) => new Date(x).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const dt = (x) => new Date(x).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const english = (m) => (m.lang === 'en' ? m.text : m.tr?.en) || m.text

export async function buildAgreementPdf(a, chat) {
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
  const heading = (text) => { y += 3; need(10); doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...SAGE).text(clean(text), M, y); y += 2; doc.setDrawColor(...LINE).line(M, y, W - M, y); y += 5 }

  // Header
  doc.setFillColor(...DARK).rect(0, 0, W, 28, 'F')
  doc.setTextColor(245, 242, 235).setFont('helvetica', 'bold').setFontSize(17).text('kuluri', M, 14)
  doc.setFont('helvetica', 'normal').setFontSize(10).text(`Job agreement ${a.id} - agreed terms and intent`, M, 21)
  doc.setFontSize(9).text(clean(statusOf(a)), W - M, 14, { align: 'right' })
  y = 38
  para(`${a.farmId} <-> ${a.workerName} (${a.workerId})`, 12, DARK, 'bold')
  para('This document records the terms both sides agreed and their intention to work together. It does not replace the written employment contract required by national law.', 8.5, MUTED)

  heading('1. Intent shown in the chat')
  para(a.analysis.intent.text, 10, DARK, 'bold')
  for (const e of a.analysis.intent.evidence) {
    const m = chat.messages[e.idx]
    para(`${e.from === 'farm' ? 'Farm' : 'Worker'} - ${dt(e.time)}`, 8.5, MUTED, 'bold', 4)
    para(`"${english(m)}"`, 9.5, DARK, 'normal', 4)
    if (m.lang !== 'en') para(`Original (${m.lang}): "${m.text}"`, 8.5, MUTED, 'italic', 4)
  }

  heading('2. Agreed terms')
  const t = a.terms
  const rows = [
    ['Job', t.job], ['Tasks', t.tasks.join(', ')], ['Period', `${d(t.start)} - ${d(t.end)}`], ['Arrival', d(t.arrival)],
    ['Pay', `EUR ${t.payPerHour.toFixed(2)} gross per hour`], ['Hours per week', String(t.hoursPerWeek)],
    ['Housing', t.housing ? 'Included' : 'Not included'], ['Meeting point', t.meeting], ['Languages', t.languages.join(', ')],
  ]
  rows.forEach(([k, v], i) => {
    need(7)
    if (i % 2 === 0) doc.setFillColor(245, 242, 235).rect(M, y - 4.5, W - 2 * M, 7, 'F')
    doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...MUTED).text(k, M + 2, y)
    doc.setTextColor(...DARK).text(clean(v), M + 45, y)
    y += 7
  })

  heading('3. Confirmations')
  for (const s of ['farm', 'worker']) {
    para(`${s === 'farm' ? 'Farm' : 'Worker'}: ${a.signed[s] ? 'confirmed on ' + dt(a.signed[s].at) : 'not confirmed yet'}`, 9.5)
  }
  para(`Fingerprint of the agreed terms (SHA-256): ${a.hash}`, 8, MUTED)
  para('If any term is changed, the fingerprint no longer matches. Confirmations are simple electronic confirmations in the app.', 8, MUTED)

  heading('4. AI chat memorandum')
  para('Points found in the chat, each with the message it comes from:', 9, MUTED)
  for (const f of a.analysis.findings) {
    para(`- ${f.label}: ${f.value} (${f.strength})`, 9.5, DARK, 'bold')
    for (const e of f.evidence) para(`${e.from === 'farm' ? 'Farm' : 'Worker'}, ${dt(e.time)}: "${english(chat.messages[e.idx])}"`, 8.5, MUTED, 'normal', 4)
  }
  y += 2
  para('Agreement compared with the chat:', 9, MUTED)
  for (const r of consistency(a, a.analysis)) {
    para(`${r.match === true ? '[match]' : r.match === false ? '[DIFFERS]' : '[not in chat]'}  ${r.label}: agreed ${r.agreed}${r.chat ? ', chat ' + r.chat : ''}`, 9)
  }
  y += 2
  para(`Analysed ${a.analysis.messages} messages on ${dt(a.analysis.analysedAt)}. Both sides allowed the AI summary of this chat. Prototype: rule-based analysis; the chat messages themselves remain the record.`, 8, MUTED)

  // Verification QR code block
  const verifyUrl = `${VERIFY_BASE}/${a.id}?h=${a.hash?.slice(0, 16)}`
  try {
    const qrImg = await qrDataUrl(verifyUrl)
    const QR_SIZE = 28
    need(QR_SIZE + 14)
    y += 4
    doc.setFillColor(247, 250, 247).roundedRect(M, y - 2, W - 2 * M, QR_SIZE + 10, 3, 3, 'F')
    doc.addImage(qrImg, 'PNG', M + 4, y + 1, QR_SIZE, QR_SIZE)
    doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...DARK).text('Verify this agreement', M + QR_SIZE + 8, y + 8)
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...MUTED)
    const verifyLines = doc.splitTextToSize('Scan this QR code to confirm this document is genuine and unmodified. Our system checks the fingerprint against the blockchain record — no technical knowledge needed.', W - 2 * M - QR_SIZE - 12)
    doc.text(verifyLines, M + QR_SIZE + 8, y + 14)
    doc.setFontSize(7.5).setTextColor(95, 117, 86).text(verifyUrl, M + QR_SIZE + 8, y + QR_SIZE + 4)
    y += QR_SIZE + 14
  } catch (_) { /* QR generation failed — skip silently */ }

  // Footer on every page
  const pages = doc.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setDrawColor(...LINE).line(M, H - 14, W - M, H - 14)
    doc.setFontSize(7.5).setTextColor(...MUTED).setFont('helvetica', 'normal')
    doc.text('Kuluri - Agreement summary - not a substitute for a formal employment contract', M, H - 9)
    doc.text(`${a.id} - page ${p}/${pages}`, W - M, H - 9, { align: 'right' })
  }
  return doc
}
