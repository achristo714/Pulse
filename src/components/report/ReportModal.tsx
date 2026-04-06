import { useState, useMemo } from 'react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ReportPreview } from './ReportPreview';
import { generateReportMarkdown } from '../../lib/reportGenerator';
import { useTaskStore } from '../../stores/taskStore';
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

  const markdown = useMemo(
    () => generateReportMarkdown(tasks, new Date(startDate), new Date(endDate), members),
    [tasks, startDate, endDate, members]
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
  };

  return (
    <Modal open={open} onClose={onClose} title="Generate Report" width="600px">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-bg-primary border border-border-default rounded-[4px] px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-focus transition-colors duration-150 [color-scheme:dark]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-bg-primary border border-border-default rounded-[4px] px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-border-focus transition-colors duration-150 [color-scheme:dark]"
            />
          </div>
        </div>

        <ReportPreview markdown={markdown} />

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy}>
            Copy to Clipboard
          </Button>
        </div>
      </div>
    </Modal>
  );
}
