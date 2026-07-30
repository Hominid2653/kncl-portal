import { useEffect, useState } from 'react'
import { Loader2Icon, MailIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOtp } from '@/context/OtpContext'
import type { OtpPurpose } from '@/api/auth-otp'

interface EmailOtpVerificationProps {
  email: string
  purpose: OtpPurpose
  onVerified: (token: string) => void
  /** Auto-send code when mounted */
  autoSend?: boolean
  className?: string
}

export function EmailOtpVerification({
  email,
  purpose,
  onVerified,
  autoSend = false,
  className,
}: EmailOtpVerificationProps) {
  const { requestOtp, verifyOtp } = useOtp()
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [devCode, setDevCode] = useState<string>()

  const sendCode = async () => {
    if (!email.trim()) {
      toast.error('Enter your email first.')
      return
    }
    setSending(true)
    const result = await requestOtp(email, purpose)
    setSending(false)

    if (!result.success) {
      if (result.cooldownSeconds) setCooldown(result.cooldownSeconds)
      toast.error(result.error ?? 'Could not send code.')
      return
    }

    setSent(true)
    setDevCode(result.devCode)
    setCooldown(60)
    toast.success(`Verification code sent to ${email}`)
    if (result.devCode) {
      toast.message(`Demo mode: your code is ${result.devCode}`, { duration: 15000 })
    }
  }

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code from your email.')
      return
    }
    setVerifying(true)
    const result = await verifyOtp(email, code, purpose)
    setVerifying(false)

    if (!result.success || !result.emailVerificationToken) {
      toast.error(result.error ?? 'Verification failed.')
      return
    }

    toast.success('Email verified')
    onVerified(result.emailVerificationToken)
  }

  useEffect(() => {
    if (!autoSend || !email.trim()) return
    void sendCode()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend, email])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  return (
    <div className={className}>
      <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <MailIcon className="mt-0.5 size-5 shrink-0 text-kenya-green" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Verify your email</p>
            <p className="text-sm text-muted-foreground">
              We&apos;ll send a 6-digit code to <strong>{email}</strong>. In production this is delivered via Resend from the backend.
            </p>
          </div>
        </div>

        {!sent ? (
          <Button type="button" onClick={() => void sendCode()} disabled={sending || !email.trim()}>
            {sending ? <><Loader2Icon className="animate-spin" /> Sending…</> : 'Send verification code'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="otp-code">Verification code</Label>
              <Input
                id="otp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void handleVerify()} disabled={verifying || code.length !== 6}>
                {verifying ? <><Loader2Icon className="animate-spin" /> Verifying…</> : 'Verify code'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void sendCode()}
                disabled={sending || cooldown > 0}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </Button>
            </div>
          </div>
        )}

        {devCode && import.meta.env.DEV && (
          <Alert>
            <AlertDescription className="text-xs">
              <strong>Dev only:</strong> mock OTP is <code className="rounded bg-muted px-1">{devCode}</code> — backend will send this via Resend in production.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
