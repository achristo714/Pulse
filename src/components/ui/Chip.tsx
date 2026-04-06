interface ChipProps {
  label: string;
  color?: string;
  active?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function Chip({ label, color, active = false, onClick, size = 'md' }: ChipProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-[12px]';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-150 cursor-pointer border ${
        active
          ? 'bg-bg-surface-active border-border-focus text-text-primary'
          : 'bg-transparent border-border-default text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary'
      } ${sizeClasses}`}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}
