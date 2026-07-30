import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  description: string
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-header text-header-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.35em] text-white/60 uppercase">KNCL</p>
            <p className="text-sm font-medium">Transfer Portal</p>
          </div>
          <Link to="/" className="text-xs tracking-[0.2em] text-white/70 uppercase hover:text-white">
            Home
          </Link>
        </div>
        <Separator className="bg-white/10" />
      </header>
      <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-md items-center px-4 py-10 sm:px-6">
        <Card className="w-full shadow-sm">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  )
}
