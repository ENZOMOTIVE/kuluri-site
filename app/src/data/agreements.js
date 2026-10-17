// Job agreements ("agreed terms & intent") between a farm and a worker – SIMULATED, in memory.
// An agreement records what both sides agreed to and that both intended to work together.
// It is NOT the employment contract required by national law; it documents the agreed terms and intent.
import { reactive } from 'vue'
import { state, fingerprint } from './store.js'
import { chats } from './chats.js'

export const agreements = reactive([])
let seq = 0

const MONTHS = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 }
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

// English reading of a message (original if English, else the stored English translation)
const english = (m) => (m.lang === 'en' ? m.text : m.tr?.en) || ''

/**
 * "AI" chat analysis – PROTOTYPE: transparent rule-based extraction over the chat.
 * Production: an LLM (e.g. via Azure AI Foundry) with both parties' consent, always citing the messages it used.
 * Returns findings with evidence (which message, who wrote it, original quote).
 */
export function analyseChat(chat) {
  const msgs = chat.messages.map((m, idx) => ({ ...m, idx, en: english(m) }))
  const ev = (m) => ({ idx: m.idx, from: m.from, time: m.time, quote: m.text, lang: m.lang })
  const findings = []
  const add = (key, label, value, evidence, strength = 'clear') => {
    if (!findings.some((f) => f.key === key)) findings.push({ key, label, value, evidence, strength }) // first mention wins
  }

  for (const m of msgs) {
    let r
    if ((r = m.en.match(/starts on (\d{1,2}) (january|february|march|april|may|june|july|august|september|october|november|december)/i))) {
      add('start', 'Start date', iso(2026, MONTHS[r[2].toLowerCase()], +r[1]), [ev(m)])
    }
    if ((r = m.en.match(/arrive on the (\d{1,2})/i))) {
      const reply = msgs.find((x) => x.idx > m.idx && x.from !== m.from && /\byes\b/i.test(x.en) && /arrive/i.test(x.en))
      const month = findings.find((f) => f.key === 'start')?.value?.slice(5, 7)
      add('arrival', 'Arrival date', `2026-${month ?? '10'}-${String(r[1]).padStart(2, '0')}`, reply ? [ev(m), ev(reply)] : [ev(m)], reply ? 'clear' : 'implied')
    }
    if (/housing (is )?included/i.test(m.en) && m.from === 'farm') {
      const d = m.en.match(/(\d+)\s?m from the farm/i)
      add('housing', 'Housing', d ? `Included, ${d[1]} m from the farm` : 'Included', [ev(m)])
    }
    if ((r = m.en.match(/farmyard at (\d{1,2}:\d{2})/i))) {
      add('meeting', 'Meeting point', `Farmyard, ${r[1].padStart(5, '0')}`, [ev(m)])
    }
    if ((r = m.en.match(/€\s?(\d+(?:[.,]\d+)?)\s?(?:\/h|per hour|an hour)/i))) {
      add('pay', 'Pay per hour (gross)', `€${r[1].replace(',', '.')}`, [ev(m)])
    }
  }

  // Intent: an offer/invitation from the farm and a clear "yes" from the worker
  const offer = msgs.find((m) => m.from === 'farm' && /(can you arrive|see you|start)/i.test(m.en))
  const yes = msgs.find((m) => m.from === 'worker' && /\b(yes|ok|agree)\b/i.test(m.en))
  const intent = offer && yes
    ? { both: true, text: 'Both sides expressed the intention to work together on this job.', evidence: [ev(offer), ev(yes)] }
    : { both: false, text: 'No clear agreement from both sides found in the chat yet.', evidence: [] }

  return { findings, intent, messages: msgs.length, analysedAt: new Date().toISOString() }
}

// Compare agreement terms with what the chat says
export function consistency(agreement, analysis) {
  const f = Object.fromEntries(analysis.findings.map((x) => [x.key, x]))
  const t = agreement.terms
  const rows = [
    { key: 'start', label: 'Start date', agreed: t.start, chat: f.start?.value, match: f.start ? f.start.value === t.start : null },
    { key: 'arrival', label: 'Arrival date', agreed: t.arrival, chat: f.arrival?.value, match: f.arrival ? f.arrival.value === t.arrival : null },
    { key: 'housing', label: 'Housing', agreed: t.housing ? 'Included' : 'Not included', chat: f.housing?.value, match: f.housing ? t.housing : null },
    { key: 'meeting', label: 'Meeting point', agreed: t.meeting, chat: f.meeting?.value, match: f.meeting ? f.meeting.value === t.meeting : null },
    { key: 'pay', label: 'Pay per hour (gross)', agreed: `€${t.payPerHour.toFixed(2)}`, chat: f.pay?.value, match: f.pay ? f.pay.value === `€${t.payPerHour}` : null },
  ]
  return rows
}

// Compact label for the UI (like the match %). The full analysis stays stored with the agreement (backend / PDF).
export function intentLabel(a) {
  const rows = consistency(a, a.analysis)
  const discussed = rows.filter((r) => r.match !== null)
  const matched = discussed.filter((r) => r.match).length
  const differs = discussed.length - matched
  const score = a.analysis.intent.both ? Math.max(0, Math.round(60 + (matched / rows.length) * 40 - differs * 20)) : 0
  const level = score >= 80 ? 'strong' : score > 0 ? 'partial' : 'none'
  return { score, level, matched, total: rows.length, differs }
}

export function termsHash(a) {
  return fingerprint({ id: a.id, farm: a.farmId, worker: a.workerId, terms: a.terms })
}

export async function createAgreement(chatId, jobId) {
  const chat = chats.find((c) => c.id === chatId)
  const job = state.jobs.find((j) => j.id === jobId)
  const analysis = analyseChat(chat)
  const f = Object.fromEntries(analysis.findings.map((x) => [x.key, x.value]))
  const a = {
    id: `AG-${String(++seq).padStart(3, '0')}`,
    chatId, jobId, farmId: chat.farmId, workerId: chat.workerId, workerName: chat.workerName,
    created: new Date().toISOString(),
    terms: {
      job: job.title, crop: job.crop, tasks: [...job.tasks],
      start: f.start ?? job.start, end: job.end, arrival: f.arrival ?? job.start,
      payPerHour: job.payPerHour, hoursPerWeek: job.hoursPerWeek, housing: job.housing,
      meeting: f.meeting ?? 'Farmyard', languages: [...job.languages],
    },
    consent: { farm: true, worker: true }, // both allowed the AI chat summary (demo)
    signed: { farm: null, worker: null }, // { at, hash }
    analysis,
    hash: null,
    state: 'draft',
    updated: new Date().toISOString(),
  }
  a.hash = await termsHash(a)
  agreements.push(a)
  return a
}

// ---- Lifecycle -------------------------------------------------------------------------
// draft -> (farm agrees & sends in chat) -> sent -> (worker agrees) -> agreed -> completed
// sent -> withdrawn (by farm, before the worker agrees);  agreed -> cancelled (by farm, with reason)
export const STATES = ['draft', 'sent', 'agreed', 'completed', 'withdrawn', 'cancelled']

export async function agree(a, side) {
  a.hash = await termsHash(a)
  a.signed[side] = { at: new Date().toISOString(), hash: a.hash }
}

function post(a, msg) {
  const chat = chats.find((c) => c.id === a.chatId)
  if (!chat) return
  chat.messages.push({ time: new Date().toISOString(), lang: 'en', tr: {}, agreementId: a.id, ...msg })
  const other = msg.from === 'farm' ? 'worker' : 'farm'
  chat.unread[other] += 1
}

export async function updateTerms(a, terms) {
  if (a.state !== 'draft') return
  Object.assign(a.terms, terms)
  a.hash = await termsHash(a)
  a.updated = new Date().toISOString()
}

// The farm agrees and sends the agreement to the worker – it appears as a card in their chat
export async function sendToWorker(a) {
  await agree(a, 'farm')
  a.state = 'sent'
  a.updated = new Date().toISOString()
  post(a, { from: 'farm', type: 'agreement', text: `Job agreement ${a.id} sent`, tr: { ro: `Acord de muncă ${a.id} trimis`, it: `Accordo di lavoro ${a.id} inviato` } })
}

export async function workerAgrees(a) {
  await agree(a, 'worker')
  a.state = 'agreed'
  a.updated = new Date().toISOString()
  post(a, { from: 'worker', type: 'event', event: 'accepted', text: `Agreement ${a.id} accepted`, tr: { ro: `Acord ${a.id} acceptat`, it: `Accordo ${a.id} accettato` } })
}

export function withdraw(a) {
  if (a.state !== 'sent') return
  a.state = 'withdrawn'
  a.updated = new Date().toISOString()
  post(a, { from: 'farm', type: 'event', event: 'withdrawn', text: `Agreement ${a.id} withdrawn by the farm`, tr: { ro: `Acordul ${a.id} a fost retras de fermă`, it: `Accordo ${a.id} ritirato dall’azienda` } })
}

export function complete(a) {
  if (a.state !== 'agreed') return
  a.state = 'completed'
  a.updated = new Date().toISOString()
}

export function cancel(a, reason) {
  if (a.state !== 'agreed') return
  a.state = 'cancelled'
  a.cancelReason = reason
  a.updated = new Date().toISOString()
  post(a, { from: 'farm', type: 'event', event: 'cancelled', text: `Agreement ${a.id} cancelled by the farm${reason ? ': ' + reason : ''}` })
}

export function removeDraft(a) {
  if (a.state !== 'draft') return
  agreements.splice(agreements.indexOf(a), 1)
}

const LABEL = { draft: 'Draft', sent: 'Waiting for worker', agreed: 'Agreed', completed: 'Completed', withdrawn: 'Withdrawn', cancelled: 'Cancelled' }
export const statusOf = (a) => LABEL[a.state]
export const statusColor = (a) => ({ draft: 'grey-7', sent: 'warning', agreed: 'primary', completed: 'accent', withdrawn: 'grey-7', cancelled: 'negative' }[a.state])

// The worker only sees an agreement after the farm has agreed and sent it
export const visibleToWorker = (a) => ['sent', 'agreed', 'completed', 'cancelled'].includes(a.state)

export const forChat = (chatId) => agreements.find((a) => a.chatId === chatId && !['withdrawn', 'cancelled'].includes(a.state))

// Seed: AG-001 sent to Andrei in the chat (waiting for him); AG-002 still a draft for Ahmed
export async function seedAgreements() {
  if (agreements.length) return
  const a1 = await createAgreement('C-1', 'J-01')
  await sendToWorker(a1)
  const a2 = await createAgreement('C-2', 'J-01')
  a2.terms.job = 'Grain handling – autumn 2026'
  a2.terms.tasks = ['Grain handling']
  a2.terms.start = '2026-10-01'
  a2.terms.arrival = '2026-10-01'
  a2.terms.housing = false
  a2.hash = await termsHash(a2)
}
