import { Router } from 'express';
import { dashboardController } from '../controllers/DashboardController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';

/**
 * @openapi
 * tags:
 *   - name: Dashboard
 *     description: Activity dashboard summaries
 */
export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get today's activity dashboard summary
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved
 */
dashboardRouter.get('/summary', asyncHandler(dashboardController.summary));
