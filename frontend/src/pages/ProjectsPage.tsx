import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Power, ScanSearch, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/contexts/ToastContext';
import { useProjects } from '@/hooks/useAppData';
import { formatDate } from '@/lib/utils';
import { ApiClientError } from '@/services/apiClient';
import { activityApi } from '@/services/activityApi';
import { projectsApi } from '@/services/projectsApi';
import type { CreateProjectPayload, Project } from '@/types/api';

const emptyForm: CreateProjectPayload = {
  name: '',
  localGitPath: '',
  gitBranch: 'main',
  description: '',
  tags: [],
  validateGit: true,
};

export function ProjectsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const projectsQuery = useProjects();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<CreateProjectPayload>(emptyForm);
  const [tagsInput, setTagsInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['activities'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateProjectPayload = {
        ...form,
        tags: tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      if (editing) {
        return projectsApi.update(editing.id, payload);
      }
      return projectsApi.create(payload);
    },
    onSuccess: async () => {
      toast({
        title: editing ? 'Project updated' : 'Project created',
        variant: 'success',
      });
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setTagsInput('');
      await invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Save failed',
        description: error instanceof ApiClientError ? error.message : 'Unable to save project',
        variant: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: async () => {
      toast({ title: 'Project deleted', variant: 'success' });
      setDeleteTarget(null);
      await invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof ApiClientError ? error.message : 'Unable to delete project',
        variant: 'error',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (project: Project) =>
      project.isEnabled ? projectsApi.disable(project.id) : projectsApi.enable(project.id),
    onSuccess: async (project) => {
      toast({
        title: project.isEnabled ? 'Project enabled' : 'Project disabled',
        variant: 'success',
      });
      await invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof ApiClientError ? error.message : 'Unable to update project',
        variant: 'error',
      });
    },
  });

  const scanMutation = useMutation({
    mutationFn: (projectId: string) => activityApi.scan(projectId),
    onMutate: (projectId) => setScanningId(projectId),
    onSuccess: async (result) => {
      toast({
        title: 'Scan completed',
        description: `${result.commitsFound} commits found, ${result.activitiesStored} stored`,
        variant: 'success',
      });
      await invalidate();
    },
    onError: (error) => {
      toast({
        title: 'Scan failed',
        description: error instanceof ApiClientError ? error.message : 'Unable to scan repository',
        variant: 'error',
      });
    },
    onSettled: () => setScanningId(null),
  });

  const columns: DataTableColumn<Project>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Project',
        render: (row) => (
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="mt-1 text-xs text-slate-500">{row.localGitPath}</p>
          </div>
        ),
      },
      {
        key: 'branch',
        header: 'Branch',
        render: (row) => <code className="text-xs">{row.gitBranch}</code>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <Badge variant={row.isEnabled ? 'success' : 'warning'}>
            {row.isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        ),
      },
      {
        key: 'updated',
        header: 'Updated',
        render: (row) => formatDate(row.updatedAt, true),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={scanningId === row.id || !row.isEnabled}
              onClick={() => scanMutation.mutate(row.id)}
            >
              <ScanSearch className="size-4" />
              {scanningId === row.id ? 'Scanning…' : 'Scan'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(row);
                setForm({
                  name: row.name,
                  localGitPath: row.localGitPath,
                  gitBranch: row.gitBranch,
                  description: row.description,
                  tags: row.tags,
                  validateGit: true,
                });
                setTagsInput(row.tags.join(', '));
                setModalOpen(true);
              }}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleMutation.mutate(row)}
              disabled={toggleMutation.isPending}
            >
              <Power className="size-4" />
              {row.isEnabled ? 'Disable' : 'Enable'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteTarget(row)}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [scanningId, scanMutation, toggleMutation],
  );

  if (projectsQuery.isLoading) {
    return <LoadingSpinner label="Loading projects…" />;
  }

  if (projectsQuery.isError) {
    return (
      <ErrorState
        message={
          projectsQuery.error instanceof ApiClientError
            ? projectsQuery.error.message
            : 'Failed to load projects'
        }
        onRetry={() => void projectsQuery.refetch()}
      />
    );
  }

  const projects = projectsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            Manage repositories and trigger daily activity scans.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
            setTagsInput('');
            setModalOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Add a local Git repository to start scanning commits."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
                setModalOpen(true);
              }}
            >
              Add Project
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} rows={projects} rowKey={(row) => row.id} />
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Edit Project' : 'Add Project'}
        description="Provide the local Git path and branch used for scanning."
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name || !form.localGitPath}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="My App"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Local Git Path</label>
            <Input
              value={form.localGitPath}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, localGitPath: event.target.value }))
              }
              placeholder="E:\\repos\\my-app"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Branch</label>
            <Input
              value={form.gitBranch}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, gitBranch: event.target.value }))
              }
              placeholder="main"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Optional notes"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tags</label>
            <Input
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="backend, api"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete project?"
        description={
          deleteTarget
            ? `Delete "${deleteTarget.name}" permanently from the workspace.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
