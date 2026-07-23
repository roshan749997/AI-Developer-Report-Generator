import type { Request, Response } from 'express';
import {
  createScanScheduleUseCase,
  listScanSchedulesUseCase,
  getScanScheduleUseCase,
  updateScanScheduleUseCase,
  setScanScheduleEnabledUseCase,
  deleteScanScheduleUseCase,
} from '../../../application/use-cases/schedules/index.js';
import { scanProjectUseCase } from '../../../application/use-cases/scanner/index.js';
import { scanSchedulerService } from '../../../infrastructure/scheduler/index.js';
import { ScanTrigger } from '../../../domain/entities/ScanRun.js';
import type {
  CreateScheduleDto,
  UpdateScheduleDto,
} from '../../../application/use-cases/schedules/ScheduleUseCases.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

export class ScheduleController {
  create = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const schedule = await createScanScheduleUseCase.execute(
      user,
      req.body as CreateScheduleDto,
    );
    if (schedule.isEnabled) {
      scanSchedulerService.register(schedule);
    }
    return ApiResponse.created(res, schedule, 'Schedule created');
  };

  list = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const schedules = await listScanSchedulesUseCase.execute(user);
    return ApiResponse.success(res, schedules, 'Schedules retrieved');
  };

  getById = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const schedule = await getScanScheduleUseCase.execute(req.params.id!, user);
    return ApiResponse.success(res, schedule, 'Schedule retrieved');
  };

  update = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const schedule = await updateScanScheduleUseCase.execute(
      req.params.id!,
      user,
      req.body as UpdateScheduleDto,
    );
    await scanSchedulerService.refresh(schedule.id);
    return ApiResponse.success(res, schedule, 'Schedule updated');
  };

  enable = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const schedule = await setScanScheduleEnabledUseCase.execute(req.params.id!, user, true);
    scanSchedulerService.register(schedule);
    return ApiResponse.success(res, schedule, 'Schedule enabled');
  };

  disable = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const schedule = await setScanScheduleEnabledUseCase.execute(req.params.id!, user, false);
    scanSchedulerService.unregister(schedule.id);
    return ApiResponse.success(res, schedule, 'Schedule disabled');
  };

  remove = async (req: Request, res: Response) => {
    const user = requireUser(req);
    await deleteScanScheduleUseCase.execute(req.params.id!, user);
    scanSchedulerService.unregister(req.params.id!);
    return ApiResponse.success(res, null, 'Schedule deleted');
  };

  runNow = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const schedule = await getScanScheduleUseCase.execute(req.params.id!, user);

    const result = await scanProjectUseCase.execute({
      projectId: schedule.projectId,
      actor: user,
      scheduleId: schedule.id,
      trigger: ScanTrigger.API,
      todayOnly: schedule.scanTodayOnly,
      lookbackDays: schedule.scanTodayOnly ? undefined : schedule.lookbackDays,
    });

    return ApiResponse.success(res, { schedule, ...result }, 'Scheduled scan executed');
  };

  active = async (_req: Request, res: Response) => {
    requireUser(_req);
    return ApiResponse.success(
      res,
      { activeScheduleIds: scanSchedulerService.listActiveScheduleIds() },
      'Active schedules retrieved',
    );
  };
}

export const scheduleController = new ScheduleController();
