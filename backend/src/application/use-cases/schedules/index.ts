import { projectRepository } from '../../../infrastructure/database/repositories/MongoProjectRepository.js';
import { scanScheduleRepository } from '../../../infrastructure/database/repositories/MongoScanScheduleRepository.js';
import {
  CreateScanScheduleUseCase,
  DeleteScanScheduleUseCase,
  GetScanScheduleUseCase,
  ListScanSchedulesUseCase,
  SetScanScheduleEnabledUseCase,
  UpdateScanScheduleUseCase,
} from './ScheduleUseCases.js';

export const createScanScheduleUseCase = new CreateScanScheduleUseCase(
  scanScheduleRepository,
  projectRepository,
);

export const listScanSchedulesUseCase = new ListScanSchedulesUseCase(scanScheduleRepository);

export const getScanScheduleUseCase = new GetScanScheduleUseCase(
  scanScheduleRepository,
  projectRepository,
);

export const updateScanScheduleUseCase = new UpdateScanScheduleUseCase(
  scanScheduleRepository,
  projectRepository,
);

export const setScanScheduleEnabledUseCase = new SetScanScheduleEnabledUseCase(
  scanScheduleRepository,
  projectRepository,
);

export const deleteScanScheduleUseCase = new DeleteScanScheduleUseCase(
  scanScheduleRepository,
  projectRepository,
);

export {
  CreateScanScheduleUseCase,
  ListScanSchedulesUseCase,
  GetScanScheduleUseCase,
  UpdateScanScheduleUseCase,
  SetScanScheduleEnabledUseCase,
  DeleteScanScheduleUseCase,
};
