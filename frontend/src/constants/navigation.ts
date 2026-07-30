import {
  ArrowRightLeft,
  Bell,
  Building2,
  CalendarRange,
  ClipboardList,
  FileText,
  Handshake,
  ImageIcon,
  LayoutDashboard,
  ScrollText,
  Shield,
  Trophy,
  UserCircle2,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { UserRole } from '@/types'
import { federationAdminRoles, leagueLeadershipRoles } from '@/constants/roles'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const marketingNav: NavItem[] = [
  { title: 'About', href: '/about', icon: Shield },
  { title: 'Players', href: '/players', icon: Users },
  { title: 'Register', href: '/register', icon: UserPlus },
  { title: 'Status', href: '/register/status', icon: ClipboardList },
  { title: 'Leagues', href: '/about#leagues', icon: Trophy },
  { title: 'Portal', href: '/login', icon: LayoutDashboard },
]

export const playerNav: NavItem[] = [
  { title: 'Dashboard', href: '/player', icon: LayoutDashboard },
  { title: 'Profile', href: '/player/profile', icon: UserCircle2 },
  { title: 'External accounts', href: '/player/accounts', icon: Shield },
  { title: 'Engagements', href: '/player/engagements', icon: Handshake },
  { title: 'Registrations', href: '/player/registrations', icon: ClipboardList },
  { title: 'Transfers', href: '/player/transfers', icon: ArrowRightLeft },
  { title: 'Notifications', href: '/player/notifications', icon: Bell },
]

export const clubNav: NavItem[] = [
  { title: 'Dashboard', href: '/club', icon: LayoutDashboard },
  { title: 'Roster', href: '/club/roster', icon: Users },
  { title: 'Players', href: '/club/players', icon: UserCircle2 },
  { title: 'Engagements', href: '/club/engagements', icon: Handshake },
  { title: 'Registrations', href: '/club/registrations', icon: ClipboardList },
  { title: 'Transfers', href: '/club/transfers', icon: ArrowRightLeft },
  { title: 'Documents', href: '/club/documents', icon: FileText },
]

export const coordinatorNav: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Club applications', href: '/admin/club-applications', icon: UserPlus },
  { title: 'Player applications', href: '/admin/player-applications', icon: UserCircle2 },
  { title: 'Headshot moderation', href: '/admin/headshot-moderation', icon: ImageIcon },
  { title: 'Seasons', href: '/admin/seasons', icon: CalendarRange },
  { title: 'Registration queue', href: '/admin/registrations', icon: ClipboardList },
  { title: 'Transfer queue', href: '/admin/transfers', icon: ArrowRightLeft },
  { title: 'Clubs', href: '/admin/clubs', icon: Building2 },
  { title: 'Players', href: '/admin/players', icon: UserCircle2 },
  { title: 'Audit logs', href: '/admin/audit-logs', icon: ScrollText },
]

export const federationOnlyNav: NavItem[] = [
  { title: 'Leagues', href: '/admin/leagues', icon: Trophy },
  { title: 'User profiles', href: '/admin/user-profiles', icon: UserCog },
  { title: 'Notifications', href: '/admin/notifications', icon: Bell },
]

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'PLAYER':
      return playerNav
    case 'CLUB_ADMIN':
      return clubNav
    case 'LEAGUE_COORDINATOR':
      return coordinatorNav
    case 'FEDERATION_ADMIN':
      return [...coordinatorNav, ...federationOnlyNav]
    default:
      return []
  }
}

export function canAccessAdmin(role: UserRole): boolean {
  return leagueLeadershipRoles.includes(role) || federationAdminRoles.includes(role)
}

export function canAccessClub(role: UserRole): boolean {
  return role === 'CLUB_ADMIN' || canAccessAdmin(role)
}

export function canAccessPlayer(role: UserRole): boolean {
  return role === 'PLAYER' || canAccessClub(role) || canAccessAdmin(role)
}
