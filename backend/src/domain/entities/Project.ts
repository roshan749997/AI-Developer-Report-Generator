export interface Project {
  id: string;
  name: string;
  localGitPath: string;
  gitBranch: string;
  description: string;
  tags: string[];
  isEnabled: boolean;
  ownerId: string;
  lastValidatedAt?: Date | null;
  lastConnectionStatus?: 'success' | 'failed' | null;
  lastConnectionMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
