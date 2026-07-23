import { Types } from 'mongoose';
import type {
  CreateInvitationInput,
  IInvitationRepository,
} from '../../../domain/repositories/IInvitationRepository.js';
import type { Invitation } from '../../../domain/entities/Invitation.js';
import { InvitationStatus } from '../../../domain/entities/Invitation.js';
import {
  InvitationModel,
  type InvitationDocument,
} from '../models/InvitationModel.js';

function mapInvite(doc: InvitationDocument): Invitation {
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    email: doc.email,
    role: doc.role as Invitation['role'],
    tokenHash: doc.tokenHash,
    invitedByUserId: doc.invitedByUserId.toString(),
    status: doc.status as Invitation['status'],
    expiresAt: doc.expiresAt,
    acceptedAt: doc.acceptedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoInvitationRepository implements IInvitationRepository {
  async create(input: CreateInvitationInput): Promise<Invitation> {
    const created = await InvitationModel.create({
      organizationId: new Types.ObjectId(input.organizationId),
      email: input.email.toLowerCase(),
      role: input.role,
      tokenHash: input.tokenHash,
      invitedByUserId: new Types.ObjectId(input.invitedByUserId),
      expiresAt: input.expiresAt,
      status: input.status ?? InvitationStatus.PENDING,
    });
    return mapInvite(created);
  }

  async findById(id: string): Promise<Invitation | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await InvitationModel.findById(id).exec();
    return doc ? mapInvite(doc) : null;
  }

  async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    const doc = await InvitationModel.findOne({ tokenHash }).exec();
    return doc ? mapInvite(doc) : null;
  }

  async findPendingByEmail(
    organizationId: string,
    email: string,
  ): Promise<Invitation | null> {
    const doc = await InvitationModel.findOne({
      organizationId,
      email: email.toLowerCase(),
      status: InvitationStatus.PENDING,
    }).exec();
    return doc ? mapInvite(doc) : null;
  }

  async listByOrganization(
    organizationId: string,
    limit = 100,
  ): Promise<Invitation[]> {
    const docs = await InvitationModel.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(mapInvite);
  }

  async markAccepted(id: string): Promise<Invitation | null> {
    const doc = await InvitationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      },
      { new: true },
    ).exec();
    return doc ? mapInvite(doc) : null;
  }

  async markRevoked(id: string): Promise<Invitation | null> {
    const doc = await InvitationModel.findByIdAndUpdate(
      id,
      { $set: { status: InvitationStatus.REVOKED } },
      { new: true },
    ).exec();
    return doc ? mapInvite(doc) : null;
  }
}

export const invitationRepository = new MongoInvitationRepository();
