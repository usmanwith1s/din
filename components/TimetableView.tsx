'use client';

import { ClassItem, DAY_NAMES } from '@/lib/types';
import { classesOnDay } from '@/lib/schedule';
import { dayIndex, formatTime } from '@/lib/time';
import { EmptyState, SectionTitle, btnPrimary, card, iconBtn } from './ui';

const accents = ['#8b9cff', '#6ee7b7', '#fbbf77', '#f0abfc', '#7dd3fc', '#fda4af', '#bef264'];

export function TimetableView({ classes, now, onAdd, onEdit, onDelete }: {
  classes: ClassItem[]; now: Date; onAdd: (day?: number) => void; onEdit: (c: ClassItem) => void; onDelete: (c: ClassItem) => void;
}) {
  const today = dayIndex(now);
  return (
    <div>
      <SectionTitle title="Weekly timetable" sub="Your classes, Monday to Sunday." right={<button type="button" className={btnPrimary} onClick={() => onAdd()}>Add class</button>} />
      {classes.length === 0 && (
        <div className="mb-6"><EmptyState title="No classes yet" body="Add your classes once and Din will show what is next and find free time between them."
          action={<button type="button" className={btnPrimary} onClick={() => onAdd()}>Add your first class</button>} /></div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DAY_NAMES.map((name, day) => {
          const list = classesOnDay(classes, day);
          return (
            <section key={name} aria-labelledby={`day-${day}`} className={`${card} p-4 ${day === today ? 'border-emerald-300/25' : ''}`}>
              <div className="mb-3 flex items-center justify-between">
                <h4 id={`day-${day}`} className="text-sm font-semibold">{name}{day === today && <span className="ml-2 rounded-full bg-emerald-300/10 px-2 py-0.5 text-xs font-normal text-emerald-200">Today</span>}</h4>
                <button type="button" className={iconBtn} onClick={() => onAdd(day)} aria-label={`Add class on ${name}`}>+ Add</button>
              </div>
              {list.length === 0 ? <p className="py-3 text-sm text-gray-600">No classes</p> : (
                <ul className="space-y-2">
                  {list.map((c) => (
                    <li key={c.id} className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-3">
                      <span className="mt-0.5 h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: accents[(c.name.length + c.name.charCodeAt(0)) % accents.length] }} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="mt-0.5 text-xs text-gray-400">{formatTime(c.start)} – {formatTime(c.end)}</p>
                        {(c.code || c.room || c.instructor) && <p className="mt-0.5 text-xs text-gray-600">{[c.code, c.room, c.instructor].filter(Boolean).join(' · ')}</p>}
                      </div>
                      <div className="flex shrink-0 flex-col items-end">
                        <button type="button" className={iconBtn} onClick={() => onEdit(c)} aria-label={`Edit ${c.name} on ${name}`}>Edit</button>
                        <button type="button" className={iconBtn} onClick={() => onDelete(c)} aria-label={`Delete ${c.name} on ${name}`}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
