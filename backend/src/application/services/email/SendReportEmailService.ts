import type { IProjectRepository } from '../../../domain/repositories/IProjectRepository.js';
import type { IDailyReportRepository } from '../../../domain/repositories/IDailyReportRepository.js';
import type { IEmailLogRepository } from '../../../domain/repositories/IEmailLogRepository.js';
import type { EmailLog } from '../../../domain/entities/EmailLog.js';
import { EmailLogStatus } from '../../../domain/entities/EmailLog.js';
import type { UserRole } from '../../../domain/entities/User.js';
import type { EmailService } from '../../../infrastructure/email/EmailService.js';
import type { EmailAttachment } from '../../../infrastructure/email/EmailService.js';
import {
  exportService,
  type ExportFileResult,
} from '../reports/ExportService.js';
import { BadRequestError, NotFoundError } from '../../../shared/errors/index.js';
import { getAccessibleProject } from '../../use-cases/projects/projectAccess.js';
import { logger } from '../../../infrastructure/logger/index.js';

export interface SendReportEmailInput {
  reportId: string;
  recipients: string[];
  actor: { id: string; role: UserRole };
}

export interface SendReportEmailResult {
  reportId: string;
  projectId: string;
  subject: string;
  recipients: string[];
  sent: number;
  failed: number;
  logs: EmailLog[];
}

function formatReportDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function buildBody(input: {
  projectName: string;
  dateLabel: string;
  summary: string;
  markdownFallback?: string;
}): { text: string; html: string } {
  const summary = input.summary.trim() || 'No summary available.';
  const markdownBlock = input.markdownFallback
    ? `\n\n---\nReport (Markdown)\n\n${input.markdownFallback}\n`
    : '';

  const text = [
    'Hello,',
    '',
    "Please find today's work report attached.",
    '',
    `Project Name: ${input.projectName}`,
    `Date: ${input.dateLabel}`,
    '',
    'Summary',
    summary,
    markdownBlock.trim(),
    '',
    'Regards',
    'Developer Report Generator',
  ]
    .filter((line, index, arr) => !(line === '' && arr[index - 1] === ''))
    .join('\n');

  const html = `
    <p>Hello,</p>
    <p>Please find today's work report attached.</p>
    <p><strong>Project Name:</strong> ${escapeHtml(input.projectName)}<br/>
    <strong>Date:</strong> ${escapeHtml(input.dateLabel)}</p>
    <p><strong>Summary</strong><br/>${escapeHtml(summary).replace(/\n/g, '<br/>')}</p>
    ${
      input.markdownFallback
        ? `<hr/><pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;">${escapeHtml(input.markdownFallback)}</pre>`
        : ''
    }
    <p>Regards<br/>Developer Report Generator</p>
  `.trim();

  return { text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Loads a report, builds PDF/DOCX attachments, emails recipients, and logs results.
 */
export class SendReportEmailService {
  constructor(
    private readonly projects: IProjectRepository,
    private readonly reports: IDailyReportRepository,
    private readonly emailLogs: IEmailLogRepository,
    private readonly mailer: EmailService,
  ) {}

  async execute(input: SendReportEmailInput): Promise<SendReportEmailResult> {
    const recipients = [
      ...new Set(
        input.recipients
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];

    if (recipients.length === 0) {
      throw new BadRequestError('At least one recipient email is required');
    }

    const report = await this.reports.findById(input.reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    const project = await getAccessibleProject(
      this.projects,
      report.projectId,
      input.actor,
    );

    const dateLabel = formatReportDate(report.reportDate);
    const subject = `Daily Work Report - ${project.name} - ${dateLabel}`;

    const attachments: EmailAttachment[] = [];
    let markdownFallback: string | undefined;

    try {
      const pdf = await exportService.export('pdf', {
        report,
        projectName: project.name,
      });
      attachments.push(toAttachment(pdf));
    } catch (error) {
      logger.warn({ err: error, reportId: report.id }, 'PDF export failed for email');
    }

    try {
      const docx = await exportService.export('docx', {
        report,
        projectName: project.name,
      });
      attachments.push(toAttachment(docx));
    } catch (error) {
      logger.warn({ err: error, reportId: report.id }, 'DOCX export failed for email');
    }

    if (attachments.length === 0) {
      const md = exportService.toMarkdown({
        report,
        projectName: project.name,
      });
      markdownFallback = md.buffer.toString('utf8');
    }

    const { text, html } = buildBody({
      projectName: project.name,
      dateLabel,
      summary: report.summary,
      markdownFallback,
    });

    const results = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          await this.mailer.sendDailyReport({
            to: recipient,
            subject,
            text,
            html,
            attachments,
          });

          const log = await this.emailLogs.create({
            projectId: project.id,
            reportId: report.id,
            recipient,
            subject,
            status: EmailLogStatus.SENT,
            error: null,
            sentAt: new Date(),
          });
          return { ok: true as const, log };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Failed to send email';
          const log = await this.emailLogs.create({
            projectId: project.id,
            reportId: report.id,
            recipient,
            subject,
            status: EmailLogStatus.FAILED,
            error: message,
            sentAt: null,
          });
          logger.error(
            { err: error, recipient, reportId: report.id },
            'Report email failed for recipient',
          );
          return { ok: false as const, log };
        }
      }),
    );

    const logs = results.map((result) => result.log);
    const sent = results.filter((result) => result.ok).length;
    const failed = results.length - sent;

    if (sent === 0) {
      throw new BadRequestError(
        logs[0]?.error ?? 'Failed to send report email to all recipients',
      );
    }

    return {
      reportId: report.id,
      projectId: project.id,
      subject,
      recipients,
      sent,
      failed,
      logs,
    };
  }

  async listLogs(limit = 50): Promise<EmailLog[]> {
    return this.emailLogs.listLatest(limit);
  }
}

function toAttachment(file: ExportFileResult): EmailAttachment {
  return {
    filename: file.filename,
    content: file.buffer,
    contentType: file.contentType,
  };
}
