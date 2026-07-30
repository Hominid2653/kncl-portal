import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { getHomeRouteForUser, useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AuthLayout from '@/layouts/AuthLayout'
import { roleLabels } from '@/constants/roles'
import { USE_API } from '@/lib/api-config'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  previewUserId: z.string().optional(),
})

type LoginForm = z.infer<typeof schema>

const isDev = import.meta.env.DEV

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const stateEmail = (location.state as { email?: string } | null)?.email
  const { login, loginWithApi, allUsers } = useAuth()

  const form = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: stateEmail ?? 'faith.njeri@kncl.local',
      password: 'password123',
      previewUserId: allUsers.find((u) => u.email === (stateEmail ?? 'faith.njeri@kncl.local'))?.id ?? '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    if (USE_API) {
      try {
        const profile = await loginWithApi(data.email, data.password)
        toast.success(`Signed in as ${profile.firstName} ${profile.lastName} (${roleLabels[profile.role]})`)
        navigate(getHomeRouteForUser(profile))
        return
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Sign in failed.')
        return
      }
    }

    const user = allUsers.find((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())
    if (!user) {
      toast.error('No account found for this email.')
      return
    }

    await new Promise((r) => setTimeout(r, 400))
    login(user)
    toast.success(`Signed in as ${user.firstName} ${user.lastName} (${roleLabels[user.role]})`)
    navigate(getHomeRouteForUser(user))
  }

  const onDevMockSignIn = () => {
    const previewId = form.getValues('previewUserId')
    const user = allUsers.find((u) => u.id === previewId) ?? allUsers[0]
    if (!user) return
    form.setValue('email', user.email)
    login(user)
    toast.success(`Dev sign-in as ${user.firstName} ${user.lastName} (mock headers)`)
    navigate(getHomeRouteForUser(user))
  }

  return (
    <AuthLayout
      title="Sign in"
      description="Use the email and password from your welcome email after your application is approved."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>
              </div>
              <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          {isDev && USE_API && (
            <div className="space-y-2 rounded-lg border border-dashed p-3">
              <Label className="text-xs text-muted-foreground">Dev quick sign-in (mock headers)</Label>
              <Select
                value={form.watch('previewUserId')}
                onValueChange={(v) => {
                  form.setValue('previewUserId', v)
                  const match = allUsers.find((u) => u.id === v)
                  if (match) form.setValue('email', match.email)
                }}
              >
                <SelectTrigger><SelectValue placeholder="Pick a seeded user" /></SelectTrigger>
                <SelectContent>
                  {allUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({roleLabels[u.role]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" className="w-full" onClick={onDevMockSignIn}>
                Sign in with mock headers
              </Button>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No account yet?{' '}
            <Link to="/register/player" className="underline">Register as a player</Link>
            {' · '}
            <Link to="/register/captain" className="underline">Register a club</Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Awaiting approval? <Link to="/register/status" className="underline">Check application status</Link>
          </p>
        </form>
      </Form>
    </AuthLayout>
  )
}
