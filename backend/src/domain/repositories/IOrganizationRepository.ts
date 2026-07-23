import type { Organization, OrganizationSettings } from '../entities/Organization.js';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  ownerId: string;
  logoUrl?: string | null;
  settings?: Partial<OrganizationSettings>;
}

export interface UpdateOrganizationInput {
  name?: string;
  logoUrl?: string | null;
  settings?: Partial<OrganizationSettings>;
}

export interface IOrganizationRepository {
  create(input: CreateOrganizationInput): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findByOwnerId(ownerId: string): Promise<Organization | null>;
  update(id: string, input: UpdateOrganizationInput): Promise<Organization | null>;
}
