import { Router } from 'express';
import { scheduleController } from '../controllers/ScheduleController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  createScheduleSchema,
  scheduleIdParamSchema,
  updateScheduleSchema,
} from '../validation/scanner.validation.js';

/**
 * @openapi
 * tags:
 *   - name: Schedules
 *     description: Git scan scheduler APIs
 */
export const scheduleRouter = Router();

scheduleRouter.use(authenticate);

/**
 * @openapi
 * /schedules:
 *   post:
 *     tags: [Schedules]
 *     summary: Create a scan schedule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, name, cronExpression]
 *             properties:
 *               projectId:
 *                 type: string
 *               name:
 *                 type: string
 *               cronExpression:
 *                 type: string
 *                 example: "0 0 * * *"
 *               timezone:
 *                 type: string
 *                 example: UTC
 *               scanTodayOnly:
 *                 type: boolean
 *               lookbackDays:
 *                 type: integer
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Schedule created
 *   get:
 *     tags: [Schedules]
 *     summary: List scan schedules
 *     security:
 *       - bearerAuth: []
 */
scheduleRouter.post(
  '/',
  validate({ body: createScheduleSchema }),
  asyncHandler(scheduleController.create),
);

scheduleRouter.get('/', asyncHandler(scheduleController.list));

/**
 * @openapi
 * /schedules/active:
 *   get:
 *     tags: [Schedules]
 *     summary: List currently registered cron schedule IDs
 *     security:
 *       - bearerAuth: []
 */
scheduleRouter.get('/active', asyncHandler(scheduleController.active));

/**
 * @openapi
 * /schedules/{id}:
 *   get:
 *     tags: [Schedules]
 *     summary: Get a schedule
 *     security:
 *       - bearerAuth: []
 *   patch:
 *     tags: [Schedules]
 *     summary: Update a schedule
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     tags: [Schedules]
 *     summary: Delete a schedule
 *     security:
 *       - bearerAuth: []
 */
scheduleRouter.get(
  '/:id',
  validate({ params: scheduleIdParamSchema }),
  asyncHandler(scheduleController.getById),
);

scheduleRouter.patch(
  '/:id',
  validate({ params: scheduleIdParamSchema, body: updateScheduleSchema }),
  asyncHandler(scheduleController.update),
);

scheduleRouter.delete(
  '/:id',
  validate({ params: scheduleIdParamSchema }),
  asyncHandler(scheduleController.remove),
);

/**
 * @openapi
 * /schedules/{id}/enable:
 *   post:
 *     tags: [Schedules]
 *     summary: Enable a schedule
 *     security:
 *       - bearerAuth: []
 */
scheduleRouter.post(
  '/:id/enable',
  validate({ params: scheduleIdParamSchema }),
  asyncHandler(scheduleController.enable),
);

/**
 * @openapi
 * /schedules/{id}/disable:
 *   post:
 *     tags: [Schedules]
 *     summary: Disable a schedule
 *     security:
 *       - bearerAuth: []
 */
scheduleRouter.post(
  '/:id/disable',
  validate({ params: scheduleIdParamSchema }),
  asyncHandler(scheduleController.disable),
);

/**
 * @openapi
 * /schedules/{id}/run-now:
 *   post:
 *     tags: [Schedules]
 *     summary: Run a schedule immediately
 *     security:
 *       - bearerAuth: []
 */
scheduleRouter.post(
  '/:id/run-now',
  validate({ params: scheduleIdParamSchema }),
  asyncHandler(scheduleController.runNow),
);
