import { Avatar } from '../ui/Avatar';
import { useUIStore } from '../../stores/uiStore';
import { CATEGORY_CONFIG, STATUS_CONFIG, CATEGORIES, STATUSES } from '../../lib/constants';
import { colors, font } from '../../lib/theme';
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

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: active ? colors.text.primary : colors.text.secondary,
    backgroundColor: active ? colors.bg.surfaceActive : 'transparent',
    border: `1px solid ${active ? colors.border.focus : colors.border.default}`,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 150ms ease-out',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 28px',
        borderBottom: `1px solid ${colors.border.default}`,
        overflowX: 'auto',
        fontFamily: font.family,
      }}
    >
      <div style={{ display: 'flex', gap: '6px' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            style={chipStyle(categoryFilters.includes(cat))}
            onClick={() => toggleCategoryFilter(cat)}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: CATEGORY_CONFIG[cat].color,
              }}
            />
            {CATEGORY_CONFIG[cat].label}
          </button>
        ))}
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: colors.border.default }} />

      <div style={{ display: 'flex', gap: '6px' }}>
        {STATUSES.map((status) => (
          <button
            key={status}
            style={chipStyle(statusFilters.includes(status))}
            onClick={() => toggleStatusFilter(status)}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: STATUS_CONFIG[status].color,
              }}
            />
            {STATUS_CONFIG[status].label}
          </button>
        ))}
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: colors.border.default }} />

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          style={chipStyle(assigneeFilter === 'unassigned')}
          onClick={() => setAssigneeFilter(assigneeFilter === 'unassigned' ? null : 'unassigned')}
        >
          Unassigned
        </button>
        {members.map((member) => (
          <button
            key={member.id}
            style={chipStyle(assigneeFilter === member.id)}
            onClick={() => setAssigneeFilter(assigneeFilter === member.id ? null : member.id)}
          >
            <Avatar name={member.display_name} url={member.avatar_url} size={18} />
            {member.display_name}
          </button>
        ))}
      </div>
    </div>
  );
}
