import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { useTransfers } from '@/context/TransferContext'
import { clubCaptainByClubId, initialEngagements } from '@/data/mockPlayerListings'
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
  initiateTransferFromEngagement: (id: string) => void
  getPlayerEngagements: (playerId: string) => EngagementRequest[]
  getClubEngagements: (clubId: string) => EngagementRequest[]
  getOutgoingEngagements: (clubId: string) => EngagementRequest[]
}

const EngagementContext = createContext<EngagementContextValue | null>(null)

export function EngagementProvider({ children }: { children: ReactNode }) {
  const { createFromEngagement } = useTransfers()
  const [engagements, setEngagements] = useState<EngagementRequest[]>(initialEngagements)

  const value = useMemo<EngagementContextValue>(
    () => ({
      engagements,
      createEngagement: ({ player, captain, message }) => {
        if (captain.role !== 'CLUB_ADMIN' || !captain.clubId || !captain.clubName) {
          toast.error('Only club captains can express interest in players.')
          return
        }

        const isFreeAgent = player.commitmentStatus === 'FREE_AGENT'
        const recipientClubId = isFreeAgent ? undefined : player.clubId
        const recipientCaptainId = recipientClubId ? clubCaptainByClubId[recipientClubId] : undefined

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
          message,
          status: 'PENDING',
          createdAt: new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        }

        setEngagements((prev) => [request, ...prev])

        if (isFreeAgent) {
          toast.success(`Interest sent to ${player.name}. They will see it in their player portal.`)
        } else {
          toast.success(`Interest sent to ${player.club} captain regarding ${player.name}.`)
        }

        void recipientCaptainId
      },
      respondToEngagement: (id, status) => {
        setEngagements((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item)),
        )
        toast.success(status === 'ACCEPTED' ? 'Engagement accepted. Captain can initiate transfer.' : 'Engagement declined (mock)')
      },
      initiateTransferFromEngagement: (id) => {
        const engagement = engagements.find((e) => e.id === id)
        if (!engagement) return
        if (engagement.status !== 'ACCEPTED') {
          toast.error('Transfer can only be initiated from accepted engagements.')
          return
        }
        if (engagement.transferInitiated) {
          toast.info(`Transfer already initiated (${engagement.transferId}).`)
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
    [engagements, createFromEngagement],
  )

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>
}

export function useEngagements() {
  const context = useContext(EngagementContext)
  if (!context) throw new Error('useEngagements must be used within EngagementProvider')
  return context
}
