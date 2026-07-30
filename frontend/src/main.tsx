import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from '@/context/AuthContext'
import { EngagementProvider } from '@/context/EngagementContext'
import { TransferProvider } from '@/context/TransferContext'
import { OnboardingProvider } from '@/context/OnboardingContext'
import { PlayerListingsProvider } from '@/context/PlayerListingsContext'
import { SeasonProvider } from '@/context/SeasonContext'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import router from '@/routes/index'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SeasonProvider>
        <PlayerListingsProvider>
          <OnboardingProvider>
            <TransferProvider>
              <EngagementProvider>
              <TooltipProvider>
                <RouterProvider router={router} />
                <Toaster position="top-right" richColors closeButton />
              </TooltipProvider>
              </EngagementProvider>
            </TransferProvider>
          </OnboardingProvider>
        </PlayerListingsProvider>
      </SeasonProvider>
    </AuthProvider>
  </StrictMode>,
)
