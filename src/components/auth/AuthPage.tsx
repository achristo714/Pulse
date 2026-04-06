import { useState } from 'react';

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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: '#F5F5F5',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            Pulse
          </h1>
          <p style={{ fontSize: '14px', color: '#A0A0A0' }}>
            Task management for Applied Technology
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            padding: '28px',
          }}
        >
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#7C3AED20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '20px',
                }}
              >
                ✉
              </div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#F5F5F5',
                  marginBottom: '8px',
                }}
              >
                Check your email
              </div>
              <p style={{ fontSize: '13px', color: '#A0A0A0', lineHeight: 1.5 }}>
                We sent a magic link to{' '}
                <strong style={{ color: '#F5F5F5' }}>{email}</strong>
              </p>
              <button
                onClick={() => setSent(false)}
                style={{
                  marginTop: '16px',
                  color: '#7C3AED',
                  fontSize: '13px',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#A0A0A0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@kpf.com"
                required
                style={{
                  width: '100%',
                  backgroundColor: '#0F0F0F',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: '#F5F5F5',
                  outline: 'none',
                  transition: 'border-color 150ms ease-out',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#7C3AED')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#2A2A2A')}
              />
              {error && (
                <p style={{ color: '#F87171', fontSize: '12px', marginTop: '8px' }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '10px 16px',
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 500,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'background-color 150ms ease-out',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#6D28D9';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#7C3AED';
                }}
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
