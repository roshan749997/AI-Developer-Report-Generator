import type { UserRole } from './User.js';

export const InvitationStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;

export type InvitationStatus =
  (typeof InvitationStatus)[keyof typeof InvitationStatus];

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: UserRole;
  tokenHash: string;
  invitedByUserId: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
