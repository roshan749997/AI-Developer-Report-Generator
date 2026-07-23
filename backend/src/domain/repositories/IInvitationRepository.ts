import type { Invitation, InvitationStatus } from '../entities/Invitation.js';
import type { UserRole } from '../entities/User.js';

export interface CreateInvitationInput {
  organizationId: string;
  email: string;
  role: UserRole;
  tokenHash: string;
  invitedByUserId: string;
  expiresAt: Date;
  status?: InvitationStatus;
}

export interface IInvitationRepository {
  create(input: CreateInvitationInput): Promise<Invitation>;
  findById(id: string): Promise<Invitation | null>;
  findByTokenHash(tokenHash: string): Promise<Invitation | null>;
  findPendingByEmail(organizationId: string, email: string): Promise<Invitation | null>;
  listByOrganization(organizationId: string, limit?: number): Promise<Invitation[]>;
  markAccepted(id: string): Promise<Invitation | null>;
  markRevoked(id: string): Promise<Invitation | null>;
}
