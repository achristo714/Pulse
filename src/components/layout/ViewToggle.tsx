import { useUIStore } from '../../stores/uiStore';

export function ViewToggle() {
  const { viewMode, setViewMode } = useUIStore();

  return (
    <div className="flex bg-bg-primary rounded-full p-0.5 border border-border-default">
      <button
        onClick={() => setViewMode('list')}
        className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 cursor-pointer ${
          viewMode === 'list'
            ? 'bg-bg-surface-active text-text-primary'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        List
      </button>
      <button
        onClick={() => setViewMode('canvas')}
        className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150 cursor-pointer ${
          viewMode === 'canvas'
            ? 'bg-bg-surface-active text-text-primary'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        Canvas
      </button>
    </div>
  );
}
