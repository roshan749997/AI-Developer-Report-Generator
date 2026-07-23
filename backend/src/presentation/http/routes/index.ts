import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { projectRouter } from './project.routes.js';
import { scannerRouter } from './scanner.routes.js';
import { scheduleRouter } from './schedule.routes.js';
import { aiRouter } from './ai.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { reportRouter } from './report.routes.js';
import { jobsRouter } from './jobs.routes.js';
import { emailRouter } from './email.routes.js';
import {
  organizationRouter,
  saasUsersRouter,
  invitationRouter,
  notificationRouter,
  auditRouter,
  timelineRouter,
  profileRouter,
} from './saas.routes.js';

/**
 * Root API router.
 */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/projects', projectRouter);
apiRouter.use('/scanner', scannerRouter);
apiRouter.use('/schedules', scheduleRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/jobs', jobsRouter);
apiRouter.use('/email', emailRouter);
apiRouter.use('/organizations', organizationRouter);
apiRouter.use('/org/users', saasUsersRouter);
apiRouter.use('/invitations', invitationRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/audit-logs', auditRouter);
apiRouter.use('/timeline', timelineRouter);
apiRouter.use('/profile', profileRouter);

