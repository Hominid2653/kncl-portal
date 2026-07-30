/**
 * Mock OTP + verification token store.
 * Mirrors backend Part 4 (`POST /auth/otp/*`) until Phase 8 API wiring.
 */

export type OtpPurpose = 'APPLICATION_SUBMIT' | 'STATUS_LOOKUP'

const OTP_EXPIRY_MS = 10 * 60 * 1000
const TOKEN_EXPIRY_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 3
const REQUEST_WINDOW_MS = 15 * 60 * 1000

interface OtpRecord {
  email: string
  purpose: OtpPurpose
  code: string
  expiresAt: number
  attempts: number
}

interface VerificationTokenRecord {
  email: string
  purpose: OtpPurpose
  expiresAt: number
  used: boolean
}

const otpByKey = new Map<string, OtpRecord>()
const tokensById = new Map<string, VerificationTokenRecord>()
const requestLog = new Map<string, number[]>()

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function otpKey(email: string, purpose: OtpPurpose) {
  return `${normalizeEmail(email)}:${purpose}`
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function generateToken() {
  return `evt_${crypto.randomUUID().replace(/-/g, '')}`
}

function pruneRequestLog(email: string) {
  const key = normalizeEmail(email)
  const now = Date.now()
  const recent = (requestLog.get(key) ?? []).filter((t) => now - t < REQUEST_WINDOW_MS)
  requestLog.set(key, recent)
  return recent
}

export interface RequestOtpResult {
  success: boolean
  error?: string
  /** Shown in dev UI only — real backend sends via Resend */
  devCode?: string
  cooldownSeconds?: number
}

export interface VerifyOtpResult {
  success: boolean
  error?: string
  emailVerificationToken?: string
  expiresIn?: number
}

export function requestOtp(email: string, purpose: OtpPurpose): RequestOtpResult {
  const normalized = normalizeEmail(email)
  if (!normalized.includes('@')) {
    return { success: false, error: 'Enter a valid email address.' }
  }

  const recent = pruneRequestLog(normalized)
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return { success: false, error: 'Too many code requests. Try again in a few minutes.' }
  }

  const key = otpKey(normalized, purpose)
  const existing = otpByKey.get(key)
  if (existing && existing.expiresAt - OTP_EXPIRY_MS + RESEND_COOLDOWN_MS > Date.now()) {
    const cooldownSeconds = Math.ceil(
      (existing.expiresAt - OTP_EXPIRY_MS + RESEND_COOLDOWN_MS - Date.now()) / 1000,
    )
    return { success: false, error: 'Please wait before requesting another code.', cooldownSeconds }
  }

  const code = generateCode()
  otpByKey.set(key, {
    email: normalized,
    purpose,
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  })
  requestLog.set(normalized, [...recent, Date.now()])

  return { success: true, devCode: code }
}

export function verifyOtp(email: string, code: string, purpose: OtpPurpose): VerifyOtpResult {
  const normalized = normalizeEmail(email)
  const key = otpKey(normalized, purpose)
  const record = otpByKey.get(key)

  if (!record) {
    return { success: false, error: 'No code found. Request a new one.' }
  }

  if (Date.now() > record.expiresAt) {
    otpByKey.delete(key)
    return { success: false, error: 'Code expired. Request a new one.' }
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpByKey.delete(key)
    return { success: false, error: 'Too many failed attempts. Request a new code.' }
  }

  if (record.code !== code.trim()) {
    record.attempts += 1
    otpByKey.set(key, record)
    return { success: false, error: 'Invalid code. Check your email and try again.' }
  }

  otpByKey.delete(key)
  const token = generateToken()
  tokensById.set(token, {
    email: normalized,
    purpose,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
    used: false,
  })

  return {
    success: true,
    emailVerificationToken: token,
    expiresIn: Math.floor(TOKEN_EXPIRY_MS / 1000),
  }
}

export function validateVerificationToken(
  email: string,
  token: string,
  purpose: OtpPurpose,
): boolean {
  const record = tokensById.get(token)
  if (!record) return false
  if (record.used) return false
  if (record.purpose !== purpose) return false
  if (normalizeEmail(email) !== record.email) return false
  if (Date.now() > record.expiresAt) {
    tokensById.delete(token)
    return false
  }
  return true
}

/** One-time use when submitting an application (mirrors backend token consumption). */
export function consumeVerificationToken(
  email: string,
  token: string,
  purpose: OtpPurpose,
): boolean {
  if (!validateVerificationToken(email, token, purpose)) return false
  const record = tokensById.get(token)
  if (!record) return false
  record.used = true
  tokensById.set(token, record)
  return true
}
