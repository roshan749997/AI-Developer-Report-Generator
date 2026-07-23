import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IDailyReportRepository } from '../../../domain/repositories/IDailyReportRepository.js';
import type { UserRole } from '../../../domain/entities/User.js';
import { NotFoundError } from '../../../shared/errors/index.js';
import { getAccessibleProject } from '../../use-cases/projects/projectAccess.js';
import {
  exportService,
  type ExportFileResult,
  type ExportFormat,
} from './ExportService.js';

/**
 * Loads a report (with access control) and builds an in-memory export file.
 */
export class ReportExportService {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly reports: IDailyReportRepository,
  ) {}

  async export(
    reportId: string,
    format: ExportFormat,
    actor: { id: string; role: UserRole },
  ): Promise<ExportFileResult> {
    const report = await this.reports.findById(reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    const project = await getAccessibleProject(
      this.projects,
      report.projectId,
      actor,
    );

    return exportService.export(format, {
      report,
      projectName: project.name,
    });
  }
}
