import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Modal } from '../ui/Modal';
import { ReportPreview } from './ReportPreview';
import { generateReportMarkdown } from '../../lib/reportGenerator';
import { useTaskStore } from '../../stores/taskStore';
import { Avatar } from '../ui/Avatar';
import { colors, font } from '../../lib/theme';
import type { Profile } from '../../lib/types';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  members: Profile[];
}

export function ReportModal({ open, onClose, members }: ReportModalProps) {
  const tasks = useTaskStore((s) => s.tasks);
  const now = new Date();
  const [startDate, setStartDate] = useState(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [filterMember, setFilterMember] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'weekly' | 'sync'>('weekly');
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(() => {
    if (reportType === 'sync') {
      return generateSyncReport(tasks, members);
    }
    return generateReportMarkdown(tasks, new Date(startDate), new Date(endDate), members, filterMember);
  }, [tasks, startDate, endDate, members, filterMember, reportType]);

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Convert markdown to simple HTML for print
    const html = markdown
      .replace(/^# (.+)$/gm, '<h1 style="font-size:24px;font-weight:600;margin:16px 0 8px">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:600;color:#555;margin:12px 0 6px">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;color:#7C3AED;margin:16px 0 6px">$1</h3>')
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #ddd;margin:16px 0">')
      .replace(/^- \[x\] (.+)$/gm, '<div style="margin-left:24px;color:#888">✓ <s>$1</s></div>')
      .replace(/^- \[ \] (.+)$/gm, '<div style="margin-left:24px">○ $1</div>')
      .replace(/^  - (.+)$/gm, '<div style="margin-left:20px;color:#555">$1</div>')
      .replace(/^- (.+)$/gm, '<div style="margin:2px 0">• $1</div>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^_(.+)_$/gm, '<em style="color:#888">$1</em>')
      .replace(/\n\n/g, '<br>')
      .replace(/\n/g, '');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pulse Report</title>
        <style>
          body { font-family: 'Inter', -apple-system, system-ui, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; font-size: 13px; line-height: 1.6; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #7C3AED; padding-bottom: 8px; }
          h2 { color: #555; }
          h3 { color: #7C3AED; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', backgroundColor: colors.bg.primary,
    border: `1px solid ${colors.border.default}`, borderRadius: '6px',
    padding: '8px 12px', fontSize: font.size.base, color: colors.text.primary,
    outline: 'none', fontFamily: 'inherit', colorScheme: 'dark',
  };

  return (
    <Modal open={open} onClose={onClose} title="Generate Report" width="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Report type */}
        <div>
          <label style={{ display: 'block', fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Report Type
          </label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            <ScopeBtn active={reportType === 'weekly'} onClick={() => setReportType('weekly')}>Weekly Report</ScopeBtn>
            <ScopeBtn active={reportType === 'sync'} onClick={() => setReportType('sync')}>Tuesday Sync</ScopeBtn>
          </div>
        </div>

        {/* Report scope — only for weekly */}
        {reportType === 'weekly' && <div>
          <label style={{ display: 'block', fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            Report For
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <ScopeBtn active={filterMember === null} onClick={() => setFilterMember(null)}>
              Everyone
            </ScopeBtn>
            {members.map((m) => (
              <ScopeBtn key={m.id} active={filterMember === m.id} onClick={() => setFilterMember(m.id)}>
                <Avatar name={m.display_name} url={m.avatar_url} size={18} />
                {m.display_name}
              </ScopeBtn>
            ))}
          </div>
        </div>}

        {/* Date range — weekly only */}
        {reportType === 'weekly' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}

        <ReportPreview markdown={markdown} />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', backgroundColor: 'transparent', color: colors.text.secondary,
            fontSize: font.size.base, borderRadius: '6px', border: `1px solid ${colors.border.default}`,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Close</button>
          <button onClick={handleCopy} style={{
            padding: '8px 16px', backgroundColor: colors.accent.purple, color: '#FFFFFF',
            fontSize: font.size.base, fontWeight: font.weight.medium, borderRadius: '6px',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>{copied ? 'Copied!' : 'Copy to Clipboard'}</button>
          <button onClick={handleExportPDF} style={{
            padding: '8px 16px', backgroundColor: colors.bg.surfaceActive, color: colors.text.primary,
            fontSize: font.size.base, fontWeight: font.weight.medium, borderRadius: '6px',
            border: `1px solid ${colors.border.default}`, cursor: 'pointer', fontFamily: 'inherit',
          }}>Export PDF</button>
        </div>
      </div>
    </Modal>
  );
}

function generateSyncReport(tasks: any[], members: any[]) {
  const memberMap = new Map(members.map((m: any) => [m.id, m.display_name]));
  const wip = tasks.filter((t: any) => t.status === 'wip');
  const blocked = tasks.filter((t: any) => t.needs_approval && !t.approved_by);
  const recentDone = tasks.filter((t: any) => t.status === 'done').slice(0, 10);
  const overdue = tasks.filter((t: any) => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date());

  let md = `# Leadership Sync - ${format(new Date(), 'EEEE, MMMM d, yyyy')}\n## Applied Technology\n\n`;

  md += `### Currently In Progress (${wip.length})\n`;
  for (const t of wip) {
    const who = t.assigned_to ? memberMap.get(t.assigned_to) || 'Unassigned' : 'Unassigned';
    md += `- ${t.title} — ${who}`;
    if (t.due_date) md += ` (due ${format(new Date(t.due_date), 'MMM d')})`;
    md += '\n';
  }

  if (overdue.length > 0) {
    md += `\n### ⚠ Overdue (${overdue.length})\n`;
    for (const t of overdue) {
      const who = t.assigned_to ? memberMap.get(t.assigned_to) || 'Unassigned' : 'Unassigned';
      md += `- ${t.title} — ${who} (was due ${format(new Date(t.due_date!), 'MMM d')})\n`;
    }
  }

  if (blocked.length > 0) {
    md += `\n### Needs Review (${blocked.length})\n`;
    for (const t of blocked) md += `- ${t.title}\n`;
  }

  md += `\n### Recently Completed\n`;
  for (const t of recentDone) md += `- ${t.title}\n`;

  md += `\n---\n**Team:** ${members.map((m: any) => m.display_name).join(', ')}\n`;
  md += `**Total tasks:** ${tasks.length} (${tasks.filter((t: any) => t.status === 'done').length} done, ${wip.length} in progress, ${tasks.filter((t: any) => t.status === 'todo').length} to do)\n`;

  return md;
}

function ScopeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 14px', borderRadius: '20px',
        fontSize: font.size.sm, fontWeight: font.weight.medium,
        color: active ? colors.text.primary : colors.text.secondary,
        backgroundColor: active ? colors.accent.purpleSubtle : 'transparent',
        border: `1px solid ${active ? colors.accent.purple + '60' : colors.border.default}`,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
      }}
    >
      {children}
    </button>
  );
}
