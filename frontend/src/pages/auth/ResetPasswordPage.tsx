import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import AuthLayout from '@/layouts/AuthLayout'

const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: '', confirmPassword: '' } })
  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 400))
    toast.success('Password updated (mock)')
    navigate('/login')
  }
  return (
    <AuthLayout title="Reset password" description="Choose a new password for your account.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem><FormLabel>New password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem><FormLabel>Confirm password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <Button type="submit" className="w-full">Update password</Button>
        </form>
      </Form>
    </AuthLayout>
  )
}
