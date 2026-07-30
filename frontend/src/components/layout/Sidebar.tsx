import { ArrowRightLeft, LayoutDashboard, LogOut, UserCircle2, UserRoundPlus, FileText } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Registration', href: '/register', icon: UserRoundPlus },
  { title: 'Transfers', href: '/transfers', icon: ArrowRightLeft },
  { title: 'Players', href: '/players', icon: UserCircle2 },
  { title: 'Reports', href: '/reports', icon: FileText },
]

function Sidebar() {
  return (
    <aside className="flex w-full flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm lg:w-64 lg:p-5">
      <div>
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">KNCL</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Portal Admin</h2>
        </div>
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <button className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50">
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </aside>
  )
}

export default Sidebar
