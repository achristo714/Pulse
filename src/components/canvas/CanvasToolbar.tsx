import { useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { colors, font } from '../../lib/theme';

interface CanvasToolbarProps {
  onZoomToFit: () => void;
  onResetView: () => void;
}

export function CanvasToolbar({ onZoomToFit, onResetView }: CanvasToolbarProps) {
  const { zoom, setZoom } = useCanvasStore();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        marginLeft: '130px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.border.default}`,
        borderRadius: '8px',
        padding: '6px 8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        zIndex: 20,
        fontFamily: font.family,
      }}
    >
      <ToolbarBtn onClick={() => setZoom(zoom - 0.1)} title="Zoom out">−</ToolbarBtn>
      <span style={{ fontSize: font.size.xs, color: colors.text.muted, width: '40px', textAlign: 'center' }}>
        {Math.round(zoom * 100)}%
      </span>
      <ToolbarBtn onClick={() => setZoom(zoom + 0.1)} title="Zoom in">+</ToolbarBtn>

      <div style={{ width: '1px', height: '16px', backgroundColor: colors.border.default, margin: '0 4px' }} />

      <ToolbarBtn onClick={onZoomToFit} title="Zoom to fit" wide>Fit</ToolbarBtn>
      <ToolbarBtn onClick={onResetView} title="Reset view" wide>Reset</ToolbarBtn>
    </div>
  );
}

function ToolbarBtn({ onClick, title, children, wide }: { onClick: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        width: wide ? 'auto' : '28px',
        height: '28px',
        padding: wide ? '0 8px' : 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: wide ? font.size.xs : '14px',
        color: hovered ? colors.text.primary : colors.text.secondary,
        backgroundColor: hovered ? colors.bg.surfaceHover : 'transparent',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 150ms',
      }}
    >
      {children}
    </button>
  );
}
