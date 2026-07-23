import type { IOrganizationRepository } from '../../../domain/repositories/IOrganizationRepository.js';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import type { IActivityEventRepository } from '../../../domain/repositories/IActivityEventRepository.js';
import type { Organization, OrganizationSettings } from '../../../domain/entities/Organization.js';
import { toPublicUser, UserRole, type PublicUser } from '../../../domain/entities/User.js';
import { ActivityEventType } from '../../../domain/entities/ActivityEvent.js';
import type {
  AuthTokens,
  JwtTokenService,
} from '../../../infrastructure/security/JwtTokenService.js';
import type { TokenService } from '../../../infrastructure/security/TokenService.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../shared/errors/index.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export class OrganizationService {
  constructor(
    private readonly orgs: IOrganizationRepository,
    private readonly users: IUserRepository,
    private readonly activities: IActivityEventRepository,
    private readonly jwt: JwtTokenService,
    private readonly tokens: TokenService,
  ) {}

  async create(input: {
    actorId: string;
    name: string;
    logoUrl?: string | null;
  }): Promise<{ organization: Organization; user: PublicUser; tokens: AuthTokens }> {
    const actor = await this.users.findById(input.actorId);
    if (!actor) throw new NotFoundError('User not found');

    if (actor.organizationId) {
      throw new ConflictError('You already belong to an organization');
    }

    let slug = slugify(input.name) || `org-${Date.now()}`;
    const existingSlug = await this.orgs.findBySlug(slug);
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const org = await this.orgs.create({
      name: input.name.trim(),
      slug,
      ownerId: actor.id,
      logoUrl: input.logoUrl ?? null,
    });

    const updated =
      (await this.users.assignOrganization(actor.id, org.id, UserRole.ADMIN)) ?? actor;

    await this.activities.create({
      organizationId: org.id,
      actorUserId: actor.id,
      type: ActivityEventType.USER_JOINED,
      title: `${actor.name} created organization`,
      description: org.name,
    });

    const jti = this.tokens.generateOpaqueToken(16);
    const tokenPair = this.jwt.issueTokenPair(updated, jti);
    await this.users.addRefreshToken(updated.id, {
      tokenHash: this.tokens.hashToken(tokenPair.refreshToken),
      expiresAt: this.jwt.getRefreshTokenExpiryDate(),
      createdAt: new Date(),
    });

    return {
      organization: org,
      user: toPublicUser(updated),
      tokens: tokenPair,
    };
  }

  async getMine(actorId: string): Promise<Organization> {
    const actor = await this.users.findById(actorId);
    if (!actor?.organizationId) {
      throw new NotFoundError('No organization found for this user');
    }
    const org = await this.orgs.findById(actor.organizationId);
    if (!org) throw new NotFoundError('Organization not found');
    return org;
  }

  async updateSettings(
    actorId: string,
    actorRole: string,
    input: {
      name?: string;
      logoUrl?: string | null;
      settings?: Partial<OrganizationSettings>;
    },
  ): Promise<Organization> {
    if (actorRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only admins can update organization settings');
    }

    const org = await this.getMine(actorId);
    const updated = await this.orgs.update(org.id, input);
    if (!updated) throw new BadRequestError('Failed to update organization');
    return updated;
  }
}
