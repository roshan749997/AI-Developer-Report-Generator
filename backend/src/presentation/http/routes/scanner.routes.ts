import { Router } from 'express';
import { scannerController } from '../controllers/ScannerController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  commitHashParamSchema,
  listCommitsQuerySchema,
  projectIdParamSchema,
  runIdParamSchema,
  triggerScanSchema,
} from '../validation/scanner.validation.js';

/**
 * @openapi
 * tags:
 *   - name: Scanner
 *     description: Git commit scanning and history
 */
export const scannerRouter = Router();

scannerRouter.use(authenticate);

/**
 * @openapi
 * /scanner/projects/{projectId}/scan:
 *   post:
 *     tags: [Scanner]
 *     summary: Scan a project repository and store commits
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
 *               yesterdayOnly:
 *                 type: boolean
 *               lookbackDays:
 *                 type: integer
 *               maxCount:
 *                 type: integer
 *               fromDate:
 *                 type: string
 *                 format: date-time
 *               toDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Scan completed
 */
scannerRouter.post(
  '/projects/:projectId/scan',
  validate({ params: projectIdParamSchema, body: triggerScanSchema }),
  asyncHandler(scannerController.scan),
);

/**
 * @openapi
 * /scanner/projects/{projectId}/commits:
 *   get:
 *     tags: [Scanner]
 *     summary: List scanned commit history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [all, today, yesterday]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Commits retrieved
 */
scannerRouter.get(
  '/projects/:projectId/commits',
  validate({ params: projectIdParamSchema, query: listCommitsQuerySchema }),
  asyncHandler(scannerController.listCommits),
);

/**
 * @openapi
 * /scanner/projects/{projectId}/commits/today:
 *   get:
 *     tags: [Scanner]
 *     summary: List today's scanned commits
 *     security:
 *       - bearerAuth: []
 */
scannerRouter.get(
  '/projects/:projectId/commits/today',
  validate({ params: projectIdParamSchema }),
  asyncHandler(scannerController.listTodayCommits),
);

/**
 * @openapi
 * /scanner/projects/{projectId}/commits/yesterday:
 *   get:
 *     tags: [Scanner]
 *     summary: List yesterday's scanned commits
 *     security:
 *       - bearerAuth: []
 */
scannerRouter.get(
  '/projects/:projectId/commits/yesterday',
  validate({ params: projectIdParamSchema }),
  asyncHandler(scannerController.listYesterdayCommits),
);

/**
 * @openapi
 * /scanner/projects/{projectId}/commits/{hash}:
 *   get:
 *     tags: [Scanner]
 *     summary: Get a scanned commit by hash
 *     security:
 *       - bearerAuth: []
 */
scannerRouter.get(
  '/projects/:projectId/commits/:hash',
  validate({ params: commitHashParamSchema }),
  asyncHandler(scannerController.getCommit),
);

/**
 * @openapi
 * /scanner/projects/{projectId}/runs:
 *   get:
 *     tags: [Scanner]
 *     summary: List scan runs for a project
 *     security:
 *       - bearerAuth: []
 */
scannerRouter.get(
  '/projects/:projectId/runs',
  validate({ params: projectIdParamSchema }),
  asyncHandler(scannerController.listRuns),
);

/**
 * @openapi
 * /scanner/runs/{runId}:
 *   get:
 *     tags: [Scanner]
 *     summary: Get a scan run by ID
 *     security:
 *       - bearerAuth: []
 */
scannerRouter.get(
  '/runs/:runId',
  validate({ params: runIdParamSchema }),
  asyncHandler(scannerController.getRun),
);
