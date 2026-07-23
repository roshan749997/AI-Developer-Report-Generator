import { z } from 'zod';

export const activityProjectIdParamSchema = z.object({
  projectId: z.string().trim().min(1, 'projectId is required'),
});
