import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../config/env.js';
import { BadRequestError } from '../../shared/errors/index.js';
import { logger } from '../logger/index.js';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendMailInput {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  attachments?: EmailAttachment[];
}

/**
 * Nodemailer SMTP email sender.
 * Weekly/Monthly helpers are stubs for future phases.
 */
export class EmailService {
  private transporter: Transporter | null = null;

  private assertConfigured(): void {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
      throw new BadRequestError(
        'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in backend/.env',
      );
    }
  }

  private getTransporter(): Transporter {
    this.assertConfigured();

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }

    return this.transporter;
  }

  async sendMail(input: SendMailInput): Promise<void> {
    const transporter = this.getTransporter();

    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: Array.isArray(input.to) ? input.to.join(', ') : input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        attachments: input.attachments?.map((file) => ({
          filename: file.filename,
          content: file.content,
          contentType: file.contentType,
        })),
      });
    } catch (error) {
      logger.error({ err: error }, 'SMTP sendMail failed');
      const message =
        error instanceof Error ? error.message : 'Failed to send email via SMTP';
      throw new BadRequestError(message);
    }
  }

  /** Daily report delivery (implemented). */
  async sendDailyReport(input: SendMailInput): Promise<void> {
    return this.sendMail(input);
  }

  /** Reserved for weekly digest emails. */
  async sendWeeklyReport(_input: SendMailInput): Promise<void> {
    throw new BadRequestError('Weekly report email is not implemented yet');
  }

  /** Reserved for monthly digest emails. */
  async sendMonthlyReport(_input: SendMailInput): Promise<void> {
    throw new BadRequestError('Monthly report email is not implemented yet');
  }
}

export const emailService = new EmailService();
