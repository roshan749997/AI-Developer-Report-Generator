import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../.env') });

const defaultNodeEnv =
  process.env.RENDER || process.env.NODE_ENV === 'production'
    ? 'production'
    : 'development';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default(defaultNodeEnv),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  PASSWORD_RESET_EXPIRES_IN_MS: z.coerce.number().int().positive().default(3_600_000),
  GIT_SCAN_MAX_COMMITS: z.coerce.number().int().positive().max(5000).default(200),
  GIT_SCAN_MAX_DIFF_CHARS: z.coerce.number().int().positive().default(200_000),
  OPENAI_API_KEY: z.string().optional().default(''),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  AI_PREVIOUS_REPORTS_LIMIT: z.coerce.number().int().min(0).max(20).default(5),
  AI_MAX_COMMITS_PER_REPORT: z.coerce.number().int().min(1).max(200).default(50),
  AI_DIFF_EXCERPT_CHARS: z.coerce.number().int().min(0).max(50_000).default(4_000),
  AI_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  DAILY_REPORT_SCHEDULER_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  DAILY_REPORT_CRON: z.string().default('0 20 * * *'),
  DAILY_REPORT_TIMEZONE: z.string().default('Asia/Kolkata'),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.flatten().fieldErrors;
  console.error('Invalid environment variables:', details);
  process.exit(1);
}

export const env = parsed.data;

export type Env = typeof env;
