import { useState } from 'react'
import { NavLink as RouterLink, useLocation } from 'react-router-dom'
import { Avatar, Box, Group, Menu, NavLink, Stack, Text, UnstyledButton } from '@mantine/core'
import { FileUp, History, Handshake, Bot, Database, Globe, LogOut, ChevronsUpDown, Check } from 'lucide-react'
import Logo from './Logo.jsx'
import { farm } from '../data/farm.js'

const nav = [
  { to: '/questionnaires', label: 'Upload request', icon: FileUp },
  { to: '/history', label: 'History', icon: History },
  { to: '/buyers', label: 'Buyers', icon: Handshake },
  { to: '/assistant', label: 'AI assistant', icon: Bot },
  { to: '/data', label: 'Data', icon: Database },
]

const languages = ['English', 'Deutsch', 'Italiano', 'Español', 'Français', 'Polski']

export default function Sidebar({ onNavigate }) {
  const { pathname } = useLocation()
  const [lang, setLang] = useState('English')

  return (
    <Stack h="100%" gap={0} p="md">
      <Box component={RouterLink} to="/" onClick={onNavigate} px={8} pt={6} pb={28} visibleFrom="sm">
        <Logo size={30} />
      </Box>

      <Stack gap={4}>
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            component={RouterLink}
            to={to}
            onClick={onNavigate}
            label={label}
            leftSection={<Icon size={18} strokeWidth={2} />}
            active={pathname.startsWith(to)}
            className="side-link"
          />
        ))}
      </Stack>

      <Stack gap={6} mt="auto" pt="md" className="side-foot">
        <Group gap="sm" px={8} py={6} wrap="nowrap">
          <Avatar radius="md" size={36} className="side-avatar">FA</Avatar>
          <Box style={{ minWidth: 0 }}>
            <Text size="sm" fw={700} className="side-name" truncate>{farm.name}</Text>
            <Text size="xs" className="side-muted">{farm.regionLabel.split(' · ')[1]}</Text>
          </Box>
        </Group>

        <Menu position="top-start" width={180} shadow="md">
          <Menu.Target>
            <UnstyledButton className="side-btn">
              <Globe size={16} />
              <span>{lang}</span>
              <ChevronsUpDown size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            {languages.map((l) => (
              <Menu.Item key={l} onClick={() => setLang(l)} rightSection={l === lang ? <Check size={14} /> : null}>
                {l}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>

        <UnstyledButton className="side-btn">
          <LogOut size={16} />
          <span>Log out</span>
        </UnstyledButton>
      </Stack>
    </Stack>
  )
}
