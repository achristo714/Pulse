import { colors, font } from '../../lib/theme';

interface ReportPreviewProps {
  markdown: string;
}

export function ReportPreview({ markdown }: ReportPreviewProps) {
  const lines = markdown.split('\n');

  return (
    <div
      style={{
        backgroundColor: colors.bg.primary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: '8px',
        padding: '16px',
        maxHeight: '400px',
        overflowY: 'auto',
        fontFamily: font.family,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: font.size.base, color: colors.text.primary }}>
        {lines.map((line, i) => {
          if (line.startsWith('# ')) return <h1 key={i} style={{ fontSize: '18px', fontWeight: 600, marginTop: '8px' }}>{line.slice(2)}</h1>;
          if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: '15px', fontWeight: 600, color: colors.text.secondary, marginTop: '4px' }}>{line.slice(3)}</h2>;
          if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: '14px', fontWeight: 500, color: colors.accent.purple, marginTop: '12px', marginBottom: '4px' }}>{line.slice(4)}</h3>;
          if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: `1px solid ${colors.border.default}`, margin: '8px 0' }} />;
          if (line.startsWith('  - [x] ')) return <div key={i} style={{ marginLeft: '24px', color: colors.text.muted, display: 'flex', gap: '6px' }}><span style={{ color: colors.status.done }}>✓</span><span style={{ textDecoration: 'line-through' }}>{line.slice(8)}</span></div>;
          if (line.startsWith('  - [ ] ')) return <div key={i} style={{ marginLeft: '24px', color: colors.text.secondary, display: 'flex', gap: '6px' }}><span style={{ color: colors.text.muted }}>○</span><span>{line.slice(8)}</span></div>;
          if (line.startsWith('  - ')) return <div key={i} style={{ marginLeft: '16px', color: colors.text.secondary }}>{line.slice(2)}</div>;
          if (line.startsWith('- ')) return <div key={i}>• {line.slice(2)}</div>;
          if (line.startsWith('_') && line.endsWith('_')) return <p key={i} style={{ color: colors.text.muted, fontStyle: 'italic' }}>{line.slice(1, -1)}</p>;
          if (line.trim() === '') return <div key={i} style={{ height: '4px' }} />;
          return <p key={i}>{line}</p>;
        })}
      </div>
    </div>
  );
}
