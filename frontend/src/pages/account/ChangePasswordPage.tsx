import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { changePassword } from '@/api/auth'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { portalLabels } from '@/constants/roles'
import { useAuth } from '@/context/AuthContext'
import PortalLayout from '@/layouts/PortalLayout'
import { getAccessToken, USE_API } from '@/lib/api-config'

const schema = z
  .object({
    currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  })

type FormValues = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const { user } = useAuth()
  const hasBearerSession = Boolean(getAccessToken())

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    if (USE_API && !hasBearerSession) {
      toast.error('Sign in with email and password to change your account password.')
      return
    }

    if (USE_API) {
      try {
        await changePassword(data.currentPassword, data.newPassword)
        toast.success('Password updated successfully.')
        form.reset()
        return
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not update password.')
        return
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 400))
    toast.success('Password updated (mock)')
    form.reset()
  }

  const portalLabel = user ? portalLabels[user.role] : 'Portal'

  return (
    <PortalLayout portalLabel={portalLabel}>
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Account security</h1>
          <p className="text-sm text-muted-foreground">
            Update your portal password or request a reset link if you have forgotten it.
          </p>
        </div>

        {USE_API && !hasBearerSession && (
          <Alert>
            <AlertTitle>Email sign-in required</AlertTitle>
            <AlertDescription>
              Password changes are managed through Supabase. Sign out and sign in with your email and
              password, or use the reset link below if you do not know your current password.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Enter your current password, then choose a new one.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm new password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting || (USE_API && !hasBearerSession)}
                >
                  {form.formState.isSubmitting ? 'Updating...' : 'Update password'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>
              We will email you a secure link to set a new password without your current one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link to="/forgot-password" />}>
              Request password reset
            </Button>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  )
}
