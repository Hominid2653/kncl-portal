import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import AuthLayout from '@/layouts/AuthLayout'

const schema = z.object({ email: z.string().email() })
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } })
  const onSubmit = async () => {
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
              <FormControl><Input type="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full">Send reset link</Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
