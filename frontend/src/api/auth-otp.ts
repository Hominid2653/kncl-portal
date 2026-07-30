/**
 * Auth OTP API — POST /auth/otp/request and /auth/otp/verify
 */

import { apiRequest } from '@/api/client'
import { USE_API } from '@/lib/api-config'
import {
  consumeVerificationToken,
  requestOtp,
  validateVerificationToken,
  verifyOtp,
  type OtpPurpose,
  type RequestOtpResult,
  type VerifyOtpResult,
} from '@/lib/otp-mock'

export type { OtpPurpose, RequestOtpResult, VerifyOtpResult }

/** POST /auth/otp/request */
export async function postOtpRequest(email: string, purpose: OtpPurpose): Promise<RequestOtpResult> {
  if (USE_API) {
    await apiRequest('/auth/otp/request', {
      method: 'POST',
      body: { email, purpose },
      public: true,
    })
    return { success: true }
  }

  await delay(300)
  return requestOtp(email, purpose)
}

/** POST /auth/otp/verify */
export async function postOtpVerify(
  email: string,
  code: string,
  purpose: OtpPurpose,
): Promise<VerifyOtpResult> {
  if (USE_API) {
    const result = await apiRequest<{ email_verification_token: string; expires_in: number }>(
      '/auth/otp/verify',
      {
        method: 'POST',
        body: { email, code, purpose },
        public: true,
      },
    )
    return {
      success: true,
      emailVerificationToken: result.email_verification_token,
      expiresIn: result.expires_in,
    }
  }

  await delay(300)
  return verifyOtp(email, code, purpose)
}

export function isEmailVerificationTokenValid(
  email: string,
  token: string,
  purpose: OtpPurpose,
): boolean {
  if (USE_API) {
    return Boolean(token?.trim())
  }
  return validateVerificationToken(email, token, purpose)
}

export function consumeEmailVerificationToken(
  email: string,
  token: string,
  purpose: OtpPurpose,
): boolean {
  if (USE_API) {
    return Boolean(token?.trim())
  }
  return consumeVerificationToken(email, token, purpose)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
