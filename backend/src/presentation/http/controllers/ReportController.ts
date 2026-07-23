import type { Request, Response } from 'express';
import {
  aiReportService,
  reportExportService,
} from '../../../application/services/reports/index.js';
import type { ExportFormat } from '../../../application/services/reports/ExportService.js';
import { UnauthorizedError } from '../../../shared/errors/index.js';
import { ApiResponse } from '../response/index.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  return req.user;
}

async function sendExport(
  req: Request,
  res: Response,
  format: ExportFormat,
): Promise<Response> {
  const user = requireUser(req);
  const file = await reportExportService.export(
    req.params.reportId!,
    format,
    user,
  );

  res.setHeader('Content-Type', file.contentType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${file.filename}"`,
  );
  res.setHeader('Content-Length', file.buffer.length);
  res.setHeader('Cache-Control', 'no-store');

  return res.status(200).send(file.buffer);
}

export class ReportController {
  generate = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const report = await aiReportService.generate({
      projectId: req.params.projectId!,
      actor: user,
    });

    return ApiResponse.success(res, report, 'Daily report ready');
  };

  today = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const report = await aiReportService.getToday(req.params.projectId!, user);
    return ApiResponse.success(res, report, "Today's report retrieved");
  };

  history = async (req: Request, res: Response) => {
    const user = requireUser(req);
    const reports = await aiReportService.getHistory(req.params.projectId!, user);
    return ApiResponse.success(res, reports, 'Report history retrieved', 200, {
      total: reports.length,
    });
  };

  exportPdf = async (req: Request, res: Response) => sendExport(req, res, 'pdf');

  exportDocx = async (req: Request, res: Response) => sendExport(req, res, 'docx');

  exportMarkdown = async (req: Request, res: Response) => sendExport(req, res, 'md');
}

export const reportController = new ReportController();
