import { useState } from 'react';

interface OnboardingPageProps {
  onCreateTeam: (teamName: string, displayName: string) => Promise<any>;
  onJoinTeam: (inviteCode: string, displayName: string) => Promise<any>;
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0F0F0F',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: '16px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  wrapper: { width: '100%', maxWidth: '400px' },
  header: { textAlign: 'center' as const, marginBottom: '32px' },
  title: {
    fontSize: '32px',
    fontWeight: 600,
    color: '#F5F5F5',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  subtitle: { fontSize: '14px', color: '#A0A0A0' },
  card: {
    backgroundColor: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
    padding: '28px',
  },
  label: {
    display: 'block' as const,
    fontSize: '11px',
    fontWeight: 500,
    color: '#A0A0A0',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    backgroundColor: '#0F0F0F',
    border: '1px solid #2A2A2A',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#F5F5F5',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 150ms ease-out',
  },
  primaryBtn: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: '#7C3AED',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 150ms ease-out',
  },
  ghostBtn: {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: '#A0A0A0',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    border: '1px solid #2A2A2A',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 150ms ease-out',
  },
  backBtn: {
    padding: '10px 16px',
    backgroundColor: 'transparent',
    color: '#A0A0A0',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '8px',
    border: '1px solid #2A2A2A',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  error: { color: '#F87171', fontSize: '12px', marginTop: '4px' },
};

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
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>Welcome to Pulse</h1>
          <p style={styles.subtitle}>Set up your workspace</p>
        </div>

        <div style={styles.card}>
          {mode === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                style={styles.primaryBtn}
                onClick={() => setMode('create')}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#6D28D9')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#7C3AED')}
              >
                Create a New Team
              </button>
              <button
                style={styles.ghostBtn}
                onClick={() => setMode('join')}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#3A3A3A';
                  e.currentTarget.style.color = '#F5F5F5';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#2A2A2A';
                  e.currentTarget.style.color = '#A0A0A0';
                }}
              >
                Join with Invite Code
              </button>
            </div>
          )}

          {mode === 'create' && (
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={styles.label}>Your Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Andy"
                  required
                  style={styles.input}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7C3AED')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2A2A')}
                />
              </div>
              <div>
                <label style={styles.label}>Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="KPF Applied Technology"
                  required
                  style={styles.input}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7C3AED')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2A2A')}
                />
              </div>
              {error && <p style={styles.error}>{error}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" style={styles.backBtn} onClick={() => setMode('choose')}>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.primaryBtn,
                    flex: 1,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseOver={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#6D28D9';
                  }}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#7C3AED')}
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          )}

          {mode === 'join' && (
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={styles.label}>Your Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  style={styles.input}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7C3AED')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2A2A')}
                />
              </div>
              <div>
                <label style={styles.label}>Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="abc12345"
                  required
                  style={styles.input}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#7C3AED')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2A2A')}
                />
              </div>
              {error && <p style={styles.error}>{error}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" style={styles.backBtn} onClick={() => setMode('choose')}>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.primaryBtn,
                    flex: 1,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseOver={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = '#6D28D9';
                  }}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#7C3AED')}
                >
                  {loading ? 'Joining...' : 'Join Team'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
