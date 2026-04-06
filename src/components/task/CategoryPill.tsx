import { useCategoryStore } from '../../stores/categoryStore';
import { font } from '../../lib/theme';

interface CategoryPillProps {
  category: string;
}

export function CategoryPill({ category }: CategoryPillProps) {
  const { getCategoryConfig } = useCategoryStore();
  const config = getCategoryConfig();
  const cat = config[category] || { label: category, color: '#666' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '20px',
        fontSize: font.size.xs,
        fontWeight: font.weight.medium,
        backgroundColor: `${cat.color}18`,
        color: cat.color,
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cat.color }} />
      {cat.label}
    </span>
  );
}
