/** @deprecated Use `useSeason()` from `@/context/SeasonContext` instead. */
import { seasons } from '@/data/mockData'

export function getCurrentSeason() {
  return seasons.find((s) => s.transfersOpen || s.rosterEnrollmentOpen) ?? seasons[seasons.length - 1]
}

export function isTransferWindowOpen() {
  return getCurrentSeason().transfersOpen
}

export function isRosterEnrollmentOpen() {
  return getCurrentSeason().rosterEnrollmentOpen
}

/** @deprecated Use isRosterEnrollmentOpen */
export function isRegistrationWindowOpen() {
  return isRosterEnrollmentOpen()
}
