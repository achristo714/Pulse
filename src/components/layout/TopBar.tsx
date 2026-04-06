import { useState } from 'react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { ViewToggle } from './ViewToggle';
import { useUIStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import type { Profile } from '../../lib/types';

interface TopBarProps {
  profile: Profile;
  onSignOut: () => void;
}

export function TopBar({ profile, onSignOut }: TopBarProps) {
  const setReportModalOpen = useUIStore((s) => s.setReportModalOpen);
  const createTask = useTaskStore((s) => s.createTask);
  const [showMenu, setShowMenu] = useState(false);

  const handleNewTask = async () => {
    await createTask({
      team_id: profile.team_id,
      created_by: profile.id,
      title: 'New Task',
      status: 'todo',
      category: 'admin',
    });
  };

  return (
    <div className="h-14 bg-bg-surface border-b border-border-default flex items-center px-4 gap-4 shrink-0">
      <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-text-primary">Pulse</h1>

      <div className="flex-1 flex justify-center">
        <ViewToggle />
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setReportModalOpen(true)}>
          Generate Report
        </Button>

        <Button size="sm" onClick={handleNewTask}>
          + New Task
        </Button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-150"
          >
            <Avatar name={profile.display_name} url={profile.avatar_url} size={28} />
            <span className="text-[13px] text-text-secondary hidden sm:inline">{profile.display_name}</span>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-bg-surface border border-border-default rounded-[8px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] py-1 z-50">
              <div className="px-3 py-2 border-b border-border-default">
                <div className="text-[12px] text-text-primary font-medium">{profile.display_name}</div>
                <div className="text-[11px] text-text-muted">{profile.role}</div>
              </div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onSignOut();
                }}
                className="w-full text-left px-3 py-2 text-[12px] text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary transition-colors duration-150 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
