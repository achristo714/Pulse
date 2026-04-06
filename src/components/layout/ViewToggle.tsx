import { useUIStore } from '../../stores/uiStore';
import { colors, font } from '../../lib/theme';

const TABS = [
  { key: 'list' as const, label: 'Tasks', accent: '#7C3AED' },
  { key: 'canvas' as const, label: 'Canvas', accent: '#818CF8' },
  { key: 'calendar' as const, label: 'Calendar', accent: '#60A5FA' },
  { key: 'goals' as const, label: 'Goals', accent: '#F59E0B' },
  { key: 'knowledge' as const, label: 'Knowledge', accent: '#34D399' },
  { key: 'vault' as const, label: 'Vault', accent: '#F472B6' },
];

export function ViewToggle() {
  const { viewMode, setViewMode } = useUIStore();

  return (
    <div style={{
      display: 'flex',
      backgroundColor: colors.bg.primary,
      borderRadius: '22px',
      padding: '3px',
      border: `1px solid ${colors.border.default}`,
      gap: '2px',
    }}>
      {TABS.map((tab) => {
        const active = viewMode === tab.key;
        return (
          <button
            key={tab.key}
            style={{
              padding: '6px 14px',
              borderRadius: '18px',
              fontSize: font.size.sm,
              fontWeight: font.weight.medium,
              color: active ? '#fff' : colors.text.secondary,
              backgroundColor: active ? tab.accent : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 200ms ease-out',
              boxShadow: active ? `0 2px 8px ${tab.accent}30` : 'none',
            }}
            onClick={() => setViewMode(tab.key)}
            onMouseOver={(e) => {
              if (!active) {
                e.currentTarget.style.color = tab.accent;
                e.currentTarget.style.backgroundColor = `${tab.accent}10`;
              }
            }}
            onMouseOut={(e) => {
              if (!active) {
                e.currentTarget.style.color = colors.text.secondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
