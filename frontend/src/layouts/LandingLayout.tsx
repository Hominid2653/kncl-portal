import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MenuIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { marketingNav } from '@/constants/navigation'

interface LandingLayoutProps {
  children: ReactNode
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-header text-header-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="space-y-0.5">
            <p className="text-[10px] font-semibold tracking-[0.35em] text-white/60 uppercase">Kenya National Chess League</p>
            <p className="text-sm font-medium">Transfer Portal</p>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {marketingNav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-xs font-medium tracking-[0.2em] text-white/70 uppercase transition-colors hover:text-white"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white" render={<Link to="/login" />}>
                Sign in
              </Button>
              <Button className="border-kenya-green bg-kenya-green text-white hover:bg-kenya-green/90" render={<Link to="/login" />}>
                Portal
              </Button>
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 md:hidden"
                    aria-label="Open menu"
                  >
                    <MenuIcon className="size-5" />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  {marketingNav.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <item.icon className="size-4 text-muted-foreground" />
                      {item.title}
                    </Link>
                  ))}
                  <Separator className="my-3" />
                  <Link
                    to="/register/status"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Application status
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    Sign in
                  </Link>
                  <Button className="mt-2 w-full" render={<Link to="/login" onClick={() => setMobileOpen(false)} />}>
                    Portal
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <Separator className="bg-white/10" />
      </header>
      <main>{children}</main>
      <footer className="border-t bg-header text-white/60">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm sm:px-6">
          © Kenya National Chess League · Registration &amp; Transfer Management
        </div>
      </footer>
    </div>
  )
}
