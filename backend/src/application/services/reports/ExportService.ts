import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
} from 'docx';
import type { DailyReport } from '../../../domain/entities/DailyReport.js';

export type ExportFormat = 'pdf' | 'docx' | 'md';

export interface ExportPayload {
  report: DailyReport;
  projectName: string;
}

export interface ExportFileResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
  extension: ExportFormat;
}

function formatReportDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80);
}

function buildFilename(projectName: string, reportDate: Date, ext: ExportFormat): string {
  const datePart = reportDate.toISOString().slice(0, 10);
  return `${sanitizeFilename(projectName)}_daily-report_${datePart}.${ext === 'md' ? 'md' : ext}`;
}

function bulletsOrEmpty(items: string[]): string[] {
  return items.length > 0 ? items : ['None'];
}

/**
 * Generates PDF / DOCX / Markdown report exports in memory.
 */
export class ExportService {
  async export(
    format: ExportFormat,
    payload: ExportPayload,
  ): Promise<ExportFileResult> {
    switch (format) {
      case 'pdf':
        return this.toPdf(payload);
      case 'docx':
        return this.toDocx(payload);
      case 'md':
        return this.toMarkdown(payload);
      default:
        throw new Error(`Unsupported export format: ${format as string}`);
    }
  }

  toMarkdown({ report, projectName }: ExportPayload): ExportFileResult {
    const dateLabel = formatReportDate(report.reportDate);
    const section = (title: string, items: string[]) => {
      const lines = bulletsOrEmpty(items).map((item) => `- ${item}`);
      return `## ${title}\n\n${lines.join('\n')}`;
    };

    const content = [
      '# Daily Work Report',
      '',
      `**Project:** ${projectName}`,
      `**Date:** ${dateLabel}`,
      '',
      '---',
      '',
      section('Completed Tasks', report.completedTasks),
      '',
      section('Work In Progress', report.workInProgress),
      '',
      section('Pending Tasks', report.pendingTasks),
      '',
      section('Challenges', report.challenges),
      '',
      section('Tomorrow Plan', report.tomorrowPlan),
      '',
      '## Summary',
      '',
      report.summary?.trim() || 'No summary available.',
      '',
    ].join('\n');

    return {
      buffer: Buffer.from(content, 'utf8'),
      contentType: 'text/markdown; charset=utf-8',
      filename: buildFilename(projectName, report.reportDate, 'md'),
      extension: 'md',
    };
  }

  async toPdf({ report, projectName }: ExportPayload): Promise<ExportFileResult> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;
    const maxWidth = width - margin * 2;
    const lineGap = 16;

    const drawText = (
      text: string,
      options: { size?: number; fontFace?: typeof font; color?: ReturnType<typeof rgb> } = {},
    ) => {
      const size = options.size ?? 11;
      const fontFace = options.fontFace ?? font;
      const color = options.color ?? rgb(0.12, 0.16, 0.22);
      const words = text.split(/\s+/);
      let line = '';

      const flush = (value: string) => {
        if (y < margin + 40) {
          page = pdfDoc.addPage();
          y = height - margin;
        }
        page.drawText(value, {
          x: margin,
          y,
          size,
          font: fontFace,
          color,
        });
        y -= lineGap;
      };

      for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (fontFace.widthOfTextAtSize(next, size) > maxWidth) {
          if (line) flush(line);
          line = word;
        } else {
          line = next;
        }
      }
      if (line) flush(line);
    };

    const drawDivider = () => {
      if (y < margin + 40) {
        page = pdfDoc.addPage();
        y = height - margin;
      }
      page.drawLine({
        start: { x: margin, y },
        end: { x: width - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.82, 0.85),
      });
      y -= lineGap;
    };

    const drawSection = (title: string, items: string[]) => {
      drawText(title, { size: 13, fontFace: bold });
      for (const item of bulletsOrEmpty(items)) {
        drawText(`• ${item}`);
      }
      y -= 6;
      drawDivider();
    };

    drawText('Daily Work Report', { size: 20, fontFace: bold });
    y -= 4;
    drawText(`Project: ${projectName}`, { size: 12 });
    drawText(`Date: ${formatReportDate(report.reportDate)}`, { size: 12 });
    y -= 4;
    drawDivider();

    drawSection('Completed Tasks', report.completedTasks);
    drawSection('Work In Progress', report.workInProgress);
    drawSection('Pending Tasks', report.pendingTasks);
    drawSection('Challenges', report.challenges);
    drawSection('Tomorrow Plan', report.tomorrowPlan);

    drawText('Summary', { size: 13, fontFace: bold });
    drawText(report.summary?.trim() || 'No summary available.');

    const bytes = await pdfDoc.save();
    return {
      buffer: Buffer.from(bytes),
      contentType: 'application/pdf',
      filename: buildFilename(projectName, report.reportDate, 'pdf'),
      extension: 'pdf',
    };
  }

  async toDocx({ report, projectName }: ExportPayload): Promise<ExportFileResult> {
    const divider = new Paragraph({
      border: {
        bottom: {
          color: 'CCCCCC',
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      spacing: { after: 200 },
      children: [],
    });

    const heading = (text: string) =>
      new Paragraph({
        text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 },
      });

    const bullets = (items: string[]) =>
      bulletsOrEmpty(items).map(
        (item) =>
          new Paragraph({
            text: item,
            bullet: { level: 0 },
            spacing: { after: 60 },
          }),
      );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Daily Work Report',
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 120 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Project: ${projectName}` })],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Date: ${formatReportDate(report.reportDate)}`,
                }),
              ],
              spacing: { after: 120 },
            }),
            divider,
            heading('Completed Tasks'),
            ...bullets(report.completedTasks),
            divider,
            heading('Work In Progress'),
            ...bullets(report.workInProgress),
            divider,
            heading('Pending Tasks'),
            ...bullets(report.pendingTasks),
            divider,
            heading('Challenges'),
            ...bullets(report.challenges),
            divider,
            heading('Tomorrow Plan'),
            ...bullets(report.tomorrowPlan),
            divider,
            heading('Summary'),
            new Paragraph({
              children: [
                new TextRun({
                  text: report.summary?.trim() || 'No summary available.',
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return {
      buffer,
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      filename: buildFilename(projectName, report.reportDate, 'docx'),
      extension: 'docx',
    };
  }
}

export const exportService = new ExportService();
