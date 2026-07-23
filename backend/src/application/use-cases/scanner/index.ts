import { projectRepository } from '../../../infrastructure/database/repositories/MongoProjectRepository.js';
import { scannedCommitRepository } from '../../../infrastructure/database/repositories/MongoScannedCommitRepository.js';
import { scanRunRepository } from '../../../infrastructure/database/repositories/MongoScanRunRepository.js';
import { gitScannerService } from '../../../infrastructure/git/index.js';
import { ScanProjectUseCase } from './ScanProjectUseCase.js';
import {
  GetProjectCommitUseCase,
  GetScanRunUseCase,
  ListProjectCommitsUseCase,
  ListScanRunsUseCase,
} from './QueryCommitsUseCase.js';

export const scanProjectUseCase = new ScanProjectUseCase(
  projectRepository,
  scannedCommitRepository,
  scanRunRepository,
  gitScannerService,
);

export const listProjectCommitsUseCase = new ListProjectCommitsUseCase(
  projectRepository,
  scannedCommitRepository,
  gitScannerService,
);

export const getProjectCommitUseCase = new GetProjectCommitUseCase(
  projectRepository,
  scannedCommitRepository,
);

export const listScanRunsUseCase = new ListScanRunsUseCase(projectRepository, scanRunRepository);

export const getScanRunUseCase = new GetScanRunUseCase(projectRepository, scanRunRepository);

export {
  ScanProjectUseCase,
  ListProjectCommitsUseCase,
  GetProjectCommitUseCase,
  ListScanRunsUseCase,
  GetScanRunUseCase,
};
