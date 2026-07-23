import { Types } from 'mongoose';
import type {
  IScannedCommitRepository,
  ListCommitsFilter,
  UpsertScannedCommitInput,
} from '../../../domain/repositories/IScannedCommitRepository.js';
import type { ScannedCommit } from '../../../domain/entities/ScannedCommit.js';
import {
  ScannedCommitModel,
  type ScannedCommitDocument,
} from '../models/ScannedCommitModel.js';

function mapCommit(doc: ScannedCommitDocument): ScannedCommit {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    scanRunId: doc.scanRunId.toString(),
    commitHash: doc.commitHash,
    shortHash: doc.shortHash,
    authorName: doc.authorName,
    authorEmail: doc.authorEmail,
    authoredAt: doc.authoredAt,
    branch: doc.branch,
    commitMessage: doc.commitMessage,
    changedFiles: doc.changedFiles ?? [],
    renamedFiles: doc.renamedFiles ?? [],
    deletedFiles: doc.deletedFiles ?? [],
    insertions: doc.insertions,
    deletions: doc.deletions,
    gitDiff: doc.gitDiff,
    gitDiffTruncated: doc.gitDiffTruncated,
    categories: doc.categories ?? [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function buildQuery(filter: Omit<ListCommitsFilter, 'limit' | 'skip'>) {
  const query: Record<string, unknown> = {
    projectId: filter.projectId,
  };

  if (filter.fromDate || filter.toDate) {
    query.authoredAt = {
      ...(filter.fromDate ? { $gte: filter.fromDate } : {}),
      ...(filter.toDate ? { $lte: filter.toDate } : {}),
    };
  }

  if (filter.authorEmail) {
    query.authorEmail = filter.authorEmail.toLowerCase();
  }

  if (filter.category) {
    query.categories = filter.category;
  }

  if (filter.branch) {
    query.branch = filter.branch;
  }

  return query;
}

export class MongoScannedCommitRepository implements IScannedCommitRepository {
  async upsertMany(commits: UpsertScannedCommitInput[]): Promise<number> {
    if (commits.length === 0) {
      return 0;
    }

    const ops = commits.map((commit) => ({
      updateOne: {
        filter: {
          projectId: new Types.ObjectId(commit.projectId),
          commitHash: commit.commitHash,
        },
        update: {
          $set: {
            scanRunId: new Types.ObjectId(commit.scanRunId),
            shortHash: commit.shortHash,
            authorName: commit.authorName,
            authorEmail: commit.authorEmail,
            authoredAt: commit.authoredAt,
            branch: commit.branch,
            commitMessage: commit.commitMessage,
            changedFiles: commit.changedFiles,
            renamedFiles: commit.renamedFiles,
            deletedFiles: commit.deletedFiles,
            insertions: commit.insertions,
            deletions: commit.deletions,
            gitDiff: commit.gitDiff,
            gitDiffTruncated: commit.gitDiffTruncated,
            categories: commit.categories,
          },
          $setOnInsert: {
            projectId: new Types.ObjectId(commit.projectId),
            commitHash: commit.commitHash,
          },
        },
        upsert: true,
      },
    }));

    const result = await ScannedCommitModel.bulkWrite(ops, { ordered: false });
    return (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0);
  }

  async findByProjectAndHash(
    projectId: string,
    commitHash: string,
  ): Promise<ScannedCommit | null> {
    if (!Types.ObjectId.isValid(projectId)) {
      return null;
    }

    const doc = await ScannedCommitModel.findOne({
      projectId,
      $or: [{ commitHash }, { shortHash: commitHash }],
    }).exec();

    return doc ? mapCommit(doc) : null;
  }

  async list(filter: ListCommitsFilter): Promise<ScannedCommit[]> {
    const docs = await ScannedCommitModel.find(buildQuery(filter))
      .sort({ authoredAt: -1 })
      .skip(filter.skip ?? 0)
      .limit(filter.limit ?? 100)
      .exec();

    return docs.map(mapCommit);
  }

  async count(filter: Omit<ListCommitsFilter, 'limit' | 'skip'>): Promise<number> {
    return ScannedCommitModel.countDocuments(buildQuery(filter)).exec();
  }

  async deleteByProject(projectId: string): Promise<number> {
    const result = await ScannedCommitModel.deleteMany({ projectId }).exec();
    return result.deletedCount ?? 0;
  }
}

export const scannedCommitRepository = new MongoScannedCommitRepository();
