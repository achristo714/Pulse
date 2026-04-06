import { useCategoryStore } from '../../stores/categoryStore';
import { colors } from '../../lib/theme';

interface CategoryPickerProps {
  value: string;
  onChange: (cat: string) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { categories } = useCategoryStore();

  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {categories.map((cat) => {
        const active = value === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            title={cat.label}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? `${cat.color}20` : 'transparent',
              border: active ? `1.5px solid ${cat.color}` : '1px solid transparent',
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
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
          </button>
        );
      })}
    </div>
  );
}
