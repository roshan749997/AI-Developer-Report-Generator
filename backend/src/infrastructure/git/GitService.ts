import { access, constants, stat } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { BadRequestError } from '../../shared/errors/index.js';

const execFileAsync = promisify(execFile);

export interface GitValidationResult {
  valid: boolean;
  localGitPath: string;
  gitBranch: string;
  currentBranch?: string;
  remotes?: string[];
  message: string;
}

export interface GitConnectionResult {
  success: boolean;
  localGitPath: string;
  gitBranch: string;
  remoteUrl?: string;
  reachable: boolean;
  message: string;
  details?: {
    isRepo: boolean;
    branchExists: boolean;
    hasRemote: boolean;
  };
}

async function runGit(cwd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
      timeout: 20_000,
    });
    return stdout.trim();
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    const detail = (err.stderr || err.message || 'Git command failed').toString().trim();
    throw new BadRequestError(detail || 'Git command failed');
  }
}

export class GitService {
  async assertPathExists(localGitPath: string): Promise<string> {
    const resolved = path.resolve(localGitPath);

    try {
      await access(resolved, constants.R_OK);
    } catch {
      throw new BadRequestError(`Local Git path does not exist or is not readable: ${resolved}`);
    }

    const info = await stat(resolved);
    if (!info.isDirectory()) {
      throw new BadRequestError(`Local Git path is not a directory: ${resolved}`);
    }

    return resolved;
  }

  async validateRepository(localGitPath: string, gitBranch: string): Promise<GitValidationResult> {
    const resolved = await this.assertPathExists(localGitPath);

    const isRepo = await runGit(resolved, ['rev-parse', '--is-inside-work-tree']);
    if (isRepo !== 'true') {
      throw new BadRequestError('Path is not a valid Git repository');
    }

    const currentBranch = await runGit(resolved, ['rev-parse', '--abbrev-ref', 'HEAD']);

    try {
      await runGit(resolved, ['rev-parse', '--verify', '--quiet', gitBranch]);
    } catch {
      throw new BadRequestError(`Git branch "${gitBranch}" was not found in the repository`);
    }

    let remotes: string[] = [];
    try {
      const remoteOutput = await runGit(resolved, ['remote']);
      remotes = remoteOutput ? remoteOutput.split(/\r?\n/).filter(Boolean) : [];
    } catch {
      remotes = [];
    }

    return {
      valid: true,
      localGitPath: resolved,
      gitBranch,
      currentBranch,
      remotes,
      message: `Valid Git repository. Branch "${gitBranch}" exists.`,
    };
  }

  async testConnection(localGitPath: string, gitBranch: string): Promise<GitConnectionResult> {
    const resolved = await this.assertPathExists(localGitPath);

    let isRepo = false;
    let branchExists = false;
    let hasRemote = false;
    let remoteUrl: string | undefined;

    try {
      isRepo = (await runGit(resolved, ['rev-parse', '--is-inside-work-tree'])) === 'true';
    } catch {
      return {
        success: false,
        localGitPath: resolved,
        gitBranch,
        reachable: false,
        message: 'Path is not a valid Git repository',
        details: { isRepo, branchExists, hasRemote },
      };
    }

    try {
      await runGit(resolved, ['rev-parse', '--verify', '--quiet', gitBranch]);
      branchExists = true;
    } catch {
      return {
        success: false,
        localGitPath: resolved,
        gitBranch,
        reachable: false,
        message: `Git branch "${gitBranch}" was not found`,
        details: { isRepo, branchExists, hasRemote },
      };
    }

    // Local working tree is readable for the selected branch.
    await runGit(resolved, ['status', '--porcelain', '--branch']);

    try {
      const remotes = (await runGit(resolved, ['remote'])).split(/\r?\n/).filter(Boolean);
      hasRemote = remotes.length > 0;

      if (hasRemote) {
        const primaryRemote = remotes[0]!;
        remoteUrl = await runGit(resolved, ['remote', 'get-url', primaryRemote]);

        // Prefer probing the remote without mutating local refs.
        await runGit(resolved, ['ls-remote', '--heads', primaryRemote, gitBranch]);
      }
    } catch (error) {
      const message =
        error instanceof BadRequestError
          ? error.message
          : 'Failed to reach Git remote';

      return {
        success: false,
        localGitPath: resolved,
        gitBranch,
        remoteUrl,
        reachable: false,
        message,
        details: { isRepo, branchExists, hasRemote },
      };
    }

    return {
      success: true,
      localGitPath: resolved,
      gitBranch,
      remoteUrl,
      reachable: true,
      message: hasRemote
        ? `Connection successful. Remote reachable for branch "${gitBranch}".`
        : `Local repository is accessible for branch "${gitBranch}" (no remotes configured).`,
      details: { isRepo, branchExists, hasRemote },
    };
  }
}

export const gitService = new GitService();
