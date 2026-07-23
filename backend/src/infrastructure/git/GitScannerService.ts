/**
 * Git Scanner using simple-git.
 * Collects commit metadata, stats, diffs, and category labels.
 */
import path from 'node:path';
import { simpleGit } from 'simple-git';
import { access, constants, stat } from 'node:fs/promises';
import { BadRequestError } from '../../shared/errors/index.js';
import { classifyCommit } from './CommitClassifier.js';
import type { CommitCategory } from '../../domain/entities/ScannedCommit.js';
import { env } from '../../config/env.js';

export interface ScanCommitOptions {
  branch: string;
  fromDate?: Date;
  toDate?: Date;
  maxCount?: number;
}

export interface RawScannedCommit {
  commitHash: string;
  shortHash: string;
  authorName: string;
  authorEmail: string;
  authoredAt: Date;
  branch: string;
  commitMessage: string;
  changedFiles: string[];
  renamedFiles: string[];
  deletedFiles: string[];
  insertions: number;
  deletions: number;
  gitDiff: string;
  gitDiffTruncated: boolean;
  categories: CommitCategory[];
}

/** Metadata-only commit shape for GitActivities (no full diff). */
export interface RawActivityCommit {
  commitHash: string;
  author: string;
  authoredAt: Date;
  branch: string;
  commitMessage: string;
  changedFiles: string[];
  insertions: number;
  deletions: number;
}

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function formatGitDate(date: Date): string {
  return date.toISOString();
}

export class GitScannerService {
  private async assertRepo(localGitPath: string): Promise<string> {
    const resolved = path.resolve(localGitPath);

    try {
      await access(resolved, constants.R_OK);
    } catch {
      throw new BadRequestError(
        'Local Git path does not exist or is not readable: ' + resolved,
      );
    }

    const info = await stat(resolved);
    if (!info.isDirectory()) {
      throw new BadRequestError('Local Git path is not a directory: ' + resolved);
    }

    const git = simpleGit(resolved);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      throw new BadRequestError('Path is not a valid Git repository');
    }

    return resolved;
  }

  private async openRepo(localGitPath: string, branch: string) {
    const resolved = await this.assertRepo(localGitPath);
    const git = simpleGit({
      baseDir: resolved,
      binary: 'git',
      maxConcurrentProcesses: 1,
      trimmed: true,
    });

    try {
      await git.revparse(['--verify', branch]);
    } catch {
      throw new BadRequestError('Git branch "' + branch + '" was not found');
    }

    return { resolved, git };
  }

  private buildLogOptions(options: ScanCommitOptions): Record<string, unknown> {
    const logOptions: Record<string, unknown> = {
      format: {
        hash: '%H',
        date: '%aI',
        message: '%s',
        body: '%b',
        author_name: '%an',
        author_email: '%ae',
      },
      maxCount: options.maxCount ?? env.GIT_SCAN_MAX_COMMITS,
    };

    if (options.fromDate) {
      logOptions['--since'] = formatGitDate(options.fromDate);
    }
    if (options.toDate) {
      logOptions['--until'] = formatGitDate(options.toDate);
    }

    // Include branch ref as a positional git-log argument.
    logOptions[options.branch] = null;
    return logOptions;
  }

  private async collectFileStats(
    git: ReturnType<typeof simpleGit>,
    commitHash: string,
  ): Promise<{
    changedFiles: string[];
    renamedFiles: string[];
    deletedFiles: string[];
    insertions: number;
    deletions: number;
  }> {
    const changedFiles: string[] = [];
    const renamedFiles: string[] = [];
    const deletedFiles: string[] = [];
    let insertions = 0;
    let deletions = 0;

    try {
      const summary = await git.diffSummary([commitHash + '^', commitHash]);
      insertions = summary.insertions;
      deletions = summary.deletions;
      for (const file of summary.files) {
        changedFiles.push(file.file);
      }
    } catch {
      // Root commit has no parent — use --root below.
    }

    try {
      const nameStatus = await git.raw([
        'diff-tree',
        '--root',
        '--no-commit-id',
        '--name-status',
        '-r',
        '-M',
        commitHash,
      ]);

      for (const line of nameStatus.split(/\r?\n/).filter(Boolean)) {
        const parts = line.split('\t');
        const status = parts[0] ?? '';
        if (status.startsWith('R') && parts[1] && parts[2]) {
          renamedFiles.push(parts[1] + ' -> ' + parts[2]);
          if (!changedFiles.includes(parts[2])) {
            changedFiles.push(parts[2]);
          }
        } else if (status.startsWith('D') && parts[1]) {
          deletedFiles.push(parts[1]);
          if (!changedFiles.includes(parts[1])) {
            changedFiles.push(parts[1]);
          }
        } else if (parts[1] && !changedFiles.includes(parts[1])) {
          changedFiles.push(parts[1]);
        }
      }
    } catch {
      // ignore name-status failures
    }

    if (insertions === 0 && deletions === 0) {
      try {
        const numstat = await git.raw([
          'diff-tree',
          '--root',
          '--no-commit-id',
          '--numstat',
          '-r',
          '-M',
          commitHash,
        ]);
        for (const line of numstat.split(/\r?\n/).filter(Boolean)) {
          const [added, removed] = line.split('\t');
          if (added !== '-' && added !== undefined) {
            insertions += Number(added) || 0;
          }
          if (removed !== '-' && removed !== undefined) {
            deletions += Number(removed) || 0;
          }
        }
      } catch {
        // ignore
      }
    }

    return {
      changedFiles: [...new Set(changedFiles)],
      renamedFiles: [...new Set(renamedFiles)],
      deletedFiles: [...new Set(deletedFiles)],
      insertions,
      deletions,
    };
  }

  /**
   * Scan repository for activity metadata only (no full git diff).
   * Used by GitActivities storage.
   */
  async scanActivityMetadata(
    localGitPath: string,
    options: ScanCommitOptions,
  ): Promise<RawActivityCommit[]> {
    const { git } = await this.openRepo(localGitPath, options.branch);
    const log = await git.log(this.buildLogOptions(options) as Parameters<typeof git.log>[0]);

    type LogEntry = {
      hash: string;
      date: string;
      message: string;
      body?: string;
      author_name: string;
      author_email: string;
    };

    const commits: RawActivityCommit[] = [];

    for (const raw of log.all) {
      const entry = raw as LogEntry;
      const commitHash = entry.hash;
      const commitMessage = [entry.message, entry.body].filter(Boolean).join('\n').trim();
      const stats = await this.collectFileStats(git, commitHash);
      const authorEmail = entry.author_email.toLowerCase();

      commits.push({
        commitHash,
        author: `${entry.author_name} <${authorEmail}>`,
        authoredAt: new Date(entry.date),
        branch: options.branch,
        commitMessage,
        changedFiles: stats.changedFiles,
        insertions: stats.insertions,
        deletions: stats.deletions,
      });
    }

    return commits;
  }

  async scanRepository(
    localGitPath: string,
    options: ScanCommitOptions,
  ): Promise<RawScannedCommit[]> {
    const { git } = await this.openRepo(localGitPath, options.branch);
    const log = await git.log(this.buildLogOptions(options) as Parameters<typeof git.log>[0]);
    const commits: RawScannedCommit[] = [];

    type LogEntry = {
      hash: string;
      date: string;
      message: string;
      body?: string;
      author_name: string;
      author_email: string;
    };

    for (const raw of log.all) {
      const entry = raw as LogEntry;
      const commitHash = entry.hash;
      const shortHash = commitHash.slice(0, 7);
      const commitMessage = [entry.message, entry.body].filter(Boolean).join('\n').trim();
      const stats = await this.collectFileStats(git, commitHash);

      let gitDiff = '';
      let gitDiffTruncated = false;
      try {
        gitDiff = await git.show([commitHash, '--pretty=format:', '--patch', '--find-renames']);
        const maxLen = env.GIT_SCAN_MAX_DIFF_CHARS;
        if (gitDiff.length > maxLen) {
          gitDiff = gitDiff.slice(0, maxLen);
          gitDiffTruncated = true;
        }
      } catch {
        gitDiff = '';
      }

      const categories = classifyCommit({
        commitMessage,
        changedFiles: stats.changedFiles,
        deletedFiles: stats.deletedFiles,
        renamedFiles: stats.renamedFiles,
        gitDiff,
      });

      commits.push({
        commitHash,
        shortHash,
        authorName: entry.author_name,
        authorEmail: entry.author_email.toLowerCase(),
        authoredAt: new Date(entry.date),
        branch: options.branch,
        commitMessage,
        changedFiles: stats.changedFiles,
        renamedFiles: stats.renamedFiles,
        deletedFiles: stats.deletedFiles,
        insertions: stats.insertions,
        deletions: stats.deletions,
        gitDiff,
        gitDiffTruncated,
        categories,
      });
    }

    return commits;
  }

  getTodayRange(now = new Date()): { fromDate: Date; toDate: Date } {
    return { fromDate: startOfDay(now), toDate: endOfDay(now) };
  }

  getYesterdayRange(now = new Date()): { fromDate: Date; toDate: Date } {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return { fromDate: startOfDay(yesterday), toDate: endOfDay(yesterday) };
  }
}

export const gitScannerService = new GitScannerService();
