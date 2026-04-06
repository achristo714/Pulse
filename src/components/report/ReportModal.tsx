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
  const [copied, setCopied] = useState(false);

  const markdown = useMemo(
    () => generateReportMarkdown(tasks, new Date(startDate), new Date(endDate), members, filterMember),
    [tasks, startDate, endDate, members, filterMember]
  );

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
        {/* Report scope */}
        <div>
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
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Start Date
            </label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: font.size.xs, fontWeight: font.weight.medium, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              End Date
            </label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

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
        </div>
      </div>
    </Modal>
  );
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
