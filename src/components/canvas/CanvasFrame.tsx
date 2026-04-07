import { useState, useRef } from 'react';
import { colors, font } from '../../lib/theme';

interface CanvasFrameProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onLabelChange: (label: string) => void;
  onResize?: (w: number, h: number) => void;
}

export function CanvasFrame({ x, y, width, height, label, color, selected, onMouseDown, onLabelChange }: CanvasFrameProps) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitLabel = () => {
    setEditing(false);
    if (editLabel.trim() && editLabel !== label) onLabelChange(editLabel.trim());
    else setEditLabel(label);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        border: `2px ${selected ? 'solid' : 'dashed'} ${color}${selected ? '' : '40'}`,
        borderRadius: '12px',
        backgroundColor: `${color}06`,
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      {/* Label */}
      <div style={{
        position: 'absolute', top: '-28px', left: '8px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
        {editing ? (
          <input
            ref={inputRef}
            autoFocus
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') { setEditLabel(label); setEditing(false); } }}
            onClick={(e) => e.stopPropagation()}
            style={{
              fontSize: font.size.sm, fontWeight: font.weight.semibold, color,
              backgroundColor: colors.bg.surface, border: `1px solid ${color}40`,
              borderRadius: '4px', padding: '2px 8px', outline: 'none',
              fontFamily: 'inherit', letterSpacing: '0.02em',
            }}
          />
        ) : (
          <span
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
            style={{
              fontSize: font.size.sm, fontWeight: font.weight.semibold, color,
              letterSpacing: '0.02em', textTransform: 'uppercase', cursor: 'text',
              padding: '2px 6px', borderRadius: '4px',
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
