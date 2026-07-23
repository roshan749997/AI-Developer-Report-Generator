import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ArrowLeft, Download, FileDown, FileText, Mail } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/contexts/ToastContext';
import { useReportDetails } from '@/hooks/useAppData';
import { formatDate } from '@/lib/utils';
import { ApiClientError } from '@/services/apiClient';
import { reportsApi, type ReportExportFormat } from '@/services/reportsApi';

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No items recorded.</p>
      ) : (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ReportDetailsPage() {
  const { projectId, reportId } = useParams<{ projectId: string; reportId: string }>();
  const { toast } = useToast();
  const { project, report, isLoading, isError, error, refetch } = useReportDetails(
    projectId,
    reportId,
  );
  const [downloading, setDownloading] = useState<ReportExportFormat | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [recipientsText, setRecipientsText] = useState('');
  const [sending, setSending] = useState(false);

  const parsedRecipients = useMemo(
    () =>
      [
        ...new Set(
          recipientsText
            .split(/[\n,;]+/)
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean),
        ),
      ],
    [recipientsText],
  );

  const invalidRecipients = parsedRecipients.filter((email) => !EMAIL_REGEX.test(email));

  async function handleDownload(format: ReportExportFormat) {
    if (!reportId) return;
    setDownloading(format);
    try {
      const file = await reportsApi.downloadExport(reportId, format);
      triggerBrowserDownload(file.blob, file.filename);
      toast({
        title: 'Download started',
        description: file.filename,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Download failed',
        description: err instanceof ApiClientError ? err.message : 'Unable to export report',
        variant: 'error',
      });
    } finally {
      setDownloading(null);
    }
  }

  async function handleSendEmail() {
    if (!reportId) return;

    if (parsedRecipients.length === 0) {
      toast({
        title: 'Recipients required',
        description: 'Enter at least one email address.',
        variant: 'error',
      });
      return;
    }

    if (invalidRecipients.length > 0) {
      toast({
        title: 'Invalid email',
        description: invalidRecipients.join(', '),
        variant: 'error',
      });
      return;
    }

    setSending(true);
    try {
      const result = await reportsApi.sendEmail(reportId, parsedRecipients);
      toast({
        title: 'Email sent',
        description: `Delivered to ${result.sent} recipient(s)${
          result.failed > 0 ? `, ${result.failed} failed` : ''
        }`,
        variant: 'success',
      });
      setEmailOpen(false);
      setRecipientsText('');
    } catch (err) {
      toast({
        title: 'Email failed',
        description: err instanceof ApiClientError ? err.message : 'Unable to send email',
        variant: 'error',
      });
    } finally {
      setSending(false);
    }
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading report…" />;
  }

  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof ApiClientError ? error.message : 'Failed to load report details'
        }
        onRetry={refetch}
      />
    );
  }

  if (!report) {
    return (
      <EmptyState
        title="Report not found"
        description="This report may have been removed or the link is invalid."
        action={
          <Button asChild variant="outline">
            <Link to="/reports">Back to Reports</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to="/reports">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <h2 className="text-xl font-semibold text-slate-900">
            {project?.name ?? 'Project'} · {formatDate(report.reportDate)}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Created {formatDate(report.createdAt, true)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={downloading !== null || sending}
            onClick={() => void handleDownload('pdf')}
          >
            <Download className="size-4" />
            {downloading === 'pdf' ? 'Downloading…' : 'Download PDF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={downloading !== null || sending}
            onClick={() => void handleDownload('docx')}
          >
            <FileDown className="size-4" />
            {downloading === 'docx' ? 'Downloading…' : 'Download DOCX'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={downloading !== null || sending}
            onClick={() => void handleDownload('md')}
          >
            <FileText className="size-4" />
            {downloading === 'md' ? 'Downloading…' : 'Download Markdown'}
          </Button>
          <Button
            size="sm"
            disabled={downloading !== null || sending}
            onClick={() => setEmailOpen(true)}
          >
            <Mail className="size-4" />
            Send Email
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Summary</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {report.summary || 'No summary available.'}
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Completed Tasks" items={report.completedTasks} />
        <Section title="Work In Progress" items={report.workInProgress} />
        <Section title="Pending Tasks" items={report.pendingTasks} />
        <Section title="Challenges" items={report.challenges} />
      </div>

      <Section title="Tomorrow Plan" items={report.tomorrowPlan} />

      <Modal
        open={emailOpen}
        title="Send Email"
        description="Enter one or more recipient emails (comma or new-line separated)."
        onClose={() => {
          if (!sending) setEmailOpen(false);
        }}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setEmailOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleSendEmail()} disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="recipients">
            Recipients
          </label>
          <Textarea
            id="recipients"
            value={recipientsText}
            onChange={(event) => setRecipientsText(event.target.value)}
            placeholder={'manager@example.com\nlead@example.com'}
            rows={5}
          />
          {invalidRecipients.length > 0 ? (
            <p className="text-xs text-red-600">
              Invalid: {invalidRecipients.join(', ')}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              {parsedRecipients.length} recipient(s) ready
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
