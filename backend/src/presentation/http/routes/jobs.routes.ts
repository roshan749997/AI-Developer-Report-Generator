import { Router } from 'express';
import { jobsController } from '../controllers/JobsController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { jobsLogsQuerySchema } from '../validation/jobs.validation.js';

/**
 * @openapi
 * tags:
 *   - name: Jobs
 *     description: Daily report scheduler status, logs, and manual trigger
 */
export const jobsRouter = Router();

jobsRouter.use(authenticate);

/**
 * @openapi
 * /jobs/status:
 *   get:
 *     tags: [Jobs]
 *     summary: Get daily report scheduler status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduler status retrieved
 */
jobsRouter.get('/status', asyncHandler(jobsController.status));

/**
 * @openapi
 * /jobs/logs:
 *   get:
 *     tags: [Jobs]
 *     summary: List scheduler logs (latest first)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Scheduler logs retrieved
 */
jobsRouter.get(
  '/logs',
  validate({ query: jobsLogsQuerySchema }),
  asyncHandler(jobsController.logs),
);

/**
 * @openapi
 * /jobs/run:
 *   post:
 *     tags: [Jobs]
 *     summary: Manually trigger today's daily report job
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job triggered
 */
jobsRouter.post('/run', asyncHandler(jobsController.run));
