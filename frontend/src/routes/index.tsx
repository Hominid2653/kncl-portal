import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'

import LandingLayout from '@/layouts/LandingLayout'
import AboutPage from '@/pages/marketing/AboutPage'
import LandingPage from '@/pages/marketing/LandingPage'
import PlayerListingsPage from '@/pages/marketing/PlayerListingsPage'
import RegisterHubPage from '@/pages/marketing/RegisterHubPage'
import ApplicationStatusPage from '@/pages/marketing/ApplicationStatusPage'
import CaptainRegistrationPage from '@/pages/marketing/CaptainRegistrationPage'
import PlayerRegistrationPage from '@/pages/marketing/PlayerRegistrationPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import LoginPage from '@/pages/auth/LoginPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import PlayerDashboardPage from '@/pages/player/PlayerDashboardPage'
import PlayerProfilePage from '@/pages/player/PlayerProfilePage'
import PlayerAccountsPage from '@/pages/player/PlayerAccountsPage'
import PlayerRegistrationsPage from '@/pages/player/PlayerRegistrationsPage'
import PlayerTransferNewPage from '@/pages/player/PlayerTransferNewPage'
import PlayerTransfersPage from '@/pages/player/PlayerTransfersPage'
import PlayerNotificationsPage from '@/pages/player/PlayerNotificationsPage'
import PlayerEngagementsPage from '@/pages/player/PlayerEngagementsPage'
import ClubDashboardPage from '@/pages/club/ClubDashboardPage'
import ClubRosterPage from '@/pages/club/ClubRosterPage'
import ClubPlayersPage from '@/pages/club/ClubPlayersPage'
import ClubPlayerNewPage from '@/pages/club/ClubPlayerNewPage'
import ClubRegistrationsPage from '@/pages/club/ClubRegistrationsPage'
import ClubRegistrationNewPage from '@/pages/club/ClubRegistrationNewPage'
import ClubTransfersPage from '@/pages/club/ClubTransfersPage'
import ClubTransferNewPage from '@/pages/club/ClubTransferNewPage'
import ClubDocumentsPage from '@/pages/club/ClubDocumentsPage'
import ClubEngagementsPage from '@/pages/club/ClubEngagementsPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminRegistrationsPage from '@/pages/admin/AdminRegistrationsPage'
import AdminTransfersPage from '@/pages/admin/AdminTransfersPage'
import AdminClubsPage from '@/pages/admin/AdminClubsPage'
import AdminPlayersPage from '@/pages/admin/AdminPlayersPage'
import AdminAuditLogsPage from '@/pages/admin/AdminAuditLogsPage'
import AdminLeaguesPage from '@/pages/admin/AdminLeaguesPage'
import AdminSeasonsPage from '@/pages/admin/AdminSeasonsPage'
import AdminUserProfilesPage from '@/pages/admin/AdminUserProfilesPage'
import AdminNotificationsPage from '@/pages/admin/AdminNotificationsPage'
import AdminClubApplicationsPage from '@/pages/admin/AdminClubApplicationsPage'
import AdminPlayerApplicationsPage from '@/pages/admin/AdminPlayerApplicationsPage'
import AdminHeadshotModerationPage from '@/pages/admin/AdminHeadshotModerationPage'
import ChangePasswordPage from '@/pages/account/ChangePasswordPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { FederationOnlyRoute } from '@/routes/FederationOnlyRoute'

const router = createBrowserRouter([
  {
    element: <LandingLayout><Outlet /></LandingLayout>,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/players', element: <PlayerListingsPage /> },
      { path: '/register', element: <RegisterHubPage /> },
      { path: '/register/status', element: <ApplicationStatusPage /> },
      { path: '/register/captain', element: <CaptainRegistrationPage /> },
      { path: '/register/player', element: <PlayerRegistrationPage /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  {
    element: (
      <ProtectedRoute allowedRoles={['PLAYER', 'CLUB_ADMIN', 'LEAGUE_COORDINATOR', 'FEDERATION_ADMIN']} />
    ),
    children: [{ path: '/account/security', element: <ChangePasswordPage /> }],
  },

  {
    element: <ProtectedRoute allowedRoles={['PLAYER']} />,
    children: [
      { path: '/player', element: <PlayerDashboardPage /> },
      { path: '/player/profile', element: <PlayerProfilePage /> },
      { path: '/player/accounts', element: <PlayerAccountsPage /> },
      { path: '/player/engagements', element: <PlayerEngagementsPage /> },
      { path: '/player/registrations', element: <PlayerRegistrationsPage /> },
      { path: '/player/transfers', element: <PlayerTransfersPage /> },
      { path: '/player/transfers/new', element: <PlayerTransferNewPage /> },
      { path: '/player/notifications', element: <PlayerNotificationsPage /> },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['CLUB_ADMIN']} />,
    children: [
      { path: '/club', element: <ClubDashboardPage /> },
      { path: '/club/roster', element: <ClubRosterPage /> },
      { path: '/club/players', element: <ClubPlayersPage /> },
      { path: '/club/engagements', element: <ClubEngagementsPage /> },
      { path: '/club/players/new', element: <ClubPlayerNewPage /> },
      { path: '/club/registrations', element: <ClubRegistrationsPage /> },
      { path: '/club/registrations/new', element: <ClubRegistrationNewPage /> },
      { path: '/club/transfers', element: <ClubTransfersPage /> },
      { path: '/club/documents', element: <ClubDocumentsPage /> },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['LEAGUE_COORDINATOR', 'FEDERATION_ADMIN']} />,
    children: [
      { path: '/admin', element: <AdminDashboardPage /> },
      { path: '/admin/club-applications', element: <AdminClubApplicationsPage /> },
      { path: '/admin/player-applications', element: <AdminPlayerApplicationsPage /> },
      { path: '/admin/headshot-moderation', element: <AdminHeadshotModerationPage /> },
      { path: '/admin/seasons', element: <AdminSeasonsPage /> },
      { path: '/admin/registrations', element: <AdminRegistrationsPage /> },
      { path: '/admin/transfers', element: <AdminTransfersPage /> },
      { path: '/admin/transfers/new', element: <ClubTransferNewPage /> },
      { path: '/admin/clubs', element: <AdminClubsPage /> },
      { path: '/admin/players', element: <AdminPlayersPage /> },
      { path: '/admin/audit-logs', element: <AdminAuditLogsPage /> },
      {
        element: <FederationOnlyRoute />,
        children: [
          { path: '/admin/leagues', element: <AdminLeaguesPage /> },
          { path: '/admin/user-profiles', element: <AdminUserProfilesPage /> },
          { path: '/admin/notifications', element: <AdminNotificationsPage /> },
        ],
      },
    ],
  },

  { path: '/dashboard', element: <Navigate to="/login" replace /> },
  { path: '*', element: <Navigate to="/" replace /> },
])

export default router
