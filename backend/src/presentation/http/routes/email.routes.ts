import { Router } from 'express';
import { emailController } from '../controllers/EmailController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { emailLogsQuerySchema } from '../validation/email.validation.js';

/**
 * @openapi
 * tags:
 *   - name: Email
 *     description: Email delivery logs
 */
export const emailRouter = Router();

emailRouter.use(authenticate);

/**
 * @openapi
 * /email/logs:
 *   get:
 *     tags: [Email]
 *     summary: List latest email delivery logs
 *     security:
 *       - bearerAuth: []
 */
emailRouter.get(
  '/logs',
  validate({ query: emailLogsQuerySchema }),
  asyncHandler(emailController.logs),
);
