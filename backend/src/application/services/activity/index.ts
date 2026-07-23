import { projectRepository } from '../../../infrastructure/database/repositories/MongoProjectRepository.js';
import { gitActivityRepository } from '../../../infrastructure/database/repositories/MongoGitActivityRepository.js';
import { gitScannerService } from '../../../infrastructure/git/index.js';
import { ScanProjectActivityService } from './ScanProjectActivityService.js';
import { GetProjectActivityService } from './GetProjectActivityService.js';
import { GetDashboardSummaryService } from './GetDashboardSummaryService.js';

export const scanProjectActivityService = new ScanProjectActivityService(
  projectRepository,
  gitActivityRepository,
  gitScannerService,
);

export const getProjectActivityService = new GetProjectActivityService(
  projectRepository,
  gitActivityRepository,
  gitScannerService,
);

export const getDashboardSummaryService = new GetDashboardSummaryService(
  projectRepository,
  gitActivityRepository,
  gitScannerService,
);

export {
  ScanProjectActivityService,
  GetProjectActivityService,
  GetDashboardSummaryService,
};
