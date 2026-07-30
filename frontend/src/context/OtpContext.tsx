import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  consumeEmailVerificationToken,
  isEmailVerificationTokenValid,
  postOtpRequest,
  postOtpVerify,
  type OtpPurpose,
  type RequestOtpResult,
  type VerifyOtpResult,
} from '@/api/auth-otp'

interface OtpContextValue {
  requestOtp: (email: string, purpose: OtpPurpose) => Promise<RequestOtpResult>
  verifyOtp: (email: string, code: string, purpose: OtpPurpose) => Promise<VerifyOtpResult>
  isTokenValid: (email: string, token: string, purpose: OtpPurpose) => boolean
  consumeToken: (email: string, token: string, purpose: OtpPurpose) => boolean
}

const OtpContext = createContext<OtpContextValue | null>(null)

export function OtpProvider({ children }: { children: ReactNode }) {
  const value = useMemo<OtpContextValue>(
    () => ({
      requestOtp: postOtpRequest,
      verifyOtp: postOtpVerify,
      isTokenValid: isEmailVerificationTokenValid,
      consumeToken: consumeEmailVerificationToken,
    }),
    [],
  )

  return <OtpContext.Provider value={value}>{children}</OtpContext.Provider>
}

export function useOtp() {
  const context = useContext(OtpContext)
  if (!context) throw new Error('useOtp must be used within OtpProvider')
  return context
}
