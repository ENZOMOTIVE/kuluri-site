import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Paperclip, Pencil, Check, ChevronDown, ChevronRight, Sparkles, Trash2, FileSpreadsheet,
  Download, CheckCircle2, Loader2, Database, UserCheck, AlertCircle, Lock, ArrowRight,
} from 'lucide-react'
import { demoQuestionnaire } from '../data/farm.js'
import { useApp } from '../App.jsx'

const STEPS = ['Upload', 'Questions', 'Answers', 'Done']

function buildState() {
  let n = 0
  return demoQuestionnaire.sections.map((s, si) => ({
    title: s.title,
    open: true,
    questions: s.questions.map((q, qi) => ({ ...q, id: `${si}-${qi}`, nr: ++n, share: true })),
  }))
}

function Stepper({ step }) {
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <span key={s} className="stepper-item">
          <span className={`step${i === step ? ' current' : ''}${i < step ? ' done' : ''}`}>{s}</span>
          {i < STEPS.length - 1 && <ArrowRight size={14} className="step-arrow" />}
        </span>
      ))}
    </div>
  )
}

function FileCard({ name, state, onDelete }) {
  return (
    <div className="file-card">
      <div className="file-card-top">
        <FileSpreadsheet size={30} className="file-icon" />
        {state === 'loading' && <Loader2 size={26} className="spin green" />}
        {state === 'ok' && <CheckCircle2 size={26} className="green" />}
      </div>
      <div className="file-name">{name}</div>
      {onDelete && (
        <button className="link-btn muted" onClick={onDelete}>
          <Trash2 size={14} /> Delete
        </button>
      )}
    </div>
  )
}

function Skeleton({ label }) {
  return (
    <div className="pane-scroll">
      <h1 className="page-title">{label}</h1>
      <div className="skeleton">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="sk-bar" style={{ width: i % 2 ? '78%' : '100%' }} />
        ))}
      </div>
    </div>
  )
}

const typeMeta = {
  data: { label: 'Farm data', icon: Database, cls: 'chip-green' },
  worker: { label: 'Worker-confirmed', icon: UserCheck, cls: 'chip-teal' },
  input: { label: 'Needs your input', icon: AlertCircle, cls: 'chip-amber' },
}

export default function NewRequest() {
  const navigate = useNavigate()
  const { addToHistory, showToast } = useApp()
  const [stage, setStage] = useState('upload') // upload | extracting | questions | generating | answers
  const [fileName, setFileName] = useState('')
  const [sections, setSections] = useState(buildState)
  const [editingQ, setEditingQ] = useState(null)
  const [editAnswers, setEditAnswers] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const all = useMemo(() => sections.flatMap((s) => s.questions), [sections])
  const stats = useMemo(() => ({
    total: all.length,
    data: all.filter((q) => q.type === 'data').length,
    worker: all.filter((q) => q.type === 'worker').length,
    missing: all.filter((q) => !q.a.trim()).length,
    shared: all.filter((q) => q.share && q.a.trim()).length,
  }), [all])

  const step = { upload: 0, extracting: 0, questions: 1, generating: 1, answers: 2 }[stage]

  function start(name) {
    setFileName(name || demoQuestionnaire.fileName)
    setStage('extracting')
    setTimeout(() => {
      setStage('questions')
      showToast('The questionnaire was uploaded.')
    }, 1800)
  }

  function onFiles(files) {
    const f = files?.[0]
    if (f) start(f.name)
  }

  function update(id, patch) {
    setSections((ss) => ss.map((s) => ({ ...s, questions: s.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })))
  }

  function toggleSection(i) {
    setSections((ss) => ss.map((s, j) => (j === i ? { ...s, open: !s.open } : s)))
  }

  function generate() {
    setStage('generating')
    setTimeout(() => setStage('answers'), 2000)
  }

  function reset() {
    setStage('upload')
    setSections(buildState())
    setFileName('')
  }

  function download() {
    const rows = [['Nr', 'Section', 'Question', 'Answer', 'Source']]
    sections.forEach((s) =>
      s.questions.forEach((q) => {
        const shared = q.share && q.a.trim()
        rows.push([q.nr, s.title, q.q, shared ? q.a : 'Not shared', shared ? q.source : ''])
      }),
    )
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = fileName.replace(/\.(xlsx?|pdf)$/i, '') + '_answered.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function complete(status = 'Completed') {
    addToHistory({
      file: fileName,
      buyer: demoQuestionnaire.buyer,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      questions: stats.total,
      shared: status === 'Completed' ? stats.shared : 0,
      status,
    })
    showToast(status === 'Completed'
      ? 'Done! Your document was saved under Questionnaires.'
      : 'Saved. You can continue later from Questionnaires.')
    navigate('/')
  }

  // ---------- Upload ----------
  if (stage === 'upload') {
    return (
      <div
        className={`dropzone${dragOver ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files) }}
      >
        <button className="drop-circle" onClick={() => inputRef.current?.click()} aria-label="Choose file">
          <Paperclip size={44} />
        </button>
        <p>
          Drag a buyer questionnaire here or{' '}
          <button className="link-btn underline" onClick={() => inputRef.current?.click()}>choose a file</button>
        </p>
        <span className="muted small">.xls / .xlsx / .pdf</span>
        <button className="link-btn small demo-link" onClick={() => start()}>
          No file at hand? Use the demo questionnaire
        </button>
        <input ref={inputRef} type="file" accept=".xls,.xlsx,.pdf" hidden onChange={(e) => onFiles(e.target.files)} />
      </div>
    )
  }

  // ---------- Shared two-pane layout ----------
  const right = (
    <aside className="right-pane">
      <div className="right-title">Your questionnaire:</div>
      <FileCard
        name={fileName}
        state={stage === 'extracting' || stage === 'generating' ? 'loading' : 'ok'}
        onDelete={stage === 'questions' ? reset : null}
      />

      {stage === 'questions' && (
        <>
          <button className="btn btn-primary btn-block" onClick={generate}>
            Generate answers <Sparkles size={16} />
          </button>
          <button className="btn btn-outline btn-block" onClick={() => setSections((ss) => ss.map((s) => ({ ...s, open: true })))}>
            Preview questions
          </button>
          <button className="btn btn-ghost btn-block" onClick={() => complete('In progress')}>
            Continue later
          </button>
        </>
      )}

      {stage === 'answers' && (
        <>
          <div className="stat-list">
            <div><Database size={14} /> From farm data <b>{stats.data}</b></div>
            <div><UserCheck size={14} /> Worker-confirmed <b>{stats.worker}</b></div>
            <div className={stats.missing ? 'amber' : ''}><AlertCircle size={14} /> Needs your input <b>{stats.missing}</b></div>
            <div className="stat-total">Shared with buyer <b>{stats.shared} / {stats.total}</b></div>
          </div>
          <button className={`btn btn-outline btn-block${editAnswers ? ' active' : ''}`} onClick={() => setEditAnswers((e) => !e)}>
            {editAnswers ? <>Done editing <Check size={16} /></> : <>Edit answers <Pencil size={16} /></>}
          </button>
          <button className="btn btn-outline btn-block" onClick={download}>
            Download file <Download size={16} />
          </button>
          <button className="btn btn-primary btn-block" onClick={() => complete()}>
            Complete process <Check size={16} />
          </button>
        </>
      )}
    </aside>
  )

  let body
  if (stage === 'extracting') body = <Skeleton label="Questions are being extracted…" />
  else if (stage === 'generating') body = <Skeleton label="Answering from your farm data…" />
  else if (stage === 'questions') {
    body = (
      <div className="pane-scroll">
        <Stepper step={step} />
        <div className="title-row">
          <h1 className="page-title">Your questions</h1>
          <span className="muted">Total: <b className="green">{stats.total}</b></span>
        </div>
        {sections.map((s, si) => (
          <section key={s.title} className="q-section">
            <button className="q-section-head" onClick={() => toggleSection(si)}>
              {s.open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>{si + 1}. {s.title}</span>
              <span className="muted small push">Section: <b className="green">{s.questions.length}</b></span>
            </button>
            {s.open && s.questions.map((q) => (
              <div key={q.id} className="q-row">
                {editingQ === q.id ? (
                  <input
                    className="q-input"
                    autoFocus
                    value={q.q}
                    onChange={(e) => update(q.id, { q: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingQ(null)}
                  />
                ) : (
                  <span>{q.nr}: {q.q}</span>
                )}
                <button className="icon-btn" onClick={() => setEditingQ(editingQ === q.id ? null : q.id)} aria-label="Edit question">
                  {editingQ === q.id ? <Check size={16} /> : <Pencil size={16} />}
                </button>
              </div>
            ))}
          </section>
        ))}
      </div>
    )
  } else {
    body = (
      <div className="pane-scroll">
        <Stepper step={step} />
        <div className="sheet">
          <div className="sheet-head">
            <h2>Supplier self-assessment questionnaire</h2>
            <span>{demoQuestionnaire.buyer} · {demoQuestionnaire.formId}</span>
          </div>
          {sections.map((s, si) => (
            <div key={s.title} className="sheet-section">
              <div className="sheet-section-title">{si + 1}. {s.title}</div>
              <table className="sheet-table">
                <thead>
                  <tr><th className="c-nr">Nr</th><th>Question</th><th className="c-ans">Answer</th><th className="c-share">Share</th></tr>
                </thead>
                <tbody>
                  {s.questions.map((q) => {
                    const meta = typeMeta[q.a.trim() ? q.type : 'input']
                    const Icon = meta.icon
                    const empty = !q.a.trim()
                    return (
                      <tr key={q.id} className={empty ? 'row-missing' : ''}>
                        <td className="c-nr">{q.nr}</td>
                        <td>{q.q}</td>
                        <td className="c-ans">
                          {editAnswers || q.type === 'input' ? (
                            <input
                              className="ans-input"
                              placeholder="Type your answer…"
                              value={q.a}
                              onChange={(e) => update(q.id, { a: e.target.value })}
                            />
                          ) : (
                            <div className="ans-text">{q.a}</div>
                          )}
                          <span className={`chip ${meta.cls}`} title={q.source}>
                            <Icon size={12} /> {empty ? meta.label : q.source}
                          </span>
                        </td>
                        <td className="c-share">
                          {q.mandatory ? (
                            <span className="lock" title="Required by the buyer – always shared"><Lock size={14} /></span>
                          ) : (
                            <label className="switch" title="Share this answer with the buyer">
                              <input type="checkbox" checked={q.share} onChange={(e) => update(q.id, { share: e.target.checked })} />
                              <span />
                            </label>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
          <p className="sheet-foot muted small">
            <Lock size={12} /> Required by the buyer · only totals leave the farm, never personal worker data.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="two-pane">
      <div className="left-pane">{body}</div>
      {right}
    </div>
  )
}
