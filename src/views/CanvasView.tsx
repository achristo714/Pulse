import { useEffect } from 'react';
import { InfiniteCanvas } from '../components/canvas/InfiniteCanvas';
import { TaskDetailPanel } from '../components/task/TaskDetailPanel';
import { useCanvasStore } from '../stores/canvasStore';
import { useTaskStore } from '../stores/taskStore';
import type { Profile } from '../lib/types';

interface CanvasViewProps {
  teamId: string;
  userId: string;
  members: Profile[];
}

export function CanvasView({ teamId, userId, members }: CanvasViewProps) {
  const fetchCanvasData = useCanvasStore((s) => s.fetchCanvasData);
  const tasks = useTaskStore((s) => s.tasks);
  const { selectedTaskId, setSelectedTask } = useTaskStore();

  useEffect(() => {
    fetchCanvasData(teamId);
  }, [teamId, fetchCanvasData]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
      <InfiniteCanvas
        teamId={teamId}
        userId={userId}
        members={members}
        onTaskDoubleClick={(taskId) => setSelectedTask(taskId)}
      />

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          members={members}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
