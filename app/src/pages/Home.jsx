import { useNavigate } from 'react-router-dom'
import { Badge, Box, Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title, UnstyledButton } from '@mantine/core'
import { FileUp, Database, FileSpreadsheet, FileText, ShieldCheck, Users, CheckCheck, ChevronRight } from 'lucide-react'
import { useApp } from '../App.jsx'
import { farm, labourSummary } from '../data/farm.js'

export default function Home() {
  const navigate = useNavigate()
  const { history } = useApp()
  const L = labourSummary()
  const answered = history.filter((h) => h.status === 'Answered')

  const stats = [
    { label: 'Questionnaires answered', value: answered.length, sub: 'this year', icon: CheckCheck },
    { label: 'Questions answered', value: answered.reduce((s, h) => s + h.questions, 0), sub: 'without retyping', icon: FileText },
    { label: 'Worker-confirmed records', value: `${L.confirmed}/${L.total}`, sub: `${farm.season} season`, icon: Users },
  ]

  return (
    <div className="page">
      <Box className="hero" mb={28}>
        <Stack gap="md" maw={620} pos="relative" style={{ zIndex: 1 }}>
          <Badge variant="light" color="brand" size="lg" w="fit-content">Record once, share with control</Badge>
          <Title order={1} fz={{ base: 28, sm: 36 }} lh={1.2} c="brand.9">
            A buyer sent you a questionnaire?
          </Title>
          <Text size="lg" c="gray.7">
            Upload it. Kuluri finds the answers in your farm records, you check them, and you decide what the buyer gets to see.
          </Text>
          <Group mt="sm">
            <Button size="md" leftSection={<FileUp size={18} />} onClick={() => navigate('/questionnaires')}>
              Upload request
            </Button>
            <Button size="md" variant="default" leftSection={<Database size={18} />} onClick={() => navigate('/data')}>
              Provide data
            </Button>
          </Group>
        </Stack>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb={32}>
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} className="stat-card" shadow="xs">
            <Group justify="space-between" align="flex-start">
              <Stack gap={2}>
                <Text size="sm" c="dimmed" fw={600}>{label}</Text>
                <Text fz={30} fw={800} lh={1.2}>{value}</Text>
                <Text size="xs" c="dimmed">{sub}</Text>
              </Stack>
              <ThemeIcon size={42} radius="md" variant="light"><Icon size={20} /></ThemeIcon>
            </Group>
          </Card>
        ))}
      </SimpleGrid>

      <Group justify="space-between" mb="sm">
        <Title order={3}>Recent documents</Title>
        <Button variant="subtle" rightSection={<ChevronRight size={16} />} onClick={() => navigate('/history')}>See all</Button>
      </Group>
      <Card p={0}>
        {history.slice(0, 3).map((h, i) => {
          const Icon = h.file.endsWith('.pdf') ? FileText : FileSpreadsheet
          return (
            <UnstyledButton key={h.id} onClick={() => navigate('/history')} w="100%"
              style={{ borderTop: i ? '1px solid var(--mantine-color-gray-2)' : 0 }}>
              <Group px="lg" py="md" wrap="nowrap">
                <ThemeIcon size={40} radius="md" variant="light"><Icon size={20} /></ThemeIcon>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} truncate>{h.file}</Text>
                  <Text size="sm" c="dimmed">{h.buyer} · {h.date}</Text>
                </Box>
                <Badge variant="light" color={h.status === 'Answered' ? 'brand' : 'yellow'}>{h.status}</Badge>
              </Group>
            </UnstyledButton>
          )
        })}
      </Card>

      <Group gap={8} mt="lg" c="dimmed">
        <ShieldCheck size={16} />
        <Text size="sm">Only totals leave your farm. Personal worker data is never shared.</Text>
      </Group>
    </div>
  )
}
