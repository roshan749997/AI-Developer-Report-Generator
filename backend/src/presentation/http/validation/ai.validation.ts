import { z } from 'zod';

export const aiProjectIdParamSchema = z.object({
  projectId: z.string().trim().min(1),
});

export const aiReportIdParamSchema = z.object({
  reportId: z.string().trim().min(1),
});

export const generateAiReportSchema = z
  .object({
    todayOnly: z.boolean().optional(),
    fromDate: z.string().datetime().optional(),
    toDate: z.string().datetime().optional(),
    commitLimit: z.number().int().min(1).max(200).optional(),
    previousReportsLimit: z.number().int().min(0).max(20).optional(),
  })
  .refine(
    (data) => {
      if (data.fromDate && data.toDate) {
        return new Date(data.fromDate) <= new Date(data.toDate);
      }
      return true;
    },
    { message: 'fromDate must be before or equal to toDate' },
  );

export const listAiReportsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
