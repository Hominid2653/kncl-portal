import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, type SetStateAction } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  listClubApplications,
  listPlayerApplications,
  postClubApplication,
  postPlayerApplication,
  reviewClubApplication,
  reviewPlayerApplication,
} from '@/api/applications'
import { useAuth } from '@/context/AuthContext'
import { useOtp } from '@/context/OtpContext'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import { filterByLeagueScope } from '@/lib/coordinator'
import { isClubInInitialRosterPeriod as checkInitialPeriod } from '@/lib/business-rules'
import { USE_API, hasApiSession } from '@/lib/api-config'
import { queryKeys } from '@/lib/query-keys'
import { STALE_PORTAL_MS } from '@/lib/query-client'
import { usePortalData } from '@/context/PortalDataContext'
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
  applicationsLoading: boolean
  initialRosterClubIds: string[]
  submitClubApplication: (input: SubmitClubApplicationInput, emailVerificationToken: string) => string
  submitPlayerRegistration: (input: SubmitPlayerRegistrationInput, emailVerificationToken: string) => string
  reviewClubApplication: (input: ReviewInput) => void
  reviewPlayerApplication: (input: ReviewInput) => void
  getClubApplicationByEmail: (email: string) => ClubCaptainApplication | undefined
  getPlayerApplicationByEmail: (email: string) => PlayerRegistrationApplication | undefined
  getScopedClubApplications: (user: MockUser | null) => ClubCaptainApplication[]
  getScopedPlayerApplications: (user: MockUser | null) => PlayerRegistrationApplication[]
  getScopedPendingCounts: (user: MockUser | null) => { club: number; player: number }
  isClubInInitialRosterPeriod: (clubId: string) => boolean
  getClubRosterCount: (clubId: string) => number
  recordRosterAddition: (clubId: string) => void
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

interface ApiClubApplication {
  id: string
  club_name: string
  county: string
  league_id: string
  league_name?: string | null
  description?: string | null
  captain_first_name: string
  captain_last_name: string
  captain_email: string
  captain_phone: string
  status: ApplicationStatus
  rejection_reason?: string | null
  created_at?: string
}

interface ApiPlayerApplication {
  id: string
  first_name: string
  last_name: string
  email: string
  county: string
  nationality: string
  league_id?: string | null
  status: ApplicationStatus
  rejection_reason?: string | null
  federation_id?: string | null
  created_at?: string
}

function mapClubApplicationFromApi(item: ApiClubApplication): ClubCaptainApplication {
  return {
    id: item.id,
    clubName: item.club_name,
    county: item.county,
    leagueId: item.league_id,
    leagueName: item.league_name ?? '',
    description: item.description ?? undefined,
    captainFirstName: item.captain_first_name,
    captainLastName: item.captain_last_name,
    captainEmail: item.captain_email,
    captainPhone: item.captain_phone,
    status: item.status,
    rejectionReason: item.rejection_reason ?? undefined,
    submittedAt: item.created_at ?? timestamp(),
    emailVerifiedAt: item.created_at ?? timestamp(),
  }
}

function mapPlayerApplicationFromApi(item: ApiPlayerApplication): PlayerRegistrationApplication {
  return {
    id: item.id,
    firstName: item.first_name,
    lastName: item.last_name,
    email: item.email,
    county: item.county,
    nationality: item.nationality,
    leagueId: item.league_id ?? '',
    leagueName: '',
    status: item.status,
    federationId: item.federation_id ?? undefined,
    rejectionReason: item.rejection_reason ?? undefined,
    submittedAt: item.created_at ?? timestamp(),
    emailVerifiedAt: item.created_at ?? timestamp(),
  }
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
  const { user, accessToken, loading: authLoading, provisionUser } = useAuth()
  const { clubs } = usePortalData()
  const { consumeToken } = useOtp()
  const { addFreeAgentFromApplication } = usePlayerListings()
  const queryClient = useQueryClient()
  const [mockClubApplications, setMockClubApplications] = useState(initialClubCaptainApplications)
  const [mockPlayerApplications, setMockPlayerApplications] = useState(initialPlayerRegistrationApplications)
  const [initialRosterClubIds, setInitialRosterClubIds] = useState<string[]>([])
  const [clubRosterCounts, setClubRosterCounts] = useState<Record<string, number>>({})

  const isCoordinator =
    user?.role === 'FEDERATION_ADMIN' || user?.role === 'LEAGUE_COORDINATOR'

  const clubAppsQuery = useQuery({
    queryKey: queryKeys.clubApplications,
    queryFn: async () => {
      const response = await listClubApplications(accessToken)
      return (response?.items ?? []).map((item) =>
        mapClubApplicationFromApi(item as ApiClubApplication),
      )
    },
    enabled: USE_API && !authLoading && Boolean(user) && hasApiSession() && isCoordinator,
    staleTime: STALE_PORTAL_MS,
    placeholderData: (previous) => previous,
  })

  const playerAppsQuery = useQuery({
    queryKey: queryKeys.playerApplications,
    queryFn: async () => {
      const response = await listPlayerApplications(accessToken)
      return (response?.items ?? []).map((item) =>
        mapPlayerApplicationFromApi(item as ApiPlayerApplication),
      )
    },
    enabled: USE_API && !authLoading && Boolean(user) && hasApiSession() && isCoordinator,
    staleTime: STALE_PORTAL_MS,
    placeholderData: (previous) => previous,
  })

  const clubApplications = USE_API ? (clubAppsQuery.data ?? []) : mockClubApplications
  const playerApplications = USE_API ? (playerAppsQuery.data ?? []) : mockPlayerApplications
  const applicationsLoading =
    USE_API &&
    isCoordinator &&
    (clubAppsQuery.isPending || playerAppsQuery.isPending) &&
    !clubAppsQuery.data &&
    !playerAppsQuery.data

  const setClubApplications = (updater: SetStateAction<ClubCaptainApplication[]>) => {
    if (USE_API) {
      queryClient.setQueryData<ClubCaptainApplication[]>(queryKeys.clubApplications, (prev) => {
        const current = prev ?? []
        return typeof updater === 'function' ? updater(current) : updater
      })
      return
    }
    setMockClubApplications(updater)
  }

  const setPlayerApplications = (updater: SetStateAction<PlayerRegistrationApplication[]>) => {
    if (USE_API) {
      queryClient.setQueryData<PlayerRegistrationApplication[]>(queryKeys.playerApplications, (prev) => {
        const current = prev ?? []
        return typeof updater === 'function' ? updater(current) : updater
      })
      return
    }
    setMockPlayerApplications(updater)
  }

  const invalidateApplications = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.clubApplications })
    void queryClient.invalidateQueries({ queryKey: queryKeys.playerApplications })
    void queryClient.invalidateQueries({ queryKey: ['portal'] })
  }

  useEffect(() => {
    if (clubs.length) {
      setClubRosterCounts(Object.fromEntries(clubs.map((c) => [c.id, c.players])))
    }
  }, [clubs])

  const value = useMemo<OnboardingContextValue>(
    () => ({
      clubApplications,
      playerApplications,
      applicationsLoading,
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
      isClubInInitialRosterPeriod: (clubId) =>
        checkInitialPeriod(clubId, initialRosterClubIds, clubRosterCounts[clubId] ?? 0),
      getClubRosterCount: (clubId) => clubRosterCounts[clubId] ?? 0,
      recordRosterAddition: (clubId) => {
        setClubRosterCounts((prev) => {
          const next = (prev[clubId] ?? 0) + 1
          return { ...prev, [clubId]: next }
        })
      },
      submitClubApplication: (input, emailVerificationToken) => {
        if (!consumeToken(input.captainEmail, emailVerificationToken, 'APPLICATION_SUBMIT')) {
          toast.error('Email verification expired. Verify your email and try again.')
          return ''
        }

        if (USE_API) {
          void postClubApplication(
            {
              club_name: input.clubName,
              county: input.county,
              league_id: input.leagueId,
              description: input.description,
              captain_first_name: input.captainFirstName,
              captain_last_name: input.captainLastName,
              captain_email: input.captainEmail,
              captain_phone: input.captainPhone,
            },
            emailVerificationToken,
          )
            .then((result) => {
              if (!result) return
              toast.success('Application submitted. Track status with your email.')
              setClubApplications((prev) => [
                {
                  id: result.id,
                  ...input,
                  status: 'PENDING',
                  submittedAt: timestamp(),
                  emailVerifiedAt: timestamp(),
                },
                ...prev,
              ])
            })
            .catch(() => toast.error('Failed to submit club application.'))
          return 'pending'
        }

        const pending = clubApplications.some(
          (a) => a.captainEmail.toLowerCase() === input.captainEmail.toLowerCase() && a.status === 'PENDING',
        )
        if (pending) {
          toast.error('A pending club application already exists for this email.')
          return ''
        }

        const verifiedAt = timestamp()
        const application: ClubCaptainApplication = {
          id: `CCA-${Date.now()}`,
          ...input,
          status: 'PENDING',
          submittedAt: verifiedAt,
          emailVerifiedAt: verifiedAt,
        }
        setClubApplications((prev) => [application, ...prev])
        toast.success('Application submitted. Track status with your email.')
        return application.id
      },
      submitPlayerRegistration: (input, emailVerificationToken) => {
        if (!consumeToken(input.email, emailVerificationToken, 'APPLICATION_SUBMIT')) {
          toast.error('Email verification expired. Verify your email and try again.')
          return ''
        }

        if (USE_API) {
          void postPlayerApplication(
            {
              first_name: input.firstName,
              last_name: input.lastName,
              email: input.email,
              county: input.county,
              nationality: input.nationality,
              league_id: input.leagueId,
            },
            emailVerificationToken,
          )
            .then((result) => {
              if (!result) return
              toast.success('Profile request submitted. Track status with your email.')
              setPlayerApplications((prev) => [
                {
                  id: result.id,
                  ...input,
                  status: 'PENDING',
                  submittedAt: timestamp(),
                  emailVerifiedAt: timestamp(),
                },
                ...prev,
              ])
            })
            .catch(() => toast.error('Failed to submit player application.'))
          return 'pending'
        }

        const pending = playerApplications.some(
          (a) => a.email.toLowerCase() === input.email.toLowerCase() && a.status === 'PENDING',
        )
        if (pending) {
          toast.error('A pending player application already exists for this email.')
          return ''
        }

        const verifiedAt = timestamp()
        const application: PlayerRegistrationApplication = {
          id: `PRA-${Date.now()}`,
          ...input,
          status: 'PENDING',
          submittedAt: verifiedAt,
          emailVerifiedAt: verifiedAt,
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

        if (USE_API && hasApiSession()) {
          void reviewClubApplication(
            id,
            { status, rejection_reason: rejectionReason },
            accessToken,
          )
            .then(() => {
              setClubApplications((prev) =>
                prev.map((item) =>
                  item.id === id
                    ? {
                        ...item,
                        status,
                        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
                        reviewedAt: timestamp(),
                        reviewedBy: reviewerName,
                      }
                    : item,
                ),
              )
              toast.success(status === 'APPROVED' ? 'Club application approved.' : 'Club application rejected.')
              invalidateApplications()
            })
            .catch(() => toast.error('Failed to review club application.'))
          return
        }

        const target = clubApplications.find((item) => item.id === id)
        if (!target) return
        if (target.status !== 'PENDING') {
          toast.error('This application has already been reviewed.')
          return
        }

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
          setClubRosterCounts((prev) => ({ ...prev, [createdClubId]: 0 }))
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

        if (USE_API && hasApiSession()) {
          void reviewPlayerApplication(
            id,
            { status, rejection_reason: rejectionReason },
            accessToken,
          )
            .then(() => {
              setPlayerApplications((prev) =>
                prev.map((item) =>
                  item.id === id
                    ? {
                        ...item,
                        status,
                        rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
                        reviewedAt: timestamp(),
                        reviewedBy: reviewerName,
                      }
                    : item,
                ),
              )
              toast.success(status === 'APPROVED' ? 'Player application approved.' : 'Player application rejected.')
              invalidateApplications()
            })
            .catch(() => toast.error('Failed to review player application.'))
          return
        }

        const target = playerApplications.find((item) => item.id === id)
        if (!target) return
        if (target.status !== 'PENDING') {
          toast.error('This application has already been reviewed.')
          return
        }

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
    [clubApplications, playerApplications, applicationsLoading, initialRosterClubIds, clubRosterCounts, addFreeAgentFromApplication, provisionUser, consumeToken, accessToken],
  )

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider')
  return context
}
