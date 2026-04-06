// Pulse Design Tokens — Mistral AI-inspired dark theme

export const colors = {
  bg: {
    primary: '#0F0F0F',
    surface: '#1A1A1A',
    surfaceHover: '#242424',
    surfaceActive: '#2E2E2E',
    elevated: '#1E1E1E',
  },
  border: {
    default: '#2A2A2A',
    subtle: '#222222',
    focus: '#7C3AED',
  },
  text: {
    primary: '#F5F5F5',
    secondary: '#A0A0A0',
    muted: '#666666',
    inverse: '#0F0F0F',
  },
  accent: {
    purple: '#7C3AED',
    purpleHover: '#6D28D9',
    purpleSubtle: 'rgba(124, 58, 237, 0.12)',
  },
  status: {
    todo: '#6B7280',
    wip: '#F59E0B',
    done: '#10B981',
  },
  category: {
    education: '#818CF8',
    resources: '#34D399',
    support: '#F472B6',
    admin: '#FB923C',
  },
  sticky: {
    purple: '#7C3AED',
    amber: '#F59E0B',
    emerald: '#10B981',
    pink: '#F472B6',
    slate: '#6B7280',
  },
  danger: '#EF4444',
} as const;

export const radius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
} as const;

export const shadow = {
  modal: '0 8px 32px rgba(0,0,0,0.5)',
  dropdown: '0 4px 24px rgba(0,0,0,0.4)',
  panel: '-4px 0 24px rgba(0,0,0,0.3)',
} as const;

export const font = {
  family: "'Inter', system-ui, -apple-system, sans-serif",
  size: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '17px',
    xl: '22px',
    title: '30px',
  },
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
  },
} as const;
