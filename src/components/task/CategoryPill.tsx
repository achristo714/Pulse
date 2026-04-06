import type { TaskCategory } from '../../lib/types';
import { CATEGORY_CONFIG } from '../../lib/constants';

interface CategoryPillProps {
  category: TaskCategory;
}

export function CategoryPill({ category }: CategoryPillProps) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        backgroundColor: `${config.color}15`,
        color: config.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}
