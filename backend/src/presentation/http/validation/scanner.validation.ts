import { z } from 'zod';
import { CommitCategory } from '../../../domain/entities/ScannedCommit.js';

export const projectIdParamSchema = z.object({
  projectId: z.string().trim().min(1),
});

export const commitHashParamSchema = z.object({
  projectId: z.string().trim().min(1),
  hash: z.string().trim().min(4),
});

export const runIdParamSchema = z.object({
  runId: z.string().trim().min(1),
});

export const scheduleIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export const triggerScanSchema = z
  .object({
    todayOnly: z.boolean().optional(),
    yesterdayOnly: z.boolean().optional(),
    lookbackDays: z.number().int().min(1).max(365).optional(),
    maxCount: z.number().int().min(1).max(5000).optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
  })
  .refine((data) => !(data.todayOnly && data.yesterdayOnly), {
    message: 'todayOnly and yesterdayOnly cannot both be true',
  });

export const listCommitsQuerySchema = z.object({
  range: z.enum(['all', 'today', 'yesterday']).optional().default('all'),
  category: z
    .enum([
      CommitCategory.BUG_FIX,
      CommitCategory.FEATURE,
      CommitCategory.REFACTOR,
      CommitCategory.UI,
      CommitCategory.BACKEND,
      CommitCategory.API,
      CommitCategory.FIREBASE,
      CommitCategory.AUTHENTICATION,
      CommitCategory.PERFORMANCE,
    ])
    .optional(),
  authorEmail: z.string().email().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  skip: z.coerce.number().int().min(0).optional().default(0),
});
export const createScheduleSchema = z.object({
  projectId: z.string().trim().min(1),
  name: z.string().trim().min(2).max(150),
  cronExpression: z.string().trim().min(1).max(100),
  timezone: z.string().trim().min(1).max(100).optional().default('UTC'),
  scanTodayOnly: z.boolean().optional().default(false),
  lookbackDays: z.number().int().min(1).max(365).optional().default(7),
  isEnabled: z.boolean().optional().default(true),
});

export const updateScheduleSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    cronExpression: z.string().trim().min(1).max(100).optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
    scanTodayOnly: z.boolean().optional(),
    lookbackDays: z.number().int().min(1).max(365).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.cronExpression !== undefined ||
      data.timezone !== undefined ||
      data.scanTodayOnly !== undefined ||
      data.lookbackDays !== undefined,
    { message: 'At least one field must be provided' },
  );
