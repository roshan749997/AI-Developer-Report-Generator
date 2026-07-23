import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { logger } from '../logger/index.js';
import { AppError, BadRequestError } from '../../shared/errors/index.js';
import { HttpStatus } from '../../shared/constants/httpStatus.js';
import { ErrorCode } from '../../shared/errors/errorCodes.js';
import {
  AI_SYSTEM_INSTRUCTIONS,
  AI_PROMPT_VERSION,
  buildAiUserPayload,
} from './aiPrompt.js';
import { AI_REPORT_JSON_SCHEMA, aiReportContentSchema } from './aiReportSchema.js';
import type { AiReportContent } from '../../domain/entities/AiReport.js';

export interface GenerateAiReportParams {
  projectName: string;
  fromDate: Date;
  toDate: Date;
  commits: Array<{
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
    categories: string[];
    gitDiffExcerpt: string;
  }>;
  previousReports: Array<{
    reportId: string;
    reportDate: Date;
    summary: string;
    tasksCompleted: string[];
    workInProgress: string[];
    pendingTasks: string[];
    tomorrowPlan: string[];
  }>;
}

export interface GenerateAiReportResult {
  content: AiReportContent;
  rawOutput: string;
  responseId: string;
  model: string;
  promptVersion: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export class OpenAiResponsesClient {
  private client: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!env.OPENAI_API_KEY) {
      throw new BadRequestError(
        'OPENAI_API_KEY is not configured. Add it to backend/.env to generate AI reports.',
      );
    }

    if (!this.client) {
      this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }

    return this.client;
  }

  async generateDeveloperReport(
    params: GenerateAiReportParams,
  ): Promise<GenerateAiReportResult> {
    const client = this.getClient();

    const input = buildAiUserPayload({
      projectName: params.projectName,
      fromDate: params.fromDate.toISOString(),
      toDate: params.toDate.toISOString(),
      commits: params.commits,
      previousReports: params.previousReports,
    });

    try {
      const response = await client.responses.create({
        model: env.OPENAI_MODEL,
        instructions: AI_SYSTEM_INSTRUCTIONS,
        input,
        temperature: 0,
        text: {
          format: {
            type: 'json_schema',
            name: 'developer_report',
            strict: true,
            schema: AI_REPORT_JSON_SCHEMA as unknown as Record<string, unknown>,
          },
        },
      });

      const rawOutput = response.output_text?.trim() ?? '';
      if (!rawOutput) {
        throw new AppError('OpenAI returned an empty response', {
          statusCode: HttpStatus.BAD_REQUEST,
          code: ErrorCode.BAD_REQUEST,
        });
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawOutput);
      } catch {
        throw new AppError('OpenAI returned invalid JSON', {
          statusCode: HttpStatus.BAD_REQUEST,
          code: ErrorCode.BAD_REQUEST,
          details: { rawOutput },
        });
      }

      const content = aiReportContentSchema.parse(parsedJson);

      return {
        content,
        rawOutput,
        responseId: response.id,
        model: response.model ?? env.OPENAI_MODEL,
        promptVersion: AI_PROMPT_VERSION,
        usage: {
          inputTokens: response.usage?.input_tokens,
          outputTokens: response.usage?.output_tokens,
          totalTokens: response.usage?.total_tokens,
        },
      };
    } catch (error) {
      if (error instanceof AppError || error instanceof BadRequestError) {
        throw error;
      }

      logger.error({ err: error }, 'OpenAI Responses API call failed');

      const message =
        error instanceof Error ? error.message : 'Failed to generate AI report';

      throw new AppError(message, {
        statusCode: HttpStatus.BAD_REQUEST,
        code: ErrorCode.BAD_REQUEST,
        cause: error,
      });
    }
  }
}

export const openAiResponsesClient = new OpenAiResponsesClient();
