import { useState } from 'react';
import { Button } from '../ui/Button';

interface AuthPageProps {
  onSignIn: (email: string) => Promise<{ error: any }>;
}

export function AuthPage({ onSignIn }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await onSignIn(email);
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary mb-2">
            Pulse
          </h1>
          <p className="text-text-secondary text-[13px]">
            Task management for Applied Technology
          </p>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
          {sent ? (
            <div className="text-center">
              <div className="text-[16px] font-medium text-text-primary mb-2">Check your email</div>
              <p className="text-text-secondary text-[13px]">
                We sent a magic link to <strong className="text-text-primary">{email}</strong>
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-accent-purple text-[13px] hover:underline cursor-pointer"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@kpf.com"
                required
                className="w-full bg-bg-primary border border-border-default rounded-[4px] px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors duration-150"
              />
              {error && <p className="text-red-400 text-[11px] mt-2">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full mt-4">
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
