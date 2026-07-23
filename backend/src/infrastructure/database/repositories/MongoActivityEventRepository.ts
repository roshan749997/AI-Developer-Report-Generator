import { Types } from 'mongoose';
import type {
  CreateActivityEventInput,
  IActivityEventRepository,
} from '../../../domain/repositories/IActivityEventRepository.js';
import type { ActivityEvent } from '../../../domain/entities/ActivityEvent.js';
import {
  ActivityEventModel,
  type ActivityEventDocument,
} from '../models/ActivityEventModel.js';

function mapEvent(doc: ActivityEventDocument): ActivityEvent {
  return {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    actorUserId: doc.actorUserId ? doc.actorUserId.toString() : null,
    type: doc.type as ActivityEvent['type'],
    title: doc.title,
    description: doc.description ?? '',
    meta: doc.meta ?? {},
    createdAt: doc.createdAt,
  };
}

export class MongoActivityEventRepository implements IActivityEventRepository {
  async create(input: CreateActivityEventInput): Promise<ActivityEvent> {
    const created = await ActivityEventModel.create({
      organizationId: new Types.ObjectId(input.organizationId),
      actorUserId: input.actorUserId
        ? new Types.ObjectId(input.actorUserId)
        : null,
      type: input.type,
      title: input.title,
      description: input.description ?? '',
      meta: input.meta ?? {},
    });
    return mapEvent(created);
  }

  async listByOrganization(
    organizationId: string,
    limit = 50,
  ): Promise<ActivityEvent[]> {
    const docs = await ActivityEventModel.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(mapEvent);
  }
}

export const activityEventRepository = new MongoActivityEventRepository();
