import { Navigate } from 'react-router-dom'

/** Captains add players via engagement → roster enrollment, not manual forms. */
export default function ClubRegistrationNewPage() {
  return <Navigate to="/club/players/new" replace />
}
