import { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { ViewToggle } from './ViewToggle';
import { useUIStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import { colors, font } from '../../lib/theme';
import type { Profile } from '../../lib/types';

interface TopBarProps {
  profile: Profile;
  onSignOut: () => void;
}

export function TopBar({ profile, onSignOut }: TopBarProps) {
  const setReportModalOpen = useUIStore((s) => s.setReportModalOpen);
  const createTask = useTaskStore((s) => s.createTask);
  const [showMenu, setShowMenu] = useState(false);

  const handleNewTask = async () => {
    await createTask({
      team_id: profile.team_id,
      created_by: profile.id,
      title: 'New Task',
      status: 'todo',
      category: 'admin',
    });
  };

  return (
    <div
      style={{
        height: '56px',
        backgroundColor: colors.bg.surface,
        borderBottom: `1px solid ${colors.border.default}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '16px',
        flexShrink: 0,
        fontFamily: font.family,
      }}
    >
      <h1
        style={{
          fontSize: font.size.xl,
          fontWeight: font.weight.semibold,
          color: colors.text.primary,
          letterSpacing: '-0.01em',
        }}
      >
        Pulse
      </h1>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <ViewToggle />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => setReportModalOpen(true)}
          style={{
            padding: '6px 12px',
            backgroundColor: 'transparent',
            color: colors.text.secondary,
            fontSize: font.size.sm,
            fontWeight: font.weight.medium,
            borderRadius: '6px',
            border: `1px solid ${colors.border.default}`,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 150ms ease-out',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = colors.border.focus;
            e.currentTarget.style.color = colors.text.primary;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = colors.border.default;
            e.currentTarget.style.color = colors.text.secondary;
          }}
        >
          Generate Report
        </button>

        <button
          onClick={handleNewTask}
          style={{
            padding: '6px 14px',
            backgroundColor: colors.accent.purple,
            color: '#FFFFFF',
            fontSize: font.size.sm,
            fontWeight: font.weight.medium,
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background-color 150ms ease-out',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.accent.purpleHover)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.accent.purple)}
        >
          + New Task
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              fontFamily: 'inherit',
            }}
          >
            <Avatar name={profile.display_name} url={profile.avatar_url} size={30} />
            <span style={{ fontSize: font.size.base, color: colors.text.secondary }}>
              {profile.display_name}
            </span>
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '8px',
                width: '200px',
                backgroundColor: colors.bg.surface,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '8px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                zIndex: 50,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${colors.border.default}` }}>
                <div style={{ fontSize: font.size.base, color: colors.text.primary, fontWeight: font.weight.medium }}>
                  {profile.display_name}
                </div>
                <div style={{ fontSize: font.size.xs, color: colors.text.muted, marginTop: '2px' }}>
                  {profile.role}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onSignOut();
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  fontSize: font.size.sm,
                  color: colors.text.secondary,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 150ms',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.surfaceHover;
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = colors.text.secondary;
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
