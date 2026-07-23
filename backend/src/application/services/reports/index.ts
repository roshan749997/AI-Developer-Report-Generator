import { projectRepository } from '../../../infrastructure/database/repositories/MongoProjectRepository.js';
import { gitActivityRepository } from '../../../infrastructure/database/repositories/MongoGitActivityRepository.js';
import { dailyReportRepository } from '../../../infrastructure/database/repositories/MongoDailyReportRepository.js';
import { geminiReportClient } from '../../../infrastructure/ai/GeminiReportClient.js';
import { gitScannerService } from '../../../infrastructure/git/index.js';
import { AIReportService } from './AIReportService.js';
import { ReportExportService } from './ReportExportService.js';
import { ExportService, exportService } from './ExportService.js';

export const aiReportService = new AIReportService(
  projectRepository,
  gitActivityRepository,
  dailyReportRepository,
  geminiReportClient,
  gitScannerService,
);

export const reportExportService = new ReportExportService(
  projectRepository,
  dailyReportRepository,
);

export { AIReportService, ReportExportService, ExportService, exportService };
