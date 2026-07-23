import { Schema, model, type Document, type Types } from 'mongoose';
import { UserRole, USER_ROLES } from '../../../domain/entities/User.js';

export interface RefreshTokenSubdocument {
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId?: Types.ObjectId | null;
  avatarUrl?: string | null;
  timezone?: string;
  workingHours?: { start: string; end: string };
  gitUsername?: string | null;
  isActive?: boolean;
  refreshTokens: RefreshTokenSubdocument[];
  passwordResetTokenHash?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenSubdocument>(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: UserRole.DEVELOPER,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    avatarUrl: { type: String, default: null },
    timezone: { type: String, default: 'Asia/Kolkata' },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' },
    },
    gitUsername: { type: String, default: null, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const value = ret as Record<string, unknown>;
        value.id = String(value._id);
        delete value._id;
        delete value.passwordHash;
        delete value.refreshTokens;
        delete value.passwordResetTokenHash;
        delete value.passwordResetExpires;
        return value;
      },
    },
  },
);

userSchema.index({ 'refreshTokens.tokenHash': 1 });
userSchema.index({ passwordResetTokenHash: 1 });

export const UserModel = model<UserDocument>('User', userSchema);
