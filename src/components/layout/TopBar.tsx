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
  onTheme?: () => void;
}

export function TopBar({ profile, onSignOut, onNewTask, onPresent, onZen, onTextToTasks, onTheme }: TopBarProps) {
  const setReportModalOpen = useUIStore((s) => s.setReportModalOpen);
  const [showMenu, setShowMenu] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <div style={{ backgroundColor: colors.bg.surface, borderBottom: `1px solid ${colors.border.default}`, flexShrink: 0, fontFamily: font.family }}>
      {/* Top row: logo + actions */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: '52px', gap: '8px' }}>
        <h1 style={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: colors.text.primary, letterSpacing: '-0.01em', marginRight: '8px' }}>Pulse</h1>

        <div style={{ flex: 1 }} />

        {/* Action icons — desktop */}
        <div className="desktop-only" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {onTheme && <IconBtn onClick={onTheme} title="Theme"><PaletteIcon /></IconBtn>}
          {onTextToTasks && <IconBtn onClick={onTextToTasks} title="Paste"><ClipboardIcon /></IconBtn>}
          {onZen && <IconBtn onClick={onZen} title="Focus"><FocusIcon /></IconBtn>}
          {onPresent && <IconBtn onClick={onPresent} title="Present"><PresentIcon /></IconBtn>}
        </div>

        <IconBtn onClick={() => setReportModalOpen(true)} title="Generate Report (R)">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
        </IconBtn>

        <button onClick={onNewTask} style={{
          padding: '5px 12px', backgroundColor: colors.accent.purple, color: '#FFFFFF',
          fontSize: font.size.xs, fontWeight: font.weight.medium, borderRadius: '6px',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>+ New</button>

        {/* Mobile menu toggle */}
        <div className="mobile-only" style={{ display: 'none' }}>
          <IconBtn onClick={() => setShowActions(!showActions)} title="More">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="4" cy="8" r="1.2" fill="currentColor"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="8" r="1.2" fill="currentColor"/></svg>
          </IconBtn>
        </div>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
            <Avatar name={profile.display_name} url={profile.avatar_url} size={28} />
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '180px',
              backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
              borderRadius: '8px', boxShadow: '0 4px 24px rgba(0,0,0,0.4)', zIndex: 50, overflow: 'hidden',
            }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${colors.border.default}` }}>
                <div style={{ fontSize: font.size.sm, color: colors.text.primary, fontWeight: font.weight.medium }}>{profile.display_name}</div>
                <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: '2px' }}>{profile.role}</div>
              </div>
              {onTheme && <MenuBtn onClick={() => { setShowMenu(false); onTheme(); }}>Appearance</MenuBtn>}
              <MenuBtn onClick={() => { setShowMenu(false); onSignOut(); }}>Sign Out</MenuBtn>
            </div>
          )}
        </div>
      </div>

      {/* Nav tabs — scrollable row */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderTop: `1px solid ${colors.border.subtle}`, padding: '0 8px' }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          <ViewToggle />
        </div>
      </div>
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} title={title} onMouseOver={() => setH(true)} onMouseOut={() => setH(false)} style={{
      width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '6px', backgroundColor: h ? colors.bg.surfaceHover : 'transparent',
      border: 'none', color: h ? colors.text.primary : colors.text.muted,
      cursor: 'pointer', transition: 'all 150ms', padding: 0,
    }}>{children}</button>
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

function PaletteIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M8 2a6 6 0 0 0 0 12V2z" fill="currentColor" opacity="0.3"/><circle cx="6" cy="6" r="1" fill="currentColor"/></svg>; }
function ClipboardIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6h4M6 8.5h4M6 11h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>; }
function FocusIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>; }
function PresentIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 6L10.5 8.5L6.5 11V6Z" fill="currentColor"/></svg>; }
