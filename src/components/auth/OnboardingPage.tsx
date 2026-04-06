import { useState } from 'react';
import { Button } from '../ui/Button';

interface OnboardingPageProps {
  onCreateTeam: (teamName: string, displayName: string) => Promise<any>;
  onJoinTeam: (inviteCode: string, displayName: string) => Promise<any>;
}

export function OnboardingPage({ onCreateTeam, onJoinTeam }: OnboardingPageProps) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [teamName, setTeamName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await onCreateTeam(teamName, displayName);
    if (!result) setError('Failed to create team');
    setLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await onJoinTeam(inviteCode, displayName);
    if (!result) setError('Invalid invite code');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-text-primary mb-2">
            Welcome to Pulse
          </h1>
          <p className="text-text-secondary text-[13px]">Set up your workspace</p>
        </div>

        <div className="bg-bg-surface border border-border-default rounded-[12px] p-6">
          {mode === 'choose' && (
            <div className="space-y-3">
              <Button onClick={() => setMode('create')} className="w-full">
                Create a New Team
              </Button>
              <Button variant="ghost" onClick={() => setMode('join')} className="w-full">
                Join with Invite Code
              </Button>
            </div>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Andy"
                  required
                  className="w-full bg-bg-primary border border-border-default rounded-[4px] px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors duration-150"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="KPF Applied Technology"
                  required
                  className="w-full bg-bg-primary border border-border-default rounded-[4px] px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors duration-150"
                />
              </div>
              {error && <p className="text-red-400 text-[11px]">{error}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setMode('choose')} type="button">
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Team'}
                </Button>
              </div>
            </form>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-bg-primary border border-border-default rounded-[4px] px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors duration-150"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="abc12345"
                  required
                  className="w-full bg-bg-primary border border-border-default rounded-[4px] px-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors duration-150"
                />
              </div>
              {error && <p className="text-red-400 text-[11px]">{error}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setMode('choose')} type="button">
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Joining...' : 'Join Team'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
