import { useNavigate } from 'react-router-dom'

import { roleHomeRoutes, roleLabels } from '@/constants/roles'
import { useAuth } from '@/context/AuthContext'
import { mockUsers } from '@/data/mockUsers'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserRole } from '@/types'

export function DevRoleSwitcher() {
  if (!import.meta.env.DEV) return null

  const { user, switchRole } = useAuth()
  const navigate = useNavigate()

  const handleChange = (role: UserRole) => {
    switchRole(role)
    navigate(roleHomeRoutes[role])
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg border bg-background p-2 shadow-lg">
      <span className="text-xs text-muted-foreground">Dev role</span>
      <Select value={user?.role ?? 'PLAYER'} onValueChange={(value) => handleChange(value as UserRole)}>
        <SelectTrigger className="h-8 w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {mockUsers.map((mockUser) => (
            <SelectItem key={mockUser.id} value={mockUser.role}>
              {roleLabels[mockUser.role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
