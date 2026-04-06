import { Avatar } from '../ui/Avatar';
import { useUIStore } from '../../stores/uiStore';
import { CATEGORY_CONFIG, STATUS_CONFIG, CATEGORIES, STATUSES } from '../../lib/constants';
import { colors, font } from '../../lib/theme';
import type { Profile } from '../../lib/types';

interface FilterBarProps {
  members: Profile[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function FilterBar({ members, searchQuery, onSearchChange }: FilterBarProps) {
  const {
    categoryFilters, statusFilters, assigneeFilter,
    toggleCategoryFilter, toggleStatusFilter, setAssigneeFilter,
  } = useUIStore();

  const chipStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '4px 12px', borderRadius: '20px', fontSize: font.size.xs, fontWeight: font.weight.medium,
    color: active ? colors.text.primary : colors.text.secondary,
    backgroundColor: active ? colors.bg.surfaceActive : 'transparent',
    border: `1px solid ${active ? colors.border.focus : colors.border.default}`,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease-out',
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 28px', borderBottom: `1px solid ${colors.border.default}`,
      overflowX: 'auto', fontFamily: font.family,
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          style={{
            width: '180px', padding: '6px 10px 6px 30px', backgroundColor: colors.bg.primary,
            border: `1px solid ${colors.border.default}`, borderRadius: '8px',
            fontSize: font.size.xs, color: colors.text.primary, outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 150ms',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = colors.border.focus)}
          onBlur={(e) => (e.currentTarget.style.borderColor = colors.border.default)}
        />
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx="6" cy="6" r="4.5" stroke={colors.text.muted} strokeWidth="1.2" />
          <path d="M9.5 9.5L12.5 12.5" stroke={colors.text.muted} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: colors.border.default }} />

      <div style={{ display: 'flex', gap: '6px' }}>
        {CATEGORIES.map((cat) => (
          <button key={cat} style={chipStyle(categoryFilters.includes(cat))} onClick={() => toggleCategoryFilter(cat)}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CATEGORY_CONFIG[cat].color }} />
            {CATEGORY_CONFIG[cat].label}
          </button>
        ))}
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: colors.border.default }} />

      <div style={{ display: 'flex', gap: '6px' }}>
        {STATUSES.map((status) => (
          <button key={status} style={chipStyle(statusFilters.includes(status))} onClick={() => toggleStatusFilter(status)}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: STATUS_CONFIG[status].color }} />
            {STATUS_CONFIG[status].label}
          </button>
        ))}
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: colors.border.default }} />

      <div style={{ display: 'flex', gap: '6px' }}>
        <button style={chipStyle(assigneeFilter === 'unassigned')} onClick={() => setAssigneeFilter(assigneeFilter === 'unassigned' ? null : 'unassigned')}>Unassigned</button>
        {members.map((member) => (
          <button key={member.id} style={chipStyle(assigneeFilter === member.id)} onClick={() => setAssigneeFilter(assigneeFilter === member.id ? null : member.id)}>
            <Avatar name={member.display_name} url={member.avatar_url} size={18} />
            {member.display_name}
          </button>
        ))}
      </div>
    </div>
  );
}
