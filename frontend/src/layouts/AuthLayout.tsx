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
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="shrink-0 bg-header text-header-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="space-y-0.5">
            <p className="text-[10px] font-semibold tracking-[0.35em] text-white/60 uppercase">KNCL</p>
            <p className="text-sm font-medium">Transfer Portal</p>
          </Link>
          <Link to="/" className="text-xs tracking-[0.2em] text-white/70 uppercase transition-colors hover:text-white">
            Home
          </Link>
        </div>
        <Separator className="bg-white/10" />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>

      <footer className="mt-auto shrink-0 border-t border-white/10 bg-header py-4 text-center text-xs text-white/45">
        © {new Date().getFullYear()} Kenya National Chess League
      </footer>
    </div>
  )
}
