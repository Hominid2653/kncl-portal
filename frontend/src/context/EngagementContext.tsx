import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { useOnboarding } from '@/context/OnboardingContext'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import { useRosterEnrollments } from '@/context/RosterEnrollmentContext'
import { useSeason } from '@/context/SeasonContext'
import { useTransfers } from '@/context/TransferContext'
import { clubs } from '@/data/mockData'
import { clubCaptainByClubId, initialEngagements } from '@/data/mockPlayerListings'
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
  createEngagement: (input: CreateEngagementInput) => void
  respondToEngagement: (id: string, status: 'ACCEPTED' | 'DECLINED') => void
  initiateMovementFromEngagement: (id: string, captain: MockUser) => void
  getPlayerEngagements: (playerId: string) => EngagementRequest[]
  getPlayerCcEngagements: (playerId: string) => EngagementRequest[]
  getClubEngagements: (clubId: string) => EngagementRequest[]
  getOutgoingEngagements: (clubId: string) => EngagementRequest[]
}

const EngagementContext = createContext<EngagementContextValue | null>(null)

export function EngagementProvider({ children }: { children: ReactNode }) {
  const { createFromEngagement } = useTransfers()
  const { createFromFreeAgentEngagement } = useRosterEnrollments()
  const { isClubInInitialRosterPeriod } = useOnboarding()
  const { isTransferWindowOpen, isRosterEnrollmentOpen, getSeasonForLeague } = useSeason()
  const { listings } = usePlayerListings()
  const [engagements, setEngagements] = useState<EngagementRequest[]>(initialEngagements)

  const value = useMemo<EngagementContextValue>(
    () => ({
      engagements,
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
          createdAt: new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        }

        setEngagements((prev) => [request, ...prev])

        if (isFreeAgent) {
          toast.success(`Interest sent to ${player.name}. They will see it in their player portal.`)
        } else {
          toast.success(`Interest sent to ${player.club} captain. ${player.name} is CC'd for personal terms.`)
        }

        void clubCaptainByClubId[recipientClubId ?? '']
      },
      respondToEngagement: (id, status) => {
        const target = engagements.find((e) => e.id === id)
        if (!target) return
        if (target.status !== 'PENDING') {
          toast.error('This engagement has already been responded to.')
          return
        }

        setEngagements((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item)),
        )
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
          const enrollmentId = createFromFreeAgentEngagement(engagement, season?.name ?? 'Current season')
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
      createFromEngagement,
      createFromFreeAgentEngagement,
      isClubInInitialRosterPeriod,
      isTransferWindowOpen,
      isRosterEnrollmentOpen,
      getSeasonForLeague,
    ],
  )

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>
}

export function useEngagements() {
  const context = useContext(EngagementContext)
  if (!context) throw new Error('useEngagements must be used within EngagementProvider')
  return context
}
