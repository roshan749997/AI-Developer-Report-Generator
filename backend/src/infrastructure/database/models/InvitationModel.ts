import { Schema, model, type Document, type Types } from 'mongoose';
import { USER_ROLES } from '../../../domain/entities/User.js';
import { InvitationStatus } from '../../../domain/entities/Invitation.js';

export interface InvitationDocument extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  email: string;
  role: string;
  tokenHash: string;
  invitedByUserId: Types.ObjectId;
  status: string;
  expiresAt: Date;
  acceptedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<InvitationDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: USER_ROLES, required: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
      index: true,
    },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'Invitations',
  },
);

invitationSchema.index({ organizationId: 1, email: 1, status: 1 });

export const InvitationModel = model<InvitationDocument>('Invitation', invitationSchema);
