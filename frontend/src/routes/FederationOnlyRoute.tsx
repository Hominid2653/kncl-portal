import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'
import { federationAdminRoles } from '@/constants/roles'

export function FederationOnlyRoute() {
  const { user } = useAuth()
  if (!user || !federationAdminRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  return <Outlet />
}
