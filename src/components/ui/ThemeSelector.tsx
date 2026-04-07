import { useThemeStore, THEMES, THEME_ORDER } from '../../stores/themeStore';
import { Modal } from './Modal';

export function ThemeSelector({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { themeId, setTheme, theme } = useThemeStore();
  const c = theme.colors;
  const f = theme.font;

  return (
    <Modal open={open} onClose={onClose} title="Appearance" width="560px">
      <div>
        <p style={{ fontSize: '13px', color: c.text.secondary, margin: '0 0 20px', fontFamily: f.family }}>
          Choose a theme that suits your vibe
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
        }}>
          {THEME_ORDER.map((id) => {
            const t = THEMES[id];
            const active = themeId === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                style={{
                  padding: 0,
                  border: active ? `2px solid ${t.colors.accent.purple}` : `2px solid transparent`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  backgroundColor: t.colors.bg.primary,
                  transition: 'all 200ms ease-out',
                  boxShadow: active ? `0 0 0 3px ${t.colors.accent.purple}20` : `0 2px 8px rgba(0,0,0,0.08)`,
                  fontFamily: f.family,
                }}
              >
                {/* Color swatch preview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', height: '56px', gap: '0' }}>
                  <div style={{ backgroundColor: t.previewColors[0], borderRadius: '0' }} />
                  <div style={{ backgroundColor: t.previewColors[1], borderRadius: '0' }} />
                  <div style={{ backgroundColor: t.previewColors[2], borderRadius: '0' }} />
                  <div style={{ backgroundColor: t.previewColors[3], borderRadius: '0' }} />
                </div>

                {/* Label */}
                <div style={{
                  padding: '8px 6px',
                  backgroundColor: t.colors.bg.surface,
                  borderTop: `1px solid ${t.colors.border.default}`,
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: t.colors.text.primary, textAlign: 'center' }}>
                    {t.label}
                  </div>
                </div>

                {/* Active indicator */}
                {active && (
                  <div style={{
                    height: '3px',
                    backgroundColor: t.colors.accent.purple,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
