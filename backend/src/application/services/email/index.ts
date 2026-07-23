import { projectRepository } from '../../../infrastructure/database/repositories/MongoProjectRepository.js';
import { dailyReportRepository } from '../../../infrastructure/database/repositories/MongoDailyReportRepository.js';
import { emailLogRepository } from '../../../infrastructure/database/repositories/MongoEmailLogRepository.js';
import { emailService } from '../../../infrastructure/email/index.js';
import { SendReportEmailService } from './SendReportEmailService.js';

export const sendReportEmailService = new SendReportEmailService(
  projectRepository,
  dailyReportRepository,
  emailLogRepository,
  emailService,
);

export { SendReportEmailService };
