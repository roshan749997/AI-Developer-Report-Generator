import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiClientError } from '@/services/apiClient';
import { saasApi } from '@/services/saasApi';

export function ProfilePage() {
  const { setUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => saasApi.getProfile(),
  });

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [gitUsername, setGitUsername] = useState('');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('18:00');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (!profileQuery.data) return;
    setName(profileQuery.data.name);
    setTimezone(profileQuery.data.timezone ?? 'Asia/Kolkata');
    setGitUsername(profileQuery.data.gitUsername ?? '');
    setStart(profileQuery.data.workingHours?.start ?? '09:00');
    setEnd(profileQuery.data.workingHours?.end ?? '18:00');
    setAvatarUrl(profileQuery.data.avatarUrl ?? '');
  }, [profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saasApi.updateProfile({
        name,
        timezone,
        gitUsername: gitUsername || null,
        avatarUrl: avatarUrl || null,
        workingHours: { start, end },
      }),
    onSuccess: async (profile) => {
      setUser(profile);
      toast({ title: 'Profile updated', variant: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof ApiClientError ? error.message : 'Unable to save profile',
        variant: 'error',
      });
    },
  });

  if (profileQuery.isLoading) return <LoadingSpinner label="Loading profile…" />;

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ErrorState
        message={
          profileQuery.error instanceof ApiClientError
            ? profileQuery.error.message
            : 'Failed to load profile'
        }
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.name} className="size-full object-cover" />
            ) : (
              profile.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile.name}</p>
            <p className="text-sm capitalize text-slate-500">
              {profile.role} · {profile.email}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Avatar URL</label>
            <Input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Timezone</label>
            <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Git Username</label>
            <Input
              value={gitUsername}
              onChange={(event) => setGitUsername(event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Working Hours Start</label>
              <Input value={start} onChange={(event) => setStart(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Working Hours End</label>
              <Input value={end} onChange={(event) => setEnd(event.target.value)} />
            </div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </section>
    </div>
  );
}
