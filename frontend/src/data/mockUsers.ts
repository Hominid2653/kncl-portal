import type { MockUser } from '@/types'

/** Dev quick-sign-in accounts aligned with backend seed `user_profiles` IDs. */
export const mockUsers: MockUser[] = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    email: 'grace.wanjiru@kncl.local',
    firstName: 'Grace',
    lastName: 'Wanjiru',
    role: 'FEDERATION_ADMIN',
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    email: 'daniel.otieno@kncl.local',
    firstName: 'Daniel',
    lastName: 'Otieno',
    role: 'LEAGUE_COORDINATOR',
    leagueIds: ['11111111-1111-4111-8111-111111111101'],
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    email: 'brian.kamau@kncl.local',
    firstName: 'Brian',
    lastName: 'Kamau',
    role: 'CLUB_ADMIN',
    clubId: '22222222-2222-4222-8222-222222222201',
    clubName: 'Nairobi Chess Club',
  },
  {
    id: '33333333-3333-4333-8333-333333333304',
    email: 'amina.hassan@kncl.local',
    firstName: 'Amina',
    lastName: 'Hassan',
    role: 'CLUB_ADMIN',
    clubId: '22222222-2222-4222-8222-222222222202',
    clubName: 'Mombasa Chess Warriors',
  },
  {
    id: '33333333-3333-4333-8333-333333333305',
    email: 'elias.mwangi@kncl.local',
    firstName: 'Elias',
    lastName: 'Mwangi',
    role: 'PLAYER',
    clubId: '22222222-2222-4222-8222-222222222201',
    clubName: 'Nairobi Chess Club',
    playerId: '44444444-4444-4444-8444-444444444401',
  },
  {
    id: '33333333-3333-4333-8333-333333333306',
    email: 'faith.njeri@kncl.local',
    firstName: 'Faith',
    lastName: 'Njeri',
    role: 'PLAYER',
    clubId: '22222222-2222-4222-8222-222222222201',
    clubName: 'Nairobi Chess Club',
    playerId: '44444444-4444-4444-8444-444444444402',
  },
  {
    id: '33333333-3333-4333-8333-333333333307',
    email: 'kevin.ochieng@kncl.local',
    firstName: 'Kevin',
    lastName: 'Ochieng',
    role: 'PLAYER',
    clubId: '22222222-2222-4222-8222-222222222202',
    clubName: 'Mombasa Chess Warriors',
    playerId: '44444444-4444-4444-8444-444444444403',
  },
]

export const defaultMockUser = mockUsers[5]
