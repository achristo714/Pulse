import { useState, useEffect } from 'react';
import { colors, font } from '../../lib/theme';

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Don't show if already installed, dismissed, or no prompt
  if (!deferredPrompt || dismissed) return null;
  if (window.matchMedia('(display-mode: standalone)').matches) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <div style={{
      position: 'fixed', bottom: '60px', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 20px', borderRadius: '12px',
      backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 200,
      fontFamily: font.family,
    }}>
      <span style={{ fontSize: font.size.sm, color: colors.text.primary, fontWeight: font.weight.medium }}>
        Install Pulse as a desktop app
      </span>
      <button onClick={handleInstall} style={{
        padding: '5px 14px', backgroundColor: colors.accent.purple, color: '#fff',
        fontSize: font.size.xs, fontWeight: font.weight.semibold, borderRadius: '8px',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
      }}>Install</button>
      <button onClick={() => setDismissed(true)} style={{
        background: 'none', border: 'none', color: colors.text.muted,
        cursor: 'pointer', fontSize: font.size.xs, padding: '4px',
      }}>✕</button>
    </div>
  );
}
