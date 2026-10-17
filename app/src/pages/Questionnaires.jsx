import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Accordion, ActionIcon, Anchor, Badge, Box, Button, Card, Divider, Group, Loader, Progress, Skeleton,
  Stack, Stepper, Switch, Table, Text, Textarea, TextInput, ThemeIcon, Title, Tooltip,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import {
  Upload, FileSpreadsheet, CircleCheck, Trash2, Sparkles, Pencil, Check, Undo2, CheckCheck,
  ArrowRight, ArrowLeft, Download, Lock, Database, UserCheck, CircleAlert, X,
} from 'lucide-react'
import { demoQuestionnaire } from '../data/farm.js'
import { useApp } from '../App.jsx'

// Flow: upload → extracting → questions → generating → review (verify each answer) → final
function buildState() {
  let n = 0
  return demoQuestionnaire.sections.map((s, si) => ({
    title: s.title,
    questions: s.questions.map((q, qi) => ({
      id: `${si}-${qi}`, nr: ++n, q: q.q,
      suggestion: q.a, answer: '', status: 'open',
      type: q.type, source: q.source, mandatory: q.mandatory, share: true,
    })),
  }))
}

const isDone = (q) => q.status !== 'open' || (!q.share && !q.mandatory)
const isShared = (q) => (q.share || q.mandatory) && q.status !== 'open'

const sourceMeta = {
  data: { icon: Database, color: 'brand' },
  worker: { icon: UserCheck, color: 'teal' },
}
const statusMeta = {
  open: { label: 'To check', color: 'yellow' },
  accepted: { label: 'Suggestion used', color: 'brand' },
  edited: { label: 'Edited by you', color: 'teal' },
}

function ShareControl({ q, onChange }) {
  if (q.mandatory) {
    return (
      <Tooltip label="The buyer requires this answer">
        <Badge variant="default" leftSection={<Lock size={11} />} radius="sm">Required</Badge>
      </Tooltip>
    )
  }
  return (
    <Switch size="sm" checked={q.share} onChange={(e) => onChange(e.currentTarget.checked)}
      label={q.share ? 'Shared' : 'Not shared'} styles={{ label: { fontSize: 13, color: 'var(--mantine-color-dimmed)' } }} />
  )
}

function SourceBadge({ q }) {
  const m = sourceMeta[q.type] ?? sourceMeta.data
  const Icon = m.icon
  return (
    <Badge variant="light" color={m.color} leftSection={<Icon size={11} />} tt="none" fw={500}
      maw="100%" styles={{ label: { overflow: 'hidden', textOverflow: 'ellipsis' } }}>
      {q.source}
    </Badge>
  )
}

function ReviewCard({ q, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const has = !!q.suggestion.trim()
  const st = statusMeta[q.status]

  const startEdit = () => { setDraft(q.answer || q.suggestion); setEditing(true) }
  const save = () => {
    const v = draft.trim()
    if (!v) return
    onUpdate({ answer: v, status: v === q.suggestion ? 'accepted' : 'edited' })
    setEditing(false)
  }

  return (
    <div className="review" data-status={q.status} data-unshared={!q.share && !q.mandatory}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
        <Group gap="sm" align="flex-start" wrap="nowrap">
          <span className="q-nr">{q.nr}</span>
          <Text fw={600} pt={3}>{q.q}</Text>
        </Group>
        <Badge variant="light" color={st.color} style={{ flexShrink: 0 }}>{st.label}</Badge>
      </Group>

      {editing ? (
        <div className="answer-editor">
          <Text size="sm" fw={700} mb={8}>Your answer</Text>
          <Textarea
            autosize
            minRows={3}
            maxRows={10}
            size="md"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            placeholder="Type your answer…"
            classNames={{ input: 'answer-input' }}
          />
          {has && <Text size="xs" c="dimmed" mt={8}>AI suggestion: “{q.suggestion}”</Text>}
          <Group gap="sm" mt="md">
            <Button size="sm" leftSection={<Check size={16} />} onClick={save} disabled={!draft.trim()}>Save answer</Button>
            <Button size="sm" variant="default" onClick={() => setEditing(false)}>Cancel</Button>
          </Group>
        </div>
      ) : q.status === 'open' ? (
        <Stack gap="sm" pl={40}>
          <div className="suggest" data-empty={!has}>
            <Group gap={6} mb={6}>
              {has ? <Sparkles size={14} color="var(--mantine-color-brand-7)" /> : <CircleAlert size={14} color="var(--mantine-color-yellow-8)" />}
              <Text size="xs" fw={700} tt="uppercase" c={has ? 'brand.8' : 'yellow.9'} style={{ letterSpacing: '0.04em' }}>
                {has ? 'Suggested answer' : 'Not found in your data'}
              </Text>
            </Group>
            <Text fw={500} mb={has ? 8 : 0}>
              {has ? q.suggestion : 'Write the answer yourself, or choose not to share it.'}
            </Text>
            {has && <SourceBadge q={q} />}
          </div>
          <Group justify="space-between">
            <Group gap="xs">
              {has && <Button size="sm" leftSection={<Check size={16} />} onClick={() => onUpdate({ answer: q.suggestion, status: 'accepted' })}>Use suggestion</Button>}
              <Button size="sm" variant={has ? "default" : "filled"} leftSection={<Pencil size={15} />} onClick={startEdit}>
                {has ? 'Edit' : 'Write answer'}
              </Button>
            </Group>
            <ShareControl q={q} onChange={(share) => onUpdate({ share })} />
          </Group>
        </Stack>
      ) : (
        <Stack gap={8} pl={40}>
          <Text fw={500}>{q.answer}</Text>
          {q.status === 'accepted' ? <Box><SourceBadge q={q} /></Box>
            : has && <Text size="xs" c="dimmed">AI suggested: “{q.suggestion}”</Text>}
          <Group justify="space-between">
            <Group gap={4}>
              <Button size="compact-sm" variant="subtle" leftSection={<Pencil size={13} />} onClick={startEdit}>Edit</Button>
              <Button size="compact-sm" variant="subtle" color="gray" leftSection={<Undo2 size={13} />} onClick={() => onUpdate({ answer: '', status: 'open' })}>Undo</Button>
            </Group>
            <ShareControl q={q} onChange={(share) => onUpdate({ share })} />
          </Group>
        </Stack>
      )}
    </div>
  )
}

function FileCard({ name, loading, onDelete }) {
  return (
    <Card padding="md">
      <Group wrap="nowrap">
        <ThemeIcon size={44} radius="md" variant="light"><FileSpreadsheet size={22} /></ThemeIcon>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} truncate>{name}</Text>
          <Text size="xs" c="dimmed">{loading ? 'Processing…' : demoQuestionnaire.buyer}</Text>
        </Box>
        {loading ? <Loader size="sm" /> : <CircleCheck size={22} color="var(--mantine-color-brand-7)" />}
      </Group>
      {onDelete && (
        <Button mt="sm" size="compact-xs" variant="subtle" color="gray" leftSection={<Trash2 size={12} />} onClick={onDelete} w="fit-content">
          Remove file
        </Button>
      )}
    </Card>
  )
}

function Loading({ label }) {
  return (
    <Card>
      <Group gap="sm" mb="lg"><Loader size="sm" /><Title order={3}>{label}</Title></Group>
      <Stack gap="md">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={34} width={i % 2 ? '75%' : '100%'} radius="md" />)}
      </Stack>
    </Card>
  )
}

export default function Questionnaires() {
  const navigate = useNavigate()
  const { addToHistory, showToast } = useApp()
  const [stage, setStage] = useState('upload')
  const [fileName, setFileName] = useState('')
  const [sections, setSections] = useState(buildState)
  const [editingQ, setEditingQ] = useState(null)
  const [open, setOpen] = useState(() => demoQuestionnaire.sections.map((s) => s.title))

  const all = useMemo(() => sections.flatMap((s) => s.questions), [sections])
  const stats = useMemo(() => {
    const done = all.filter(isDone).length
    return {
      total: all.length, done, open: all.length - done,
      accepted: all.filter((q) => q.status === 'accepted').length,
      edited: all.filter((q) => q.status === 'edited').length,
      openWithSuggestion: all.filter((q) => q.status === 'open' && q.suggestion.trim()).length,
      shared: all.filter(isShared).length,
    }
  }, [all])

  const active = { upload: 0, extracting: 0, questions: 1, generating: 1, review: 2, final: 3 }[stage]

  function start(name) {
    setFileName(name || demoQuestionnaire.fileName)
    setStage('extracting')
    setTimeout(() => { setStage('questions'); showToast('The questionnaire was uploaded.') }, 1800)
  }
  const update = (id, patch) =>
    setSections((ss) => ss.map((s) => ({ ...s, questions: s.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })))
  const acceptAll = () =>
    setSections((ss) => ss.map((s) => ({ ...s, questions: s.questions.map((q) => (q.status === 'open' && q.suggestion.trim() ? { ...q, answer: q.suggestion, status: 'accepted' } : q)) })))
  const reset = () => { setStage('upload'); setSections(buildState()); setFileName('') }

  function download() {
    const rows = [['Nr', 'Section', 'Question', 'Answer', 'Source']]
    sections.forEach((s) => s.questions.forEach((q) => {
      const sh = isShared(q)
      rows.push([q.nr, s.title, q.q, sh ? q.answer : 'Not shared', sh ? (q.status === 'edited' ? 'Farmer' : q.source) : ''])
    }))
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = fileName.replace(/\.(xlsx?|pdf)$/i, '') + '_answered.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function finish(status) {
    addToHistory({
      file: fileName, buyer: demoQuestionnaire.buyer,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      questions: stats.total, shared: stats.shared, status,
    })
    showToast(status === 'Answered' ? 'Done! Your document was saved under History.' : 'Saved. You can continue later from History.')
    navigate('/')
  }

  const header = (
    <div className="page-header">
      <Group justify="space-between" align="flex-end" gap="lg">
        <div>
          <Title order={2}>Upload request</Title>
          <Text c="dimmed" mt={4}>Upload a buyer's questionnaire. Kuluri suggests answers from your data; you check them.</Text>
        </div>
      </Group>
      <Stepper active={active} size="sm" mt="lg" allowNextStepsSelect={false} iconSize={30}>
        <Stepper.Step label="Upload" description="Excel or PDF" />
        <Stepper.Step label="Questions" description="Extracted" />
        <Stepper.Step label="Answers" description="Check & edit" />
        <Stepper.Step label="Done" description="Download & share" />
      </Stepper>
    </div>
  )

  if (stage === 'upload') {
    return (
      <div className="page">
        {header}
        <Dropzone
          onDrop={(files) => files[0] && start(files[0].name)}
          accept={['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']}
          radius="lg"
          p={56}
          styles={{ root: { borderWidth: 2, borderColor: 'var(--mantine-color-brand-3)', background: 'var(--mantine-color-body)' } }}
        >
          <Stack align="center" gap="sm" style={{ pointerEvents: 'none' }}>
            <Dropzone.Accept><ThemeIcon size={88} radius={44}><Upload size={40} /></ThemeIcon></Dropzone.Accept>
            <Dropzone.Reject><ThemeIcon size={88} radius={44} color="red"><X size={40} /></ThemeIcon></Dropzone.Reject>
            <Dropzone.Idle><ThemeIcon size={88} radius={44} variant="light"><Upload size={40} /></ThemeIcon></Dropzone.Idle>
            <Title order={3} mt="sm">Drop the buyer's questionnaire here</Title>
            <Text c="dimmed">or click to choose a file · .xls, .xlsx or .pdf</Text>
          </Stack>
        </Dropzone>
        <Group justify="center" mt="lg">
          <Anchor component="button" fw={600} onClick={() => start()}>No file at hand? Try the demo questionnaire →</Anchor>
        </Group>
      </div>
    )
  }

  const pct = Math.round((stats.done / stats.total) * 100)
  const side = (
    <Stack className="flow-side" gap="md">
      <FileCard name={fileName} loading={stage === 'extracting' || stage === 'generating'} onDelete={stage === 'questions' ? reset : null} />

      {stage === 'questions' && (
        <Card>
          <Text fw={700} mb={4}>{stats.total} questions found</Text>
          <Text size="sm" c="dimmed" mb="md">Check that the questions were read correctly, then let Kuluri suggest answers.</Text>
          <Stack gap="sm">
            <Button size="md" rightSection={<Sparkles size={16} />} onClick={() => { setStage('generating'); setTimeout(() => setStage('review'), 2000) }}>
              Suggest answers
            </Button>
            <Button variant="default" onClick={() => finish('In progress')}>Continue later</Button>
          </Stack>
        </Card>
      )}

      {stage === 'review' && (
        <Card>
          <Group justify="space-between" mb={6}>
            <Text fw={700}>Checked</Text>
            <Text fw={700}>{stats.done} / {stats.total}</Text>
          </Group>
          <Progress value={pct} size="md" radius="xl" mb="md" />
          <Stack gap={6} mb="md">
            <Group justify="space-between"><Group gap={6}><Badge size="xs" circle color="brand"> </Badge><Text size="sm">Suggestion used</Text></Group><Text size="sm" fw={600}>{stats.accepted}</Text></Group>
            <Group justify="space-between"><Group gap={6}><Badge size="xs" circle color="teal"> </Badge><Text size="sm">Edited by you</Text></Group><Text size="sm" fw={600}>{stats.edited}</Text></Group>
            <Group justify="space-between"><Group gap={6}><Badge size="xs" circle color="yellow"> </Badge><Text size="sm">Still to check</Text></Group><Text size="sm" fw={600}>{stats.open}</Text></Group>
          </Stack>
          <Stack gap="sm">
            {stats.openWithSuggestion > 0 && (
              <Button variant="light" rightSection={<CheckCheck size={16} />} onClick={acceptAll}>
                Use all {stats.openWithSuggestion} suggestions
              </Button>
            )}
            <Button size="md" rightSection={<ArrowRight size={16} />} disabled={stats.open > 0} onClick={() => setStage('final')}>
              Review & finish
            </Button>
            {stats.open > 0 && <Text size="xs" c="dimmed">Check every answer, or set optional ones to “Not shared”, to continue.</Text>}
            <Button variant="default" onClick={() => finish('In progress')}>Continue later</Button>
          </Stack>
        </Card>
      )}

      {stage === 'final' && (
        <Card>
          <Text size="sm" c="dimmed">Shared with buyer</Text>
          <Text fz={28} fw={800} mb="md">{stats.shared} <Text span c="dimmed" fz={18} fw={600}>/ {stats.total}</Text></Text>
          <Stack gap="sm">
            <Button size="md" rightSection={<Check size={16} />} onClick={() => finish('Answered')}>Complete process</Button>
            <Button variant="outline" rightSection={<Download size={16} />} onClick={download}>Download file</Button>
            <Button variant="default" leftSection={<ArrowLeft size={16} />} onClick={() => setStage('review')}>Back to answers</Button>
          </Stack>
        </Card>
      )}
    </Stack>
  )

  let body
  if (stage === 'extracting') body = <Loading label="Extracting questions…" />
  else if (stage === 'generating') body = <Loading label="Finding answers in your farm data…" />
  else if (stage === 'questions' || stage === 'review') {
    const review = stage === 'review'
    body = (
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={3}>{review ? 'Check the suggested answers' : 'Your questions'}</Title>
          <Badge size="lg" variant="light">{stats.total} questions</Badge>
        </Group>
        <Accordion multiple value={open} onChange={setOpen} variant="separated" radius="lg"
          styles={{ item: { background: 'var(--mantine-color-body)', border: '1px solid var(--mantine-color-gray-3)' }, label: { fontWeight: 700 } }}>
          {sections.map((s, si) => {
            const done = s.questions.filter(isDone).length
            return (
              <Accordion.Item key={s.title} value={s.title}>
                <Accordion.Control>
                  <Group justify="space-between" pr="sm">
                    <Text fw={700}>{si + 1}. {s.title}</Text>
                    {review
                      ? <Badge variant={done === s.questions.length ? 'filled' : 'light'} color={done === s.questions.length ? 'brand' : 'gray'}>{done}/{s.questions.length} checked</Badge>
                      : <Text size="sm" c="dimmed">{s.questions.length} questions</Text>}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  {review ? (
                    <Stack gap="sm">
                      {s.questions.map((q) => <ReviewCard key={q.id} q={q} onUpdate={(p) => update(q.id, p)} />)}
                    </Stack>
                  ) : (
                    <Stack gap={0}>
                      {s.questions.map((q) => (
                        <div key={q.id} className="q-line">
                          <span className="q-nr">{q.nr}</span>
                          {editingQ === q.id ? (
                            <TextInput style={{ flex: 1 }} autoFocus value={q.q} onChange={(e) => update(q.id, { q: e.currentTarget.value })}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingQ(null)} />
                          ) : <Text style={{ flex: 1 }}>{q.q}</Text>}
                          <ActionIcon variant="subtle" color="gray" onClick={() => setEditingQ(editingQ === q.id ? null : q.id)} aria-label="Edit question">
                            {editingQ === q.id ? <Check size={16} /> : <Pencil size={16} />}
                          </ActionIcon>
                        </div>
                      ))}
                    </Stack>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            )
          })}
        </Accordion>
      </Stack>
    )
  } else {
    body = (
      <Card p={0} style={{ overflow: 'hidden' }}>
        <div className="sheet-head">
          <Text fw={800} fz={18} tt="uppercase" style={{ letterSpacing: '0.03em' }}>Supplier self-assessment questionnaire</Text>
          <Text size="sm" opacity={0.85}>{demoQuestionnaire.buyer} · {demoQuestionnaire.formId}</Text>
        </div>
        {sections.map((s, si) => (
          <div key={s.title}>
            <div className="sheet-section">{si + 1}. {s.title}</div>
            <Table verticalSpacing="sm" horizontalSpacing="md" layout="fixed">
              <Table.Tbody>
                {s.questions.map((q) => (
                  <Table.Tr key={q.id}>
                    <Table.Td w={48} c="dimmed">{q.nr}</Table.Td>
                    <Table.Td>{q.q}</Table.Td>
                    <Table.Td w="45%" fw={isShared(q) ? 600 : 400} c={isShared(q) ? undefined : 'dimmed'}>
                      {isShared(q) ? q.answer : 'Not shared'}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        ))}
        <Divider />
        <Group gap={6} p="md" c="dimmed"><Lock size={13} /><Text size="xs">Only totals leave the farm, never personal worker data.</Text></Group>
      </Card>
    )
  }

  return (
    <div className="page">
      {header}
      <div className="flow">
        <div>{body}</div>
        {side}
      </div>
    </div>
  )
}
