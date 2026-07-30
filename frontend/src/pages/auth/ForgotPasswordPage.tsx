import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { requestPasswordReset } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import AuthLayout from '@/layouts/AuthLayout'
import { USE_API } from '@/lib/api-config'

const schema = z.object({ email: z.string().email() })
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const onSubmit = async (data: FormValues) => {
    if (USE_API) {
      try {
        await requestPasswordReset(data.email)
        toast.success('If an account exists for that email, a reset link has been sent.')
        return
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not send reset email.')
        return
      }
    }

    await new Promise((r) => setTimeout(r, 400))
    toast.success('Password reset link sent (mock)')
  }

  return (
    <AuthLayout title="Forgot password" description="Enter your email to receive a reset link.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Sending...' : 'Send reset link'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/login" className="underline">Back to sign in</Link>
          </p>
        </form>
      </Form>
    </AuthLayout>
  )
}
