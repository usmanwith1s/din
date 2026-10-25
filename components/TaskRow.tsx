'use client';

import { Task } from '@/lib/types';
import { formatDeadline, formatDuration } from '@/lib/time';
import { Urgency } from '@/lib/planner';
import { CheckBox, card, iconBtn } from './ui';

const prioStyle = { high: 'text-rose-300', medium: 'text-amber-200', low: 'text-sky-200' } as const;

export function TaskRow({ task, urgency, onToggle, onEdit, onDelete, compact }: {
  task: Task; urgency?: Urgency; onToggle: () => void; onEdit?: () => void; onDelete?: () => void; compact?: boolean;
}) {
  return (
    <li className={`${card} flex items-center gap-3.5 ${compact ? 'p-3.5' : 'p-4'}`}>
      <CheckBox checked={task.done} label={task.done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`} onToggle={onToggle} />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${task.done ? 'text-gray-500 line-through' : 'text-gray-100'}`}>{task.title}</p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
          <span>{task.category}</span>
          <span className={prioStyle[task.priority]}>{task.priority} priority</span>
          <span>{formatDuration(task.estimateMin)}</span>
          {task.deadline && <span className={urgency === 'overdue' && !task.done ? 'text-rose-300' : undefined}>{formatDeadline(task.deadline, task.deadlineTime)}</span>}
        </p>
      </div>
      {onEdit && <button type="button" onClick={onEdit} className={iconBtn} aria-label={`Edit task ${task.title}`}>Edit</button>}
      {onDelete && <button type="button" onClick={onDelete} className={iconBtn} aria-label={`Delete task ${task.title}`}>Delete</button>}
    </li>
  );
}
