import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/contexts/ToastContext';
import { ApiClientError } from '@/services/apiClient';
import { saasApi } from '@/services/saasApi';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const initialToken = useMemo(() => params.get('token') ?? '', [params]);

  const [token, setToken] = useState(initialToken);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await saasApi.acceptInvitation({ token, name, password });
      toast({
        title: 'Welcome to the organization',
        description: 'Please sign in with your new credentials.',
        variant: 'success',
      });
      navigate('/login', { replace: true });
    } catch (error) {
      toast({
        title: 'Invite failed',
        description: error instanceof ApiClientError ? error.message : 'Unable to accept invite',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Accept Invitation</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create your password to join the organization.
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Invite Token</label>
          <Input value={token} onChange={(event) => setToken(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Full Name</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Joining…' : 'Join Organization'}
        </Button>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-slate-900 underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
