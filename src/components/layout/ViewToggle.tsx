import { useUIStore } from '../../stores/uiStore';
import { colors, font } from '../../lib/theme';

const TABS = [
  { key: 'list' as const, label: 'Tasks' },
  { key: 'canvas' as const, label: 'Canvas' },
  { key: 'goals' as const, label: 'Goals' },
  { key: 'knowledge' as const, label: 'Knowledge' },
  { key: 'vault' as const, label: 'Vault' },
];

export function ViewToggle() {
  const { viewMode, setViewMode } = useUIStore();

  return (
    <div style={{ display: 'flex', backgroundColor: colors.bg.primary, borderRadius: '20px', padding: '2px', border: `1px solid ${colors.border.default}` }}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          style={{
            padding: '5px 14px', borderRadius: '20px', fontSize: font.size.sm, fontWeight: font.weight.medium,
            color: viewMode === tab.key ? colors.text.primary : colors.text.secondary,
            backgroundColor: viewMode === tab.key ? colors.bg.surfaceActive : 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease-out',
          }}
          onClick={() => setViewMode(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
