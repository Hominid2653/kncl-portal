import type { VariantProps } from 'class-variance-authority'

import { badgeVariants } from '@/components/ui/badge'
import type { EngagementStatus, RosterEnrollmentStatus, TransferStatus } from '@/types'

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export const rosterEnrollmentStatusLabels: Record<RosterEnrollmentStatus, string> = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export const rosterEnrollmentStatusVariants: Record<RosterEnrollmentStatus, BadgeVariant> = {
  PENDING: 'outline',
  APPROVED: 'secondary',
  REJECTED: 'destructive',
}

/** @deprecated Use rosterEnrollmentStatusLabels */
export const registrationStatusLabels = rosterEnrollmentStatusLabels

/** @deprecated Use rosterEnrollmentStatusVariants */
export const registrationStatusVariants = rosterEnrollmentStatusVariants

export const transferStatusLabels: Record<TransferStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export const transferStatusVariants: Record<TransferStatus, BadgeVariant> = {
  PENDING: 'outline',
  APPROVED: 'secondary',
  REJECTED: 'destructive',
  CANCELLED: 'ghost',
}

export const engagementStatusLabels: Record<EngagementStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn',
}

export const engagementStatusVariants: Record<EngagementStatus, BadgeVariant> = {
  PENDING: 'outline',
  ACCEPTED: 'secondary',
  DECLINED: 'destructive',
  WITHDRAWN: 'ghost',
}
