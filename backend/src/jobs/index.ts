import { projectRepository } from '../infrastructure/database/repositories/MongoProjectRepository.js';
import { gitActivityRepository } from '../infrastructure/database/repositories/MongoGitActivityRepository.js';
import { dailyReportRepository } from '../infrastructure/database/repositories/MongoDailyReportRepository.js';
import { schedulerLogRepository } from '../infrastructure/database/repositories/MongoSchedulerLogRepository.js';
import { gitScannerService } from '../infrastructure/git/index.js';
import { geminiReportClient } from '../infrastructure/ai/GeminiReportClient.js';
import { DailyReportJob } from './dailyReport.job.js';
import { JobScheduler } from './scheduler.js';

export const dailyReportJob = new DailyReportJob(
  projectRepository,
  gitActivityRepository,
  dailyReportRepository,
  schedulerLogRepository,
  gitScannerService,
  geminiReportClient,
);

export const jobScheduler = new JobScheduler(dailyReportJob);

export { DailyReportJob } from './dailyReport.job.js';
export { JobScheduler } from './scheduler.js';
export {
  getKolkataTodayRange,
  getNextKolkataEightPm,
  KOLKATA_TZ,
} from './kolkataTime.js';
