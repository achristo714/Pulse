import type { TaskStatus } from '../../lib/types';
import { STATUS_CONFIG } from '../../lib/constants';

interface StatusCircleProps {
  status: TaskStatus;
  size?: number;
  onClick?: () => void;
}

export function StatusCircle({ status, size = 18, onClick }: StatusCircleProps) {
  const color = STATUS_CONFIG[status].color;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="shrink-0 cursor-pointer hover:scale-110 transition-transform duration-150"
      title={STATUS_CONFIG[status].label}
    >
      <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7.5" stroke={color} strokeWidth="1.5" />
        {status === 'wip' && (
          <path
            d="M9 1.5A7.5 7.5 0 0 1 9 16.5"
            fill={color}
          />
        )}
        {status === 'done' && (
          <circle cx="9" cy="9" r="7.5" fill={color} />
        )}
        {status === 'done' && (
          <path
            d="M5.5 9.5L7.5 11.5L12.5 6.5"
            stroke="#0F0F0F"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
