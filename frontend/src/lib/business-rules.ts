/**
 * Canonical business rules — keep in sync with docs/backend_updates.md § Business rules.
 */

/** Minimum approved roster members before initial roster period ends. */
export const MIN_ROSTER_SIZE = 6

/** Engagements may be sent anytime; roster/transfer initiation is window-gated (pipeline policy). */
export const ENGAGEMENT_WINDOW_POLICY = 'pipeline' as const

export function canSendEngagement(): boolean {
  return true
}

/** Free-agent first affiliation → roster enrollment (not inter-club transfer). */
export function canInitiateRosterEnrollment(
  transfersOpen: boolean,
  rosterEnrollmentOpen: boolean,
  inInitialRosterPeriod: boolean,
): boolean {
  return rosterEnrollmentOpen && (transfersOpen || inInitialRosterPeriod)
}

/** Committed player move → inter-club transfer; requires open transfer window. */
export function canInitiateTransfer(transfersOpen: boolean): boolean {
  return transfersOpen
}

/** Player-initiated transfer request (personal terms); requires club affiliation + open window. */
export function canPlayerSubmitTransferRequest(transfersOpen: boolean, hasCurrentClub: boolean): boolean {
  return transfersOpen && hasCurrentClub
}

export function isClubInInitialRosterPeriod(
  clubId: string,
  initialRosterClubIds: string[],
  rosterCount: number,
): boolean {
  return initialRosterClubIds.includes(clubId) && rosterCount < MIN_ROSTER_SIZE
}
