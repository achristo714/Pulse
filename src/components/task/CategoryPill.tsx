import type { TaskCategory } from '../../lib/types';
import { CATEGORY_CONFIG } from '../../lib/constants';
import { font } from '../../lib/theme';

interface CategoryPillProps {
  category: TaskCategory;
}

export function CategoryPill({ category }: CategoryPillProps) {
  const config = CATEGORY_CONFIG[category];
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
        backgroundColor: `${config.color}18`,
        color: config.color,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.color,
        }}
      />
      {config.label}
    </span>
  );
}
