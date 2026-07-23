import { projectRepository } from '../../../infrastructure/database/repositories/MongoProjectRepository.js';
import { scannedCommitRepository } from '../../../infrastructure/database/repositories/MongoScannedCommitRepository.js';
import { aiReportRepository } from '../../../infrastructure/database/repositories/MongoAiReportRepository.js';
import { openAiResponsesClient } from '../../../infrastructure/ai/index.js';
import { GenerateAiReportUseCase } from './GenerateAiReportUseCase.js';
import { GetAiReportUseCase, ListAiReportsUseCase } from './QueryAiReportsUseCase.js';

export const generateAiReportUseCase = new GenerateAiReportUseCase(
  projectRepository,
  scannedCommitRepository,
  aiReportRepository,
  openAiResponsesClient,
);

export const listAiReportsUseCase = new ListAiReportsUseCase(
  projectRepository,
  aiReportRepository,
);

export const getAiReportUseCase = new GetAiReportUseCase(
  projectRepository,
  aiReportRepository,
);

export { GenerateAiReportUseCase, ListAiReportsUseCase, GetAiReportUseCase };
