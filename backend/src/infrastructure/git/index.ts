export { GitService, gitService } from './GitService.js';
export type { GitValidationResult, GitConnectionResult } from './GitService.js';
export { GitScannerService, gitScannerService } from './GitScannerService.js';
export type {
  ScanCommitOptions,
  RawScannedCommit,
  RawActivityCommit,
} from './GitScannerService.js';
export { classifyCommit } from './CommitClassifier.js';
