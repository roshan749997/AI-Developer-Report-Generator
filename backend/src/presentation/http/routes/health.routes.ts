import { Router } from 'express';
import { ApiResponse } from '../response/index.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

/**
 * Health / readiness probe — no business logic.
 */
export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler((_req, res) => {
    return ApiResponse.success(
      res,
      {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      'Service healthy',
    );
  }),
);
