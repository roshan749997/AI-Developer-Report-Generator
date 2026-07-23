import { z } from 'zod';

export const reportProjectIdParamSchema = z.object({
  projectId: z.string().trim().min(1, 'projectId is required'),
});

export const reportIdParamSchema = z.object({
  reportId: z.string().trim().min(1, 'reportId is required'),
});
