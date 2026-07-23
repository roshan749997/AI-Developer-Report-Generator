import { z } from 'zod';
import { UserRole } from '../../../domain/entities/User.js';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: passwordSchema,
  role: z
    .enum([UserRole.DEVELOPER, UserRole.MANAGER, UserRole.ADMIN])
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().toLowerCase().optional(),
    avatarUrl: z.string().trim().url().nullable().optional(),
    timezone: z.string().trim().min(2).max(80).optional(),
    workingHours: z
      .object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
      })
      .optional(),
    gitUsername: z.string().trim().max(100).nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.avatarUrl !== undefined ||
      data.timezone !== undefined ||
      data.workingHours !== undefined ||
      data.gitUsername !== undefined,
    {
      message: 'At least one profile field must be provided',
    },
  );

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});
