import type { CanvasPosition } from '../../lib/types';

interface MinimapProps {
  positions: CanvasPosition[];
  zoom: number;
  panX: number;
  panY: number;
}

export function Minimap({ positions, zoom, panX, panY }: MinimapProps) {
  if (positions.length === 0) return null;

  const minX = Math.min(...positions.map((p) => p.x), 0);
  const minY = Math.min(...positions.map((p) => p.y), 0);
  const maxX = Math.max(...positions.map((p) => p.x + (p.width || 280)), 1000);
  const maxY = Math.max(...positions.map((p) => p.y + (p.height || 140)), 600);

  const worldW = maxX - minX + 200;
  const worldH = maxY - minY + 200;
  const scale = Math.min(160 / worldW, 100 / worldH);

  const mapW = worldW * scale;
  const mapH = worldH * scale;

  return (
    <div
      className="absolute bottom-12 right-4 bg-bg-surface/90 border border-border-default rounded-[6px] overflow-hidden z-20"
      style={{ width: mapW, height: mapH }}
    >
      {/* Items */}
      {positions.map((pos) => (
        <div
          key={pos.id}
          className="absolute rounded-[1px]"
          style={{
            left: (pos.x - minX) * scale,
            top: (pos.y - minY) * scale,
            width: (pos.width || 280) * scale,
            height: (pos.height || 60) * scale,
            backgroundColor: pos.item_type === 'task' ? '#7C3AED' : '#F59E0B',
            opacity: 0.6,
          }}
        />
      ))}

      {/* Viewport indicator */}
      <div
        className="absolute border border-white/30 rounded-[1px]"
        style={{
          left: (-panX / zoom - minX) * scale,
          top: (-panY / zoom - minY) * scale,
          width: (window.innerWidth / zoom) * scale,
          height: (window.innerHeight / zoom) * scale,
        }}
      />
    </div>
  );
}
