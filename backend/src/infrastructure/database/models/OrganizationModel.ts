import { Schema, model, type Document, type Types } from 'mongoose';
import { DEFAULT_ORG_SETTINGS } from '../../../domain/entities/Organization.js';

export interface OrganizationDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  logoUrl?: string | null;
  ownerId: Types.ObjectId;
  settings: {
    workingDays: number[];
    defaultReportTime: string;
    defaultAiModel: string;
    emailSettings: {
      enabled: boolean;
      defaultRecipients: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logoUrl: { type: String, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    settings: {
      workingDays: { type: [Number], default: DEFAULT_ORG_SETTINGS.workingDays },
      defaultReportTime: {
        type: String,
        default: DEFAULT_ORG_SETTINGS.defaultReportTime,
      },
      defaultAiModel: {
        type: String,
        default: DEFAULT_ORG_SETTINGS.defaultAiModel,
      },
      emailSettings: {
        enabled: { type: Boolean, default: true },
        defaultRecipients: { type: [String], default: [] },
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'Organizations',
  },
);

export const OrganizationModel = model<OrganizationDocument>(
  'Organization',
  organizationSchema,
);
