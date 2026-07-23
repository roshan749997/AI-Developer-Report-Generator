import { jobScheduler } from '../../../jobs/index.js';
import { schedulerLogRepository } from '../../../infrastructure/database/repositories/MongoSchedulerLogRepository.js';
import { JobsService } from './JobsService.js';

export const jobsService = new JobsService(jobScheduler, schedulerLogRepository);

export { JobsService };
