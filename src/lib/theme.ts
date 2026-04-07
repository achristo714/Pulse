// Re-export theme values reactively from the store
// Components that use `colors` and `font` will get the active theme
import { useThemeStore } from '../stores/themeStore';

// These getters read from the store at call time (non-reactive, for inline styles in event handlers etc.)
export const colors = new Proxy({} as any, {
  get: (_target, section: string) => {
    return new Proxy({} as any, {
      get: (_t2, key: string) => {
        const theme = useThemeStore.getState().theme;
        return (theme.colors as any)[section]?.[key];
      },
    });
  },
});

export const font = new Proxy({} as any, {
  get: (_target, section: string) => {
    const theme = useThemeStore.getState().theme;
    if (section === 'family') return theme.font.family;
    // size and weight
    if (section === 'size') return new Proxy({} as any, { get: (_t, k: string) => ({ xs: '12px', sm: '13px', base: '14px', md: '15px', lg: '17px', xl: '22px', title: '30px' }[k]) });
    if (section === 'weight') return new Proxy({} as any, { get: (_t, k: string) => ({ normal: 400, medium: 500, semibold: 600 }[k]) });
    return undefined;
  },
});

export const radius = { sm: '4px', md: '6px', lg: '8px', xl: '12px' };

export const shadow = {
  get modal() { const t = useThemeStore.getState().theme; const isDark = t.colors.bg.primary.startsWith('#0') || t.colors.bg.primary.startsWith('#1'); return isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.12)'; },
  get dropdown() { const t = useThemeStore.getState().theme; const isDark = t.colors.bg.primary.startsWith('#0') || t.colors.bg.primary.startsWith('#1'); return isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)'; },
  get panel() { const t = useThemeStore.getState().theme; const isDark = t.colors.bg.primary.startsWith('#0') || t.colors.bg.primary.startsWith('#1'); return isDark ? '-4px 0 24px rgba(0,0,0,0.3)' : '-4px 0 20px rgba(0,0,0,0.06)'; },
};
