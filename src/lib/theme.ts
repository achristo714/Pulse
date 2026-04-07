// Theme bridge — reads from the theme store at call time
// Fallback colors used until the store is initialized

const defaultColors = {
  bg: { primary: '#0F0F0F', surface: '#1A1A1A', surfaceHover: '#242424', surfaceActive: '#2E2E2E', elevated: '#1E1E1E' },
  border: { default: '#2A2A2A', subtle: '#222222', focus: '#7C3AED' },
  text: { primary: '#F5F5F5', secondary: '#A0A0A0', muted: '#666666', inverse: '#0F0F0F' },
  accent: { purple: '#7C3AED', purpleHover: '#6D28D9', purpleSubtle: 'rgba(124,58,237,0.12)' },
  status: { todo: '#6B7280', wip: '#F59E0B', done: '#10B981' },
  danger: '#EF4444',
};

// Late-bind to avoid circular import — store is set after initialization
let _getTheme: (() => any) | null = null;

export function _bindThemeStore(getter: () => any) {
  _getTheme = getter;
}

function getColors() {
  if (_getTheme) {
    try { return _getTheme().colors; } catch { /* fall through */ }
  }
  return defaultColors;
}

export const colors = {
  get bg() { return getColors().bg; },
  get border() { return getColors().border; },
  get text() { return getColors().text; },
  get accent() { return getColors().accent; },
  get status() { return getColors().status; },
  get danger() { return getColors().danger; },
  get category() {
    return { education: '#818CF8', resources: '#34D399', support: '#F472B6', admin: '#FB923C' };
  },
  get sticky() {
    return { purple: '#7C3AED', amber: '#F59E0B', emerald: '#10B981', pink: '#F472B6', slate: '#6B7280' };
  },
};

export const font = {
  get family() {
    if (_getTheme) try { return _getTheme().font.family; } catch { /* fall through */ }
    return "'Inter', system-ui, -apple-system, sans-serif";
  },
  size: { xs: '12px', sm: '13px', base: '14px', md: '15px', lg: '17px', xl: '22px', title: '30px' } as const,
  weight: { normal: 400, medium: 500, semibold: 600 } as const,
};

export const radius = { sm: '4px', md: '6px', lg: '8px', xl: '12px' } as const;

function isDark() {
  const bg = getColors().bg.primary;
  const hex = bg.replace('#', '');
  if (hex.length >= 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r + g + b) / 3 < 128;
  }
  return true;
}

export const shadow = {
  get modal() { return isDark() ? '0 8px 32px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.12)'; },
  get dropdown() { return isDark() ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.08)'; },
  get panel() { return isDark() ? '-4px 0 24px rgba(0,0,0,0.3)' : '-4px 0 20px rgba(0,0,0,0.06)'; },
};
