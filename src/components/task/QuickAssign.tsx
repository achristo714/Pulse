import { useState, useRef, useEffect } from 'react';
import { Avatar, EmptyAvatar } from '../ui/Avatar';
import { colors, font } from '../../lib/theme';
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
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex' }}
      >
        {assigned ? (
          <Avatar name={assigned.display_name} url={assigned.avatar_url} size={24} />
        ) : (
          <EmptyAvatar size={24} />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '4px',
            width: '200px',
            backgroundColor: colors.bg.surface,
            border: `1px solid ${colors.border.default}`,
            borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            zIndex: 40,
            overflow: 'hidden',
          }}
        >
          <DropdownItem
            label="Unassigned"
            active={!assignedTo}
            icon={<EmptyAvatar size={20} />}
            onClick={(e) => { e.stopPropagation(); onAssign(null); setOpen(false); }}
          />
          {members.map((member) => (
            <DropdownItem
              key={member.id}
              label={member.display_name}
              active={assignedTo === member.id}
              icon={<Avatar name={member.display_name} url={member.avatar_url} size={20} />}
              onClick={(e) => { e.stopPropagation(); onAssign(member.id); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ label, active, icon, onClick }: { label: string; active: boolean; icon: React.ReactNode; onClick: (e: React.MouseEvent) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '8px 12px',
        fontSize: font.size.sm,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: active ? colors.text.primary : colors.text.secondary,
        backgroundColor: hovered ? colors.bg.surfaceHover : 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background-color 150ms',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
