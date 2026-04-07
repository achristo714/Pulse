import { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { ViewToggle } from './ViewToggle';
import { useUIStore } from '../../stores/uiStore';
import { colors, font } from '../../lib/theme';
import type { Profile } from '../../lib/types';

interface TopBarProps {
  profile: Profile;
  onSignOut: () => void;
  onNewTask: () => void;
  onPresent?: () => void;
  onZen?: () => void;
  onTextToTasks?: () => void;
}

export function TopBar({ profile, onSignOut, onNewTask, onPresent, onZen, onTextToTasks }: TopBarProps) {
  const setReportModalOpen = useUIStore((s) => s.setReportModalOpen);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{
      height: '60px', backgroundColor: colors.bg.surface,
      borderBottom: `1px solid ${colors.border.default}`,
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', flexShrink: 0, fontFamily: font.family,
    }}>
      <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, letterSpacing: '-0.01em' }}>Pulse</h1>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <ViewToggle />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onTextToTasks && <TopBtn onClick={onTextToTasks} title="Paste text → tasks (T)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6h4M6 8.5h4M6 11h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </TopBtn>}
        {onZen && <TopBtn onClick={onZen} title="Focus mode (Z)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>
        </TopBtn>}
        {onPresent && <TopBtn onClick={onPresent} title="Present mode (P)">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 6L10.5 8.5L6.5 11V6Z" fill="currentColor"/><path d="M5 13.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </TopBtn>}
        <button onClick={() => setReportModalOpen(true)} style={{
          padding: '6px 12px', backgroundColor: 'transparent', color: colors.text.secondary,
          fontSize: font.size.sm, fontWeight: font.weight.medium, borderRadius: '6px',
          border: `1px solid ${colors.border.default}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
        }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = colors.border.focus; e.currentTarget.style.color = colors.text.primary; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = colors.border.default; e.currentTarget.style.color = colors.text.secondary; }}
        >Generate Report</button>

        <button onClick={onNewTask} style={{
          padding: '6px 14px', backgroundColor: colors.accent.purple, color: '#FFFFFF',
          fontSize: font.size.sm, fontWeight: font.weight.medium, borderRadius: '6px',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 150ms',
        }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.accent.purpleHover)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.accent.purple)}
        >+ New Task</button>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
            <Avatar name={profile.display_name} url={profile.avatar_url} size={30} />
            <span style={{ fontSize: font.size.base, color: colors.text.secondary }}>{profile.display_name}</span>
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '200px',
              backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
              borderRadius: '8px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', zIndex: 50, overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.border.default}` }}>
                <div style={{ fontSize: font.size.base, color: colors.text.primary, fontWeight: font.weight.medium }}>{profile.display_name}</div>
                <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: '2px' }}>{profile.role}</div>
              </div>
              <MenuBtn onClick={() => { setShowMenu(false); onSignOut(); }}>Sign Out</MenuBtn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseOver={() => setH(true)} onMouseOut={() => setH(false)} style={{
      width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: font.size.sm,
      color: h ? colors.text.primary : colors.text.secondary,
      backgroundColor: h ? colors.bg.surfaceHover : 'transparent',
      border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
    }}>{children}</button>
  );
}

function TopBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} title={title} onMouseOver={() => setH(true)} onMouseOut={() => setH(false)} style={{
      padding: '6px 10px', backgroundColor: 'transparent', color: h ? colors.text.primary : colors.text.muted,
      fontSize: font.size.xs, borderRadius: '6px', border: `1px solid ${h ? colors.border.default : 'transparent'}`,
      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
    }}>{children}</button>
  );
}
