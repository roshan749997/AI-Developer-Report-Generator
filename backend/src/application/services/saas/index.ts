import { organizationRepository } from '../../../infrastructure/database/repositories/MongoOrganizationRepository.js';
import { invitationRepository } from '../../../infrastructure/database/repositories/MongoInvitationRepository.js';
import { notificationRepository } from '../../../infrastructure/database/repositories/MongoNotificationRepository.js';
import { auditLogRepository } from '../../../infrastructure/database/repositories/MongoAuditLogRepository.js';
import { activityEventRepository } from '../../../infrastructure/database/repositories/MongoActivityEventRepository.js';
import { userRepository } from '../../../infrastructure/database/repositories/MongoUserRepository.js';
import {
  jwtTokenService,
  passwordHasher,
  tokenService,
} from '../../../infrastructure/security/index.js';
import { OrganizationService } from './OrganizationService.js';
import { InvitationService } from './InvitationService.js';
import {
  AuditService,
  NotificationService,
  SaasUserService,
  TimelineService,
} from './SaasServices.js';

export const organizationService = new OrganizationService(
  organizationRepository,
  userRepository,
  activityEventRepository,
  jwtTokenService,
  tokenService,
);

export const invitationService = new InvitationService(
  invitationRepository,
  organizationRepository,
  userRepository,
  notificationRepository,
  activityEventRepository,
  passwordHasher,
  tokenService,
);

export const saasUserService = new SaasUserService(userRepository);

export const notificationService = new NotificationService(notificationRepository);

export const auditService = new AuditService(auditLogRepository);

export const timelineService = new TimelineService(activityEventRepository);

export {
  OrganizationService,
  InvitationService,
  SaasUserService,
  NotificationService,
  AuditService,
  TimelineService,
};
