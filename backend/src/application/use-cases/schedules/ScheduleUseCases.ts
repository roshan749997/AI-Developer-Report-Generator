import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IScanScheduleRepository } from '../../../domain/repositories/IScanScheduleRepository.js';
import type { ScanSchedule } from '../../../domain/entities/ScanSchedule.js';
import type { UserRole } from '../../../domain/entities/User.js';
import { UserRole as Roles } from '../../../domain/entities/User.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../shared/errors/index.js';
import { getAccessibleProject, canManageAllProjects } from '../projects/projectAccess.js';
import { validate as validateCron } from 'node-cron';

export interface CreateScheduleDto {
  projectId: string;
  name: string;
  cronExpression: string;
  timezone?: string;
  scanTodayOnly?: boolean;
  lookbackDays?: number;
  isEnabled?: boolean;
}

export interface UpdateScheduleDto {
  name?: string;
  cronExpression?: string;
  timezone?: string;
  scanTodayOnly?: boolean;
  lookbackDays?: number;
}

function assertCron(expression: string): void {
  if (!validateCron(expression)) {
    throw new BadRequestError(`Invalid cron expression: ${expression}`);
  }
}

async function getAccessibleSchedule(
  schedules: IScanScheduleRepository,
  projects: IProjectRepository,
  scheduleId: string,
  actor: { id: string; role: UserRole },
): Promise<ScanSchedule> {
  const schedule = await schedules.findById(scheduleId);
  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  const isPrivileged = actor.role === Roles.ADMIN || actor.role === Roles.MANAGER;
  if (!isPrivileged && schedule.ownerId !== actor.id) {
    throw new ForbiddenError('You do not have access to this schedule');
  }

  // Ensure project still accessible
  await getAccessibleProject(projects, schedule.projectId, actor);
  return schedule;
}

export class CreateScanScheduleUseCase {
  constructor(
    private readonly schedules: IScanScheduleRepository,
    private readonly projects: IProjectRepository,
  ) {}

  async execute(
    actor: { id: string; role: UserRole },
    input: CreateScheduleDto,
  ): Promise<ScanSchedule> {
    await getAccessibleProject(this.projects, input.projectId, actor);
    assertCron(input.cronExpression);

    try {
      return await this.schedules.create({
        projectId: input.projectId,
        ownerId: actor.id,
        name: input.name.trim(),
        cronExpression: input.cronExpression.trim(),
        timezone: input.timezone?.trim() || 'UTC',
        isEnabled: input.isEnabled ?? true,
        scanTodayOnly: input.scanTodayOnly ?? false,
        lookbackDays: input.lookbackDays ?? 7,
      });
    } catch (error) {
      const err = error as { code?: number };
      if (err.code === 11000) {
        throw new ConflictError('A schedule with this name already exists for the project');
      }
      throw error;
    }
  }
}

export class ListScanSchedulesUseCase {
  constructor(private readonly schedules: IScanScheduleRepository) {}

  async execute(actor: { id: string; role: UserRole }): Promise<ScanSchedule[]> {
    if (canManageAllProjects(actor.role)) {
      return this.schedules.listAll();
    }
    return this.schedules.listByOwner(actor.id);
  }
}

export class GetScanScheduleUseCase {
  constructor(
    private readonly schedules: IScanScheduleRepository,
    private readonly projects: IProjectRepository,
  ) {}

  async execute(scheduleId: string, actor: { id: string; role: UserRole }): Promise<ScanSchedule> {
    return getAccessibleSchedule(this.schedules, this.projects, scheduleId, actor);
  }
}

export class UpdateScanScheduleUseCase {
  constructor(
    private readonly schedules: IScanScheduleRepository,
    private readonly projects: IProjectRepository,
  ) {}

  async execute(
    scheduleId: string,
    actor: { id: string; role: UserRole },
    input: UpdateScheduleDto,
  ): Promise<ScanSchedule> {
    await getAccessibleSchedule(this.schedules, this.projects, scheduleId, actor);

    if (input.cronExpression) {
      assertCron(input.cronExpression);
    }

    const updated = await this.schedules.update(scheduleId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.cronExpression !== undefined
        ? { cronExpression: input.cronExpression.trim() }
        : {}),
      ...(input.timezone !== undefined ? { timezone: input.timezone.trim() } : {}),
      ...(input.scanTodayOnly !== undefined ? { scanTodayOnly: input.scanTodayOnly } : {}),
      ...(input.lookbackDays !== undefined ? { lookbackDays: input.lookbackDays } : {}),
    });

    if (!updated) {
      throw new NotFoundError('Schedule not found');
    }
    return updated;
  }
}

export class SetScanScheduleEnabledUseCase {
  constructor(
    private readonly schedules: IScanScheduleRepository,
    private readonly projects: IProjectRepository,
  ) {}

  async execute(
    scheduleId: string,
    actor: { id: string; role: UserRole },
    isEnabled: boolean,
  ): Promise<ScanSchedule> {
    await getAccessibleSchedule(this.schedules, this.projects, scheduleId, actor);
    const updated = await this.schedules.setEnabled(scheduleId, isEnabled);
    if (!updated) {
      throw new NotFoundError('Schedule not found');
    }
    return updated;
  }
}

export class DeleteScanScheduleUseCase {
  constructor(
    private readonly schedules: IScanScheduleRepository,
    private readonly projects: IProjectRepository,
  ) {}

  async execute(scheduleId: string, actor: { id: string; role: UserRole }): Promise<void> {
    await getAccessibleSchedule(this.schedules, this.projects, scheduleId, actor);
    const deleted = await this.schedules.delete(scheduleId);
    if (!deleted) {
      throw new NotFoundError('Schedule not found');
    }
  }
}
