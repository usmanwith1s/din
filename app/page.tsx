'use client';

import { useCallback, useState } from 'react';
import { ClassItem, Habit, Task } from '@/lib/types';
import { dateKey } from '@/lib/time';
import { useDin, useNow } from '@/lib/useDin';
import { Backup } from '@/components/Backup';
import { ClassForm, HabitForm, TaskForm } from '@/components/Forms';
import { HabitsView } from '@/components/HabitsView';
import { TasksView } from '@/components/TasksView';
import { TimetableView } from '@/components/TimetableView';
import { TodayView } from '@/components/TodayView';

const TABS = [
  ['Today', '◷'],
  ['Timetable', '▦'],
  ['Tasks', '✓'],
  ['Habits', '✳'],
] as const;

type Dialog =
  | { kind: 'class'; editing?: ClassItem; day?: number }
  | { kind: 'task'; editing?: Task }
  | { kind: 'habit'; editing?: Habit }
  | { kind: 'backup' }
  | null;

export default function Home() {
  const store = useDin();
  const now = useNow();
  const [tab, setTab] = useState<string>('Today');
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = useCallback(() => setDialog(null), []);
  const { data } = store;

  if (!store.ready) {
    return <main className="min-h-screen bg-[#0b0e11]" aria-busy="true"><p className="sr-only">Loading Din</p></main>;
  }

  const todayKey = dateKey(now);
  const habitsDone = data.habits.filter((h) => h.log.includes(todayKey)).length;
  const categories = Array.from(new Set(data.tasks.map((t) => t.category)));

  const confirmDelete = (what: string, run: () => void) => { if (window.confirm(`Delete ${what}? This cannot be undone.`)) run(); };

  return (
    <main className="min-h-screen bg-[#0b0e11] text-[#f3f5f7]">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-emerald-300 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-black">Skip to content</a>
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r border-white/[0.07] p-6 md:flex md:flex-col">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300 text-xl font-black text-[#0b1712]">d.</div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">din<span className="text-emerald-300">.</span></h1>
              <p className="text-xs text-gray-500">Your day, in balance.</p>
            </div>
          </div>
          <nav aria-label="Main" className="space-y-2">
            {TABS.map(([name, icon]) => (
              <button key={name} type="button" onClick={() => setTab(name)} aria-current={tab === name ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors ${tab === name ? 'bg-emerald-300/10 font-semibold text-emerald-200' : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'}`}>
                <span className="text-lg" aria-hidden>{icon}</span>{name}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-3">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="mb-2 text-sm font-semibold">Small steps count.</p>
              <p className="text-xs leading-5 text-gray-500">You don&apos;t need a perfect day. Just a good next step.</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="din-bar h-full rounded-full bg-emerald-300" style={{ width: `${data.habits.length ? (habitsDone / data.habits.length) * 100 : 0}%` }} />
              </div>
              <p className="mt-2 text-xs text-gray-500">{habitsDone} of {data.habits.length} habits checked in</p>
            </div>
            <button type="button" onClick={() => setDialog({ kind: 'backup' })} className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-gray-500 hover:bg-white/[0.04] hover:text-white">Backup and restore</button>
          </div>
        </aside>

        <section id="content" className="min-w-0 flex-1 px-5 pb-28 pt-6 sm:px-8 md:px-10 md:pb-12 md:pt-10">
          <header className="mb-8 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300 font-black text-[#0b1712]">d.</div>
              <span className="text-lg font-bold">din<span className="text-emerald-300">.</span></span>
            </div>
            <button type="button" onClick={() => setDialog({ kind: 'backup' })} className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/[0.05] hover:text-white">Backup</button>
          </header>

          {store.notice && (
            <div role="status" className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-amber-200/20 bg-amber-200/[0.06] p-4 text-sm text-amber-100">
              <p>{store.notice}</p>
              <button type="button" onClick={store.dismissNotice} className="shrink-0 text-amber-200 underline">Dismiss</button>
            </div>
          )}
          {store.saveError && (
            <div role="alert" className="mb-6 rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] p-4 text-sm text-rose-200">
              Changes could not be saved in this browser (storage may be full or blocked). Export a backup so you do not lose your data.
            </div>
          )}

          {tab === 'Today' && (
            <TodayView classes={data.classes} tasks={data.tasks} habits={data.habits} now={now} go={setTab}
              onAddClass={() => setDialog({ kind: 'class' })} onAddTask={() => setDialog({ kind: 'task' })} onAddHabit={() => setDialog({ kind: 'habit' })}
              onToggleTask={store.toggleTask} onToggleHabit={(id) => store.toggleCheckin(id, todayKey)} />
          )}
          {tab === 'Timetable' && (
            <TimetableView classes={data.classes} now={now} onAdd={(day) => setDialog({ kind: 'class', day })} onEdit={(c) => setDialog({ kind: 'class', editing: c })}
              onDelete={(c) => confirmDelete(`“${c.name}”`, () => store.deleteClass(c.id))} />
          )}
          {tab === 'Tasks' && (
            <TasksView tasks={data.tasks} now={now} onAdd={() => setDialog({ kind: 'task' })} onEdit={(t) => setDialog({ kind: 'task', editing: t })} onToggle={store.toggleTask}
              onDelete={(t) => confirmDelete(`“${t.title}”`, () => store.deleteTask(t.id))} />
          )}
          {tab === 'Habits' && (
            <HabitsView habits={data.habits} now={now} onAdd={() => setDialog({ kind: 'habit' })} onEdit={(h) => setDialog({ kind: 'habit', editing: h })} onToggle={store.toggleCheckin}
              onDelete={(h) => confirmDelete(`“${h.name}” and its history`, () => store.deleteHabit(h.id))} />
          )}
        </section>
      </div>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0b0e11]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-4">
          {TABS.map(([name, icon]) => (
            <li key={name}>
              <button type="button" onClick={() => setTab(name)} aria-current={tab === name ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 py-2.5 text-xs ${tab === name ? 'text-emerald-200' : 'text-gray-500'}`}>
                <span className="text-lg" aria-hidden>{icon}</span>{name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {dialog?.kind === 'class' && (
        <ClassForm classes={data.classes} editing={dialog.editing} defaultDay={dialog.day} onClose={close}
          onSave={(c) => (dialog.editing ? store.updateClass(dialog.editing.id, c) : store.addClass(c))} />
      )}
      {dialog?.kind === 'task' && (
        <TaskForm editing={dialog.editing} categories={categories} onClose={close}
          onSave={(t) => (dialog.editing ? store.updateTask(dialog.editing.id, t) : store.addTask(t))} />
      )}
      {dialog?.kind === 'habit' && (
        <HabitForm editingName={dialog.editing?.name} onClose={close}
          onSave={(name) => (dialog.editing ? store.updateHabit(dialog.editing.id, name) : store.addHabit(name))} />
      )}
      {dialog?.kind === 'backup' && <Backup data={data} onReplace={store.replaceAll} onClose={close} />}
    </main>
  );
}
