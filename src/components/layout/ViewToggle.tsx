import { useUIStore } from '../../stores/uiStore';
import { colors, font } from '../../lib/theme';

const TABS = [
  { key: 'dashboard' as const, label: 'Home', accent: '#7C3AED' },
  { key: 'list' as const, label: 'Tasks', accent: '#7C3AED' },
  { key: 'canvas' as const, label: 'Canvas', accent: '#818CF8' },
  { key: 'calendar' as const, label: 'Calendar', accent: '#60A5FA' },
  { key: 'goals' as const, label: 'Goals', accent: '#F59E0B' },
  { key: 'sync' as const, label: 'Sync', accent: '#FB923C' },
  { key: 'knowledge' as const, label: 'Wiki', accent: '#34D399' },
  { key: 'vault' as const, label: 'Vault', accent: '#F472B6' },
  { key: 'analytics' as const, label: 'Analytics', accent: '#10B981' },
];

export function ViewToggle() {
  const { viewMode, setViewMode } = useUIStore();

  return (
    <div style={{ display: 'flex', gap: '2px', padding: '4px 0' }}>
      {TABS.map((tab) => {
        const active = viewMode === tab.key;
        return (
          <button
            key={tab.key}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: font.size.xs,
              fontWeight: font.weight.medium,
              color: active ? '#fff' : colors.text.secondary,
              backgroundColor: active ? tab.accent : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 150ms ease-out',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setViewMode(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
