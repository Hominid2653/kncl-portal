import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { canPlayerSubmitTransferRequest } from '@/lib/business-rules'
import { transfers as initialTransfers } from '@/data/mockData'
import type { EngagementRequest, MockUser, TransferRecord } from '@/types'

interface SubmitPlayerTransferInput {
  player: MockUser
  fromClubId: string
  fromClubName: string
  toClubId: string
  toClubName: string
  reason: string
  transfersOpen: boolean
}

interface SubmitManualTransferInput {
  playerName: string
  fromClub: string
  toClub: string
  reason?: string
}

interface TransferContextValue {
  transfers: TransferRecord[]
  createFromEngagement: (engagement: EngagementRequest) => string
  submitPlayerTransferRequest: (input: SubmitPlayerTransferInput) => string
  submitManualTransfer: (input: SubmitManualTransferInput) => string
  reviewTransfer: (id: string, status: 'APPROVED' | 'REJECTED', reviewerName: string) => void
  getTransfersForPlayer: (playerId: string) => TransferRecord[]
  getPendingTransferForPlayer: (playerId: string) => TransferRecord | undefined
}

const TransferContext = createContext<TransferContextValue | null>(null)

function timestamp() {
  return new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function TransferProvider({ children }: { children: ReactNode }) {
  const [transfers, setTransfers] = useState<TransferRecord[]>(initialTransfers)

  const value = useMemo<TransferContextValue>(
    () => ({
      transfers,
      createFromEngagement: (engagement) => {
        if (engagement.playerCommitmentStatus === 'FREE_AGENT') {
          toast.error('Free agents use roster enrollment, not inter-club transfer.')
          return ''
        }
        const pending = transfers.some(
          (t) =>
            t.playerId === engagement.playerId &&
            t.status === 'PENDING' &&
            t.toClubId === engagement.requestingClubId,
        )
        if (pending) {
          toast.error('A pending transfer already exists for this player and destination club.')
          return ''
        }

        const id = `T-${Date.now()}`
        const transfer: TransferRecord = {
          id,
          playerId: engagement.playerId,
          playerName: engagement.playerName,
          fromClubId: engagement.playerCurrentClubId,
          fromClub: engagement.playerCurrentClubName ?? 'Unknown',
          toClubId: engagement.requestingClubId,
          toClub: engagement.requestingClubName,
          status: 'PENDING',
          submittedAt: timestamp(),
          reason: `Initiated from engagement ${engagement.id}`,
          engagementId: engagement.id,
          source: 'ENGAGEMENT',
        }
        setTransfers((prev) => [transfer, ...prev])
        toast.success(`Transfer request ${id} created from accepted engagement.`)
        return id
      },
      submitPlayerTransferRequest: ({ player, fromClubId, fromClubName, toClubId, toClubName, reason, transfersOpen }) => {
        if (!player.playerId) {
          toast.error('Your account is not linked to a player profile.')
          return ''
        }
        if (!canPlayerSubmitTransferRequest(transfersOpen, Boolean(fromClubId))) {
          toast.error('Transfer requests require an open transfer window and current club affiliation.')
          return ''
        }
        if (fromClubId === toClubId) {
          toast.error('Destination club must differ from your current club.')
          return ''
        }
        if (!reason.trim()) {
          toast.error('Please provide a reason for your transfer request.')
          return ''
        }

        const pending = transfers.find((t) => t.playerId === player.playerId && t.status === 'PENDING')
        if (pending) {
          toast.error(`You already have a pending transfer (${pending.id}).`)
          return ''
        }

        const id = `T-${Date.now()}`
        const transfer: TransferRecord = {
          id,
          playerId: player.playerId,
          playerName: `${player.firstName} ${player.lastName}`,
          fromClubId,
          fromClub: fromClubName,
          toClubId,
          toClub: toClubName,
          status: 'PENDING',
          submittedAt: timestamp(),
          reason: reason.trim(),
          source: 'PLAYER_REQUEST',
          submittedByPlayerId: player.playerId,
        }
        setTransfers((prev) => [transfer, ...prev])
        toast.success(`Transfer request ${id} submitted. Your captain and the destination club will be notified.`)
        return id
      },
      submitManualTransfer: ({ playerName, fromClub, toClub, reason }) => {
        const id = `T-${Date.now()}`
        const transfer: TransferRecord = {
          id,
          playerName,
          fromClub,
          toClub,
          status: 'PENDING',
          submittedAt: timestamp(),
          reason: reason?.trim() || 'Coordinator manual entry',
          source: 'COORDINATOR_MANUAL',
        }
        setTransfers((prev) => [transfer, ...prev])
        toast.success(`Manual transfer ${id} submitted.`)
        return id
      },
      reviewTransfer: (id, status, reviewerName) => {
        const target = transfers.find((t) => t.id === id)
        if (!target) return
        if (target.status !== 'PENDING') {
          toast.error('This transfer has already been reviewed.')
          return
        }
        setTransfers((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status } : t)),
        )
        toast.success(`Transfer ${id} ${status.toLowerCase()} by ${reviewerName}.`)
      },
      getTransfersForPlayer: (playerId) => transfers.filter((t) => t.playerId === playerId),
      getPendingTransferForPlayer: (playerId) => transfers.find((t) => t.playerId === playerId && t.status === 'PENDING'),
    }),
    [transfers],
  )

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>
}

export function useTransfers() {
  const context = useContext(TransferContext)
  if (!context) throw new Error('useTransfers must be used within TransferProvider')
  return context
}
