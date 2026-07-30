import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOutIcon } from 'lucide-react'

import { DevRoleSwitcher } from '@/components/DevRoleSwitcher'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { roleLabels } from '@/constants/roles'
import { getNavForRole } from '@/constants/navigation'
import { useAuth } from '@/context/AuthContext'

interface PortalLayoutProps {
  children: ReactNode
  portalLabel: string
}

export default function PortalLayout({ children, portalLabel }: PortalLayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navItems = user ? getNavForRole(user.role) : []
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : 'KN'

  const currentPage = navItems.find((item) => location.pathname === item.href)?.title ?? portalLabel

  return (
    <SidebarProvider>
      <Sidebar className="border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="border-b border-white/10 p-4">
          <p className="text-[10px] font-semibold tracking-[0.35em] text-white/50 uppercase">KNCL</p>
          <p className="text-sm font-medium text-white">{portalLabel}</p>
          {user && <p className="text-xs text-white/60">{roleLabels[user.role]}</p>}
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] tracking-[0.25em] text-white/40 uppercase">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.href}
                      render={<Link to={item.href} />}
                      className="data-active:border-l-2 data-active:border-kenya-green data-active:bg-white/5"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/10 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout}>
                <LogOutIcon />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to={navItems[0]?.href ?? '/'} />}>{portalLabel}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPage}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.firstName} {user.lastName}
              </span>
            )}
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 bg-muted/20 p-4 md:p-6">{children}</div>
      </SidebarInset>
      <DevRoleSwitcher />
    </SidebarProvider>
  )
}
