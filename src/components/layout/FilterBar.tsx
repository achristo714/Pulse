import { Chip } from '../ui/Chip';
import { Avatar } from '../ui/Avatar';
import { useUIStore } from '../../stores/uiStore';
import { CATEGORY_CONFIG, STATUS_CONFIG, CATEGORIES, STATUSES } from '../../lib/constants';
import type { Profile } from '../../lib/types';

interface FilterBarProps {
  members: Profile[];
}

export function FilterBar({ members }: FilterBarProps) {
  const {
    categoryFilters,
    statusFilters,
    assigneeFilter,
    toggleCategoryFilter,
    toggleStatusFilter,
    setAssigneeFilter,
  } = useUIStore();

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border-default overflow-x-auto">
      {/* Category filters */}
      <div className="flex items-center gap-1.5">
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={CATEGORY_CONFIG[cat].label}
            color={CATEGORY_CONFIG[cat].color}
            active={categoryFilters.includes(cat)}
            onClick={() => toggleCategoryFilter(cat)}
          />
        ))}
      </div>

      <div className="w-px h-5 bg-border-default" />

      {/* Status filters */}
      <div className="flex items-center gap-1.5">
        {STATUSES.map((status) => (
          <Chip
            key={status}
            label={STATUS_CONFIG[status].label}
            color={STATUS_CONFIG[status].color}
            active={statusFilters.includes(status)}
            onClick={() => toggleStatusFilter(status)}
          />
        ))}
      </div>

      <div className="w-px h-5 bg-border-default" />

      {/* Assignee filters */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setAssigneeFilter(assigneeFilter === 'unassigned' ? null : 'unassigned')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] font-medium transition-all duration-150 cursor-pointer border ${
            assigneeFilter === 'unassigned'
              ? 'bg-bg-surface-active border-border-focus text-text-primary'
              : 'border-border-default text-text-secondary hover:bg-bg-surface-hover'
          }`}
        >
          Unassigned
        </button>
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => setAssigneeFilter(assigneeFilter === member.id ? null : member.id)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] transition-all duration-150 cursor-pointer border ${
              assigneeFilter === member.id
                ? 'bg-bg-surface-active border-border-focus'
                : 'border-border-default hover:bg-bg-surface-hover'
            }`}
          >
            <Avatar name={member.display_name} url={member.avatar_url} size={18} />
            <span className="text-text-secondary">{member.display_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
