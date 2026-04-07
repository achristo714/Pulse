import { useState } from 'react';
import { StatusCircle } from './StatusCircle';
import { CategoryPill } from './CategoryPill';
import { Avatar, EmptyAvatar } from '../ui/Avatar';
import { SubtaskCount } from './SubtaskList';
import { useTaskStore } from '../../stores/taskStore';
import { colors, font } from '../../lib/theme';
import type { Task, Profile } from '../../lib/types';

interface TaskCardProps {
  task: Task;
  members: Profile[];
  selected?: boolean;
  connecting?: boolean; // this card is the source of a connection being drawn
  connectTarget?: boolean; // a connection is being drawn and this card is a valid target
  style?: React.CSSProperties;
  onDoubleClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onStartConnect?: () => void;
  onClick?: () => void;
}

export function TaskCard({ task, members, selected, connecting, connectTarget, style: posStyle, onDoubleClick, onMouseDown, onContextMenu, onStartConnect, onClick }: TaskCardProps) {
  const { cycleStatus } = useTaskStore();
  const assigned = members.find((m) => m.id === task.assigned_to);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        width: 280,
        backgroundColor: colors.bg.surface,
        border: `1.5px solid ${connecting ? colors.accent.purple : connectTarget ? colors.accent.purple + '80' : selected ? colors.border.focus : colors.border.default}`,
        borderRadius: '8px',
        padding: '12px',
        userSelect: 'none',
        opacity: task.status === 'done' ? 0.6 : 1,
        boxShadow: connecting
          ? `0 0 0 2px ${colors.accent.purple}40, 0 0 16px ${colors.accent.purple}20`
          : connectTarget
          ? `0 0 0 1px ${colors.accent.purple}30`
          : selected ? `0 0 0 1px ${colors.border.focus}` : 'none',
        transition: 'all 150ms',
        fontFamily: font.family,
        cursor: connectTarget ? 'pointer' : undefined,
        ...posStyle,
      }}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      onClickCapture={(e) => {
        // In connect mode, intercept ALL clicks on the card
        if (connectTarget && onClick) {
          e.stopPropagation();
          e.preventDefault();
          onClick();
        }
      }}
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <StatusCircle status={task.status} category={task.category} onClick={() => cycleStatus(task.id)} size={16} />
        <span
          style={{
            flex: 1,
            fontSize: font.size.base,
            fontWeight: font.weight.medium,
            lineHeight: '1.4',
            color: task.status === 'done' ? colors.text.muted : colors.text.primary,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <CategoryPill category={task.category} />
        <SubtaskCount subtasks={task.subtasks || []} />
        <div style={{ flex: 1 }} />

        {/* Connect button — shows on hover */}
        {onStartConnect && (
          <button
            onClick={(e) => { e.stopPropagation(); onStartConnect(); }}
            title="Draw arrow to another card"
            style={{
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              backgroundColor: hovered || connecting ? `${colors.accent.purple}15` : 'transparent',
              border: `1px solid ${hovered || connecting ? colors.accent.purple + '40' : 'transparent'}`,
              cursor: 'pointer',
              opacity: hovered || connecting ? 1 : 0,
              transition: 'all 150ms',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 11L11 3" stroke={colors.accent.purple} strokeWidth="1.3" strokeLinecap="round" />
              <path d="M7 3H11V7" stroke={colors.accent.purple} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {assigned ? (
          <Avatar name={assigned.display_name} url={assigned.avatar_url} size={20} />
        ) : (
          <EmptyAvatar size={20} />
        )}
      </div>
    </div>
  );
}
