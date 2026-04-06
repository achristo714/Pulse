import { CATEGORIES, CATEGORY_CONFIG } from '../../lib/constants';
import { colors } from '../../lib/theme';
import type { TaskCategory } from '../../lib/types';

interface CategoryPickerProps {
  value: TaskCategory;
  onChange: (cat: TaskCategory) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {CATEGORIES.map((cat) => {
        const active = value === cat;
        const config = CATEGORY_CONFIG[cat];
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            title={config.label}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? `${config.color}20` : 'transparent',
              border: active ? `1.5px solid ${config.color}` : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 150ms',
              padding: 0,
            }}
            onMouseOver={(e) => {
              if (!active) e.currentTarget.style.backgroundColor = colors.bg.surfaceHover;
            }}
            onMouseOut={(e) => {
              if (!active) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: config.color }} />
          </button>
        );
      })}
    </div>
  );
}
