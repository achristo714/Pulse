import { useState } from 'react';
import { StatusCircle } from '../task/StatusCircle';
import { CategoryPill } from '../task/CategoryPill';
import { useTaskStore } from '../../stores/taskStore';
import { colors, font } from '../../lib/theme';
import type { Task, Profile } from '../../lib/types';

interface CanvasInboxProps {
  tasks: Task[];
  members: Profile[];
  teamId: string;
  onPlaceAll: () => void;
  onStashAll: () => void;
  placedCount: number;
}

export function CanvasInbox({ tasks, onPlaceAll, onStashAll, placedCount }: CanvasInboxProps) {
  const cycleStatus = useTaskStore((s) => s.cycleStatus);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, bottom: 0, width: '260px',
      backgroundColor: colors.bg.surface, borderRight: `1px solid ${colors.border.default}`,
      overflowY: 'auto', zIndex: 10, fontFamily: font.family,
    }}>
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.border.default}`, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inbox</span>
        <span style={{ fontSize: font.size.xs, color: colors.text.muted, backgroundColor: colors.bg.surfaceActive, padding: '1px 8px', borderRadius: '10px' }}>{tasks.length}</span>
        <div style={{ flex: 1 }} />
        {tasks.length > 0 && (
          <button onClick={onPlaceAll} style={{
            padding: '3px 8px', fontSize: font.size.xs, fontWeight: font.weight.medium,
            color: colors.accent.purple, backgroundColor: colors.accent.purpleSubtle,
            border: `1px solid ${colors.accent.purple}40`, borderRadius: '6px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Place All</button>
        )}
        {placedCount > 0 && (
          <button onClick={onStashAll} style={{
            padding: '3px 8px', fontSize: font.size.xs, fontWeight: font.weight.medium,
            color: colors.text.muted, backgroundColor: 'transparent',
            border: `1px solid ${colors.border.default}`, borderRadius: '6px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Stash All</button>
        )}
      </div>

      <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {tasks.length === 0 && (
          <p style={{ fontSize: font.size.sm, color: colors.text.muted, textAlign: 'center', padding: '32px 0' }}>
            {placedCount > 0 ? 'All tasks on canvas' : 'No tasks yet'}
          </p>
        )}
        {tasks.map((task) => (
          <InboxCard key={task.id} task={task} onDragStart={handleDragStart} onCycleStatus={cycleStatus} />
        ))}
      </div>
    </div>
  );
}

function InboxCard({ task, onDragStart, onCycleStatus }: { task: Task; onDragStart: (e: React.DragEvent, id: string) => void; onCycleStatus: (id: string) => Promise<void> }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      draggable onDragStart={(e) => onDragStart(e, task.id)}
      onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? colors.bg.surfaceHover : colors.bg.surface,
        border: `1px solid ${colors.border.default}`, borderRadius: '8px', padding: '10px 12px',
        cursor: 'grab', transition: 'background-color 150ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <StatusCircle status={task.status} category={task.category} size={16} onClick={() => onCycleStatus(task.id)} />
        <span style={{ flex: 1, fontSize: font.size.sm, color: colors.text.primary, fontWeight: font.weight.medium, lineHeight: '1.4' }}>{task.title}</span>
      </div>
      <div style={{ marginTop: '6px', marginLeft: '24px' }}><CategoryPill category={task.category} /></div>
    </div>
  );
}
