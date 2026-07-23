import { z } from 'zod';

export const sendReportEmailBodySchema = z.object({
  recipients: z
    .array(z.string().trim().email('Invalid email address'))
    .min(1, 'At least one recipient is required')
    .max(20, 'Maximum 20 recipients allowed'),
});

export const emailLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});
