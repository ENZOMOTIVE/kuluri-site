import { createContext, useCallback, useContext, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppShell, Burger, Group } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { CircleCheck } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import Logo from './components/Logo.jsx'
import Home from './pages/Home.jsx'
import Questionnaires from './pages/Questionnaires.jsx'
import History from './pages/History.jsx'
import Buyers from './pages/Buyers.jsx'
import Assistant from './pages/Assistant.jsx'
import Data from './pages/Data.jsx'
import { initialHistory } from './data/farm.js'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

export default function App() {
  const [history, setHistory] = useState(initialHistory)
  const [opened, { toggle, close }] = useDisclosure()

  const showToast = useCallback((message) => {
    notifications.show({ message, color: 'brand', icon: <CircleCheck size={18} />, withBorder: true, radius: 'md' })
  }, [])

  const addToHistory = useCallback((entry) => {
    setHistory((h) => [{ id: Date.now(), ...entry }, ...h])
  }, [])

  return (
    <AppContext.Provider value={{ history, addToHistory, showToast }}>
      <AppShell
        navbar={{ width: 252, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        header={{ height: { base: 56, sm: 0 } }}
        padding={0}
      >
        <AppShell.Header hiddenFrom="sm" className="mobile-header">
          <Group h="100%" px="md" justify="space-between">
            <Logo />
            <Burger opened={opened} onClick={toggle} size="sm" />
          </Group>
        </AppShell.Header>

        <AppShell.Navbar className="sidebar">
          <Sidebar onNavigate={close} />
        </AppShell.Navbar>

        <AppShell.Main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/questionnaires" element={<Questionnaires />} />
            <Route path="/history" element={<History />} />
            <Route path="/buyers" element={<Buyers />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/data" element={<Data />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </AppContext.Provider>
  )
}
