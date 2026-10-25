'use client';

import { Habit } from '@/lib/types';
import { dateKey, lastSevenDays } from '@/lib/time';
import { EmptyState, SectionTitle, btnPrimary, card, iconBtn } from './ui';

export function HabitsView({ habits, now, onAdd, onEdit, onDelete, onToggle }: {
  habits: Habit[]; now: Date; onAdd: () => void; onEdit: (h: Habit) => void; onDelete: (h: Habit) => void; onToggle: (id: string, key: string) => void;
}) {
  const days = lastSevenDays(now);
  const todayKey = dateKey(now);
  const doneToday = habits.filter((h) => h.log.includes(todayKey)).length;
  return (
    <div>
      <SectionTitle title="Habits" sub="Check in when you can. Missed days do not reset anything." right={<button type="button" className={btnPrimary} onClick={onAdd}>Add habit</button>} />
      {habits.length > 0 && (
        <div className={`${card} mb-6 p-5`}>
          <p className="text-sm text-gray-400">Today</p>
          <p className="mt-1 text-3xl font-semibold">{doneToday}<span className="text-base font-normal text-gray-500"> of {habits.length} checked in</span></p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Habits checked in today" aria-valuemin={0} aria-valuemax={habits.length} aria-valuenow={doneToday}>
            <div className="din-bar h-full rounded-full bg-emerald-300" style={{ width: `${(doneToday / habits.length) * 100}%` }} />
          </div>
        </div>
      )}
      {habits.length === 0 ? (
        <EmptyState title="No habits yet" body="Pick one or two small things you want to do regularly, like reviewing notes or planning tomorrow."
          action={<button type="button" className={btnPrimary} onClick={onAdd}>Add your first habit</button>} />
      ) : (
        <ul className="space-y-3">
          {habits.map((h) => {
            const count = days.filter((d) => h.log.includes(d.key)).length;
            return (
              <li key={h.id} className={`${card} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{h.name}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{count} of the last 7 days</p>
                  </div>
                  <div className="flex shrink-0">
                    <button type="button" className={iconBtn} onClick={() => onEdit(h)} aria-label={`Edit habit ${h.name}`}>Edit</button>
                    <button type="button" className={iconBtn} onClick={() => onDelete(h)} aria-label={`Delete habit ${h.name}`}>Delete</button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1.5" role="group" aria-label={`${h.name}, last seven days`}>
                  {days.map((d) => {
                    const on = h.log.includes(d.key);
                    return (
                      <button key={d.key} type="button" aria-pressed={on} aria-label={`${h.name}, ${d.isToday ? 'today' : d.label}: ${on ? 'checked' : 'not checked'}`} onClick={() => onToggle(h.id, d.key)}
                        className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-xs transition-colors ${on ? 'border-emerald-300/40 bg-emerald-300/15 text-emerald-200' : 'border-white/[0.07] text-gray-500 hover:bg-white/[0.04]'} ${d.isToday ? 'ring-1 ring-white/20' : ''}`}>
                        <span>{d.label}</span>
                        <span aria-hidden className="text-sm">{on ? '✓' : '·'}</span>
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
