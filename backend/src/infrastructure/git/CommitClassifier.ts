import {
  CommitCategory,
  type CommitCategory as CommitCategoryType,
} from '../../domain/entities/ScannedCommit.js';

interface ClassificationInput {
  commitMessage: string;
  changedFiles: string[];
  deletedFiles: string[];
  renamedFiles: string[];
  gitDiff: string;
}

const RULES: Array<{
  category: CommitCategoryType;
  messagePatterns: RegExp[];
  pathPatterns: RegExp[];
  diffPatterns?: RegExp[];
}> = [
  {
    category: CommitCategory.BUG_FIX,
    messagePatterns: [/\bfix\b/i, /\bbug\b/i, /\bhotfix\b/i, /\bpatch\b/i, /\bresolve[sd]?\b/i],
    pathPatterns: [],
  },
  {
    category: CommitCategory.FEATURE,
    messagePatterns: [/\bfeat\b/i, /\bfeature\b/i, /\badd(ed|s)?\b/i, /\bimplement(ed|s)?\b/i],
    pathPatterns: [],
  },
  {
    category: CommitCategory.REFACTOR,
    messagePatterns: [/\brefactor\b/i, /\bcleanup\b/i, /\brestructure\b/i, /\bchore\b/i],
    pathPatterns: [],
  },
  {
    category: CommitCategory.UI,
    messagePatterns: [/\bui\b/i, /\bux\b/i, /\bstyle\b/i, /\bcss\b/i, /\blayout\b/i, /\bfrontend\b/i],
    pathPatterns: [
      /\.(tsx|jsx|css|scss|sass|less|vue|svelte)$/i,
      /(^|\/)(components|pages|views|ui)\//i,
    ],
  },
  {
    category: CommitCategory.BACKEND,
    messagePatterns: [/\bbackend\b/i, /\bserver\b/i, /\bservice\b/i],
    pathPatterns: [/(^|\/)(backend|server|services|controllers|use-cases)\//i, /\.controller\./i],
  },
  {
    category: CommitCategory.API,
    messagePatterns: [/\bapi\b/i, /\bendpoint\b/i, /\broute\b/i, /\bswagger\b/i],
    pathPatterns: [/(^|\/)(routes|api|controllers)\//i, /\.routes?\./i],
  },
  {
    category: CommitCategory.FIREBASE,
    messagePatterns: [/\bfirebase\b/i, /\bfirestore\b/i, /\bfcm\b/i],
    pathPatterns: [/firebase/i, /firestore/i],
    diffPatterns: [/firebase/i, /firestore/i],
  },
  {
    category: CommitCategory.AUTHENTICATION,
    messagePatterns: [
      /\bauth(entication|orization)?\b/i,
      /\blogin\b/i,
      /\bjwt\b/i,
      /\boauth\b/i,
      /\bpassword\b/i,
    ],
    pathPatterns: [/(^|\/)(auth|authentication)\//i, /jwt/i, /passport/i],
  },
  {
    category: CommitCategory.PERFORMANCE,
    messagePatterns: [/\bperf(ormance)?\b/i, /\boptimiz(e|ation)\b/i, /\bcache\b/i, /\bslow\b/i],
    pathPatterns: [],
    diffPatterns: [/\bmemo\b/i, /\bcache\b/i],
  },
];

export function classifyCommit(input: ClassificationInput): CommitCategoryType[] {
  const files = [...input.changedFiles, ...input.deletedFiles, ...input.renamedFiles];
  const detected = new Set<CommitCategoryType>();

  for (const rule of RULES) {
    const messageHit = rule.messagePatterns.some((pattern) => pattern.test(input.commitMessage));
    const pathHit = rule.pathPatterns.some((pattern) => files.some((file) => pattern.test(file)));
    const diffHit = (rule.diffPatterns ?? []).some((pattern) => pattern.test(input.gitDiff));

    if (messageHit || pathHit || diffHit) {
      detected.add(rule.category);
    }
  }

  return [...detected];
}
