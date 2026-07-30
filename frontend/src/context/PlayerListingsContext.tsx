import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { playerListings as initialListings } from '@/data/mockPlayerListings'
import type { HeadshotModerationRequest, PlayerListingRecord, PlayerRegistrationApplication } from '@/types'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function defaultHeadshotUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d3b66&color=fff&size=256`
}

interface ReviewHeadshotInput {
  id: string
  status: 'APPROVED' | 'REJECTED'
  reviewerName: string
  rejectionReason?: string
}

interface PlayerListingsContextValue {
  listings: PlayerListingRecord[]
  freeAgents: PlayerListingRecord[]
  committed: PlayerListingRecord[]
  headshotModerations: HeadshotModerationRequest[]
  pendingHeadshotCount: number
  submitHeadshotForReview: (playerId: string, playerName: string, leagueId: string, proposedUrl: string) => void
  reviewHeadshot: (input: ReviewHeadshotInput) => void
  getPendingHeadshotForPlayer: (playerId: string) => HeadshotModerationRequest | undefined
  addFreeAgentFromApplication: (application: PlayerRegistrationApplication, federationId: string) => string
  getHeadshotUrl: (player: Pick<PlayerListingRecord, 'id' | 'name' | 'headshotUrl'>) => string
}

const PlayerListingsContext = createContext<PlayerListingsContextValue | null>(null)

export function PlayerListingsProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<PlayerListingRecord[]>(
    initialListings.map((p) => ({
      ...p,
      headshotUrl: p.headshotUrl ?? defaultHeadshotUrl(p.name),
    })),
  )
  const [headshotModerations, setHeadshotModerations] = useState<HeadshotModerationRequest[]>([])

  const getHeadshotUrl = useCallback(
    (player: Pick<PlayerListingRecord, 'id' | 'name' | 'headshotUrl'>) =>
      player.headshotUrl ?? defaultHeadshotUrl(player.name),
    [],
  )

  const value = useMemo<PlayerListingsContextValue>(
    () => ({
      listings,
      freeAgents: listings.filter((p) => p.commitmentStatus === 'FREE_AGENT'),
      committed: listings.filter((p) => p.commitmentStatus === 'COMMITTED'),
      headshotModerations,
      pendingHeadshotCount: headshotModerations.filter((h) => h.status === 'PENDING').length,
      getPendingHeadshotForPlayer: (playerId) =>
        headshotModerations.find((h) => h.playerId === playerId && h.status === 'PENDING'),
      submitHeadshotForReview: (playerId, playerName, leagueId, proposedUrl) => {
        const request: HeadshotModerationRequest = {
          id: `HS-${Date.now()}`,
          playerId,
          playerName,
          leagueId,
          proposedUrl,
          status: 'PENDING',
          submittedAt: new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        }
        setHeadshotModerations((prev) => [request, ...prev.filter((h) => !(h.playerId === playerId && h.status === 'PENDING'))])
        toast.success('Headshot submitted for coordinator review.')
      },
      reviewHeadshot: ({ id, status, reviewerName, rejectionReason }) => {
        if (status === 'REJECTED' && !rejectionReason?.trim()) {
          toast.error('A rejection message is required.')
          return
        }
        const target = headshotModerations.find((h) => h.id === id)
        if (!target) return

        setHeadshotModerations((prev) =>
          prev.map((h) =>
            h.id === id
              ? {
                  ...h,
                  status,
                  rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
                  reviewedAt: new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                  reviewedBy: reviewerName,
                }
              : h,
          ),
        )

        if (status === 'APPROVED') {
          setListings((prev) =>
            prev.map((p) => (p.id === target.playerId ? { ...p, headshotUrl: target.proposedUrl } : p)),
          )
          toast.success('Headshot approved and published to listings.')
        } else {
          toast.message('Headshot rejected. Player will see your message.')
        }
      },
      addFreeAgentFromApplication: (application, federationId) => {
        const name = `${application.firstName} ${application.lastName}`
        const playerId = `44444444-4444-4444-8444-${Date.now().toString().slice(-12)}`
        const newPlayer: PlayerListingRecord = {
          id: playerId,
          federationId,
          name,
          commitmentStatus: 'FREE_AGENT',
          county: application.county,
          nationality: application.nationality,
          lichessVerified: false,
          chesscomVerified: false,
          lastActive: new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }),
          headshotUrl: defaultHeadshotUrl(name),
        }
        setListings((prev) => [newPlayer, ...prev])
        return playerId
      },
      getHeadshotUrl,
    }),
    [listings, headshotModerations, getHeadshotUrl],
  )

  return <PlayerListingsContext.Provider value={value}>{children}</PlayerListingsContext.Provider>
}

export function usePlayerListings() {
  const context = useContext(PlayerListingsContext)
  if (!context) throw new Error('usePlayerListings must be used within PlayerListingsProvider')
  return context
}

export { initials }
