import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/context/AuthContext'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import { filterByLeagueScope } from '@/lib/coordinator'
import { initialClubCaptainApplications, initialPlayerRegistrationApplications } from '@/data/mockOnboarding'
import type { ApplicationStatus, ClubCaptainApplication, MockUser, PlayerRegistrationApplication } from '@/types'

export type ApplicationType = 'club' | 'player'

interface SubmitClubApplicationInput {
  clubName: string
  county: string
  leagueId: string
  leagueName: string
  description?: string
  charterFileName?: string
  charterUrl?: string
  captainFirstName: string
  captainLastName: string
  captainEmail: string
  captainPhone: string
}

interface SubmitPlayerRegistrationInput {
  firstName: string
  lastName: string
  email: string
  county: string
  nationality: string
  leagueId: string
  leagueName: string
}

interface ReviewInput {
  id: string
  status: Extract<ApplicationStatus, 'APPROVED' | 'REJECTED'>
  reviewerName: string
  rejectionReason?: string
}

interface OnboardingContextValue {
  clubApplications: ClubCaptainApplication[]
  playerApplications: PlayerRegistrationApplication[]
  initialRosterClubIds: string[]
  submitClubApplication: (input: SubmitClubApplicationInput) => string
  submitPlayerRegistration: (input: SubmitPlayerRegistrationInput) => string
  reviewClubApplication: (input: ReviewInput) => void
  reviewPlayerApplication: (input: ReviewInput) => void
  getClubApplicationByEmail: (email: string) => ClubCaptainApplication | undefined
  getPlayerApplicationByEmail: (email: string) => PlayerRegistrationApplication | undefined
  getScopedClubApplications: (user: MockUser | null) => ClubCaptainApplication[]
  getScopedPlayerApplications: (user: MockUser | null) => PlayerRegistrationApplication[]
  getScopedPendingCounts: (user: MockUser | null) => { club: number; player: number }
  isClubInInitialRosterPeriod: (clubId: string) => boolean
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

function nextFederationId(existing: PlayerRegistrationApplication[]) {
  const max = existing.reduce((acc, item) => {
    const match = item.federationId?.match(/KEN-(\d+)/)
    return match ? Math.max(acc, Number(match[1])) : acc
  }, 2500)
  return `KEN-${max + 1}`
}

function timestamp() {
  return new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function findLatestByEmail<T extends { email?: string; captainEmail?: string }>(
  items: T[],
  email: string,
  emailKey: 'email' | 'captainEmail',
): T | undefined {
  const normalized = email.trim().toLowerCase()
  return items.find((item) => {
    const value = emailKey === 'email' ? item.email : item.captainEmail
    return value?.toLowerCase() === normalized
  })
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { provisionUser } = useAuth()
  const { addFreeAgentFromApplication } = usePlayerListings()
  const [clubApplications, setClubApplications] = useState(initialClubCaptainApplications)
  const [playerApplications, setPlayerApplications] = useState(initialPlayerRegistrationApplications)
  const [initialRosterClubIds, setInitialRosterClubIds] = useState<string[]>([])

  const value = useMemo<OnboardingContextValue>(
    () => ({
      clubApplications,
      playerApplications,
      initialRosterClubIds,
      getClubApplicationByEmail: (email) => findLatestByEmail(clubApplications, email, 'captainEmail'),
      getPlayerApplicationByEmail: (email) => findLatestByEmail(playerApplications, email, 'email'),
      getScopedClubApplications: (user) => filterByLeagueScope(user, clubApplications),
      getScopedPlayerApplications: (user) => filterByLeagueScope(user, playerApplications),
      getScopedPendingCounts: (user) => {
        const clubs = filterByLeagueScope(user, clubApplications)
        const players = filterByLeagueScope(user, playerApplications)
        return {
          club: clubs.filter((a) => a.status === 'PENDING').length,
          player: players.filter((a) => a.status === 'PENDING').length,
        }
      },
      isClubInInitialRosterPeriod: (clubId) => initialRosterClubIds.includes(clubId),
      submitClubApplication: (input) => {
        const application: ClubCaptainApplication = {
          id: `CCA-${Date.now()}`,
          ...input,
          status: 'PENDING',
          submittedAt: timestamp(),
        }
        setClubApplications((prev) => [application, ...prev])
        toast.success('Application submitted. Track status with your email.')
        return application.id
      },
      submitPlayerRegistration: (input) => {
        const application: PlayerRegistrationApplication = {
          id: `PRA-${Date.now()}`,
          ...input,
          status: 'PENDING',
          submittedAt: timestamp(),
        }
        setPlayerApplications((prev) => [application, ...prev])
        toast.success('Profile request submitted. Track status with your email.')
        return application.id
      },
      reviewClubApplication: ({ id, status, reviewerName, rejectionReason }) => {
        if (status === 'REJECTED' && !rejectionReason?.trim()) {
          toast.error('A rejection message is required.')
          return
        }

        const target = clubApplications.find((item) => item.id === id)
        if (!target) return

        const createdClubId = status === 'APPROVED' ? `22222222-2222-4222-8222-${Date.now().toString().slice(-12)}` : undefined

        setClubApplications((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
                  createdClubId,
                  reviewedAt: timestamp(),
                  reviewedBy: reviewerName,
                }
              : item,
          ),
        )

        if (status === 'APPROVED' && createdClubId) {
          setInitialRosterClubIds((prev) => [...prev, createdClubId])
          provisionUser({
            id: `33333333-3333-4333-8333-${Date.now().toString().slice(-12)}`,
            email: target.captainEmail,
            firstName: target.captainFirstName,
            lastName: target.captainLastName,
            role: 'CLUB_ADMIN',
            clubId: createdClubId,
            clubName: target.clubName,
          })
          toast.success(`Club approved. Captain ${target.captainEmail} can now sign in.`)
        } else if (status === 'REJECTED') {
          toast.message('Club application rejected. Applicant will see your message.')
        }
      },
      reviewPlayerApplication: ({ id, status, reviewerName, rejectionReason }) => {
        if (status === 'REJECTED' && !rejectionReason?.trim()) {
          toast.error('A rejection message is required.')
          return
        }

        const target = playerApplications.find((item) => item.id === id)
        if (!target) return

        const federationId = status === 'APPROVED' ? nextFederationId(playerApplications) : undefined
        let playerId: string | undefined

        if (status === 'APPROVED' && federationId) {
          playerId = addFreeAgentFromApplication({ ...target, federationId }, federationId)
          provisionUser({
            id: `33333333-3333-4333-8333-${Date.now().toString().slice(-12)}`,
            email: target.email,
            firstName: target.firstName,
            lastName: target.lastName,
            role: 'PLAYER',
            playerId,
          })
        }

        setPlayerApplications((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status,
                  federationId: federationId ?? item.federationId,
                  rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
                  reviewedAt: timestamp(),
                  reviewedBy: reviewerName,
                }
              : item,
          ),
        )

        if (status === 'APPROVED') {
          toast.success(`Player approved (${federationId}). ${target.email} can now sign in.`)
        } else {
          toast.message('Player application rejected. Applicant will see your message.')
        }
      },
    }),
    [clubApplications, playerApplications, initialRosterClubIds, addFreeAgentFromApplication, provisionUser],
  )

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider')
  return context
}
