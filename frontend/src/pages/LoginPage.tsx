import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ApiClientError } from '@/services/apiClient';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast({ title: 'Welcome back', variant: 'success' });
      navigate(from, { replace: true });
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : 'Unable to sign in';
      toast({ title: 'Login failed', description: message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Developer Report Generator
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">
            Access your projects, git activity, and daily reports.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
