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

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  previewUserId: z.string().min(1),
})

type LoginForm = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const stateEmail = (location.state as { email?: string } | null)?.email
  const { login, loginByEmail, allUsers } = useAuth()

  const form = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: stateEmail ?? 'faith.njeri@kncl.local',
      password: 'password123',
      previewUserId: allUsers.find((u) => u.email === (stateEmail ?? 'faith.njeri@kncl.local'))?.id ?? allUsers[0]?.id ?? '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    await new Promise((r) => setTimeout(r, 400))
    const byEmail = loginByEmail(data.email)
    const byPicker = allUsers.find((u) => u.id === data.previewUserId)
    const user = byEmail ?? byPicker ?? allUsers[0]

    if (!user) {
      toast.error('No account found for this email. Check application status or wait for coordinator approval.')
      return
    }

    login(user)
    toast.success(`Signed in as ${user.firstName} ${user.lastName} (${roleLabels[user.role]})`)
    navigate(getHomeRouteForUser(user))
  }

  return (
    <AuthLayout title="Sign in" description="Use the email from your approved application. Authentication is handled by Supabase Auth; welcome emails are sent from the backend via Resend.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>
              </div>
              <FormControl><Input type="password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="space-y-2">
            <Label>Quick sign-in (design phase)</Label>
            <Select
              value={form.watch('previewUserId')}
              onValueChange={(v) => {
                form.setValue('previewUserId', v)
                const match = allUsers.find((u) => u.id === v)
                if (match) form.setValue('email', match.email)
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({roleLabels[u.role]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Awaiting approval? <Link to="/register/status" className="underline">Check application status</Link>
          </p>
        </form>
      </Form>
    </AuthLayout>
  )
}
