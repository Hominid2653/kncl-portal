import type { ReactNode } from 'react'

import { AuthProvider } from '@/context/AuthContext'
import { EngagementProvider } from '@/context/EngagementContext'
import { OnboardingProvider } from '@/context/OnboardingContext'
import { OtpProvider } from '@/context/OtpContext'
import { PlayerListingsProvider } from '@/context/PlayerListingsContext'
import { PortalDataProvider } from '@/context/PortalDataContext'
import { RosterEnrollmentProvider } from '@/context/RosterEnrollmentContext'
import { SeasonProvider } from '@/context/SeasonContext'
import { TransferProvider } from '@/context/TransferContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PortalDataProvider>
        <OtpProvider>
          <SeasonProvider>
            <PlayerListingsProvider>
              <OnboardingProvider>
                <RosterEnrollmentProvider>
                  <TransferProvider>
                    <EngagementProvider>{children}</EngagementProvider>
                  </TransferProvider>
                </RosterEnrollmentProvider>
              </OnboardingProvider>
            </PlayerListingsProvider>
          </SeasonProvider>
        </OtpProvider>
      </PortalDataProvider>
    </AuthProvider>
  )
}
