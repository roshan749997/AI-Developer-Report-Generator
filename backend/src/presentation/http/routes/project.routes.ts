import { Router } from 'express';
import { projectController } from '../controllers/ProjectController.js';
import { activityController } from '../controllers/ActivityController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectIdParamsSchema,
  testConnectionSchema,
  updateProjectSchema,
  validateGitSchema,
} from '../validation/project.validation.js';
import { activityProjectIdParamSchema } from '../validation/activity.validation.js';

/**
 * @openapi
 * tags:
 *   - name: Projects
 *     description: Project management and Git validation
 *   - name: Activity
 *     description: Repository scan and GitActivities storage
 */
export const projectRouter = Router();

projectRouter.use(authenticate);

/**
 * @openapi
 * /projects/validate-git:
 *   post:
 *     tags: [Projects]
 *     summary: Validate a local Git repository and branch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ValidateGitRequest'
 *     responses:
 *       200:
 *         description: Repository is valid
 *       400:
 *         description: Invalid repository or branch
 */
projectRouter.post(
  '/validate-git',
  validate({ body: validateGitSchema }),
  asyncHandler(projectController.validateGit),
);

/**
 * @openapi
 * /projects/test-connection:
 *   post:
 *     tags: [Projects]
 *     summary: Test Git connection for a path and branch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestConnectionRequest'
 *     responses:
 *       200:
 *         description: Connection test result
 */
projectRouter.post(
  '/test-connection',
  validate({ body: testConnectionSchema }),
  asyncHandler(projectController.testConnection),
);

/**
 * @openapi
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       201:
 *         description: Project created
 *   get:
 *     tags: [Projects]
 *     summary: List projects
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isEnabled
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: mine
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Projects retrieved
 */
projectRouter.post(
  '/',
  validate({ body: createProjectSchema }),
  asyncHandler(projectController.create),
);

projectRouter.get(
  '/',
  validate({ query: listProjectsQuerySchema }),
  asyncHandler(projectController.list),
);

/**
 * @openapi
 * /projects/{projectId}/scan:
 *   post:
 *     tags: [Activity]
 *     summary: Scan today's commits and store metadata in GitActivities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scan completed and activities stored
 *       400:
 *         description: Invalid repository path or git repository does not exist
 */
projectRouter.post(
  '/:projectId/scan',
  validate({ params: activityProjectIdParamSchema }),
  asyncHandler(activityController.scan),
);

/**
 * @openapi
 * /projects/{projectId}/activity:
 *   get:
 *     tags: [Activity]
 *     summary: Get today's stored GitActivities for a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Today's activity retrieved
 */
projectRouter.get(
  '/:projectId/activity',
  validate({ params: activityProjectIdParamSchema }),
  asyncHandler(activityController.todayActivity),
);

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *     responses:
 *       200:
 *         description: Project retrieved
 *   patch:
 *     tags: [Projects]
 *     summary: Edit a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProjectRequest'
 *     responses:
 *       200:
 *         description: Project updated
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *     responses:
 *       200:
 *         description: Project deleted
 */
projectRouter.get(
  '/:id',
  validate({ params: projectIdParamsSchema }),
  asyncHandler(projectController.getById),
);

projectRouter.patch(
  '/:id',
  validate({ params: projectIdParamsSchema, body: updateProjectSchema }),
  asyncHandler(projectController.update),
);

projectRouter.delete(
  '/:id',
  validate({ params: projectIdParamsSchema }),
  asyncHandler(projectController.remove),
);

/**
 * @openapi
 * /projects/{id}/enable:
 *   post:
 *     tags: [Projects]
 *     summary: Enable a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *     responses:
 *       200:
 *         description: Project enabled
 */
projectRouter.post(
  '/:id/enable',
  validate({ params: projectIdParamsSchema }),
  asyncHandler(projectController.enable),
);

/**
 * @openapi
 * /projects/{id}/disable:
 *   post:
 *     tags: [Projects]
 *     summary: Disable a project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *     responses:
 *       200:
 *         description: Project disabled
 */
projectRouter.post(
  '/:id/disable',
  validate({ params: projectIdParamsSchema }),
  asyncHandler(projectController.disable),
);

/**
 * @openapi
 * /projects/{id}/test-connection:
 *   post:
 *     tags: [Projects]
 *     summary: Test Git connection for a saved project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *     responses:
 *       200:
 *         description: Connection test result
 */
projectRouter.post(
  '/:id/test-connection',
  validate({ params: projectIdParamsSchema }),
  asyncHandler(projectController.testProjectConnection),
);
