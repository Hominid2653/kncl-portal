import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  approveTransfer,
  createTransfer,
  listTransfers,
  rejectTransfer,
} from '@/api/resources'
import { submitPlayerTransferRequest as apiSubmitPlayerTransferRequest } from '@/api/transfers'
import { useAuth } from '@/context/AuthContext'
import { usePortalData } from '@/context/PortalDataContext'
import { transfers as initialTransfers } from '@/data/mockData'
import { canPlayerSubmitTransferRequest } from '@/lib/business-rules'
import { mapTransfer } from '@/lib/api-mappers'
import { USE_API, hasApiSession } from '@/lib/api-config'
import { queryKeys } from '@/lib/query-keys'
import { STALE_PORTAL_MS } from '@/lib/query-client'
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
  loading: boolean
  refreshTransfers: () => Promise<void>
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

function mapTransferList(
  items: NonNullable<Awaited<ReturnType<typeof listTransfers>>>['items'],
  clubs: ReturnType<typeof usePortalData>['clubs'],
  players: ReturnType<typeof usePortalData>['players'],
) {
  const clubMap = new Map(clubs.map((c) => [c.id, { id: c.id, name: c.name, league_id: c.leagueId, county: c.county }]))
  const playerMap = new Map(
    players.map((p) => [
      p.id,
      {
        id: p.id,
        user_profile_id: '',
        federation_id: p.federationId,
        classical_rating: p.fideRating,
        lichess_username: p.lichessUsername,
        chesscom_username: p.chesscomUsername,
        lichess_verified: p.lichessVerified,
        chesscom_verified: p.chesscomVerified,
        nationality: p.nationality,
      },
    ]),
  )
  const profileMap = new Map<string, { id: string; first_name: string; last_name: string; role: string; auth_user_id: string }>()
  players.forEach((p) => {
    const [first, ...rest] = p.name.split(' ')
    profileMap.set(p.id, { id: p.id, first_name: first, last_name: rest.join(' '), role: 'PLAYER', auth_user_id: p.id })
  })
  return items.map((t) => mapTransfer(t, playerMap, profileMap, clubMap))
}

export function TransferProvider({ children }: { children: ReactNode }) {
  const { accessToken, loading: authLoading } = useAuth()
  const { clubs, players, refresh, loading: portalLoading } = usePortalData()
  const queryClient = useQueryClient()
  const [mockTransfers, setMockTransfers] = useState<TransferRecord[]>(initialTransfers)

  const transfersQuery = useQuery({
    queryKey: queryKeys.transfers,
    queryFn: async () => {
      const response = await listTransfers()
      if (!response?.items) return []
      return mapTransferList(response.items, clubs, players)
    },
    enabled: USE_API && !authLoading && !portalLoading && hasApiSession(),
    staleTime: STALE_PORTAL_MS,
    placeholderData: (previous) => previous,
  })

  const transfers = USE_API ? (transfersQuery.data ?? []) : mockTransfers
  const loading = USE_API && transfersQuery.isPending && !transfersQuery.data

  const refreshTransfers = useCallback(async () => {
    if (!USE_API) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.transfers })
  }, [queryClient])

  const value = useMemo<TransferContextValue>(
    () => ({
      transfers,
      loading,
      refreshTransfers,
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

        if (USE_API) {
          void createTransfer({
            from_club_id: engagement.playerCurrentClubId!,
            to_club_id: engagement.requestingClubId,
            reason: `Initiated from engagement ${engagement.id}`,
            source: 'ENGAGEMENT',
            player_id: engagement.playerId,
            engagement_id: engagement.id,
          })
            .then(() => {
              toast.success('Transfer request created from accepted engagement.')
              void refreshTransfers()
              void refresh()
            })
            .catch(() => toast.error('Failed to create transfer from engagement.'))
          return 'pending'
        }

        const id = `T-${Date.now()}`
        const transfer: TransferRecord = {
          id,
          playerId: engagement.playerId,
          playerName: engagement.playerName,
          fromClubId: engagement.playerCurrentClubId ?? '',
          fromClub: engagement.playerCurrentClubName ?? 'Unknown',
          toClubId: engagement.requestingClubId,
          toClub: engagement.requestingClubName,
          status: 'PENDING',
          submittedAt: timestamp(),
          reason: `Initiated from engagement ${engagement.id}`,
          engagementId: engagement.id,
          source: 'ENGAGEMENT',
        }
        setMockTransfers((prev) => [transfer, ...prev])
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

        if (USE_API) {
          if (!hasApiSession()) {
            toast.error('You must be signed in to submit a transfer request.')
            return ''
          }
          void apiSubmitPlayerTransferRequest(
            { from_club_id: fromClubId, to_club_id: toClubId, reason: reason.trim() },
            accessToken ?? '',
          )
            .then(() => {
              toast.success('Transfer request submitted.')
              void refreshTransfers()
            })
            .catch(() => toast.error('Failed to submit transfer request.'))
          return 'pending'
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
        setMockTransfers((prev) => [transfer, ...prev])
        toast.success(`Transfer request ${id} submitted.`)
        return id
      },
      submitManualTransfer: ({ playerName, fromClub, toClub, reason }) => {
        const id = `T-${Date.now()}`
        const transfer: TransferRecord = {
          id,
          playerName,
          fromClubId: '',
          fromClub,
          toClubId: '',
          toClub,
          status: 'PENDING',
          submittedAt: timestamp(),
          reason: reason?.trim() || 'Coordinator manual entry',
          source: 'COORDINATOR_MANUAL',
        }
        setMockTransfers((prev) => [transfer, ...prev])
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

        if (USE_API) {
          const action = status === 'APPROVED' ? approveTransfer : rejectTransfer
          void action(id)
            .then(() => {
              toast.success(`Transfer ${id} ${status.toLowerCase()} by ${reviewerName}.`)
              void refreshTransfers()
              void refresh()
            })
            .catch(() => toast.error('Failed to review transfer.'))
          return
        }

        setMockTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
        toast.success(`Transfer ${id} ${status.toLowerCase()} by ${reviewerName}.`)
      },
      getTransfersForPlayer: (playerId) => transfers.filter((t) => t.playerId === playerId),
      getPendingTransferForPlayer: (playerId) => transfers.find((t) => t.playerId === playerId && t.status === 'PENDING'),
    }),
    [transfers, loading, accessToken, refreshTransfers, refresh],
  )

  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>
}

export function useTransfers() {
  const context = useContext(TransferContext)
  if (!context) throw new Error('useTransfers must be used within TransferProvider')
  return context
}
