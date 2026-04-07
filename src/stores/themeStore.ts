import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'midnight' | 'bloom' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'sand' | 'slate' | 'noir' | 'candy';

export interface ThemeColors {
  bg: { primary: string; surface: string; surfaceHover: string; surfaceActive: string; elevated: string };
  border: { default: string; subtle: string; focus: string };
  text: { primary: string; secondary: string; muted: string; inverse: string };
  accent: { purple: string; purpleHover: string; purpleSubtle: string };
  status: { todo: string; wip: string; done: string };
  danger: string;
}

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  description: string;
  previewColors: string[]; // 4 colors for the swatch preview
  colors: ThemeColors;
  radius: string; // base radius multiplier
  font: { family: string };
}

function makeTheme(
  id: ThemeId, label: string, description: string, previewColors: string[],
  bg: ThemeColors['bg'], border: ThemeColors['border'], text: ThemeColors['text'],
  accent: ThemeColors['accent'], status: ThemeColors['status'], danger: string,
  radius: string, fontFamily?: string
): ThemeConfig {
  return {
    id, label, description, previewColors,
    colors: { bg, border, text, accent, status, danger },
    radius,
    font: { family: fontFamily || "'Inter', system-ui, -apple-system, sans-serif" },
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  midnight: makeTheme('midnight', 'Midnight', 'Dark, minimal, geometric',
    ['#0F0F0F', '#7C3AED', '#1A1A1A', '#2A2A2A'],
    { primary: '#0F0F0F', surface: '#1A1A1A', surfaceHover: '#242424', surfaceActive: '#2E2E2E', elevated: '#1E1E1E' },
    { default: '#2A2A2A', subtle: '#222222', focus: '#7C3AED' },
    { primary: '#F5F5F5', secondary: '#A0A0A0', muted: '#666666', inverse: '#0F0F0F' },
    { purple: '#7C3AED', purpleHover: '#6D28D9', purpleSubtle: 'rgba(124,58,237,0.12)' },
    { todo: '#6B7280', wip: '#F59E0B', done: '#10B981' }, '#EF4444', '8px'
  ),
  bloom: makeTheme('bloom', 'Bloom', 'Warm, colorful, playful',
    ['#FFF9F0', '#E85D75', '#4CAF7D', '#E8A838'],
    { primary: '#FFF9F0', surface: '#FFFFFF', surfaceHover: '#FFF3E6', surfaceActive: '#FFECDA', elevated: '#FFFFFF' },
    { default: '#F0E6D8', subtle: '#F5EDE3', focus: '#E85D75' },
    { primary: '#2D2A26', secondary: '#6B6560', muted: '#A39E98', inverse: '#FFFFFF' },
    { purple: '#E85D75', purpleHover: '#D44A63', purpleSubtle: 'rgba(232,93,117,0.1)' },
    { todo: '#B8B2AB', wip: '#E8A838', done: '#4CAF7D' }, '#E85D50', '14px'
  ),
  ocean: makeTheme('ocean', 'Ocean', 'Cool blue depths',
    ['#0B1426', '#3B82F6', '#1E3A5F', '#164E63'],
    { primary: '#0B1426', surface: '#121E33', surfaceHover: '#1A2940', surfaceActive: '#22354D', elevated: '#162740' },
    { default: '#1E3450', subtle: '#182D45', focus: '#3B82F6' },
    { primary: '#E2E8F0', secondary: '#94A3B8', muted: '#546580', inverse: '#0B1426' },
    { purple: '#3B82F6', purpleHover: '#2563EB', purpleSubtle: 'rgba(59,130,246,0.12)' },
    { todo: '#546580', wip: '#F59E0B', done: '#10B981' }, '#EF4444', '8px'
  ),
  forest: makeTheme('forest', 'Forest', 'Natural, earthy greens',
    ['#0F1A0F', '#22C55E', '#1A2E1A', '#2D4A2D'],
    { primary: '#0F1A0F', surface: '#152015', surfaceHover: '#1E2E1E', surfaceActive: '#273827', elevated: '#1A271A' },
    { default: '#253525', subtle: '#1E2D1E', focus: '#22C55E' },
    { primary: '#E5F0E5', secondary: '#8FAF8F', muted: '#506850', inverse: '#0F1A0F' },
    { purple: '#22C55E', purpleHover: '#16A34A', purpleSubtle: 'rgba(34,197,94,0.12)' },
    { todo: '#506850', wip: '#EAB308', done: '#22C55E' }, '#EF4444', '8px'
  ),
  sunset: makeTheme('sunset', 'Sunset', 'Warm amber glow',
    ['#1A1008', '#F59E0B', '#2D1F0E', '#78350F'],
    { primary: '#1A1008', surface: '#221810', surfaceHover: '#2D2015', surfaceActive: '#38291A', elevated: '#251B12' },
    { default: '#3D2E1A', subtle: '#332510', focus: '#F59E0B' },
    { primary: '#FDF2E0', secondary: '#C4A67A', muted: '#7A6545', inverse: '#1A1008' },
    { purple: '#F59E0B', purpleHover: '#D97706', purpleSubtle: 'rgba(245,158,11,0.12)' },
    { todo: '#7A6545', wip: '#F59E0B', done: '#10B981' }, '#EF4444', '8px'
  ),
  lavender: makeTheme('lavender', 'Lavender', 'Soft purple serenity',
    ['#F8F5FF', '#8B5CF6', '#EDE8FF', '#DDD4FF'],
    { primary: '#F8F5FF', surface: '#FFFFFF', surfaceHover: '#F0EAFF', surfaceActive: '#E8E0FF', elevated: '#FFFFFF' },
    { default: '#E0D6F5', subtle: '#EBE4FA', focus: '#8B5CF6' },
    { primary: '#2E2252', secondary: '#6B5F8A', muted: '#A099B5', inverse: '#FFFFFF' },
    { purple: '#8B5CF6', purpleHover: '#7C3AED', purpleSubtle: 'rgba(139,92,246,0.1)' },
    { todo: '#A099B5', wip: '#F59E0B', done: '#10B981' }, '#EF4444', '14px'
  ),
  sand: makeTheme('sand', 'Sand', 'Warm neutral minimalism',
    ['#FAF7F2', '#B8956A', '#F0EBE3', '#E5DDD2'],
    { primary: '#FAF7F2', surface: '#FFFFFF', surfaceHover: '#F5F0E8', surfaceActive: '#EDE6DB', elevated: '#FFFFFF' },
    { default: '#E0D8CC', subtle: '#EAE4DA', focus: '#B8956A' },
    { primary: '#3D3428', secondary: '#7A6F60', muted: '#A69E90', inverse: '#FFFFFF' },
    { purple: '#B8956A', purpleHover: '#A07D55', purpleSubtle: 'rgba(184,149,106,0.1)' },
    { todo: '#A69E90', wip: '#D4932C', done: '#5D8C5A' }, '#C75050', '12px'
  ),
  slate: makeTheme('slate', 'Slate', 'Cool gray professional',
    ['#F1F5F9', '#475569', '#E2E8F0', '#CBD5E1'],
    { primary: '#F1F5F9', surface: '#FFFFFF', surfaceHover: '#EEF2F6', surfaceActive: '#E2E8F0', elevated: '#FFFFFF' },
    { default: '#CBD5E1', subtle: '#E2E8F0', focus: '#475569' },
    { primary: '#1E293B', secondary: '#64748B', muted: '#94A3B8', inverse: '#FFFFFF' },
    { purple: '#475569', purpleHover: '#334155', purpleSubtle: 'rgba(71,85,105,0.08)' },
    { todo: '#94A3B8', wip: '#F59E0B', done: '#10B981' }, '#EF4444', '10px'
  ),
  noir: makeTheme('noir', 'Noir', 'Pure black, high contrast',
    ['#000000', '#FFFFFF', '#111111', '#222222'],
    { primary: '#000000', surface: '#0A0A0A', surfaceHover: '#151515', surfaceActive: '#1F1F1F', elevated: '#0D0D0D' },
    { default: '#222222', subtle: '#1A1A1A', focus: '#FFFFFF' },
    { primary: '#FFFFFF', secondary: '#999999', muted: '#555555', inverse: '#000000' },
    { purple: '#FFFFFF', purpleHover: '#E0E0E0', purpleSubtle: 'rgba(255,255,255,0.08)' },
    { todo: '#555555', wip: '#F59E0B', done: '#10B981' }, '#FF4444', '4px'
  ),
  candy: makeTheme('candy', 'Candy', 'Sweet pastels, rounded',
    ['#FFF0F5', '#FF6B9D', '#C47AFF', '#4ECDC4'],
    { primary: '#FFF5F8', surface: '#FFFFFF', surfaceHover: '#FFF0F5', surfaceActive: '#FFE4ED', elevated: '#FFFFFF' },
    { default: '#FFD4E0', subtle: '#FFE8F0', focus: '#FF6B9D' },
    { primary: '#4A3548', secondary: '#8A7088', muted: '#B8A0B5', inverse: '#FFFFFF' },
    { purple: '#FF6B9D', purpleHover: '#E85588', purpleSubtle: 'rgba(255,107,157,0.1)' },
    { todo: '#B8A0B5', wip: '#FFB347', done: '#4ECDC4' }, '#FF6B6B', '18px'
  ),
};

export const THEME_ORDER: ThemeId[] = ['midnight', 'noir', 'ocean', 'forest', 'sunset', 'slate', 'lavender', 'bloom', 'sand', 'candy'];

// Helper to get current theme values (for non-React contexts)
export function getTheme(): ThemeConfig {
  return useThemeStore.getState().theme;
}

interface ThemeState {
  themeId: ThemeId;
  theme: ThemeConfig;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: 'midnight',
      theme: THEMES.midnight,
      setTheme: (id) => set({ themeId: id, theme: THEMES[id] }),
    }),
    { name: 'pulse-theme' }
  )
);
