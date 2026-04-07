import { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { CategoryPicker } from './CategoryPicker';
import { Avatar } from '../ui/Avatar';
import { colors, font } from '../../lib/theme';
import type { Profile } from '../../lib/types';

interface NewTaskInputProps {
  teamId: string;
  createdBy: string;
  category: string;
  onCategoryChange: (cat: string) => void;
  members: Profile[];
}

export function NewTaskInput({ teamId, createdBy, category, onCategoryChange, members }: NewTaskInputProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignee, setAssignee] = useState<string | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [showAssignee, setShowAssignee] = useState(false);
  const [focused, setFocused] = useState(false);
  const createTask = useTaskStore((s) => s.createTask);

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await createTask({
      team_id: teamId,
      created_by: createdBy,
      title: trimmed,
      status: 'todo',
      category,
      due_date: dueDate || null,
      assigned_to: assignee,
      assignees: assignee ? [assignee] : [],
    });
    setTitle('');
    setDueDate('');
    setAssignee(null);
    setShowDate(false);
  };

  const assignedMember = members.find((m) => m.id === assignee);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 28px',
        borderBottom: `1px solid ${focused ? colors.accent.purple + '60' : colors.border.default}`,
        fontFamily: font.family,
        backgroundColor: focused ? 'rgba(124,58,237,0.05)' : 'rgba(124,58,237,0.015)',
        boxShadow: focused
          ? `inset 0 -2px 0 ${colors.accent.purple}50, 0 2px 16px rgba(124,58,237,0.12), 0 0 40px rgba(124,58,237,0.04)`
          : `inset 0 0 0 transparent, 0 0 8px rgba(124,58,237,0.03)`,
        transition: 'all 200ms ease-out',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
        <path d="M9 4V14M4 9H14" stroke={focused ? colors.accent.purple : colors.text.muted} strokeWidth="1.8" strokeLinecap="round" style={{ transition: 'stroke 200ms' }} />
      </svg>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder="Add a new task..."
        style={{
          flex: 1,
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: font.size.base,
          color: colors.text.primary,
          fontFamily: 'inherit',
          padding: '4px 0',
        }}
      />

      {/* Category dots */}
      <CategoryPicker value={category} onChange={onCategoryChange} />

      {/* Assignee picker */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setShowAssignee(!showAssignee)}
          title={assignedMember ? `Assigned to ${assignedMember.display_name}` : 'Assign to someone'}
          style={{
            width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'transparent', border: assignee ? 'none' : `1.5px dashed ${colors.text.muted}`,
            cursor: 'pointer', padding: 0, transition: 'all 150ms',
          }}
        >
          {assignedMember ? (
            <Avatar name={assignedMember.display_name} url={assignedMember.avatar_url} size={26} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="5" r="2.5" stroke={colors.text.muted} strokeWidth="1.2" />
              <path d="M2.5 12.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke={colors.text.muted} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {showAssignee && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: '4px', width: '180px',
            backgroundColor: colors.bg.surface, border: `1px solid ${colors.border.default}`,
            borderRadius: '8px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)', zIndex: 40, overflow: 'hidden',
          }}>
            <button
              onClick={() => { setAssignee(null); setShowAssignee(false); }}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: font.size.sm,
                color: !assignee ? colors.text.primary : colors.text.secondary,
                backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Unassigned</button>
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => { setAssignee(m.id); setShowAssignee(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: font.size.sm,
                  display: 'flex', alignItems: 'center', gap: '8px',
                  color: assignee === m.id ? colors.text.primary : colors.text.secondary,
                  backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Avatar name={m.display_name} url={m.avatar_url} size={20} />
                {m.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date picker toggle */}
      {showDate ? (
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{
            padding: '5px 10px', backgroundColor: colors.bg.primary,
            border: `1px solid ${colors.border.default}`, borderRadius: '4px',
            fontSize: font.size.xs, color: colors.text.primary, colorScheme: 'dark',
            outline: 'none', fontFamily: 'inherit',
          }}
        />
      ) : (
        <button
          onClick={() => setShowDate(true)}
          title="Add due date"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '6px',
            backgroundColor: 'transparent', border: '1px solid transparent',
            color: colors.text.muted, cursor: 'pointer', transition: 'all 150ms', padding: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.2" />
            <path d="M5 1.5V3.5M11 1.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {title.trim() && (
        <button
          onClick={handleSubmit}
          style={{
            padding: '5px 14px',
            backgroundColor: colors.accent.purple,
            color: '#FFFFFF',
            fontSize: font.size.sm,
            fontWeight: font.weight.medium,
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background-color 150ms',
          }}
        >
          Add
        </button>
      )}
    </div>
  );
}
