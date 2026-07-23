import { z } from 'zod';
import { UserRole } from '../../../domain/entities/User.js';

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(150),
  logoUrl: z.string().trim().url().nullable().optional(),
});

export const updateOrganizationSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    logoUrl: z.string().trim().url().nullable().optional(),
    settings: z
      .object({
        workingDays: z.array(z.number().int().min(0).max(6)).min(1).max(7).optional(),
        defaultReportTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        defaultAiModel: z.string().trim().min(2).max(80).optional(),
        emailSettings: z
          .object({
            enabled: z.boolean().optional(),
            defaultRecipients: z.array(z.string().email()).max(20).optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.logoUrl !== undefined ||
      data.settings !== undefined,
    { message: 'At least one field must be provided' },
  );

export const inviteUserSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  role: z.enum([UserRole.DEVELOPER, UserRole.MANAGER]),
});

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(10),
  name: z.string().trim().min(2).max(100),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

export const invitationIdParamSchema = z.object({
  invitationId: z.string().trim().min(1),
});

export const userIdParamSchema = z.object({
  userId: z.string().trim().min(1),
});

export const notificationIdParamSchema = z.object({
  notificationId: z.string().trim().min(1),
});

export const listLimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});
