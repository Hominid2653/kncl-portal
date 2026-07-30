import type { DashboardMetric, PlayerRecord, TransferItem } from '../types'

export const stats: DashboardMetric[] = [
  { label: 'Active players', value: '1,248', detail: 'Across 42 clubs' },
  { label: 'Pending transfers', value: '36', detail: 'Reviewed this week' },
  { label: 'Verified profiles', value: '94%', detail: 'Cross-checked by staff' },
]

export const playerRecords: PlayerRecord[] = [
  { id: 'P-101', name: 'Moses Kamau', club: 'Nairobi Kings', status: 'Verified', rating: '2200', lastUpdated: '2h ago' },
  { id: 'P-102', name: 'Amina Hassan', club: 'Mombasa Rooks', status: 'Pending review', rating: '2145', lastUpdated: '5h ago' },
  { id: 'P-103', name: 'Daniel Otieno', club: 'Kisumu Lions', status: 'Approved', rating: '2310', lastUpdated: 'Yesterday' },
]

export const transferQueue: TransferItem[] = [
  { id: 'T-201', playerName: 'Moses Kamau', fromClub: 'Nairobi Kings', toClub: 'Eldoret Falcons', status: 'Pending', submitted: '08:30' },
  { id: 'T-202', playerName: 'Amina Hassan', fromClub: 'Mombasa Rooks', toClub: 'Kisumu Lions', status: 'Approved', submitted: '11:10' },
  { id: 'T-203', playerName: 'Daniel Otieno', fromClub: 'Kisumu Lions', toClub: 'Nairobi Kings', status: 'Needs review', submitted: '14:45' },
]
