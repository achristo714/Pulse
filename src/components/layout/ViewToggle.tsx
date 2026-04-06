import { useUIStore } from '../../stores/uiStore';
import { colors, font } from '../../lib/theme';

export function ViewToggle() {
  const { viewMode, setViewMode } = useUIStore();

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 16px',
    borderRadius: '20px',
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: active ? colors.text.primary : colors.text.secondary,
    backgroundColor: active ? colors.bg.surfaceActive : 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 150ms ease-out',
  });

  return (
    <div
      style={{
        display: 'flex',
        backgroundColor: colors.bg.primary,
        borderRadius: '20px',
        padding: '2px',
        border: `1px solid ${colors.border.default}`,
      }}
    >
      <button style={btnStyle(viewMode === 'list')} onClick={() => setViewMode('list')}>
        List
      </button>
      <button style={btnStyle(viewMode === 'canvas')} onClick={() => setViewMode('canvas')}>
        Canvas
      </button>
    </div>
  );
}
