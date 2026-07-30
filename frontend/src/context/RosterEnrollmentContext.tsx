import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { useOnboarding } from '@/context/OnboardingContext'
import { usePlayerListings } from '@/context/PlayerListingsContext'
import { rosterEnrollments as initialEnrollments } from '@/data/mockData'
import type { EngagementRequest, RosterEnrollmentRecord } from '@/types'

interface RosterEnrollmentContextValue {
  rosterEnrollments: RosterEnrollmentRecord[]
  createFromFreeAgentEngagement: (engagement: EngagementRequest, seasonName: string) => string
  approveEnrollment: (id: string, reviewerName: string) => void
  rejectEnrollment: (id: string, reviewerName: string, reason: string) => void
}

const RosterEnrollmentContext = createContext<RosterEnrollmentContextValue | null>(null)

export function RosterEnrollmentProvider({ children }: { children: ReactNode }) {
  const { recordRosterAddition } = useOnboarding()
  const { commitPlayerToClub } = usePlayerListings()
  const [rosterEnrollments, setRosterEnrollments] = useState<RosterEnrollmentRecord[]>(initialEnrollments)

  const value = useMemo<RosterEnrollmentContextValue>(
    () => ({
      rosterEnrollments,
      createFromFreeAgentEngagement: (engagement, seasonName) => {
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

        const id = `RE-${Date.now()}`
        const enrollment: RosterEnrollmentRecord = {
          id,
          playerId: engagement.playerId,
          playerName: engagement.playerName,
          clubId: engagement.requestingClubId,
          club: engagement.requestingClubName,
          season: seasonName,
          status: 'PENDING',
          submittedAt: new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
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

        setRosterEnrollments((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: 'APPROVED',
                  reviewedAt: new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                  reviewedBy: reviewerName,
                }
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

        setRosterEnrollments((prev) =>
          prev.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: 'REJECTED',
                  rejectionReason: reason,
                  reviewedAt: new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                  reviewedBy: reviewerName,
                }
              : e,
          ),
        )
        toast.message('Roster enrollment rejected.')
      },
    }),
    [rosterEnrollments, recordRosterAddition, commitPlayerToClub],
  )

  return <RosterEnrollmentContext.Provider value={value}>{children}</RosterEnrollmentContext.Provider>
}

export function useRosterEnrollments() {
  const context = useContext(RosterEnrollmentContext)
  if (!context) throw new Error('useRosterEnrollments must be used within RosterEnrollmentProvider')
  return context
}
