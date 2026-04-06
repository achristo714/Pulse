import { useCanvasStore } from '../../stores/canvasStore';

interface CanvasToolbarProps {
  onZoomToFit: () => void;
  onResetView: () => void;
}

export function CanvasToolbar({ onZoomToFit, onResetView }: CanvasToolbarProps) {
  const { zoom, setZoom } = useCanvasStore();

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-bg-surface border border-border-default rounded-[8px] px-2 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.3)] z-20" style={{ marginLeft: 130 }}>
      <button
        onClick={() => setZoom(zoom - 0.1)}
        className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover rounded transition-colors duration-150 cursor-pointer text-[14px]"
        title="Zoom out"
      >
        −
      </button>
      <span className="text-[11px] text-text-muted w-10 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={() => setZoom(zoom + 0.1)}
        className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover rounded transition-colors duration-150 cursor-pointer text-[14px]"
        title="Zoom in"
      >
        +
      </button>

      <div className="w-px h-4 bg-border-default mx-1" />

      <button
        onClick={onZoomToFit}
        className="px-2 h-7 flex items-center text-[11px] text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover rounded transition-colors duration-150 cursor-pointer"
        title="Zoom to fit"
      >
        Fit
      </button>
      <button
        onClick={onResetView}
        className="px-2 h-7 flex items-center text-[11px] text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover rounded transition-colors duration-150 cursor-pointer"
        title="Reset view"
      >
        Reset
      </button>
    </div>
  );
}
