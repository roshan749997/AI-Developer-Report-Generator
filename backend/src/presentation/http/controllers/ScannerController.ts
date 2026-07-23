import type { Request, Response } from 'express';
import {
  scanProjectUseCase,
  listProjectCommitsUseCase,
  getProjectCommitUseCase,
  listScanRunsUseCase,
  getScanRunUseCase,
} from '../../../application/use-cases/scanner/index.js';
import { ScanTrigger } from '../../../domain/entities/ScanRun.js';
import type { CommitCategory } from '../../../domain/entities/ScannedCommit.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

export class ScannerController {
  scan = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const body = req.body as {
      todayOnly?: boolean;
      yesterdayOnly?: boolean;
      lookbackDays?: number;
      maxCount?: number;
      fromDate?: string;
      toDate?: string;
    };

    const result = await scanProjectUseCase.execute({
      projectId: req.params.projectId!,
      actor: user,
      trigger: ScanTrigger.MANUAL,
      todayOnly: body.todayOnly,
      yesterdayOnly: body.yesterdayOnly,
      lookbackDays: body.lookbackDays,
      maxCount: body.maxCount,
      fromDate: body.fromDate ? new Date(body.fromDate) : undefined,
      toDate: body.toDate ? new Date(body.toDate) : undefined,
    });

    return ApiResponse.success(res, result, 'Git scan completed');
  };

  listCommits = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const query = req.query as {
      range?: 'all' | 'today' | 'yesterday';
      category?: CommitCategory;
      authorEmail?: string;
      limit?: number;
      skip?: number;
    };

    const result = await listProjectCommitsUseCase.execute(req.params.projectId!, user, {
      range: query.range ?? 'all',
      category: query.category,
      authorEmail: query.authorEmail,
      limit: query.limit,
      skip: query.skip,
    });

    return ApiResponse.success(res, result, 'Commits retrieved', 200, {
      total: result.total,
    });
  };

  listTodayCommits = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const result = await listProjectCommitsUseCase.execute(req.params.projectId!, user, {
      range: 'today',
    });
    return ApiResponse.success(res, result, "Today's commits retrieved");
  };

  listYesterdayCommits = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const result = await listProjectCommitsUseCase.execute(req.params.projectId!, user, {
      range: 'yesterday',
    });
    return ApiResponse.success(res, result, "Yesterday's commits retrieved");
  };

  getCommit = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const commit = await getProjectCommitUseCase.execute(
      req.params.projectId!,
      req.params.hash!,
      user,
    );
    return ApiResponse.success(res, commit, 'Commit retrieved');
  };

  listRuns = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const runs = await listScanRunsUseCase.execute(req.params.projectId!, user);
    return ApiResponse.success(res, runs, 'Scan runs retrieved');
  };

  getRun = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const run = await getScanRunUseCase.execute(req.params.runId!, user);
    return ApiResponse.success(res, run, 'Scan run retrieved');
  };
}

export const scannerController = new ScannerController();
