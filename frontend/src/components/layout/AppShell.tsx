import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-4 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row">
        <Sidebar />
        <main className="flex-1 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">{children}</main>
      </div>
    </div>
  )
}

export default AppShell
