import { Types } from 'mongoose';
import type {
  DashboardActivitySummary,
  IGitActivityRepository,
  ListGitActivityFilter,
  UpsertGitActivityInput,
} from '../../../domain/repositories/IGitActivityRepository.js';
import type { GitActivity } from '../../../domain/entities/GitActivity.js';
import {
  GitActivityModel,
  type GitActivityDocument,
} from '../models/GitActivityModel.js';

function mapActivity(doc: GitActivityDocument): GitActivity {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    repositoryName: doc.repositoryName,
    branch: doc.branch,
    commitHash: doc.commitHash,
    commitMessage: doc.commitMessage,
    author: doc.author,
    commitDate: doc.commitDate,
    changedFiles: doc.changedFiles ?? [],
    insertions: doc.insertions,
    deletions: doc.deletions,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildQuery(filter: ListGitActivityFilter): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (filter.projectId) {
    query.projectId = new Types.ObjectId(filter.projectId);
  }

  if (filter.projectIds && filter.projectIds.length > 0) {
    query.projectId = {
      $in: filter.projectIds.map((id) => new Types.ObjectId(id)),
    };
  }

  if (filter.fromDate || filter.toDate) {
    query.commitDate = {
      ...(filter.fromDate ? { $gte: filter.fromDate } : {}),
      ...(filter.toDate ? { $lte: filter.toDate } : {}),
    };
  }

  return query;
}

export class MongoGitActivityRepository implements IGitActivityRepository {
  async upsertMany(activities: UpsertGitActivityInput[]): Promise<number> {
    if (activities.length === 0) {
      return 0;
    }

    const ops = activities.map((activity) => ({
      updateOne: {
        filter: {
          projectId: new Types.ObjectId(activity.projectId),
          commitHash: activity.commitHash,
        },
        update: {
          $set: {
            repositoryName: activity.repositoryName,
            branch: activity.branch,
            commitMessage: activity.commitMessage,
            author: activity.author,
            commitDate: activity.commitDate,
            changedFiles: activity.changedFiles,
            insertions: activity.insertions,
            deletions: activity.deletions,
          },
          $setOnInsert: {
            projectId: new Types.ObjectId(activity.projectId),
            commitHash: activity.commitHash,
          },
        },
        upsert: true,
      },
    }));

    const result = await GitActivityModel.bulkWrite(ops, { ordered: false });
    return (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0);
  }

  async listByProject(filter: ListGitActivityFilter): Promise<GitActivity[]> {
    const docs = await GitActivityModel.find(buildQuery(filter))
      .sort({ commitDate: -1 })
      .limit(filter.limit ?? 500)
      .exec();

    return docs.map(mapActivity);
  }

  async countByFilter(filter: ListGitActivityFilter): Promise<number> {
    return GitActivityModel.countDocuments(buildQuery(filter)).exec();
  }

  async getDashboardSummary(
    projectIds: string[],
    fromDate: Date,
    toDate: Date,
  ): Promise<DashboardActivitySummary> {
    if (projectIds.length === 0) {
      return {
        todaysCommits: 0,
        todaysChangedFiles: 0,
        projectsScanned: 0,
        latestScanTime: null,
      };
    }

    const objectIds = projectIds.map((id) => new Types.ObjectId(id));
    const todayMatch = {
      projectId: { $in: objectIds },
      commitDate: { $gte: fromDate, $lte: toDate },
    };

    const [todaysCommits, fileAgg, projectAgg, latest] = await Promise.all([
      GitActivityModel.countDocuments(todayMatch).exec(),
      GitActivityModel.aggregate<{ files: string[] }>([
        { $match: todayMatch },
        { $unwind: { path: '$changedFiles', preserveNullAndEmptyArrays: false } },
        { $group: { _id: null, files: { $addToSet: '$changedFiles' } } },
      ]).exec(),
      GitActivityModel.aggregate<{ count: number }>([
        { $match: todayMatch },
        { $group: { _id: '$projectId' } },
        { $count: 'count' },
      ]).exec(),
      GitActivityModel.findOne({ projectId: { $in: objectIds } })
        .sort({ createdAt: -1 })
        .select({ createdAt: 1 })
        .lean()
        .exec(),
    ]);

    return {
      todaysCommits,
      todaysChangedFiles: fileAgg[0]?.files.length ?? 0,
      projectsScanned: projectAgg[0]?.count ?? 0,
      latestScanTime: latest?.createdAt ? new Date(latest.createdAt) : null,
    };
  }
}

export const gitActivityRepository = new MongoGitActivityRepository();
