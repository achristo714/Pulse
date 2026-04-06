import { format } from 'date-fns';
import type { Task, Profile } from './types';
import { CATEGORY_CONFIG, CATEGORIES } from './constants';

export function generateReportMarkdown(
  tasks: Task[],
  startDate: Date,
  endDate: Date,
  members: Profile[],
  filterMemberId?: string | null
): string {
  const completedTasks = tasks.filter((t) => {
    if (t.status !== 'done') return false;
    if (filterMemberId && t.assigned_to !== filterMemberId) return false;
    const doneDate = t.completed_at ? new Date(t.completed_at) : new Date(t.updated_at);
    return doneDate >= startDate && doneDate <= endDate;
  });

  const byCategory: Record<string, Task[]> = {
    education: [],
    resources: [],
    support: [],
    admin: [],
  };

  for (const task of completedTasks) {
    byCategory[task.category].push(task);
  }

  const memberMap = new Map(members.map((m) => [m.id, m.display_name]));

  const byMember: Record<string, number> = {};
  for (const task of completedTasks) {
    const name = task.assigned_to ? (memberMap.get(task.assigned_to) || 'Unknown') : 'Unassigned';
    byMember[name] = (byMember[name] || 0) + 1;
  }

  const inProgressTasks = tasks.filter((t) => {
    if (t.status !== 'wip') return false;
    if (filterMemberId && t.assigned_to !== filterMemberId) return false;
    return true;
  });
  const remainingSubtasks = inProgressTasks.reduce(
    (acc, t) => acc + (t.subtasks?.filter((st) => !st.is_done).length || 0),
    0
  );

  const filterName = filterMemberId ? memberMap.get(filterMemberId) : null;
  const reportTitle = filterName ? `# ${filterName} - Weekly Report` : '# Pulse - Weekly Report';
  let md = `${reportTitle}\n## Applied Technology\n## ${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}\n\n`;

  for (const cat of CATEGORIES) {
    const catTasks = byCategory[cat];
    md += `### ${CATEGORY_CONFIG[cat].label} (${catTasks.length} completed)\n`;
    if (catTasks.length === 0) {
      md += '_No completed tasks_\n\n';
      continue;
    }
    for (const task of catTasks) {
      const assignee = task.assigned_to ? (memberMap.get(task.assigned_to) || 'Unknown') : 'Unassigned';
      const completedDate = format(new Date(task.completed_at || task.updated_at), 'MMM d');
      md += `- ${task.title} - ${assignee} - Completed ${completedDate}\n`;
      for (const st of task.subtasks || []) {
        md += `  - [${st.is_done ? 'x' : ' '}] ${st.title}\n`;
      }
    }
    md += '\n';
  }

  md += `---\n\n### Summary\n`;
  md += `- Total completed: ${completedTasks.length} tasks\n`;
  md += `- By team member:\n`;
  for (const [name, count] of Object.entries(byMember)) {
    md += `  - ${name}: ${count} tasks\n`;
  }
  md += `- Still in progress: ${inProgressTasks.length} tasks (${remainingSubtasks} subtasks remaining)\n`;

  return md;
}
