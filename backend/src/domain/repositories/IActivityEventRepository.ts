import type { ActivityEvent, ActivityEventType } from '../entities/ActivityEvent.js';

export interface CreateActivityEventInput {
  organizationId: string;
  actorUserId?: string | null;
  type: ActivityEventType;
  title: string;
  description?: string;
  meta?: Record<string, unknown>;
}

export interface IActivityEventRepository {
  create(input: CreateActivityEventInput): Promise<ActivityEvent>;
  listByOrganization(organizationId: string, limit?: number): Promise<ActivityEvent[]>;
}
