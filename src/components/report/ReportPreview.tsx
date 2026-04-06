interface ReportPreviewProps {
  markdown: string;
}

export function ReportPreview({ markdown }: ReportPreviewProps) {
  // Simple markdown-to-html for preview
  const lines = markdown.split('\n');

  return (
    <div className="bg-bg-primary border border-border-default rounded-[8px] p-4 max-h-[400px] overflow-y-auto">
      <div className="space-y-1 text-[13px] text-text-primary">
        {lines.map((line, i) => {
          if (line.startsWith('# ')) {
            return (
              <h1 key={i} className="text-[18px] font-semibold tracking-[-0.01em] mt-2">
                {line.slice(2)}
              </h1>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={i} className="text-[15px] font-semibold text-text-secondary mt-1">
                {line.slice(3)}
              </h2>
            );
          }
          if (line.startsWith('### ')) {
            return (
              <h3 key={i} className="text-[14px] font-medium text-accent-purple mt-3 mb-1">
                {line.slice(4)}
              </h3>
            );
          }
          if (line.startsWith('---')) {
            return <hr key={i} className="border-border-default my-2" />;
          }
          if (line.startsWith('  - [x] ')) {
            return (
              <div key={i} className="ml-6 flex items-center gap-1.5 text-text-muted">
                <span className="text-status-done">✓</span>
                <span className="line-through">{line.slice(8)}</span>
              </div>
            );
          }
          if (line.startsWith('  - [ ] ')) {
            return (
              <div key={i} className="ml-6 flex items-center gap-1.5 text-text-secondary">
                <span className="text-text-muted">○</span>
                <span>{line.slice(8)}</span>
              </div>
            );
          }
          if (line.startsWith('  - ')) {
            return (
              <div key={i} className="ml-4 text-text-secondary">
                {line.slice(2)}
              </div>
            );
          }
          if (line.startsWith('- ')) {
            return (
              <div key={i} className="text-text-primary">
                • {line.slice(2)}
              </div>
            );
          }
          if (line.startsWith('_') && line.endsWith('_')) {
            return (
              <p key={i} className="text-text-muted italic">
                {line.slice(1, -1)}
              </p>
            );
          }
          if (line.trim() === '') {
            return <div key={i} className="h-1" />;
          }
          return <p key={i}>{line}</p>;
        })}
      </div>
    </div>
  );
}
