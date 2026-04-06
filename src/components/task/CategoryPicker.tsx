import { CATEGORIES, CATEGORY_CONFIG } from '../../lib/constants';
import { colors, font } from '../../lib/theme';
import type { TaskCategory } from '../../lib/types';

interface CategoryPickerProps {
  value: TaskCategory;
  onChange: (cat: TaskCategory) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 28px',
        borderBottom: `1px solid ${colors.border.default}`,
        fontFamily: font.family,
      }}
    >
      <span style={{ fontSize: font.size.xs, color: colors.text.muted, marginRight: '6px' }}>
        New task category:
      </span>
      {CATEGORIES.map((cat) => {
        const active = value === cat;
        const config = CATEGORY_CONFIG[cat];
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '14px',
              fontSize: font.size.xs,
              fontWeight: font.weight.medium,
              color: active ? config.color : colors.text.muted,
              backgroundColor: active ? `${config.color}15` : 'transparent',
              border: active ? `1px solid ${config.color}40` : '1px solid transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 150ms',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: config.color }} />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
