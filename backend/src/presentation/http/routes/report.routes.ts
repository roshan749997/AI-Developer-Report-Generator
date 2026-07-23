import { Router } from 'express';
import { reportController } from '../controllers/ReportController.js';
import { emailController } from '../controllers/EmailController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  reportIdParamSchema,
  reportProjectIdParamSchema,
} from '../validation/report.validation.js';
import { sendReportEmailBodySchema } from '../validation/email.validation.js';

/**
 * @openapi
 * tags:
 *   - name: Reports
 *     description: Gemini daily work report generation from GitActivities
 */
export const reportRouter = Router();

reportRouter.use(authenticate);

reportRouter.post(
  '/generate/:projectId',
  validate({ params: reportProjectIdParamSchema }),
  asyncHandler(reportController.generate),
);

reportRouter.get(
  '/history/:projectId',
  validate({ params: reportProjectIdParamSchema }),
  asyncHandler(reportController.history),
);

reportRouter.get(
  '/:reportId/export/pdf',
  validate({ params: reportIdParamSchema }),
  asyncHandler(reportController.exportPdf),
);

reportRouter.get(
  '/:reportId/export/docx',
  validate({ params: reportIdParamSchema }),
  asyncHandler(reportController.exportDocx),
);

reportRouter.get(
  '/:reportId/export/md',
  validate({ params: reportIdParamSchema }),
  asyncHandler(reportController.exportMarkdown),
);

/**
 * @openapi
 * /reports/{reportId}/email:
 *   post:
 *     tags: [Reports]
 *     summary: Email a report to one or more recipients
 *     security:
 *       - bearerAuth: []
 */
reportRouter.post(
  '/:reportId/email',
  validate({ params: reportIdParamSchema, body: sendReportEmailBodySchema }),
  asyncHandler(emailController.sendReport),
);

reportRouter.get(
  '/:projectId/today',
  validate({ params: reportProjectIdParamSchema }),
  asyncHandler(reportController.today),
);
