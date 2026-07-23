import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { storeAuth } from '@/lib/authStorage';
import { ApiClientError } from '@/services/apiClient';
import { saasApi } from '@/services/saasApi';

export function OrganizationPage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [reportTime, setReportTime] = useState('20:00');
  const [aiModel, setAiModel] = useState('gemini-2.5-flash');

  const hasOrganization = Boolean(user?.organizationId);

  const orgQuery = useQuery({
    queryKey: ['organization', user?.organizationId],
    queryFn: () => saasApi.getOrganization(),
    enabled: hasOrganization,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () => saasApi.createOrganization({ name: name.trim() }),
    onSuccess: async (result) => {
      toast({ title: 'Organization created', variant: 'success' });
      storeAuth(result.user, result.tokens);
      setUser(result.user);
      await queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (error) => {
      toast({
        title: 'Create failed',
        description: error instanceof ApiClientError ? error.message : 'Unable to create org',
        variant: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      saasApi.updateOrganization({
        name: name || orgQuery.data?.name,
        settings: {
          defaultReportTime: reportTime,
          defaultAiModel: aiModel,
        },
      }),
    onSuccess: async () => {
      toast({ title: 'Settings saved', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof ApiClientError ? error.message : 'Unable to update',
        variant: 'error',
      });
    },
  });

  if (hasOrganization && orgQuery.isLoading) {
    return <LoadingSpinner label="Loading organization…" />;
  }

  if (hasOrganization && orgQuery.isError) {
    return (
      <ErrorState
        message={
          orgQuery.error instanceof ApiClientError
            ? orgQuery.error.message
            : 'Failed to load organization'
        }
        onRetry={() => void orgQuery.refetch()}
      />
    );
  }

  if (!hasOrganization || !orgQuery.data) {
    return (
      <EmptyState
        title="No organization yet"
        description="Create an organization to invite your team and collaborate."
        action={
          <div className="flex w-full max-w-sm flex-col gap-3">
            <Input
              placeholder="Company name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button
              disabled={!name.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              <Building2 className="size-4" />
              {createMutation.isPending ? 'Creating…' : 'Create Organization'}
            </Button>
          </div>
        }
      />
    );
  }

  const org = orgQuery.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{org.name}</h2>
        <p className="text-sm text-slate-500">Slug: {org.slug}</p>
      </div>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-800">Organization Settings</h3>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Company Name</label>
          <Input
            defaultValue={org.name}
            onChange={(event) => setName(event.target.value)}
            disabled={user?.role !== 'admin'}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Default Report Time</label>
            <Input
              defaultValue={org.settings.defaultReportTime}
              onChange={(event) => setReportTime(event.target.value)}
              disabled={user?.role !== 'admin'}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Default AI Model</label>
            <Input
              defaultValue={org.settings.defaultAiModel}
              onChange={(event) => setAiModel(event.target.value)}
              disabled={user?.role !== 'admin'}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Working days: {(org.settings.workingDays ?? []).join(', ') || 'Mon–Fri'} · Email
          delivery {org.settings.emailSettings.enabled ? 'enabled' : 'disabled'}
        </p>
        {user?.role === 'admin' ? (
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Settings'}
          </Button>
        ) : (
          <p className="text-sm text-slate-500">Only admins can edit organization settings.</p>
        )}
      </section>
    </div>
  );
}
