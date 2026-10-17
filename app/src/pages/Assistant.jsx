import { useEffect, useRef, useState } from 'react'
import { ActionIcon, Avatar, Badge, Box, Card, Group, Loader, ScrollArea, Stack, Text, TextInput, Title, UnstyledButton } from '@mantine/core'
import { Bot, Send, Database } from 'lucide-react'
import { farm, labourSummary, certificates } from '../data/farm.js'

// Front-end mock: keyword-matched answers from the synthetic farm data. To be replaced by the real AI backend.
const L = labourSummary()
const knowledge = [
  { keys: ['worker', 'labour', 'labor', 'seasonal', 'staff'], source: 'Labour records',
    a: `In ${farm.season} you employed ${L.total} seasonal workers. ${L.confirmed} confirmed their days, hours and pay via their personal link, ${L.pending} is pending and ${L.disputed} disputed a record.` },
  { keys: ['wage', 'pay', 'paid', 'salary'], source: 'Labour records · worker-confirmed',
    a: `${L.minWage}% of workers were paid at least the legal minimum wage. ${L.confirmed} of ${L.total} workers confirmed the pay they received.` },
  { keys: ['safety', 'training', 'briefing'], source: 'Labour records',
    a: `${L.safety}% of workers received a safety briefing. One briefing (W-023) is still missing.` },
  { keys: ['certificate', 'certified', 'globalg', 'organic'], source: 'combined_challenge3_sales_certification_ready',
    a: `Valid certificates: ${certificates.map((c) => `${c.name} (until ${c.validUntil})`).join('; ')}. ` },
  { keys: ['nitrogen', 'fertili', 'npk'], source: 'synthetic_fertilisation · 2025',
    a: `Average nitrogen applied in 2025 was ${farm.y2025.n_kg_ha} kg N/ha over ${farm.areaHa} ha (${farm.y2025.n_mineral_kg_ha} mineral, ${farm.y2025.n_organic_kg_ha} organic).` },
  { keys: ['spray', 'pesticide', 'plant protection', 'fungicide'], source: 'synthetic_plant_protection · 2025',
    a: `${farm.y2025.pp_applications} plant protection applications on ${farm.y2025.pp_parcels} parcels in 2025, each recorded with product, dose, date and crop stage.` },
  { keys: ['area', 'hectare', 'parcel', 'size'], source: 'synthetic_parcel',
    a: `${farm.name} farms ${farm.areaHa} ha in ${farm.parcels} parcels (${farm.farmType.toLowerCase()}).` },
]

const suggestions = [
  'How many seasonal workers did we have in 2025?',
  'Were all workers paid at least the minimum wage?',
  'Which certificates are valid?',
  'How much nitrogen did we apply per hectare?',
]

function answer(text) {
  const t = text.toLowerCase()
  const hit = knowledge.find((k) => k.keys.some((key) => t.includes(key)))
  return hit
    ? { role: 'bot', text: hit.a, source: hit.source }
    : { role: 'bot', text: "I couldn't find that in your farm data yet. Add it under Data, or answer it yourself and I'll reuse it next time." }
}

export default function Assistant() {
  const [msgs, setMsgs] = useState([{ role: 'bot', text: `Hi! Ask me anything about ${farm.name}'s data. I only answer from your records and show where each answer comes from.` }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const viewport = useRef(null)

  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  function send(text) {
    const q = (text ?? input).trim()
    if (!q) return
    setMsgs((m) => [...m, { role: 'user', text: q }])
    setInput('')
    setTyping(true)
    setTimeout(() => { setTyping(false); setMsgs((m) => [...m, answer(q)]) }, 700)
  }

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <div className="page-header">
        <Title order={2}>AI assistant</Title>
        <Text c="dimmed" mt={4}>Ask questions about your farm data. Every answer shows its source.</Text>
      </div>

      <Card p={0} className="chat-wrap">
        <ScrollArea style={{ flex: 1 }} viewportRef={viewport} p="lg">
          <Stack gap="lg">
            {msgs.map((m, i) => (
              <Group key={i} align="flex-start" wrap="nowrap" justify={m.role === 'user' ? 'flex-end' : 'flex-start'}>
                {m.role === 'bot' && <Avatar color="brand" variant="filled" radius="md"><Bot size={18} /></Avatar>}
                <Box maw="75%" px="md" py="sm" className={m.role === 'user' ? 'bubble-user' : 'bubble-bot'} style={{ borderRadius: 14 }}>
                  <Text size="sm">{m.text}</Text>
                  {m.source && <Badge mt={8} variant="light" leftSection={<Database size={11} />} tt="none" fw={500}>{m.source}</Badge>}
                </Box>
              </Group>
            ))}
            {typing && (
              <Group align="center">
                <Avatar color="brand" variant="filled" radius="md"><Bot size={18} /></Avatar>
                <Loader type="dots" size="sm" />
              </Group>
            )}
          </Stack>
        </ScrollArea>

        {msgs.length === 1 && (
          <Group gap="xs" px="lg" pb="md">
            {suggestions.map((s) => (
              <UnstyledButton key={s} onClick={() => send(s)}>
                <Badge size="lg" variant="outline" tt="none" fw={500} style={{ cursor: 'pointer' }}>{s}</Badge>
              </UnstyledButton>
            ))}
          </Group>
        )}

        <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <form onSubmit={(e) => { e.preventDefault(); send() }}>
            <TextInput
              size="md"
              radius="md"
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="Ask about your farm data…"
              rightSectionWidth={48}
              rightSection={<ActionIcon type="submit" size={34} radius="md" aria-label="Send"><Send size={16} /></ActionIcon>}
            />
          </form>
        </Box>
      </Card>
    </div>
  )
}
