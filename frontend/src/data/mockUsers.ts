import type { MockUser } from '@/types'

export const mockUsers: MockUser[] = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    email: 'admin@kncl.local',
    firstName: 'Grace',
    lastName: 'Wanjiru',
    role: 'FEDERATION_ADMIN',
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    email: 'coordinator@kncl.local',
    firstName: 'James',
    lastName: 'Mutua',
    role: 'LEAGUE_COORDINATOR',
    leagueIds: ['11111111-1111-4111-8111-111111111101'],
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    email: 'captain.nairobi@kncl.local',
    firstName: 'Peter',
    lastName: 'Ochieng',
    role: 'CLUB_ADMIN',
    clubId: '22222222-2222-4222-8222-222222222201',
    clubName: 'Nairobi Kings',
  },
  {
    id: '33333333-3333-4333-8333-333333333304',
    email: 'captain.mombasa@kncl.local',
    firstName: 'Sarah',
    lastName: 'Wambui',
    role: 'CLUB_ADMIN',
    clubId: '22222222-2222-4222-8222-222222222202',
    clubName: 'Mombasa Rooks',
  },
  {
    id: '33333333-3333-4333-8333-333333333305',
    email: 'player1@kncl.local',
    firstName: 'Moses',
    lastName: 'Kamau',
    role: 'PLAYER',
    clubId: '22222222-2222-4222-8222-222222222201',
    clubName: 'Nairobi Kings',
    playerId: '44444444-4444-4444-8444-444444444401',
  },
  {
    id: '33333333-3333-4333-8333-333333333306',
    email: 'faith.njeri@kncl.local',
    firstName: 'Faith',
    lastName: 'Njeri',
    role: 'PLAYER',
    playerId: '44444444-4444-4444-8444-444444444501',
  },
]

export const defaultMockUser = mockUsers[4]
