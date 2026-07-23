import crypto from 'node:crypto';
import type { IInvitationRepository } from '../../../domain/repositories/IInvitationRepository.js';
import type { IOrganizationRepository } from '../../../domain/repositories/IOrganizationRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { INotificationRepository } from '../../../domain/repositories/INotificationRepository.js';
import type { IActivityEventRepository } from '../../../domain/repositories/IActivityEventRepository.js';
import type { Invitation } from '../../../domain/entities/Invitation.js';
import { InvitationStatus } from '../../../domain/entities/Invitation.js';
import { UserRole, toPublicUser, type PublicUser } from '../../../domain/entities/User.js';
import { NotificationType } from '../../../domain/entities/Notification.js';
import { ActivityEventType } from '../../../domain/entities/ActivityEvent.js';
import type { PasswordHasher } from '../../../infrastructure/security/PasswordHasher.js';
import type { TokenService } from '../../../infrastructure/security/TokenService.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../shared/errors/index.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class InvitationService {
  constructor(
    private readonly invitations: IInvitationRepository,
    private readonly orgs: IOrganizationRepository,
    private readonly users: IUserRepository,
    private readonly notifications: INotificationRepository,
    private readonly activities: IActivityEventRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async invite(input: {
    actorId: string;
    actorRole: string;
    email: string;
    role: UserRole;
  }): Promise<{ invitation: Invitation; inviteToken: string }> {
    if (input.actorRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admins can invite users');
    }

    const actor = await this.users.findById(input.actorId);
    if (!actor?.organizationId) {
      throw new BadRequestError('Create an organization before inviting users');
    }

    const email = input.email.trim().toLowerCase();
    if (input.role === UserRole.ADMIN) {
      throw new BadRequestError('Cannot invite another admin via invitation');
    }

    const existingUser = await this.users.findByEmail(email);
    if (existingUser?.organizationId === actor.organizationId) {
      throw new ConflictError('User is already a member of this organization');
    }

    const pending = await this.invitations.findPendingByEmail(
      actor.organizationId,
      email,
    );
    if (pending) {
      throw new ConflictError('A pending invitation already exists for this email');
    }

    const inviteToken = this.tokens.generateOpaqueToken(32);
    const tokenHash = this.tokens.hashToken(inviteToken);

    const invitation = await this.invitations.create({
      organizationId: actor.organizationId,
      email,
      role: input.role,
      tokenHash,
      invitedByUserId: actor.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      status: InvitationStatus.PENDING,
    });

    return { invitation, inviteToken };
  }

  async list(actorId: string): Promise<Invitation[]> {
    const actor = await this.users.findById(actorId);
    if (!actor?.organizationId) return [];
    return this.invitations.listByOrganization(actor.organizationId);
  }

  async accept(input: {
    token: string;
    name: string;
    password: string;
  }): Promise<PublicUser> {
    const tokenHash = this.tokens.hashToken(input.token);
    const invitation = await this.invitations.findByTokenHash(tokenHash);
    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestError('Invitation is invalid or already used');
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestError('Invitation has expired');
    }

    const org = await this.orgs.findById(invitation.organizationId);
    if (!org) throw new NotFoundError('Organization not found');

    let user = await this.users.findByEmail(invitation.email);
    const passwordHash = await this.passwordHasher.hash(input.password);

    if (user) {
      if (user.organizationId && user.organizationId !== invitation.organizationId) {
        throw new ConflictError('Email already belongs to another organization');
      }
      await this.users.updatePassword(user.id, passwordHash);
      user =
        (await this.users.assignOrganization(
          user.id,
          invitation.organizationId,
          invitation.role,
        )) ?? user;
      if (input.name.trim()) {
        user =
          (await this.users.updateProfile(user.id, { name: input.name.trim() })) ?? user;
      }
    } else {
      user = await this.users.create({
        name: input.name.trim(),
        email: invitation.email,
        passwordHash,
        role: invitation.role,
        organizationId: invitation.organizationId,
      });
    }

    await this.invitations.markAccepted(invitation.id);

    await this.activities.create({
      organizationId: invitation.organizationId,
      actorUserId: user.id,
      type: ActivityEventType.USER_JOINED,
      title: `${user.name} joined the organization`,
      description: user.email,
    });

    // Notify org admins
    const members = await this.users.listByOrganization(invitation.organizationId);
    await Promise.all(
      members
        .filter((member) => member.role === UserRole.ADMIN && member.id !== user!.id)
        .map((admin) =>
          this.notifications.create({
            organizationId: invitation.organizationId,
            userId: admin.id,
            type: NotificationType.INVITATION_ACCEPTED,
            title: 'Invitation accepted',
            message: `${user!.name} (${user!.email}) joined your organization`,
            meta: { userId: user!.id },
          }),
        ),
    );

    return toPublicUser(user);
  }

  async revoke(actorId: string, invitationId: string): Promise<Invitation> {
    const actor = await this.users.findById(actorId);
    if (!actor?.organizationId || actor.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admins can revoke invitations');
    }

    const invitation = await this.invitations.findById(invitationId);
    if (!invitation || invitation.organizationId !== actor.organizationId) {
      throw new NotFoundError('Invitation not found');
    }

    const revoked = await this.invitations.markRevoked(invitationId);
    if (!revoked) throw new BadRequestError('Failed to revoke invitation');
    return revoked;
  }
}

export function createInviteTokenPreview(): string {
  return crypto.randomBytes(8).toString('hex');
}
