import { useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import type { StickyNote, CanvasPosition } from '../../lib/types';

interface StickyNoteCardProps {
  note: StickyNote;
  position: CanvasPosition;
  selected?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
}

export function StickyNoteCard({ note, position, selected, onMouseDown }: StickyNoteCardProps) {
  const { updateStickyNote, deleteStickyNote } = useCanvasStore();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);

  const handleBlur = () => {
    setEditing(false);
    if (content !== note.content) {
      updateStickyNote(note.id, { content });
    }
  };

  return (
    <div
      className={`absolute select-none rounded-[6px] transition-shadow duration-150 ${
        selected ? 'shadow-[0_0_0_2px_var(--color-border-focus)]' : ''
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: position.width || 200,
        height: position.height || 200,
        backgroundColor: note.color + '20',
        borderColor: note.color + '40',
        borderWidth: 1,
        borderStyle: 'solid',
      }}
      onMouseDown={onMouseDown}
      onDoubleClick={() => setEditing(true)}
    >
      {editing ? (
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent p-3 text-[13px] text-text-primary resize-none focus:outline-none"
        />
      ) : (
        <div className="p-3 text-[13px] text-text-primary whitespace-pre-wrap overflow-hidden h-full">
          {note.content || (
            <span className="text-text-muted italic">Double-click to edit</span>
          )}
        </div>
      )}
    </div>
  );
}
