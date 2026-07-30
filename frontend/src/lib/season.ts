/** @deprecated Use `useSeason()` from `@/context/SeasonContext` instead. */
import { seasons } from '@/data/mockData'

export function getCurrentSeason() {
  return seasons.find((s) => s.transfersOpen || s.registrationOpen) ?? seasons[seasons.length - 1]
}

export function isTransferWindowOpen() {
  return getCurrentSeason().transfersOpen
}

export function isRegistrationWindowOpen() {
  return getCurrentSeason().registrationOpen
}
