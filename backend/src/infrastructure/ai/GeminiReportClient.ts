import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { logger } from '../logger/index.js';
import { AppError, BadRequestError } from '../../shared/errors/index.js';
import { HttpStatus } from '../../shared/constants/httpStatus.js';
import { ErrorCode } from '../../shared/errors/errorCodes.js';
import type { DailyReportContent } from '../../domain/entities/DailyReport.js';
import { buildDailyReportPrompt } from './dailyReportPrompt.js';
import { parseDailyReportContent } from './dailyReportSchema.js';
import type { GitActivity } from '../../domain/entities/GitActivity.js';

export interface GeminiDailyReportResult {
  content: DailyReportContent;
  rawAIResponse: string;
  model: string;
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

/**
 * Google Gemini client for daily report generation.
 * Uses @google/genai with gemini-2.5-flash by default.
 */
export class GeminiReportClient {
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!env.GEMINI_API_KEY) {
      throw new BadRequestError(
        'GEMINI_API_KEY is not configured. Add it to backend/.env to generate reports.',
      );
    }

    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }

    return this.client;
  }

  async generateDailyReport(input: {
    projectName: string;
    reportDate: Date;
    activities: GitActivity[];
  }): Promise<GeminiDailyReportResult> {
    const client = this.getClient();
    const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
    const prompt = buildDailyReportPrompt({
      projectName: input.projectName,
      reportDate: input.reportDate.toISOString().slice(0, 10),
      activities: input.activities,
    });

    try {
      const response = await client.models.generateContent({
        model,
        contents: prompt,
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
        },
      });

      const rawAIResponse = (response.text ?? '').trim();
      if (!rawAIResponse) {
        throw new AppError('Gemini returned an empty response', {
          statusCode: HttpStatus.BAD_REQUEST,
          code: ErrorCode.BAD_REQUEST,
        });
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJsonText(rawAIResponse));
      } catch {
        throw new AppError('Gemini returned invalid JSON', {
          statusCode: HttpStatus.BAD_REQUEST,
          code: ErrorCode.BAD_REQUEST,
          details: { rawAIResponse },
        });
      }

      const content = parseDailyReportContent(parsed);

      return {
        content,
        rawAIResponse,
        model,
      };
    } catch (error) {
      if (error instanceof AppError || error instanceof BadRequestError) {
        throw error;
      }

      logger.error({ err: error }, 'Gemini generateContent failed');

      const message =
        error instanceof Error ? error.message : 'Failed to generate report with Gemini';

      throw new AppError(message, {
        statusCode: HttpStatus.BAD_REQUEST,
        code: ErrorCode.BAD_REQUEST,
        cause: error,
      });
    }
  }
}

export const geminiReportClient = new GeminiReportClient();
