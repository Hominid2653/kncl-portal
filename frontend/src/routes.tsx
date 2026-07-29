import { createBrowserRouter } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import PlayersPage from './pages/PlayersPage'
import RegistrationPage from './pages/RegistrationPage'
import ReportsPage from './pages/ReportsPage'
import TransfersPage from './pages/TransfersPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell><DashboardPage /></AppShell>,
  },
  {
    path: '/dashboard',
    element: <AppShell><DashboardPage /></AppShell>,
  },
  {
    path: '/register',
    element: <AppShell><RegistrationPage /></AppShell>,
  },
  {
    path: '/transfers',
    element: <AppShell><TransfersPage /></AppShell>,
  },
  {
    path: '/players',
    element: <AppShell><PlayersPage /></AppShell>,
  },
  {
    path: '/reports',
    element: <AppShell><ReportsPage /></AppShell>,
  },
])

export default router
