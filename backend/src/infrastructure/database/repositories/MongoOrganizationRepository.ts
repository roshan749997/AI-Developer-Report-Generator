import { Types } from 'mongoose';
import type {
  CreateOrganizationInput,
  IOrganizationRepository,
  UpdateOrganizationInput,
} from '../../../domain/repositories/IOrganizationRepository.js';
import type { Organization } from '../../../domain/entities/Organization.js';
import { DEFAULT_ORG_SETTINGS } from '../../../domain/entities/Organization.js';
import {
  OrganizationModel,
  type OrganizationDocument,
} from '../models/OrganizationModel.js';

function mapOrg(doc: OrganizationDocument): Organization {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    logoUrl: doc.logoUrl ?? null,
    ownerId: doc.ownerId.toString(),
    settings: {
      workingDays: doc.settings?.workingDays ?? DEFAULT_ORG_SETTINGS.workingDays,
      defaultReportTime:
        doc.settings?.defaultReportTime ?? DEFAULT_ORG_SETTINGS.defaultReportTime,
      defaultAiModel:
        doc.settings?.defaultAiModel ?? DEFAULT_ORG_SETTINGS.defaultAiModel,
      emailSettings: {
        enabled:
          doc.settings?.emailSettings?.enabled ??
          DEFAULT_ORG_SETTINGS.emailSettings.enabled,
        defaultRecipients:
          doc.settings?.emailSettings?.defaultRecipients ??
          DEFAULT_ORG_SETTINGS.emailSettings.defaultRecipients,
      },
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoOrganizationRepository implements IOrganizationRepository {
  async create(input: CreateOrganizationInput): Promise<Organization> {
    const created = await OrganizationModel.create({
      name: input.name,
      slug: input.slug,
      ownerId: new Types.ObjectId(input.ownerId),
      logoUrl: input.logoUrl ?? null,
      settings: {
        ...DEFAULT_ORG_SETTINGS,
        ...input.settings,
        emailSettings: {
          ...DEFAULT_ORG_SETTINGS.emailSettings,
          ...(input.settings?.emailSettings ?? {}),
        },
      },
    });
    return mapOrg(created);
  }

  async findById(id: string): Promise<Organization | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await OrganizationModel.findById(id).exec();
    return doc ? mapOrg(doc) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const doc = await OrganizationModel.findOne({ slug: slug.toLowerCase() }).exec();
    return doc ? mapOrg(doc) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Organization | null> {
    if (!Types.ObjectId.isValid(ownerId)) return null;
    const doc = await OrganizationModel.findOne({ ownerId }).exec();
    return doc ? mapOrg(doc) : null;
  }

  async update(
    id: string,
    input: UpdateOrganizationInput,
  ): Promise<Organization | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const existing = await OrganizationModel.findById(id).exec();
    if (!existing) return null;

    if (input.name !== undefined) existing.name = input.name;
    if (input.logoUrl !== undefined) existing.logoUrl = input.logoUrl;
    if (input.settings) {
      existing.settings = {
        workingDays: input.settings.workingDays ?? existing.settings.workingDays,
        defaultReportTime:
          input.settings.defaultReportTime ?? existing.settings.defaultReportTime,
        defaultAiModel:
          input.settings.defaultAiModel ?? existing.settings.defaultAiModel,
        emailSettings: {
          enabled:
            input.settings.emailSettings?.enabled ??
            existing.settings.emailSettings.enabled,
          defaultRecipients:
            input.settings.emailSettings?.defaultRecipients ??
            existing.settings.emailSettings.defaultRecipients,
        },
      };
    }

    await existing.save();
    return mapOrg(existing);
  }
}

export const organizationRepository = new MongoOrganizationRepository();
