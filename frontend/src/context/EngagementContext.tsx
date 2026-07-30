import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { createEngagement, listEngagements, respondEngagement } from '@/api/engagements'
import { useAuth } from '@/context/AuthContext'
import { usePortalData } from '@/context/PortalDataContext'
import { useOnboarding } from '@/context/OnboardingContext'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import { useRosterEnrollments } from '@/context/RosterEnrollmentContext'
import { useSeason } from '@/context/SeasonContext'
import { useTransfers } from '@/context/TransferContext'
import { initialEngagements } from '@/data/mockPlayerListings'
import { mapEngagement } from '@/lib/api-mappers'
import { apiSeed, USE_API, hasApiSession } from '@/lib/api-config'
import { canInitiateRosterEnrollment, canInitiateTransfer } from '@/lib/business-rules'
import { getClubLeagueId } from '@/lib/coordinator'
import type { EngagementRequest, MockUser, PlayerListingRecord } from '@/types'

interface CreateEngagementInput {
  player: PlayerListingRecord
  captain: MockUser
  message: string
}

interface EngagementContextValue {
  engagements: EngagementRequest[]
  refreshEngagements: () => Promise<void>
  createEngagement: (input: CreateEngagementInput) => void
  respondToEngagement: (id: string, status: 'ACCEPTED' | 'DECLINED') => void
  initiateMovementFromEngagement: (id: string, captain: MockUser) => void
  getPlayerEngagements: (playerId: string) => EngagementRequest[]
  getPlayerCcEngagements: (playerId: string) => EngagementRequest[]
  getClubEngagements: (clubId: string) => EngagementRequest[]
  getOutgoingEngagements: (clubId: string) => EngagementRequest[]
}

const EngagementContext = createContext<EngagementContextValue | null>(null)

function timestamp() {
  return new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function EngagementProvider({ children }: { children: ReactNode }) {
  const { accessToken, loading: authLoading } = useAuth()
  const { clubs, players, userProfiles } = usePortalData()
  const { createFromEngagement } = useTransfers()
  const { createFromFreeAgentEngagement } = useRosterEnrollments()
  const { isClubInInitialRosterPeriod } = useOnboarding()
  const { isTransferWindowOpen, isRosterEnrollmentOpen, getSeasonForLeague } = useSeason()
  const { listings } = usePlayerListings()
  const [engagements, setEngagements] = useState<EngagementRequest[]>(() => apiSeed(initialEngagements, []))

  const refreshEngagements = useCallback(async () => {
    if (!USE_API) return
    const response = await listEngagements()
    if (!response?.items) return

    const clubMap = new Map(clubs.map((c) => [c.id, { name: c.name }]))
    const playerMap = new Map(players.map((p) => [p.id, { name: p.name, clubId: p.clubId, club: p.club }]))
    const profileMap = new Map(
      userProfiles.map((p) => [
        p.id,
        { id: p.id, first_name: p.name.split(' ')[0] ?? '', last_name: p.name.split(' ').slice(1).join(' '), role: p.role, auth_user_id: p.id },
      ]),
    )
    const listingMap = new Map(
      listings.map((p) => [p.id, { name: p.name, club: p.club, clubId: p.clubId }]),
    )

    setEngagements(response.items.map((e) => mapEngagement(e, clubMap, profileMap, playerMap, listingMap)))
  }, [clubs, players, userProfiles, listings])

  useEffect(() => {
    if (USE_API && !authLoading && hasApiSession()) {
      void refreshEngagements()
    }
  }, [accessToken, authLoading, refreshEngagements])

  const value = useMemo<EngagementContextValue>(
    () => ({
      engagements,
      refreshEngagements,
      createEngagement: ({ player, captain, message }) => {
        if (captain.role !== 'CLUB_ADMIN' || !captain.clubId || !captain.clubName) {
          toast.error('Only club captains can express interest in players.')
          return
        }

        if (!listings.some((p) => p.id === player.id)) {
          toast.error('This player is not available in the public listings.')
          return
        }

        if (captain.clubId === player.clubId) {
          toast.error('You cannot express interest in a player already on your roster.')
          return
        }

        const duplicate = engagements.some(
          (e) =>
            e.requestingClubId === captain.clubId &&
            e.playerId === player.id &&
            e.status === 'PENDING',
        )
        if (duplicate) {
          toast.error('You already have a pending engagement for this player.')
          return
        }

        if (USE_API) {
          void createEngagement({ player_id: player.id, message })
            .then(() => {
              if (player.commitmentStatus === 'FREE_AGENT') {
                toast.success(`Interest sent to ${player.name}. They will see it in their player portal.`)
              } else {
                toast.success(`Interest sent to ${player.club} captain. ${player.name} is CC'd for personal terms.`)
              }
              void refreshEngagements()
            })
            .catch(() => toast.error('Failed to send engagement request.'))
          return
        }

        const isFreeAgent = player.commitmentStatus === 'FREE_AGENT'
        const recipientClubId = isFreeAgent ? undefined : player.clubId

        const request: EngagementRequest = {
          id: `E-${Date.now()}`,
          playerId: player.id,
          playerName: player.name,
          playerCommitmentStatus: player.commitmentStatus,
          playerCurrentClubId: player.clubId,
          playerCurrentClubName: player.club,
          requestingClubId: captain.clubId,
          requestingClubName: captain.clubName,
          requestingCaptainId: captain.id,
          requestingCaptainName: `${captain.firstName} ${captain.lastName}`,
          recipientType: isFreeAgent ? 'PLAYER' : 'CLUB_CAPTAIN',
          recipientClubId,
          playerCc: !isFreeAgent,
          message,
          status: 'PENDING',
          createdAt: timestamp(),
        }

        setEngagements((prev) => [request, ...prev])

        if (isFreeAgent) {
          toast.success(`Interest sent to ${player.name}. They will see it in their player portal.`)
        } else {
          toast.success(`Interest sent to ${player.club} captain. ${player.name} is CC'd for personal terms.`)
        }
      },
      respondToEngagement: (id, status) => {
        const target = engagements.find((e) => e.id === id)
        if (!target) return
        if (target.status !== 'PENDING') {
          toast.error('This engagement has already been responded to.')
          return
        }

        if (USE_API) {
          void respondEngagement(id, status)
            .then(() => {
              setEngagements((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
              toast.success(
                status === 'ACCEPTED'
                  ? 'Engagement accepted. Requesting captain can initiate the next step when the window allows.'
                  : 'Engagement declined.',
              )
              void refreshEngagements()
            })
            .catch(() => toast.error('Failed to respond to engagement.'))
          return
        }

        setEngagements((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
        toast.success(
          status === 'ACCEPTED'
            ? 'Engagement accepted. Requesting captain can initiate the next step when the window allows.'
            : 'Engagement declined.',
        )
      },
      initiateMovementFromEngagement: (id, captain) => {
        const engagement = engagements.find((e) => e.id === id)
        if (!engagement) return
        if (engagement.status !== 'ACCEPTED') {
          toast.error('Movement can only be initiated from accepted engagements.')
          return
        }
        if (engagement.requestingCaptainId !== captain.id) {
          toast.error('Only the requesting captain can initiate the next step.')
          return
        }

        const club = clubs.find((c) => c.id === captain.clubId)
        const leagueId = club?.leagueId ?? getClubLeagueId(captain.clubId)
        const season = getSeasonForLeague(leagueId)
        const inInitialPeriod = captain.clubId ? isClubInInitialRosterPeriod(captain.clubId) : false
        const transfersOpen = isTransferWindowOpen(leagueId)
        const rosterEnrollmentOpen = isRosterEnrollmentOpen(leagueId)

        if (engagement.playerCommitmentStatus === 'FREE_AGENT') {
          if (engagement.rosterEnrollmentInitiated) {
            toast.info(`Roster enrollment already initiated (${engagement.rosterEnrollmentId}).`)
            return
          }
          if (!canInitiateRosterEnrollment(transfersOpen, rosterEnrollmentOpen, inInitialPeriod)) {
            toast.error('Roster enrollment is closed. Wait for the roster enrollment or transfer window.')
            return
          }
          const enrollmentId = createFromFreeAgentEngagement(
            engagement,
            season?.id ?? '',
            season?.name ?? 'Current season',
          )
          if (!enrollmentId) return
          setEngagements((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, rosterEnrollmentInitiated: true, rosterEnrollmentId: enrollmentId } : item,
            ),
          )
          return
        }

        if (engagement.transferInitiated) {
          toast.info(`Transfer already initiated (${engagement.transferId}).`)
          return
        }
        if (!canInitiateTransfer(transfersOpen)) {
          toast.error('Transfer window is closed for your league.')
          return
        }
        const transferId = createFromEngagement(engagement)
        if (!transferId) return
        setEngagements((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, transferInitiated: true, transferId } : item,
          ),
        )
      },
      getPlayerEngagements: (playerId) =>
        engagements.filter((e) => e.recipientType === 'PLAYER' && e.playerId === playerId),
      getPlayerCcEngagements: (playerId) =>
        engagements.filter((e) => e.playerCc && e.playerId === playerId),
      getClubEngagements: (clubId) =>
        engagements.filter(
          (e) =>
            e.recipientType === 'CLUB_CAPTAIN' &&
            e.recipientClubId === clubId &&
            e.playerCurrentClubId === clubId,
        ),
      getOutgoingEngagements: (clubId) =>
        engagements.filter((e) => e.requestingClubId === clubId),
    }),
    [
      engagements,
      listings,
      clubs,
      createFromEngagement,
      createFromFreeAgentEngagement,
      isClubInInitialRosterPeriod,
      isTransferWindowOpen,
      isRosterEnrollmentOpen,
      getSeasonForLeague,
      refreshEngagements,
    ],
  )

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>
}

export function useEngagements() {
  const context = useContext(EngagementContext)
  if (!context) throw new Error('useEngagements must be used within EngagementProvider')
  return context
}
