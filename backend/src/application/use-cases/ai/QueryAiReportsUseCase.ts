import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IAiReportRepository } from '../../../domain/repositories/IAiReportRepository.js';
import type { AiReport } from '../../../domain/entities/AiReport.js';
import type { UserRole } from '../../../domain/entities/User.js';
import { NotFoundError } from '../../../shared/errors/index.js';
import { getAccessibleProject } from '../projects/projectAccess.js';

export class ListAiReportsUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly reports: IAiReportRepository,
  ) {}

  async execute(
    projectId: string,
    actor: { id: string; role: UserRole },
    limit = 50,
  ): Promise<AiReport[]> {
    await getAccessibleProject(this.projects, projectId, actor);
    return this.reports.listByProject(projectId, limit);
  }
}

export class GetAiReportUseCase {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly reports: IAiReportRepository,
  ) {}

  async execute(
    reportId: string,
    actor: { id: string; role: UserRole },
  ): Promise<AiReport> {
    const report = await this.reports.findById(reportId);
    if (!report) {
      throw new NotFoundError('AI report not found');
    }

    await getAccessibleProject(this.projects, report.projectId, actor);
    return report;
  }
}
