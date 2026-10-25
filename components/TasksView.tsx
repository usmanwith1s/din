'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';
import { URGENCY_LABEL, URGENCY_ORDER, Urgency, compareTasks, taskUrgency } from '@/lib/planner';
import { EmptyState, SectionTitle, btnGhost, btnPrimary } from './ui';
import { TaskRow } from './TaskRow';

type Filter = 'active' | 'completed' | 'all';

export function TasksView({ tasks, now, onAdd, onEdit, onToggle, onDelete }: {
  tasks: Task[]; now: Date; onAdd: () => void; onEdit: (t: Task) => void; onToggle: (id: string) => void; onDelete: (t: Task) => void;
}) {
  const [filter, setFilter] = useState<Filter>('active');
  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const groups: { key: string; label: string; items: Task[]; urgency?: Urgency }[] = [];
  if (filter !== 'completed') {
    for (const u of URGENCY_ORDER) {
      const items = active.filter((t) => taskUrgency(t, now) === u).sort(compareTasks);
      if (items.length) groups.push({ key: u, label: URGENCY_LABEL[u], items, urgency: u });
    }
  }
  if (filter !== 'active' && done.length) groups.push({ key: 'done', label: 'Completed', items: done });

  const filters: [Filter, string, number][] = [['active', 'Active', active.length], ['completed', 'Completed', done.length], ['all', 'All', tasks.length]];

  return (
    <div>
      <SectionTitle title="Tasks" sub="Grouped by how soon they need attention." right={<button type="button" className={btnPrimary} onClick={onAdd}>Add task</button>} />
      <div className="mb-6 flex gap-2" role="group" aria-label="Filter tasks">
        {filters.map(([key, label, n]) => (
          <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${filter === key ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200' : 'border-white/10 text-gray-400 hover:text-white'}`}>
            {label} <span className="text-gray-500">{n}</span>
          </button>
        ))}
      </div>
      {groups.length === 0 ? (
        tasks.length === 0 ? <EmptyState title="No tasks yet" body="Add what you need to do, with a time estimate, and Din can fit tasks into your free time."
          action={<button type="button" className={btnPrimary} onClick={onAdd}>Add your first task</button>} />
        : filter === 'completed' ? <EmptyState title="Nothing completed yet" body="Finished tasks will show up here." />
        : <EmptyState title="All clear" body="No active tasks. Enjoy the room to breathe, or plan ahead." action={<button type="button" className={btnGhost} onClick={onAdd}>Add a task</button>} />
      ) : (
        <div className="space-y-7">
          {groups.map((g) => (
            <section key={g.key} aria-label={g.label}>
              <h4 className={`mb-3 text-sm font-semibold ${g.urgency === 'overdue' ? 'text-rose-300' : g.urgency === 'today' ? 'text-emerald-200' : 'text-gray-300'}`}>
                {g.label} <span className="font-normal text-gray-600">{g.items.length}</span>
              </h4>
              <ul className="space-y-2.5">
                {g.items.map((t) => <TaskRow key={t.id} task={t} urgency={g.urgency} onToggle={() => onToggle(t.id)} onEdit={() => onEdit(t)} onDelete={() => onDelete(t)} />)}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
