import { useState } from 'react'
import { Badge, Button, Card, FileButton, Group, Paper, SimpleGrid, Stack, Table, Tabs, Text, ThemeIcon, Title } from '@mantine/core'
import { Upload, Send, CircleCheck, Clock, TriangleAlert, Map, Sprout, Award, Users, FolderOpen, ShieldCheck, Check, Minus } from 'lucide-react'
import { farm, parcels, yearly, certificates, workers, labourSummary } from '../data/farm.js'
import { useApp } from '../App.jsx'

function Kpi({ label, value, sub }) {
  return (
    <Card className="stat-card" padding="md">
      <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: '0.04em' }}>{label}</Text>
      <Text fz={26} fw={800} lh={1.3}>{value}</Text>
      {sub && <Text size="xs" c="dimmed">{sub}</Text>}
    </Card>
  )
}

function DataTable({ head, rows, minWidth = 600 }) {
  return (
    <Table.ScrollContainer minWidth={minWidth}>
      <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
        <Table.Thead bg="gray.0">
          <Table.Tr>{head.map((h) => <Table.Th key={h}>{h}</Table.Th>)}</Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

const statusBadge = {
  Confirmed: { color: 'brand', icon: CircleCheck },
  Pending: { color: 'yellow', icon: Clock },
  Disputed: { color: 'red', icon: TriangleAlert },
}
const Yes = ({ ok }) => (ok ? <Check size={16} color="var(--mantine-color-brand-7)" /> : <Minus size={16} color="var(--mantine-color-red-6)" />)

export default function Data() {
  const { showToast } = useApp()
  const L = labourSummary()
  const [docs, setDocs] = useState([
    { name: 'Timesheets_2025.csv', type: 'Labour', date: '30 Sep 2026' },
    { name: 'Payroll_summary_2025.xlsx', type: 'Labour', date: '30 Sep 2026' },
    { name: 'GLOBALGAP_certificate.pdf', type: 'Certificate', date: '12 Apr 2026' },
  ])

  return (
    <div className="page">
      <div className="page-header">
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2}>Data</Title>
            <Text c="dimmed" mt={4}>Your farm records. Kuluri answers questionnaires only from this data.</Text>
          </div>
          <Badge size="lg" variant="outline" tt="none" fw={500}>Synthetic dataset · {farm.regionLabel}</Badge>
        </Group>
      </div>

      <Tabs defaultValue="farm" variant="pills" radius="md">
        <Tabs.List mb="lg">
          <Tabs.Tab value="farm" leftSection={<Map size={16} />}>Farm profile</Tabs.Tab>
          <Tabs.Tab value="ops" leftSection={<Sprout size={16} />}>Operations</Tabs.Tab>
          <Tabs.Tab value="certs" leftSection={<Award size={16} />}>Certificates</Tabs.Tab>
          <Tabs.Tab value="labour" leftSection={<Users size={16} />}>Labour</Tabs.Tab>
          <Tabs.Tab value="docs" leftSection={<FolderOpen size={16} />}>Documents</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="farm">
          <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
            <Kpi label="Holding" value={farm.holdingId} sub={farm.name} />
            <Kpi label="Area" value={`${farm.areaHa} ha`} sub={`${farm.parcels} parcels`} />
            <Kpi label="Farm type" value={farm.farmType} sub={farm.organic ? 'Organic' : 'Conventional'} />
            <Kpi label="Region" value={farm.region} sub="NUTS3" />
          </SimpleGrid>
          <Card p={0}>
            <Group justify="space-between" p="md" px="lg"><Text fw={700}>Parcels</Text><Text size="sm" c="dimmed">12 largest of {farm.parcels}</Text></Group>
            <DataTable head={['Parcel', 'Crop', 'Area', 'Tenure']}
              rows={parcels.slice(0, 12).map((p) => (
                <Table.Tr key={p.id}><Table.Td ff="monospace" fz="sm">{p.id}</Table.Td><Table.Td>{p.crop}</Table.Td><Table.Td>{p.areaHa} ha</Table.Td><Table.Td c="dimmed">{p.lastOp}</Table.Td></Table.Tr>
              ))} />
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="ops">
          <Card p={0}>
            <Group justify="space-between" p="md" px="lg"><Text fw={700}>Inputs and harvest per season</Text><Text size="xs" c="dimmed" ff="monospace">synthetic_fertilisation · plant_protection · harvest · irrigation</Text></Group>
            <DataTable head={['Season', 'N kg/ha (total)', 'Mineral', 'Organic', 'Plant protection apps', 'Parcels treated', 'Harvest (t)', 'Irrigation (m³)']}
              rows={[...yearly].reverse().map((y) => (
                <Table.Tr key={y.year}><Table.Td fw={600}>{y.year}</Table.Td><Table.Td>{y.n_kg_ha}</Table.Td><Table.Td>{y.n_mineral_kg_ha}</Table.Td><Table.Td>{y.n_organic_kg_ha}</Table.Td><Table.Td>{y.pp_applications}</Table.Td><Table.Td>{y.pp_parcels}</Table.Td><Table.Td>{y.harvest_t.toLocaleString('en')}</Table.Td><Table.Td>{y.irrigation_m3.toLocaleString('en')}</Table.Td></Table.Tr>
              ))} />
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="certs">
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            {certificates.map((c) => (
              <Card key={c.name}>
                <Group justify="space-between" align="flex-start">
                  <Group wrap="nowrap">
                    <ThemeIcon size={44} radius="md"><Award size={22} /></ThemeIcon>
                    <div><Text fw={700}>{c.name}</Text><Text size="sm" c="dimmed">{c.scope}</Text></div>
                  </Group>
                  <Badge>{c.status}</Badge>
                </Group>
                <Text size="sm" mt="md">Valid until <b>{c.validUntil}</b></Text>
              </Card>
            ))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="labour">
          <SimpleGrid cols={{ base: 2, md: 5 }} mb="lg">
            <Kpi label="Seasonal workers" value={L.total} sub={`${L.hours.toLocaleString('en')} h in ${farm.season}`} />
            <Kpi label="Worker-confirmed" value={`${L.confirmed}/${L.total}`} sub={`${L.pending} pending · ${L.disputed} disputed`} />
            <Kpi label="Written terms" value={`${L.writtenTerms}%`} />
            <Kpi label="≥ Minimum wage" value={`${L.minWage}%`} />
            <Kpi label="Safety briefing" value={`${L.safety}%`} />
          </SimpleGrid>
          <Card p={0}>
            <Group justify="space-between" p="md" px="lg">
              <Text fw={700}>Workers {farm.season}</Text>
              <Group gap="xs">
                <Button size="xs" variant="default" leftSection={<Upload size={14} />} onClick={() => showToast('Upload timesheets or payroll as CSV/Excel (demo).')}>Import records</Button>
                <Button size="xs" leftSection={<Send size={14} />} onClick={() => showToast('Confirmation link sent to 1 pending worker, in their language.')}>Send confirmation links</Button>
              </Group>
            </Group>
            <Paper radius={0} px="lg" py="sm" bg="brand.0">
              <Group gap={8} wrap="nowrap"><ShieldCheck size={16} color="var(--mantine-color-brand-8)" style={{ flexShrink: 0 }} />
                <Text size="sm" c="brand.9">Each worker confirms their own days, hours and pay through a personal link in their language. Buyers only see totals, never names, IDs or pay amounts.</Text>
              </Group>
            </Paper>
            <div style={{ maxHeight: 480, overflow: 'auto' }}>
              <DataTable minWidth={860} head={['Worker', 'Role', 'Language', 'Days', 'Hours', 'Written terms', '≥ Min. wage', 'Safety', 'Confirmation']}
                rows={workers.map((w) => {
                  const b = statusBadge[w.status]
                  const Icon = b.icon
                  return (
                    <Table.Tr key={w.id}>
                      <Table.Td ff="monospace" fz="sm">{w.id}</Table.Td><Table.Td>{w.role}</Table.Td><Table.Td c="dimmed">{w.language}</Table.Td>
                      <Table.Td>{w.days}</Table.Td><Table.Td>{w.hours}</Table.Td>
                      <Table.Td><Yes ok={w.writtenTerms} /></Table.Td><Table.Td><Yes ok={w.minWage} /></Table.Td><Table.Td><Yes ok={w.safety} /></Table.Td>
                      <Table.Td><Badge variant="light" color={b.color} leftSection={<Icon size={11} />}>{w.status}</Badge></Table.Td>
                    </Table.Tr>
                  )
                })} />
            </div>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="docs">
          <Card p={0}>
            <Group justify="space-between" p="md" px="lg">
              <Text fw={700}>Documents</Text>
              <FileButton onChange={(f) => { if (!f) return; setDocs((d) => [{ name: f.name, type: 'Other', date: 'Today' }, ...d]); showToast(`${f.name} added to your data.`) }}>
                {(props) => <Button size="xs" leftSection={<Upload size={14} />} {...props}>Upload</Button>}
              </FileButton>
            </Group>
            <DataTable head={['File', 'Type', 'Added']}
              rows={docs.map((d, i) => (
                <Table.Tr key={i}><Table.Td fw={500}>{d.name}</Table.Td><Table.Td><Badge variant="light" color="gray">{d.type}</Badge></Table.Td><Table.Td c="dimmed">{d.date}</Table.Td></Table.Tr>
              ))} />
          </Card>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}
