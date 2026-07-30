import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { transfers as initialTransfers } from '@/data/mockData'
import type { EngagementRequest, TransferRecord } from '@/types'

interface TransferContextValue {
  transfers: TransferRecord[]
  createFromEngagement: (engagement: EngagementRequest) => string
}

const TransferContext = createContext<TransferContextValue | null>(null)

export function TransferProvider({ children }: { children: ReactNode }) {
  const [transfers, setTransfers] = useState<TransferRecord[]>(initialTransfers)

  const value = useMemo<TransferContextValue>(
    () => ({
      transfers,
      createFromEngagement: (engagement) => {
        const id = `T-${Date.now()}`
        const transfer: TransferRecord = {
          id,
          playerName: engagement.playerName,
          fromClub: engagement.playerCurrentClubName ?? 'Free agent',
          toClub: engagement.requestingClubName,
          status: 'PENDING',
          submittedAt: new Date().toLocaleString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          reason: `Initiated from engagement ${engagement.id}`,
          engagementId: engagement.id,
        }
        setTransfers((prev) => [transfer, ...prev])
        toast.success(`Transfer request ${id} created from accepted engagement.`)
        return id
      },
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
