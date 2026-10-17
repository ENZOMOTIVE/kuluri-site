import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, Group, Table, Text, ThemeIcon, Title } from '@mantine/core'
import { FileSpreadsheet, FileText, FileUp } from 'lucide-react'
import { useApp } from '../App.jsx'

export default function History() {
  const { history } = useApp()
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2}>History</Title>
            <Text c="dimmed" mt={4}>Documents you recently worked on, and what you shared with each buyer.</Text>
          </div>
          <Button leftSection={<FileUp size={16} />} onClick={() => navigate('/questionnaires')}>Upload questionnaire</Button>
        </Group>
      </div>

      <Card p={0}>
        <Table.ScrollContainer minWidth={720}>
          <Table verticalSpacing="md" horizontalSpacing="lg" highlightOnHover>
            <Table.Thead bg="gray.0">
              <Table.Tr>
                <Table.Th>Document</Table.Th>
                <Table.Th>Buyer</Table.Th>
                <Table.Th>Last activity</Table.Th>
                <Table.Th ta="right">Questions</Table.Th>
                <Table.Th ta="right">Shared</Table.Th>
                <Table.Th>Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {history.map((h) => {
                const Icon = h.file.endsWith('.pdf') ? FileText : FileSpreadsheet
                return (
                  <Table.Tr key={h.id}>
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <ThemeIcon variant="light" radius="md" size={34}><Icon size={17} /></ThemeIcon>
                        <Text fw={600} size="sm">{h.file}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td><Text size="sm">{h.buyer}</Text></Table.Td>
                    <Table.Td><Text size="sm" c="dimmed">{h.date}</Text></Table.Td>
                    <Table.Td ta="right">{h.questions}</Table.Td>
                    <Table.Td ta="right">{h.status === 'Answered' ? h.shared : '–'}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color={h.status === 'Answered' ? 'brand' : 'yellow'}>{h.status}</Badge>
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </div>
  )
}
