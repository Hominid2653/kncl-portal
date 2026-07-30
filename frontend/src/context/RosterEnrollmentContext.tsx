import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import {
  approveRosterEnrollment,
  listRosterEnrollments,
  rejectRosterEnrollment,
} from '@/api/resources'
import { submitRosterEnrollment } from '@/api/transfers'
import { useAuth } from '@/context/AuthContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import { usePortalData } from '@/context/PortalDataContext'
import { rosterEnrollments as initialEnrollments } from '@/data/mockData'
import { mapRegistration } from '@/lib/api-mappers'
import { apiSeed, USE_API, hasApiSession } from '@/lib/api-config'
import type { ApiClub, ApiPlayer, ApiRegistration, ApiUserProfile } from '@/api/resources'
import type { EngagementRequest, RosterEnrollmentRecord } from '@/types'

interface RosterEnrollmentContextValue {
  rosterEnrollments: RosterEnrollmentRecord[]
  refreshEnrollments: () => Promise<void>
  createFromFreeAgentEngagement: (
    engagement: EngagementRequest,
    seasonId: string,
    seasonName: string,
  ) => string
  approveEnrollment: (id: string, reviewerName: string) => void
  rejectEnrollment: (id: string, reviewerName: string, reason: string) => void
}

const RosterEnrollmentContext = createContext<RosterEnrollmentContextValue | null>(null)

function timestamp() {
  return new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function RosterEnrollmentProvider({ children }: { children: ReactNode }) {
  const { accessToken, loading: authLoading } = useAuth()
  const { players, clubs, userProfiles, seasonNameById, refresh } = usePortalData()
  const { recordRosterAddition } = useOnboarding()
  const { commitPlayerToClub } = usePlayerListings()
  const [rosterEnrollments, setRosterEnrollments] = useState<RosterEnrollmentRecord[]>(() => apiSeed(initialEnrollments, []))

  const refreshEnrollments = useCallback(async () => {
    if (!USE_API) return
    const response = await listRosterEnrollments()
    if (!response?.items) return

    const playerMap = new Map<string, ApiPlayer>(
      players.map((p) => [
        p.id,
        {
          id: p.id,
          user_profile_id: '',
          federation_id: p.federationId,
          classical_rating: p.fideRating,
        },
      ]),
    )
    const clubMap = new Map<string, ApiClub>(
      clubs.map((c) => [c.id, { id: c.id, name: c.name, league_id: c.leagueId, county: c.county }]),
    )
    const profileMap = new Map<string, ApiUserProfile>(
      userProfiles.map((p) => [
        p.id,
        { id: p.id, first_name: p.name.split(' ')[0] ?? '', last_name: p.name.split(' ').slice(1).join(' '), role: p.role, auth_user_id: p.id },
      ]),
    )
    const seasonMap = new Map<string, { name: string }>()

    setRosterEnrollments(
      response.items.map((item: ApiRegistration) => {
        const seasonName = seasonNameById(item.season_id)
        seasonMap.set(item.season_id, { name: seasonName })
        return mapRegistration(item, playerMap, profileMap, clubMap, seasonMap)
      }),
    )
  }, [players, clubs, userProfiles, seasonNameById])

  useEffect(() => {
    if (USE_API && !authLoading && hasApiSession()) {
      void refreshEnrollments()
    }
  }, [accessToken, authLoading, refreshEnrollments])

  const value = useMemo<RosterEnrollmentContextValue>(
    () => ({
      rosterEnrollments,
      refreshEnrollments,
      createFromFreeAgentEngagement: (engagement, seasonId, seasonName) => {
        const pending = rosterEnrollments.some(
          (e) =>
            e.playerId === engagement.playerId &&
            e.clubId === engagement.requestingClubId &&
            e.status === 'PENDING',
        )
        if (pending) {
          toast.error('A pending roster enrollment already exists for this player and club.')
          return ''
        }

        if (USE_API) {
          if (!seasonId) {
            toast.error('No active season found for roster enrollment.')
            return ''
          }
          if (!accessToken) {
            toast.error('You must be signed in to submit roster enrollment.')
            return ''
          }
          void submitRosterEnrollment(
            {
              player_id: engagement.playerId,
              club_id: engagement.requestingClubId,
              season_id: seasonId,
            },
            accessToken,
          )
            .then((result) => {
              const id = (result as { id?: string })?.id ?? 'pending'
              toast.success(`Roster enrollment submitted for coordinator review.`)
              void refreshEnrollments()
              void refresh()
              return id
            })
            .catch(() => toast.error('Failed to submit roster enrollment.'))
          return 'pending'
        }

        const id = `RE-${Date.now()}`
        const enrollment: RosterEnrollmentRecord = {
          id,
          playerId: engagement.playerId,
          playerName: engagement.playerName,
          clubId: engagement.requestingClubId,
          club: engagement.requestingClubName,
          season: seasonName,
          status: 'PENDING',
          submittedAt: timestamp(),
          engagementId: engagement.id,
          source: 'FREE_AGENT_ENGAGEMENT',
        }
        setRosterEnrollments((prev) => [enrollment, ...prev])
        toast.success(`Roster enrollment ${id} submitted for coordinator review.`)
        return id
      },
      approveEnrollment: (id, reviewerName) => {
        const target = rosterEnrollments.find((e) => e.id === id)
        if (!target) return
        if (target.status !== 'PENDING') {
          toast.error('This enrollment has already been reviewed.')
          return
        }

        if (USE_API) {
          void approveRosterEnrollment(id)
            .then(() => {
              setRosterEnrollments((prev) =>
                prev.map((e) =>
                  e.id === id
                    ? { ...e, status: 'APPROVED', reviewedAt: timestamp(), reviewedBy: reviewerName }
                    : e,
                ),
              )
              commitPlayerToClub(target.playerId, target.clubId, target.club)
              recordRosterAddition(target.clubId)
              toast.success(`${target.playerName} enrolled on ${target.club} roster.`)
              void refreshEnrollments()
              void refresh()
            })
            .catch(() => toast.error('Failed to approve enrollment.'))
          return
        }

        setRosterEnrollments((prev) =>
          prev.map((e) =>
            e.id === id
              ? { ...e, status: 'APPROVED', reviewedAt: timestamp(), reviewedBy: reviewerName }
              : e,
          ),
        )
        commitPlayerToClub(target.playerId, target.clubId, target.club)
        recordRosterAddition(target.clubId)
        toast.success(`${target.playerName} enrolled on ${target.club} roster.`)
      },
      rejectEnrollment: (id, reviewerName, reason) => {
        const target = rosterEnrollments.find((e) => e.id === id)
        if (!target) return
        if (target.status !== 'PENDING') {
          toast.error('This enrollment has already been reviewed.')
          return
        }
        if (!reason.trim()) {
          toast.error('A rejection reason is required.')
          return
        }

        if (USE_API) {
          void rejectRosterEnrollment(id, reason.trim())
            .then(() => {
              setRosterEnrollments((prev) =>
                prev.map((e) =>
                  e.id === id
                    ? {
                        ...e,
                        status: 'REJECTED',
                        rejectionReason: reason,
                        reviewedAt: timestamp(),
                        reviewedBy: reviewerName,
                      }
                    : e,
                ),
              )
              toast.message('Roster enrollment rejected.')
              void refreshEnrollments()
            })
            .catch(() => toast.error('Failed to reject enrollment.'))
          return
        }

        setRosterEnrollments((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: 'REJECTED',
                  rejectionReason: reason,
                  reviewedAt: timestamp(),
                  reviewedBy: reviewerName,
                }
              : e,
          ),
        )
        toast.message('Roster enrollment rejected.')
      },
    }),
    [rosterEnrollments, accessToken, recordRosterAddition, commitPlayerToClub, refreshEnrollments, refresh],
  )

  return <RosterEnrollmentContext.Provider value={value}>{children}</RosterEnrollmentContext.Provider>
}

export function useRosterEnrollments() {
  const context = useContext(RosterEnrollmentContext)
  if (!context) throw new Error('useRosterEnrollments must be used within RosterEnrollmentProvider')
  return context
}
