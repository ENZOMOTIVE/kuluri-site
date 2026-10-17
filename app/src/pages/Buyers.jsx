import { useMemo, useState } from 'react'
import {
  Alert, Badge, Box, Card, Divider, Drawer, Group, SimpleGrid, Stack, Switch, Table, Text, ThemeIcon, Title, Tooltip,
} from '@mantine/core'
import { BarChart } from '@mantine/charts'
import { Handshake, Info, TrendingUp, TrendingDown, ShieldCheck, FileText, Lock, ChevronRight } from 'lucide-react'
import { buyers, summary, byYearContract, sales, CERT_DATA_FROM, fmtEur, fmtPct, fmtDate } from '../data/buyers.js'
import { cropName } from '../data/farm.js'
import { useApp } from '../App.jsx'

const CONTRACT_LABEL = { SPOT: 'Spot', FORWARD: 'Forward', COOPERATIVE: 'Cooperative' }

// Topics the farmer can share with each buyer. Sales prices are never shared by default.
const TOPICS = [
  { key: 'profile', label: 'Farm profile', hint: 'Area, region, crops' },
  { key: 'certs', label: 'Certifications', hint: 'Organic certificate, validity' },
  { key: 'inputs', label: 'Inputs & crop protection', hint: 'Fertiliser and spray totals per season' },
  { key: 'environment', label: 'Environment', hint: 'Irrigation, biodiversity answers' },
  { key: 'labour', label: 'Working conditions', hint: 'Totals only, never personal data' },
  { key: 'prices', label: 'Prices & margins', hint: 'Kept private – protects your negotiating position' },
]
const defaultSharing = { profile: true, certs: true, inputs: true, environment: true, labour: true, prices: false }

function Kpi({ label, value, sub, icon: Icon, color = 'brand' }) {
  return (
    <Card className="stat-card" padding="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={2}>
          <Text size="xs" c="dimmed" fw={700} tt="uppercase" style={{ letterSpacing: '0.04em' }}>{label}</Text>
          <Text fz={26} fw={800} lh={1.25}>{value}</Text>
          {sub && <Text size="xs" c="dimmed">{sub}</Text>}
        </Stack>
        {Icon && <ThemeIcon variant="light" color={color} radius="md" size={38}><Icon size={18} /></ThemeIcon>}
      </Group>
    </Card>
  )
}

function DevBadge({ v }) {
  if (v === null) return <Text c="dimmed">–</Text>
  const up = v >= 0
  return (
    <Badge variant="light" color={up ? 'brand' : 'red'} style={{ flexShrink: 0, overflow: 'visible' }} styles={{ label: { overflow: 'visible' } }} leftSection={up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}>
      {fmtPct(v)}
    </Badge>
  )
}

function BuyerDrawer({ buyer, onClose, sharing, setSharing, history }) {
  if (!buyer) return null
  const qs = history.filter((h) => h.buyer === buyer.id)
  return (
    <Drawer opened={!!buyer} onClose={onClose} position="right" size={560} padding="lg"
      title={<Group gap="sm"><ThemeIcon variant="light" radius="md"><Handshake size={18} /></ThemeIcon><Text fw={800} fz={18}>{buyer.id}</Text>
        <Badge variant="light" color={buyer.active ? 'brand' : 'gray'}>{buyer.active ? 'Active' : 'Inactive'}</Badge></Group>}>
      <Stack gap="lg">
        <SimpleGrid cols={3}>
          <div><Text size="xs" c="dimmed">Sales</Text><Text fw={800} fz={20}>{buyer.count}</Text></div>
          <div><Text size="xs" c="dimmed">Total value</Text><Text fw={800} fz={20}>{fmtEur(buyer.value)}</Text></div>
          <div><Text size="xs" c="dimmed">Price vs reference</Text><Box mt={4}><DevBadge v={buyer.dev} /></Box></div>
        </SimpleGrid>

        <div>
          <Text fw={700} mb="xs">Sales to this buyer</Text>
          <Card p={0}>
            <Table verticalSpacing={8} horizontalSpacing="sm" fz="sm">
              <Table.Thead><Table.Tr><Table.Th>Date</Table.Th><Table.Th>Product</Table.Th><Table.Th ta="right">t</Table.Th><Table.Th ta="right">€/t</Table.Th><Table.Th>vs ref.</Table.Th><Table.Th>Cert.</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>
                {[...buyer.sales].reverse().map((s) => (
                  <Table.Tr key={s.id}>
                    <Table.Td>{fmtDate(s.date)}</Table.Td>
                    <Table.Td>{cropName(s.product)}<Text span c="dimmed" fz="xs"> · {CONTRACT_LABEL[s.contract]}</Text></Table.Td>
                    <Table.Td ta="right">{s.volume_t.toLocaleString('en')}</Table.Td>
                    <Table.Td ta="right">{s.price_eur_t.toFixed(0)}</Table.Td>
                    <Table.Td><DevBadge v={s.price_dev_pct} /></Table.Td>
                    <Table.Td>
                      {s.year < CERT_DATA_FROM
                        ? <Tooltip label="No certificate data before 2024 in the dataset"><Text c="dimmed" fz="xs">n/a</Text></Tooltip>
                        : s.certified ? <ShieldCheck size={16} color="var(--mantine-color-brand-7)" /> : <Badge color="red" variant="light" size="xs">None</Badge>}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </div>

        <div>
          <Text fw={700} mb="xs">Questionnaires from this buyer</Text>
          {qs.length ? (
            <Stack gap="xs">
              {qs.map((h) => (
                <Card key={h.id} padding="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap"><FileText size={16} color="var(--mantine-color-brand-7)" /><Text size="sm" fw={600}>{h.file}</Text></Group>
                    <Badge variant="light" color={h.status === 'Answered' ? 'brand' : 'yellow'}>{h.status}</Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>{h.date} · {h.status === 'Answered' ? `${h.shared} of ${h.questions} answers shared` : `${h.questions} questions`}</Text>
                </Card>
              ))}
            </Stack>
          ) : <Text size="sm" c="dimmed">No questionnaires received yet.</Text>}
        </div>

        <div>
          <Text fw={700}>What {buyer.id} can see</Text>
          <Text size="xs" c="dimmed" mb="sm">Applied when you answer this buyer's questionnaires. Answers the buyer requires are always shared.</Text>
          <Card padding="md">
            <Stack gap="sm">
              {TOPICS.map((t, i) => (
                <div key={t.key}>
                  {i > 0 && <Divider mb="sm" />}
                  <Group justify="space-between" wrap="nowrap">
                    <div>
                      <Group gap={6}><Text size="sm" fw={600}>{t.label}</Text>{t.key === 'prices' && <Lock size={12} />}</Group>
                      <Text size="xs" c="dimmed">{t.hint}</Text>
                    </div>
                    <Switch checked={sharing[t.key]} onChange={(e) => setSharing({ ...sharing, [t.key]: e.currentTarget.checked })} />
                  </Group>
                </div>
              ))}
            </Stack>
          </Card>
        </div>
      </Stack>
    </Drawer>
  )
}

export default function Buyers() {
  const { history } = useApp()
  const [selected, setSelected] = useState(null)
  const [sharingByBuyer, setSharingByBuyer] = useState({})
  const buyer = buyers.find((b) => b.id === selected)

  const devData = useMemo(
    () => sales.slice(-12).map((s) => ({ sale: `${s.date.slice(2, 7)} ${s.product}`, dev: s.price_dev_pct, buyer: s.buyer })),
    [],
  )
  const qCount = (id) => history.filter((h) => h.buyer === id).length

  return (
    <div className="page">
      <div className="page-header">
        <Title order={2}>Buyers</Title>
        <Text c="dimmed" mt={4}>Everyone who buys from you, what they asked for, what you shared, and how their prices compare with the market reference.</Text>
      </div>

      <Alert variant="light" color="brand" icon={<Info size={18} />} mb="lg" radius="md">
        Real records from the organisers' dataset: holding {'FARM-13079'} (synthetic), 2017–2026. Buyer names are not in the dataset, so buyers are shown by ID.
      </Alert>

      <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
        <Kpi label="Buyers since 2017" value={summary.buyersTotal} sub={`${summary.buyersActive} active in the last 12 months`} icon={Handshake} />
        <Kpi label="Sales 2025" value={fmtEur(summary.value2025)} sub={`${summary.sales2025} sales`} icon={FileText} />
        <Kpi label="Price vs market ref." value={fmtPct(summary.dev)} sub="value-weighted, all sales" icon={summary.dev >= 0 ? TrendingUp : TrendingDown} color={summary.dev >= 0 ? 'brand' : 'red'} />
        <Kpi label="Certified sales" value={`${summary.certCovered}/${summary.certTotal}`} sub={`since ${CERT_DATA_FROM} (certificate data)`} icon={ShieldCheck} />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }} mb="lg">
        <Card>
          <Text fw={700}>Sales value per year</Text>
          <Text size="xs" c="dimmed" mb="md">By contract type · € · combined_challenge3_sales_certification_ready</Text>
          <BarChart h={240} data={byYearContract} dataKey="year" type="stacked" withLegend legendProps={{ verticalAlign: 'bottom' }}
            valueFormatter={(v) => fmtEur(v)} gridAxis="y" tickLine="none"
            series={[{ name: 'SPOT', label: 'Spot', color: 'brand.4' }, { name: 'FORWARD', label: 'Forward', color: 'brand.7' }, { name: 'COOPERATIVE', label: 'Cooperative', color: 'teal.5' }]} />
        </Card>
        <Card>
          <Text fw={700}>Price received vs. market reference</Text>
          <Text size="xs" c="dimmed" mb="md">Last 12 sales · % above or below the monthly reference price for the product</Text>
          <BarChart h={240} data={devData} dataKey="sale" gridAxis="y" tickLine="none" withBarValueLabel={false}
            valueFormatter={(v) => fmtPct(v)} xAxisProps={{ angle: -35, textAnchor: 'end', height: 56, interval: 0, fontSize: 11 }}
            getBarColor={(v) => (v >= 0 ? 'brand.6' : 'red.4')}
            series={[{ name: 'dev', label: 'vs reference' }]} />
        </Card>
      </SimpleGrid>

      <Card p={0}>
        <Group justify="space-between" p="md" px="lg">
          <Text fw={700}>All buyers</Text>
          <Text size="xs" c="dimmed">Click a buyer to see sales, questionnaires and sharing settings</Text>
        </Group>
        <Table.ScrollContainer minWidth={1080}>
          <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover className="nowrap-table">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Buyer</Table.Th><Table.Th>Last sale</Table.Th><Table.Th>Products</Table.Th>
                <Table.Th ta="right">Sales</Table.Th><Table.Th ta="right">Volume (t)</Table.Th><Table.Th ta="right">Value</Table.Th>
                <Table.Th>vs reference</Table.Th><Table.Th>Contract</Table.Th><Table.Th ta="center">Questionnaires</Table.Th><Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {buyers.map((b) => (
                <Table.Tr key={b.id} onClick={() => setSelected(b.id)} style={{ cursor: 'pointer' }}>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <Text fw={700} ff="monospace" fz="sm">{b.id}</Text>
                      {b.active && <Badge size="xs" variant="light" style={{ flexShrink: 0 }} styles={{ label: { overflow: 'visible' } }}>Active</Badge>}
                    </Group>
                  </Table.Td>
                  <Table.Td c="dimmed">{fmtDate(b.last)}</Table.Td>
                  <Table.Td style={{ whiteSpace: 'normal' }}>{b.products.map(cropName).join(', ')}</Table.Td>
                  <Table.Td ta="right">{b.count}</Table.Td>
                  <Table.Td ta="right">{Math.round(b.volume).toLocaleString('en')}</Table.Td>
                  <Table.Td ta="right">{fmtEur(b.value)}</Table.Td>
                  <Table.Td><DevBadge v={b.dev} /></Table.Td>
                  <Table.Td style={{ whiteSpace: 'normal' }}><Text size="sm">{b.contracts.map((c) => CONTRACT_LABEL[c]).join(', ')}</Text></Table.Td>
                  <Table.Td ta="center">{qCount(b.id) ? <Badge variant="filled">{qCount(b.id)}</Badge> : <Text c="dimmed">–</Text>}</Table.Td>
                  <Table.Td><ChevronRight size={16} color="var(--mantine-color-dimmed)" /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>

      <BuyerDrawer
        buyer={buyer}
        onClose={() => setSelected(null)}
        history={history}
        sharing={sharingByBuyer[selected] ?? defaultSharing}
        setSharing={(v) => setSharingByBuyer((s) => ({ ...s, [selected]: v }))}
      />
    </div>
  )
}
