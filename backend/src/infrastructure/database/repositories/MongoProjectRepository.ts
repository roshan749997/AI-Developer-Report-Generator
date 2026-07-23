import { Types } from 'mongoose';
import type {
  CreateProjectInput,
  IProjectRepository,
  ListProjectsFilter,
  ProjectConnectionMeta,
  UpdateProjectInput,
} from '../../../domain/repositories/IProjectRepository.js';
import type { Project } from '../../../domain/entities/Project.js';
import { ProjectModel, type ProjectDocument } from '../models/ProjectModel.js';

function mapProject(doc: ProjectDocument): Project {
  return {
    id: doc._id.toString(),
    name: doc.name,
    localGitPath: doc.localGitPath,
    gitBranch: doc.gitBranch,
    description: doc.description,
    tags: doc.tags ?? [],
    isEnabled: doc.isEnabled,
    ownerId: doc.ownerId.toString(),
    lastValidatedAt: doc.lastValidatedAt ?? null,
    lastConnectionStatus: doc.lastConnectionStatus ?? null,
    lastConnectionMessage: doc.lastConnectionMessage ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function isObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

export class MongoProjectRepository implements IProjectRepository {
  async create(input: CreateProjectInput): Promise<Project> {
    const created = await ProjectModel.create({
      ...input,
      isEnabled: input.isEnabled ?? true,
    });
    return mapProject(created);
  }

  async findById(id: string): Promise<Project | null> {
    if (!isObjectId(id)) {
      return null;
    }
    const doc = await ProjectModel.findById(id).exec();
    return doc ? mapProject(doc) : null;
  }

  async findByOwnerAndName(ownerId: string, name: string): Promise<Project | null> {
    const doc = await ProjectModel.findOne({ ownerId, name }).exec();
    return doc ? mapProject(doc) : null;
  }

  async list(filter: ListProjectsFilter): Promise<Project[]> {
    const query: Record<string, unknown> = {};

    if (filter.ownerId) {
      query.ownerId = filter.ownerId;
    }

    if (typeof filter.isEnabled === 'boolean') {
      query.isEnabled = filter.isEnabled;
    }

    if (filter.search?.trim()) {
      query.$or = [
        { name: { $regex: filter.search.trim(), $options: 'i' } },
        { description: { $regex: filter.search.trim(), $options: 'i' } },
        { tags: { $elemMatch: { $regex: filter.search.trim(), $options: 'i' } } },
      ];
    }

    const docs = await ProjectModel.find(query).sort({ createdAt: -1 }).exec();
    return docs.map(mapProject);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const doc = await ProjectModel.findByIdAndUpdate(
      id,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.localGitPath !== undefined ? { localGitPath: input.localGitPath } : {}),
        ...(input.gitBranch !== undefined ? { gitBranch: input.gitBranch } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
      },
      { new: true, runValidators: true },
    ).exec();

    return doc ? mapProject(doc) : null;
  }

  async setEnabled(id: string, isEnabled: boolean): Promise<Project | null> {
    const doc = await ProjectModel.findByIdAndUpdate(
      id,
      { isEnabled },
      { new: true },
    ).exec();
    return doc ? mapProject(doc) : null;
  }

  async updateConnectionMeta(id: string, meta: ProjectConnectionMeta): Promise<Project | null> {
    const doc = await ProjectModel.findByIdAndUpdate(
      id,
      {
        lastValidatedAt: meta.lastValidatedAt,
        lastConnectionStatus: meta.lastConnectionStatus,
        lastConnectionMessage: meta.lastConnectionMessage,
      },
      { new: true },
    ).exec();

    return doc ? mapProject(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await ProjectModel.findByIdAndDelete(id).exec();
    return Boolean(result);
  }
}

export const projectRepository = new MongoProjectRepository();
