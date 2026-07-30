import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { toast } from 'sonner'



import { listPlayerListings } from '@/api/engagements'

import {

  listPlayersPendingHeadshots,

  moderatePlayerHeadshot,

  updatePlayerHeadshot,

  uploadPlayerHeadshot,

} from '@/api/players'

import { playerListings as initialListings } from '@/data/mockPlayerListings'

import { useAuth } from '@/context/AuthContext'

import { apiSeed, USE_API } from '@/lib/api-config'

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



function formatDate(value?: string | null) {

  if (!value) return new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  try {

    return new Date(value).toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  } catch {

    return value

  }

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

  refreshListings: () => Promise<void>

  submitHeadshotForReview: (playerId: string, playerName: string, leagueId: string, proposedUrl: string) => void

  submitHeadshotFile: (playerId: string, playerName: string, leagueId: string, file: File) => Promise<void>

  reviewHeadshot: (input: ReviewHeadshotInput) => void

  getPendingHeadshotForPlayer: (playerId: string) => HeadshotModerationRequest | undefined

  addFreeAgentFromApplication: (application: PlayerRegistrationApplication, federationId: string) => string

  commitPlayerToClub: (playerId: string, clubId: string, clubName: string) => void

  isPlayerListed: (playerId: string) => boolean

  getHeadshotUrl: (player: Pick<PlayerListingRecord, 'id' | 'name' | 'headshotUrl'>) => string

}



const PlayerListingsContext = createContext<PlayerListingsContextValue | null>(null)



export function PlayerListingsProvider({ children }: { children: ReactNode }) {

  const { loading: authLoading } = useAuth()

  const [listings, setListings] = useState<PlayerListingRecord[]>(() =>
    apiSeed(
      initialListings.map((p) => ({
        ...p,
        headshotUrl: p.headshotUrl ?? defaultHeadshotUrl(p.name),
      })),
      [],
    ),
  )

  const [headshotModerations, setHeadshotModerations] = useState<HeadshotModerationRequest[]>([])



  const refreshListings = useCallback(async () => {

    if (!USE_API || authLoading) return

    const [listingsRes, pendingRes] = await Promise.all([

      listPlayerListings(),

      listPlayersPendingHeadshots().catch(() => null),

    ])



    if (listingsRes?.items?.length) {

      setListings(

        listingsRes.items.map((item) => ({

          id: item.id,

          federationId: item.federation_id ?? '',

          name: item.name,

          commitmentStatus: item.commitment_status,

          club: item.club?.name,

          clubId: item.club?.id,

          county: item.county ?? '',

          fideRating: item.fide_rating ?? undefined,

          lichessUsername: item.lichess_username ?? undefined,

          chesscomUsername: item.chesscom_username ?? undefined,

          lichessVerified: item.lichess_verified ?? false,

          chesscomVerified: item.chesscom_verified ?? false,

          nationality: item.nationality ?? '',

          lastActive: item.last_active ?? new Date().toISOString(),

          headshotUrl: item.headshot_url ?? defaultHeadshotUrl(item.name),

        })),

      )

    }



    if (pendingRes?.items) {
      setHeadshotModerations(
        pendingRes.items.map((item) => ({
          id: item.player_id,
          playerId: item.player_id,
          playerName: item.player_name,
          leagueId: item.league_id ?? '',
          proposedUrl: item.headshot_url ?? defaultHeadshotUrl(item.player_name),
          status: 'PENDING' as const,
          submittedAt: formatDate(item.headshot_updated_at),
        })),
      )
    } else if (pendingRes) {
      setHeadshotModerations([])
    }

  }, [authLoading])



  useEffect(() => {

    void refreshListings()

  }, [refreshListings])



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

      refreshListings,

      getPendingHeadshotForPlayer: (playerId) =>

        headshotModerations.find((h) => h.playerId === playerId && h.status === 'PENDING'),

      submitHeadshotForReview: (playerId, playerName, leagueId, proposedUrl) => {

        if (USE_API) {

          void updatePlayerHeadshot(playerId, { headshot_url: proposedUrl, headshot_source: 'URL' })

            .then((result) => {

              const displayUrl = result?.headshot_url ?? proposedUrl

              const request: HeadshotModerationRequest = {

                id: playerId,

                playerId,

                playerName,

                leagueId,

                proposedUrl: displayUrl,

                status: 'PENDING',

                submittedAt: formatDate(),

              }

              setHeadshotModerations((prev) => [

                request,

                ...prev.filter((h) => !(h.playerId === playerId && h.status === 'PENDING')),

              ])

              toast.success('Headshot submitted for coordinator review.')

              void refreshListings()

            })

            .catch(() => toast.error('Failed to submit headshot.'))

          return

        }



        const request: HeadshotModerationRequest = {

          id: `HS-${Date.now()}`,

          playerId,

          playerName,

          leagueId,

          proposedUrl,

          status: 'PENDING',

          submittedAt: formatDate(),

        }

        setHeadshotModerations((prev) => [

          request,

          ...prev.filter((h) => !(h.playerId === playerId && h.status === 'PENDING')),

        ])

        toast.success('Headshot submitted for coordinator review.')

      },

      submitHeadshotFile: async (playerId, playerName, leagueId, file) => {

        if (USE_API) {

          const result = await uploadPlayerHeadshot(playerId, file)

          const displayUrl = result?.headshot_url ?? ''

          const request: HeadshotModerationRequest = {

            id: playerId,

            playerId,

            playerName,

            leagueId,

            proposedUrl: displayUrl,

            status: 'PENDING',

            submittedAt: formatDate(),

          }

          setHeadshotModerations((prev) => [

            request,

            ...prev.filter((h) => !(h.playerId === playerId && h.status === 'PENDING')),

          ])

          toast.success('Headshot uploaded and submitted for coordinator review.')

          void refreshListings()

          return

        }



        const request: HeadshotModerationRequest = {

          id: `HS-${Date.now()}`,

          playerId,

          playerName,

          leagueId,

          proposedUrl: defaultHeadshotUrl(playerName),

          status: 'PENDING',

          submittedAt: formatDate(),

        }

        setHeadshotModerations((prev) => [

          request,

          ...prev.filter((h) => !(h.playerId === playerId && h.status === 'PENDING')),

        ])

        toast.success('Headshot submitted for coordinator review.')

      },

      reviewHeadshot: ({ id, status, reviewerName, rejectionReason }) => {

        if (status === 'REJECTED' && !rejectionReason?.trim()) {

          toast.error('A rejection message is required.')

          return

        }

        const target = headshotModerations.find((h) => h.id === id)

        if (!target) return



        const applyLocal = () => {

          setHeadshotModerations((prev) =>

            prev.map((h) =>

              h.id === id

                ? {

                    ...h,

                    status,

                    rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,

                    reviewedAt: formatDate(),

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

        }



        if (USE_API) {

          void moderatePlayerHeadshot(target.playerId, status)

            .then(() => {

              applyLocal()

              void refreshListings()

            })

            .catch(() => toast.error('Failed to moderate headshot.'))

          return

        }



        applyLocal()

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

          lastActive: formatDate(),

          headshotUrl: defaultHeadshotUrl(name),

        }

        setListings((prev) => [newPlayer, ...prev])

        return playerId

      },

      commitPlayerToClub: (playerId, clubId, clubName) => {

        setListings((prev) =>

          prev.map((p) =>

            p.id === playerId

              ? { ...p, commitmentStatus: 'COMMITTED', clubId, club: clubName }

              : p,

          ),

        )

      },

      isPlayerListed: (playerId) => listings.some((p) => p.id === playerId),

      getHeadshotUrl,

    }),

    [listings, headshotModerations, refreshListings, getHeadshotUrl],

  )



  return <PlayerListingsContext.Provider value={value}>{children}</PlayerListingsContext.Provider>

}



export function usePlayerListings() {

  const context = useContext(PlayerListingsContext)

  if (!context) throw new Error('usePlayerListings must be used within PlayerListingsProvider')

  return context

}



export { initials }


