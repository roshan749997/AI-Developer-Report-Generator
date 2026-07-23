import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/utils';
import { ApiClientError } from '@/services/apiClient';
import { saasApi, type OrgUser } from '@/services/saasApi';

export function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'developer' | 'manager'>('developer');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ['org-users'],
    queryFn: () => saasApi.listUsers(),
  });

  const inviteMutation = useMutation({
    mutationFn: () => saasApi.inviteUser({ email, role }),
    onSuccess: async (result) => {
      setInviteToken(result.inviteToken);
      toast({ title: 'Invitation created', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['org-users'] });
    },
    onError: (error) => {
      toast({
        title: 'Invite failed',
        description: error instanceof ApiClientError ? error.message : 'Unable to invite',
        variant: 'error',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => saasApi.removeUser(userId),
    onSuccess: async () => {
      toast({ title: 'User removed', variant: 'success' });
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['org-users'] });
    },
    onError: (error) => {
      toast({
        title: 'Remove failed',
        description: error instanceof ApiClientError ? error.message : 'Unable to remove user',
        variant: 'error',
      });
    },
  });

  const columns: DataTableColumn<OrgUser>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'User',
        render: (row) => (
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (row) => <Badge className="capitalize">{row.role}</Badge>,
      },
      {
        key: 'git',
        header: 'Git Username',
        render: (row) => row.gitUsername || '—',
      },
      {
        key: 'joined',
        header: 'Joined',
        render: (row) => formatDate(row.createdAt),
      },
      {
        key: 'actions',
        header: '',
        render: (row) =>
          user?.role === 'admin' && row.id !== user.id ? (
            <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(row)}>
              Remove
            </Button>
          ) : null,
      },
    ],
    [user],
  );

  if (usersQuery.isLoading) return <LoadingSpinner label="Loading users…" />;

  if (usersQuery.isError) {
    return (
      <ErrorState
        message={
          usersQuery.error instanceof ApiClientError
            ? usersQuery.error.message
            : 'Failed to load users'
        }
        onRetry={() => void usersQuery.refetch()}
      />
    );
  }

  const users = usersQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Organization members and roles.</p>
        {user?.role === 'admin' ? (
          <Button
            onClick={() => {
              setInviteOpen(true);
              setInviteToken(null);
              setEmail('');
              setRole('developer');
            }}
          >
            <UserPlus className="size-4" />
            Invite User
          </Button>
        ) : null}
      </div>

      {users.length === 0 ? (
        <EmptyState title="No users" description="Invite teammates to collaborate." />
      ) : (
        <DataTable columns={columns} rows={users} rowKey={(row) => row.id} />
      )}

      <Modal
        open={inviteOpen}
        title="Invite User"
        description="Send an invitation by email. Share the invite token with the user."
        onClose={() => setInviteOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Close
            </Button>
            {!inviteToken ? (
              <Button
                disabled={!email || inviteMutation.isPending}
                onClick={() => inviteMutation.mutate()}
              >
                {inviteMutation.isPending ? 'Inviting…' : 'Send Invite'}
              </Button>
            ) : null}
          </>
        }
      >
        {inviteToken ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              Invitation created. Share this token (or open `/invite?token=...`):
            </p>
            <code className="block break-all rounded-md bg-slate-100 p-3 text-xs">
              {inviteToken}
            </code>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Role</label>
              <select
                className="flex h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as 'developer' | 'manager')
                }
              >
                <option value="developer">Developer</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Remove user?"
        description={
          deleteTarget
            ? `Deactivate ${deleteTarget.name} from this organization.`
            : ''
        }
        confirmLabel="Remove"
        destructive
        loading={removeMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) removeMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
