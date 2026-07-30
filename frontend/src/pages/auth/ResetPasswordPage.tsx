import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { confirmPasswordReset } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import AuthLayout from '@/layouts/AuthLayout'
import { USE_API } from '@/lib/api-config'

const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

type FormValues = z.infer<typeof schema>

function parseRecoveryToken(): string | null {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
  const params = new URLSearchParams(hash)
  const type = params.get('type')
  const token = params.get('access_token')
  if (type === 'recovery' && token) return token

  const query = new URLSearchParams(window.location.search)
  const queryToken = query.get('access_token')
  if (query.get('type') === 'recovery' && queryToken) return queryToken

  return null
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null)

  useEffect(() => {
    setRecoveryToken(parseRecoveryToken())
  }, [])

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: '', confirmPassword: '' } })

  const onSubmit = async (data: FormValues) => {
    if (USE_API) {
      if (!recoveryToken) {
        toast.error('Recovery link is invalid or expired. Request a new reset email.')
        return
      }
      try {
        await confirmPasswordReset(data.password, recoveryToken)
        toast.success('Password updated. You can sign in with your new password.')
        navigate('/login')
        return
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not update password.')
        return
      }
    }

    await new Promise((r) => setTimeout(r, 400))
    toast.success('Password updated (mock)')
    navigate('/login')
  }

  return (
    <AuthLayout title="Reset password" description="Choose a new password for your account.">
      {!recoveryToken && USE_API ? (
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>This page needs a valid recovery link from your email.</p>
          <Button render={<Link to="/forgot-password" />}>Request a new reset link</Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem><FormLabel>New password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem><FormLabel>Confirm password</FormLabel><FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  )
}
