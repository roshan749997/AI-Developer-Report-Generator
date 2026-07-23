import { Types } from 'mongoose';
import type {
  CreateUserInput,
  IUserRepository,
  UpdateUserProfileInput,
} from '../../../domain/repositories/IUserRepository.js';
import type { RefreshTokenRecord, User, UserRole } from '../../../domain/entities/User.js';
import { UserModel, type UserDocument } from '../models/UserModel.js';

function mapUser(doc: UserDocument): User {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    passwordHash: doc.passwordHash,
    role: doc.role,
    organizationId: doc.organizationId ? doc.organizationId.toString() : null,
    avatarUrl: doc.avatarUrl ?? null,
    timezone: doc.timezone ?? 'Asia/Kolkata',
    workingHours: doc.workingHours ?? { start: '09:00', end: '18:00' },
    gitUsername: doc.gitUsername ?? null,
    isActive: doc.isActive ?? true,
    refreshTokens: (doc.refreshTokens ?? []).map((token) => ({
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
    })),
    passwordResetTokenHash: doc.passwordResetTokenHash ?? null,
    passwordResetExpires: doc.passwordResetExpires ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const SENSITIVE_FIELDS = '+passwordHash +passwordResetTokenHash +passwordResetExpires';

export class MongoUserRepository implements IUserRepository {
  async create(input: CreateUserInput): Promise<User> {
    const created = await UserModel.create({
      ...input,
      organizationId: input.organizationId
        ? new Types.ObjectId(input.organizationId)
        : null,
    });
    const doc = await UserModel.findById(created._id).select(SENSITIVE_FIELDS).exec();
    if (!doc) {
      throw new Error('Failed to load created user');
    }
    return mapUser(doc);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id).select(SENSITIVE_FIELDS).exec();
    return doc ? mapUser(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() })
      .select(SENSITIVE_FIELDS)
      .exec();
    return doc ? mapUser(doc) : null;
  }

  async listByOrganization(organizationId: string): Promise<User[]> {
    const docs = await UserModel.find({
      organizationId,
      isActive: { $ne: false },
    })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(mapUser);
  }

  async updateProfile(id: string, input: UpdateUserProfileInput): Promise<User | null> {
    const update: Record<string, unknown> = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.email !== undefined) update.email = input.email.toLowerCase();
    if (input.avatarUrl !== undefined) update.avatarUrl = input.avatarUrl;
    if (input.timezone !== undefined) update.timezone = input.timezone;
    if (input.workingHours !== undefined) update.workingHours = input.workingHours;
    if (input.gitUsername !== undefined) update.gitUsername = input.gitUsername;

    const doc = await UserModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .select(SENSITIVE_FIELDS)
      .exec();

    return doc ? mapUser(doc) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpires: null,
      },
      { new: true },
    )
      .select(SENSITIVE_FIELDS)
      .exec();

    return doc ? mapUser(doc) : null;
  }

  async assignOrganization(
    id: string,
    organizationId: string,
    role: UserRole,
  ): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      {
        organizationId: new Types.ObjectId(organizationId),
        role,
        isActive: true,
      },
      { new: true },
    )
      .select(SENSITIVE_FIELDS)
      .exec();
    return doc ? mapUser(doc) : null;
  }

  async deactivate(id: string): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    )
      .select(SENSITIVE_FIELDS)
      .exec();
    return doc ? mapUser(doc) : null;
  }

  async addRefreshToken(id: string, token: RefreshTokenRecord): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $push: {
        refreshTokens: {
          $each: [token],
          $slice: -10,
        },
      },
    }).exec();
  }

  async removeRefreshToken(id: string, tokenHash: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $pull: { refreshTokens: { tokenHash } },
    }).exec();
  }

  async replaceRefreshToken(
    id: string,
    oldTokenHash: string,
    newToken: RefreshTokenRecord,
  ): Promise<boolean> {
    const result = await UserModel.updateOne(
      { _id: id, 'refreshTokens.tokenHash': oldTokenHash },
      {
        $pull: { refreshTokens: { tokenHash: oldTokenHash } },
      },
    ).exec();

    if (result.modifiedCount === 0) {
      return false;
    }

    await this.addRefreshToken(id, newToken);
    return true;
  }

  async clearRefreshTokens(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { refreshTokens: [] }).exec();
  }

  async setPasswordResetToken(id: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: expiresAt,
    }).exec();
  }

  async clearPasswordResetToken(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    }).exec();
  }

  async findByPasswordResetTokenHash(tokenHash: string): Promise<User | null> {
    const doc = await UserModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    })
      .select(SENSITIVE_FIELDS)
      .exec();

    return doc ? mapUser(doc) : null;
  }

  async findByRefreshTokenHash(tokenHash: string): Promise<User | null> {
    const doc = await UserModel.findOne({
      refreshTokens: {
        $elemMatch: {
          tokenHash,
          expiresAt: { $gt: new Date() },
        },
      },
    })
      .select(SENSITIVE_FIELDS)
      .exec();

    return doc ? mapUser(doc) : null;
  }
}

export const userRepository = new MongoUserRepository();
