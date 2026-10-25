'use client';

import { ClassItem, Habit, Task } from '@/lib/types';
import { todayStatus } from '@/lib/schedule';
import { compareTasks, taskUrgency } from '@/lib/planner';
import { dateKey, formatCountdown, formatLongDate, formatTime, greeting, minutesOfDay, toMinutes } from '@/lib/time';
import { CheckBox, EmptyState, SectionTitle, btnGhost, btnPrimary, card } from './ui';
import { PlanCard } from './PlanCard';
import { TaskRow } from './TaskRow';

export function TodayView({ classes, tasks, habits, now, go, onAddClass, onAddTask, onAddHabit, onToggleTask, onToggleHabit }: {
  classes: ClassItem[]; tasks: Task[]; habits: Habit[]; now: Date; go: (tab: string) => void;
  onAddClass: () => void; onAddTask: () => void; onAddHabit: () => void; onToggleTask: (id: string) => void; onToggleHabit: (id: string) => void;
}) {
  const st = todayStatus(classes, now);
  const nowM = minutesOfDay(now);
  const todayKey = dateKey(now);
  const urgent = tasks.filter((t) => !t.done && ['overdue', 'today'].includes(taskUrgency(t, now))).sort(compareTasks);
  const overdueCount = urgent.filter((t) => taskUrgency(t, now) === 'overdue').length;
  const habitsDone = habits.filter((h) => h.log.includes(todayKey)).length;
  const brandNew = !classes.length && !tasks.length && !habits.length;

  return (
    <div className="space-y-9">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">{greeting(now)}</h2>
        <p className="mt-1 text-gray-500">{formatLongDate(now)}</p>
      </div>

      {brandNew && (
        <div className={`${card} p-6`}>
          <h3 className="text-lg font-semibold">Set up your day</h3>
          <p className="mt-1.5 max-w-lg text-sm leading-6 text-gray-400">Start with whichever is easiest. Everything stays on this device.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={onAddClass}>Add a class</button>
            <button type="button" className={btnGhost} onClick={onAddTask}>Add a task</button>
            <button type="button" className={btnGhost} onClick={onAddHabit}>Add a habit</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="next-title" className={`${card} p-6`}>
          <h3 id="next-title" className="text-sm text-gray-400">{st.current ? 'In class now' : 'Next class'}</h3>
          {st.current && (
            <div className="mt-2">
              <p className="text-xl font-semibold">{st.current.name}</p>
              <p className="mt-1 text-sm text-gray-400">Ends at {formatTime(st.current.end)} ({formatCountdown(toMinutes(st.current.end) - nowM)} left)</p>
              {st.next && <p className="mt-3 text-sm text-gray-500">Then {st.next.name} at {formatTime(st.next.start)}.</p>}
            </div>
          )}
          {!st.current && st.next && (
            <div className="mt-2">
              <p className="text-4xl font-semibold tracking-tight text-emerald-200" aria-label={`Starts in ${formatCountdown(st.minutesToNext!)}`}>{formatCountdown(st.minutesToNext!)}</p>
              <p className="mt-2 text-lg font-medium">{st.next.name}</p>
              <p className="mt-0.5 text-sm text-gray-500">{formatTime(st.next.start)}{st.next.room ? ` · ${st.next.room}` : ''}</p>
            </div>
          )}
          {!st.current && !st.next && (
            <div className="mt-2">
              <p className="text-lg font-medium">{classes.length === 0 ? 'No classes added yet' : st.today.length ? 'No more classes today' : 'No classes today'}</p>
              <p className="mt-1 text-sm text-gray-500">{classes.length === 0 ? 'Add your timetable to see a countdown to your next class.' : 'Use the time for tasks or rest.'}</p>
              {classes.length === 0 && <button type="button" className={`${btnGhost} mt-4`} onClick={onAddClass}>Add a class</button>}
            </div>
          )}
        </section>
        <div className="grid grid-cols-2 gap-4">
          <div className={`${card} p-5`}>
            <p className="text-sm text-gray-400">Needs attention</p>
            <p className="mt-2 text-3xl font-semibold">{urgent.length}</p>
            <p className="mt-1 text-xs text-gray-500">{overdueCount ? `${overdueCount} overdue` : 'due today or overdue'}</p>
          </div>
          <div className={`${card} p-5`}>
            <p className="text-sm text-gray-400">Habits today</p>
            <p className="mt-2 text-3xl font-semibold">{habitsDone}<span className="text-base font-normal text-gray-500"> / {habits.length}</span></p>
            <p className="mt-1 text-xs text-gray-500">checked in</p>
          </div>
        </div>
      </div>

      <PlanCard classes={classes} tasks={tasks} now={now} onComplete={onToggleTask} />

      <div className="grid gap-9 lg:grid-cols-[1.2fr_0.8fr]">
        <section aria-labelledby="classes-title">
          <SectionTitle title="Today's classes" right={<button type="button" className="text-sm text-emerald-300 hover:text-emerald-200" onClick={() => go('Timetable')}>View timetable</button>} />
          <h3 id="classes-title" className="sr-only">Today&apos;s classes</h3>
          {st.today.length === 0 ? (
            <EmptyState title={classes.length ? 'No classes today' : 'Nothing scheduled'} body={classes.length ? 'Your timetable is clear for today.' : 'Classes you add to the timetable will appear here.'} />
          ) : (
            <ul className="space-y-2.5">
              {st.today.map((c) => {
                const over = toMinutes(c.end) <= nowM;
                const live = st.current?.id === c.id;
                return (
                  <li key={c.id} className={`${card} flex items-center gap-4 p-4 ${over ? 'opacity-50' : ''} ${live ? 'border-emerald-300/30' : ''}`}>
                    <span className={`h-10 w-1 shrink-0 rounded-full ${live ? 'bg-emerald-300' : 'bg-white/20'}`} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{[c.code, c.room, c.instructor].filter(Boolean).join(' · ') || 'No details'}</p>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <p>{formatTime(c.start)}</p>
                      <p className="text-gray-600">{live ? 'Now' : over ? 'Finished' : formatTime(c.end)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="habits-title">
          <SectionTitle title="Daily habits" right={habits.length > 0 ? <span className="text-sm text-gray-500">{habitsDone}/{habits.length}</span> : undefined} />
          <h3 id="habits-title" className="sr-only">Daily habits</h3>
          {habits.length === 0 ? (
            <EmptyState title="No habits yet" body="Add a small daily habit to check in on." action={<button type="button" className={btnGhost} onClick={onAddHabit}>Add a habit</button>} />
          ) : (
            <>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Habit progress today" aria-valuemin={0} aria-valuemax={habits.length} aria-valuenow={habitsDone}>
                <div className="din-bar h-full rounded-full bg-emerald-300" style={{ width: `${(habitsDone / habits.length) * 100}%` }} />
              </div>
              <ul className="space-y-2.5">
                {habits.map((h) => {
                  const on = h.log.includes(todayKey);
                  return (
                    <li key={h.id} className={`${card} flex items-center gap-3.5 p-4`}>
                      <CheckBox round checked={on} label={`${h.name}: ${on ? 'checked in today' : 'not checked in yet'}`} onToggle={() => onToggleHabit(h.id)} />
                      <span className={`flex-1 text-sm ${on ? 'text-gray-500' : 'text-gray-200'}`}>{h.name}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>

      <section aria-labelledby="due-title">
        <SectionTitle title="Overdue and due today" right={<button type="button" className="text-sm text-emerald-300 hover:text-emerald-200" onClick={() => go('Tasks')}>All tasks</button>} />
        <h3 id="due-title" className="sr-only">Overdue and due today</h3>
        {urgent.length === 0 ? (
          <EmptyState title={tasks.length ? 'Nothing due today' : 'No tasks yet'} body={tasks.length ? 'No overdue or due-today tasks. A good moment to get ahead.' : 'Add a task with a deadline and it will show up here when it matters.'}
            action={<button type="button" className={btnGhost} onClick={onAddTask}>Add a task</button>} />
        ) : (
          <ul className="space-y-2.5">
            {urgent.map((t) => <TaskRow key={t.id} task={t} urgency={taskUrgency(t, now)} compact onToggle={() => onToggleTask(t.id)} />)}
          </ul>
        )}
      </section>
    </div>
  );
}
