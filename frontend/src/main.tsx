import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { RosterEnrollmentProvider } from '@/context/RosterEnrollmentContext'
import { OtpProvider } from '@/context/OtpContext'
import { AuthProvider } from '@/context/AuthContext'
import { EngagementProvider } from '@/context/EngagementContext'
import { TransferProvider } from '@/context/TransferContext'
import { OnboardingProvider } from '@/context/OnboardingContext'
import { PlayerListingsProvider } from '@/context/PlayerListingsContext'
import { PortalDataProvider } from '@/context/PortalDataContext'
import { SeasonProvider } from '@/context/SeasonContext'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { queryClient } from '@/lib/query-client'
import router from '@/routes/index'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PortalDataProvider>
          <OtpProvider>
            <SeasonProvider>
              <PlayerListingsProvider>
                <OnboardingProvider>
                  <RosterEnrollmentProvider>
                    <TransferProvider>
                      <EngagementProvider>
                        <TooltipProvider>
                          <RouterProvider router={router} />
                          <Toaster position="top-right" richColors closeButton />
                        </TooltipProvider>
                      </EngagementProvider>
                    </TransferProvider>
                  </RosterEnrollmentProvider>
                </OnboardingProvider>
              </PlayerListingsProvider>
            </SeasonProvider>
          </OtpProvider>
        </PortalDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
