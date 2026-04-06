import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTaskStore } from '../stores/taskStore';
import { useCanvasStore } from '../stores/canvasStore';

export function useRealtimeSync(teamId: string | undefined) {
  const applyRealtimeTask = useTaskStore((s) => s.applyRealtimeTask);
  const applyRealtimeSubtask = useTaskStore((s) => s.applyRealtimeSubtask);
  const applyRealtimePosition = useCanvasStore((s) => s.applyRealtimePosition);
  const applyRealtimeStickyNote = useCanvasStore((s) => s.applyRealtimeStickyNote);

  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`team-${teamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `team_id=eq.${teamId}` },
        (payload: any) => applyRealtimeTask(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subtasks' },
        (payload: any) => applyRealtimeSubtask(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'canvas_positions', filter: `team_id=eq.${teamId}` },
        (payload: any) => applyRealtimePosition(payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sticky_notes', filter: `team_id=eq.${teamId}` },
        (payload: any) => applyRealtimeStickyNote(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, applyRealtimeTask, applyRealtimeSubtask, applyRealtimePosition, applyRealtimeStickyNote]);
}
