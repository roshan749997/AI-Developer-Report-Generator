import { Router } from 'express';
import { aiController } from '../controllers/AiController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  aiProjectIdParamSchema,
  aiReportIdParamSchema,
  generateAiReportSchema,
  listAiReportsQuerySchema,
} from '../validation/ai.validation.js';

/**
 * @openapi
 * tags:
 *   - name: AI Engine
 *     description: OpenAI Responses API report generation and history
 */
export const aiRouter = Router();

aiRouter.use(authenticate);

/**
 * @openapi
 * /ai/projects/{projectId}/reports/generate:
 *   post:
 *     tags: [AI Engine]
 *     summary: Generate a structured developer report from scanned commits
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               todayOnly:
 *                 type: boolean
 *               fromDate:
 *                 type: string
 *                 format: date-time
 *               toDate:
 *                 type: string
 *                 format: date-time
 *               commitLimit:
 *                 type: integer
 *               previousReportsLimit:
 *                 type: integer
 *     responses:
 *       201:
 *         description: AI report generated and stored
 */
aiRouter.post(
  '/projects/:projectId/reports/generate',
  validate({ params: aiProjectIdParamSchema, body: generateAiReportSchema }),
  asyncHandler(aiController.generate),
);

/**
 * @openapi
 * /ai/projects/{projectId}/reports:
 *   get:
 *     tags: [AI Engine]
 *     summary: List AI report history for a project
 *     security:
 *       - bearerAuth: []
 */
aiRouter.get(
  '/projects/:projectId/reports',
  validate({ params: aiProjectIdParamSchema, query: listAiReportsQuerySchema }),
  asyncHandler(aiController.list),
);

/**
 * @openapi
 * /ai/reports/{reportId}:
 *   get:
 *     tags: [AI Engine]
 *     summary: Get an AI report by ID
 *     security:
 *       - bearerAuth: []
 */
aiRouter.get(
  '/reports/:reportId',
  validate({ params: aiReportIdParamSchema }),
  asyncHandler(aiController.getById),
);
