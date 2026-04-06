import { useState, useRef, useEffect } from 'react';
import { Avatar, EmptyAvatar } from '../ui/Avatar';
import type { Profile } from '../../lib/types';

interface QuickAssignProps {
  assignedTo: string | null;
  members: Profile[];
  onAssign: (profileId: string | null) => void;
}

export function QuickAssign({ assignedTo, members, onAssign }: QuickAssignProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const assigned = members.find((m) => m.id === assignedTo);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="cursor-pointer hover:opacity-80 transition-opacity duration-150"
      >
        {assigned ? (
          <Avatar name={assigned.display_name} url={assigned.avatar_url} size={24} />
        ) : (
          <EmptyAvatar size={24} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-bg-surface border border-border-default rounded-[8px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-1 z-40">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAssign(null);
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer ${
              !assignedTo ? 'text-text-primary' : 'text-text-secondary'
            }`}
          >
            <EmptyAvatar size={20} />
            Unassigned
          </button>
          {members.map((member) => (
            <button
              key={member.id}
              onClick={(e) => {
                e.stopPropagation();
                onAssign(member.id);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 hover:bg-bg-surface-hover transition-colors duration-150 cursor-pointer ${
                assignedTo === member.id ? 'text-text-primary' : 'text-text-secondary'
              }`}
            >
              <Avatar name={member.display_name} url={member.avatar_url} size={20} />
              {member.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
