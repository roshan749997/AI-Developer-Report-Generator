import { scanScheduleRepository } from '../database/repositories/MongoScanScheduleRepository.js';
import { scanProjectUseCase } from '../../application/use-cases/scanner/index.js';
import { ScanSchedulerService } from './ScanSchedulerService.js';

export const scanSchedulerService = new ScanSchedulerService(
  scanScheduleRepository,
  scanProjectUseCase,
);

export { ScanSchedulerService } from './ScanSchedulerService.js';
