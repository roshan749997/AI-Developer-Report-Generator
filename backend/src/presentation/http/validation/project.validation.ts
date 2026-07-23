import { z } from 'zod';

const tagSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Tags may only contain letters, numbers, dots, underscores, and hyphens');

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(150),
  localGitPath: z.string().trim().min(1).max(500),
  gitBranch: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().default(''),
  tags: z.array(tagSchema).max(20).optional().default([]),
  validateGit: z.boolean().optional().default(true),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    localGitPath: z.string().trim().min(1).max(500).optional(),
    gitBranch: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    tags: z.array(tagSchema).max(20).optional(),
    validateGit: z.boolean().optional().default(true),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.localGitPath !== undefined ||
      data.gitBranch !== undefined ||
      data.description !== undefined ||
      data.tags !== undefined,
    { message: 'At least one field must be provided' },
  );

export const projectIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const listProjectsQuerySchema = z.object({
  isEnabled: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  search: z.string().trim().max(100).optional(),
  mine: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export const validateGitSchema = z.object({
  localGitPath: z.string().trim().min(1).max(500),
  gitBranch: z.string().trim().min(1).max(200),
});

export const testConnectionSchema = z.object({
  localGitPath: z.string().trim().min(1).max(500),
  gitBranch: z.string().trim().min(1).max(200),
});
