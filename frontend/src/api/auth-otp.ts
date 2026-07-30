/**
 * Auth OTP API — mirrors backend Part 4 endpoints.
 * Phase 8: replace implementations with fetch calls to FastAPI.
 */

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
  await delay(300)
  return requestOtp(email, purpose)
}

/** POST /auth/otp/verify */
export async function postOtpVerify(
  email: string,
  code: string,
  purpose: OtpPurpose,
): Promise<VerifyOtpResult> {
  await delay(300)
  return verifyOtp(email, code, purpose)
}

export function isEmailVerificationTokenValid(
  email: string,
  token: string,
  purpose: OtpPurpose,
): boolean {
  return validateVerificationToken(email, token, purpose)
}

export function consumeEmailVerificationToken(
  email: string,
  token: string,
  purpose: OtpPurpose,
): boolean {
  return consumeVerificationToken(email, token, purpose)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
