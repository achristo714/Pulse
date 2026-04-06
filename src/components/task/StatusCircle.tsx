import type { TaskStatus, TaskCategory } from '../../lib/types';
import { STATUS_CONFIG, CATEGORY_CONFIG } from '../../lib/constants';

interface StatusCircleProps {
  status: TaskStatus;
  size?: number;
  category?: TaskCategory;
  onClick?: () => void;
}

export function StatusCircle({ status, size = 18, category, onClick }: StatusCircleProps) {
  // WIP uses category color if provided, otherwise default
  const color = status === 'wip' && category
    ? CATEGORY_CONFIG[category].color
    : STATUS_CONFIG[status].color;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        flexShrink: 0,
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        padding: 0,
        display: 'flex',
        transition: 'transform 150ms',
      }}
      title={STATUS_CONFIG[status].label}
      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7.5" stroke={color} strokeWidth="1.5" />
        {status === 'wip' && (
          <path d="M9 1.5A7.5 7.5 0 0 1 9 16.5" fill={color} />
        )}
        {status === 'done' && (
          <>
            <circle cx="9" cy="9" r="7.5" fill={color} />
            <path
              d="M5.5 9.5L7.5 11.5L12.5 6.5"
              stroke="#0F0F0F"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
      </svg>
    </button>
  );
}
