export interface DashboardMetric {
  label: string
  value: string
  detail: string
}

export interface PlayerRecord {
  id: string
  name: string
  club: string
  status: string
  rating: string
  lastUpdated: string
}

export interface TransferItem {
  id: string
  playerName: string
  fromClub: string
  toClub: string
  status: 'Pending' | 'Approved' | 'Needs review'
  submitted: string
}

export interface SidebarNavItem {
  title: string
  href: string
  icon: string
}
