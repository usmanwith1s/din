'use client';

import { useState } from 'react';

const initialTasks = [
  {
    id: 1,
    title: 'Revise lecture notes',
    subject: 'Statistics',
    time: 'Today',
    done: false,
  },
  {
    id: 2,
    title: 'Complete OOP assignment',
    subject: 'Programming',
    time: 'Today',
    done: false,
  },
  {
    id: 3,
    title: 'Review calculus formulas',
    subject: 'Calculus',
    time: 'Tomorrow',
    done: true,
  },
];

const classes = [
  {
    time: '09:00 AM',
    name: 'Computer Organization',
    room: 'Lab 3',
    color: '#8b9cff',
  },
  {
    time: '11:00 AM',
    name: 'Probability & Statistics',
    room: 'Room 204',
    color: '#6ee7b7',
  },
  {
    time: '01:00 PM',
    name: 'Object Oriented Programming',
    room: 'Room 108',
    color: '#fbbf77',
  },
];

const initialHabits = [
  { id: 1, name: 'Study for 30 minutes', icon: '📚', done: false },
  { id: 2, name: 'Review today’s lectures', icon: '📝', done: false },
  { id: 3, name: 'Plan tomorrow', icon: '🌱', done: false },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('Today');
  const [tasks, setTasks] = useState(initialTasks);
  const [habits, setHabits] = useState(initialHabits);
  const [newTask, setNewTask] = useState('');
  const [taskInputOpen, setTaskInputOpen] = useState(false);

  const completedTasks = tasks.filter((task) => task.done).length;
  const completedHabits = habits.filter((habit) => habit.done).length;

  function toggleTask(id: number) {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  }

  function toggleHabit(id: number) {
    setHabits(
      habits.map((habit) =>
        habit.id === id ? { ...habit, done: !habit.done } : habit
      )
    );
  }

  function addTask() {
    if (!newTask.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        title: newTask.trim(),
        subject: 'Personal',
        time: 'Today',
        done: false,
      },
    ]);
    setNewTask('');
    setTaskInputOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#0b0e11] text-[#f3f5f7]">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r border-white/[0.07] p-6 md:flex md:flex-col">
          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-300 text-xl font-black text-[#0b1712]">
              d.
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                din<span className="text-emerald-300">.</span>
              </h1>
              <p className="text-xs text-gray-500">Your day, in balance.</p>
            </div>
          </div>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
            Workspace
          </p>
          <nav className="space-y-2">
            {[
              ['Today', '◷'],
              ['Timetable', '▦'],
              ['Tasks', '✓'],
              ['Habits', '✳'],
            ].map(([name, icon]) => (
              <button
                key={name}
                onClick={() => setActiveTab(name)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  activeTab === name
                    ? 'bg-emerald-300/10 font-semibold text-emerald-200'
                    : 'text-gray-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <span className="text-lg">{icon}</span>
                {name}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
            <p className="mb-2 text-sm font-semibold">Small steps count.</p>
            <p className="text-xs leading-5 text-gray-500">
              You don't need a perfect day. Just a good next step.
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-300"
                style={{
                  width: `${
                    habits.length ? (completedHabits / habits.length) * 100 : 0
                  }%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {completedHabits} of {habits.length} habits completed
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-5 pb-28 pt-7 sm:px-8 md:px-10 md:pb-10 md:pt-10">
          <header className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3 md:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300 font-black text-[#0b1712]">
                d.
              </div>
              <span className="text-lg font-bold">
                din<span className="text-emerald-300">.</span>
              </span>
            </div>
            <div className="hidden md:block">
              <p className="mb-1 text-sm text-gray-500">Your student space</p>
              <h2 className="text-2xl font-semibold">
                {activeTab === 'Today'
                  ? 'A little progress goes a long way.'
                  : activeTab}
              </h2>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">My day</p>
                <p className="text-xs text-gray-500">One step at a time</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 font-semibold text-emerald-200">
                U
              </div>
            </div>
          </header>

          {activeTab === 'Today' && (
            <>
              <div className="mb-8 overflow-hidden rounded-3xl border border-emerald-200/10 bg-gradient-to-br from-[#18352c] via-[#14251f] to-[#111817] p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="max-w-lg">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-200/[0.07] px-3 py-1.5 text-xs text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{' '}
                      YOUR DAILY RESET
                    </span>
                    <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                      Make room for
                      <br />
                      what matters.
                    </h2>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-gray-400">
                      Your classes, priorities, and little wins — all in one
                      place.
                    </p>
                  </div>
                  <div className="text-5xl opacity-80">🌿</div>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:max-w-sm">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-xs text-gray-400">Tasks completed</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {completedTasks}
                      <span className="text-sm font-normal text-gray-500">
                        {' '}
                        / {tasks.length}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-xs text-gray-400">Habits checked</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {completedHabits}
                      <span className="text-sm font-normal text-gray-500">
                        {' '}
                        / {habits.length}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Your schedule
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        Today's classes
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('Timetable')}
                      className="text-xs text-emerald-300 hover:text-emerald-200"
                    >
                      View timetable ↗
                    </button>
                  </div>
                  <div className="space-y-3">
                    {classes.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4"
                      >
                        <div
                          className="h-10 w-1 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.room}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-gray-400">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                        Keep moving
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        Daily habits
                      </h3>
                    </div>
                    <span className="text-xs text-gray-500">
                      {completedHabits}/{habits.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {habits.map((habit) => (
                      <button
                        key={habit.id}
                        onClick={() => toggleHabit(habit.id)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition hover:bg-white/[0.04]"
                      >
                        <span className="text-xl">{habit.icon}</span>
                        <span
                          className={`flex-1 text-sm ${
                            habit.done
                              ? 'text-gray-500 line-through'
                              : 'text-gray-200'
                          }`}
                        >
                          {habit.name}
                        </span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                            habit.done
                              ? 'border-emerald-300 bg-emerald-300 text-black'
                              : 'border-gray-600 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                      One thing at a time
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">Your tasks</h3>
                  </div>
                  <button
                    onClick={() => setTaskInputOpen(!taskInputOpen)}
                    className="rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-[#102019] transition hover:bg-emerald-200"
                  >
                    + Add task
                  </button>
                </div>

                {taskInputOpen && (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      addTask();
                    }}
                    className="mb-4 flex gap-2"
                  >
                    <input
                      autoFocus
                      value={newTask}
                      onChange={(event) => setNewTask(event.target.value)}
                      placeholder="What do you need to do?"
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-emerald-300/50"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-300 px-4 text-sm font-semibold text-black"
                    >
                      Save
                    </button>
                  </form>
                )}

                <div className="space-y-3">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition hover:bg-white/[0.04]"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs ${
                          task.done
                            ? 'border-emerald-300 bg-emerald-300 text-black'
                            : 'border-gray-600 text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm ${
                            task.done
                              ? 'text-gray-500 line-through'
                              : 'text-gray-200'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {task.subject} · {task.time}
                        </span>
                      </span>
                      <span className="text-xs text-gray-600">
                        {task.done ? 'Done' : 'Open'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'Timetable' && (
            <div>
              <p className="mb-2 text-sm text-gray-500">
                A sample schedule to help you picture your week.
              </p>
              <h2 className="mb-6 text-2xl font-semibold">Your timetable</h2>
              <div className="space-y-3">
                {classes.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5"
                  >
                    <div
                      className="h-12 w-1 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="mt-1 text-sm text-gray-500">{item.room}</p>
                    </div>
                    <span className="text-sm text-gray-400">{item.time}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-gray-600">
                These are demo classes, not your real university timetable.
                Editing the timetable is our next step.
              </p>
            </div>
          )}

          {activeTab === 'Tasks' && (
            <div>
              <h2 className="mb-2 text-2xl font-semibold">All your tasks</h2>
              <p className="mb-6 text-sm text-gray-500">
                Keep the next step clear and manageable.
              </p>
              <button
                onClick={() => {
                  setActiveTab('Today');
                  setTaskInputOpen(true);
                }}
                className="mb-5 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-black"
              >
                + Add a task
              </button>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.07] p-4 text-left"
                  >
                    <span
                      className={
                        task.done ? 'text-emerald-300' : 'text-gray-600'
                      }
                    >
                      {task.done ? '✓' : '○'}
                    </span>
                    <span
                      className={`flex-1 text-sm ${
                        task.done ? 'text-gray-500 line-through' : ''
                      }`}
                    >
                      {task.title}
                      <span className="mt-1 block text-xs text-gray-500">
                        {task.subject} · {task.time}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Habits' && (
            <div>
              <h2 className="mb-2 text-2xl font-semibold">
                Little things add up.
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                Check in with yourself. No streak pressure, no guilt.
              </p>
              <div className="mb-6 rounded-2xl border border-white/[0.08] p-5">
                <p className="text-sm text-gray-400">Today's progress</p>
                <p className="mt-2 text-3xl font-semibold">
                  {completedHabits}{' '}
                  <span className="text-base text-gray-500">
                    of {habits.length} habits
                  </span>
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-300 transition-all"
                    style={{
                      width: `${
                        habits.length
                          ? (completedHabits / habits.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                {habits.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.07] p-4 text-left"
                  >
                    <span className="text-xl">{habit.icon}</span>
                    <span
                      className={`flex-1 text-sm ${
                        habit.done ? 'text-gray-500 line-through' : ''
                      }`}
                    >
                      {habit.name}
                    </span>
                    <span
                      className={
                        habit.done ? 'text-emerald-300' : 'text-gray-600'
                      }
                    >
                      {habit.done ? '✓ Done' : '○ Check in'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <footer className="mt-12 border-t border-white/[0.07] pt-5 text-xs text-gray-600">
            din. · Made for student life, one day at a time.
          </footer>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-white/10 bg-[#0b0e11]/95 px-2 pb-3 pt-2 backdrop-blur-xl md:hidden">
        {[
          ['Today', '◷'],
          ['Timetable', '▦'],
          ['Tasks', '✓'],
          ['Habits', '✳'],
        ].map(([name, icon]) => (
          <button
            key={name}
            onClick={() => setActiveTab(name)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-xs ${
              activeTab === name ? 'text-emerald-300' : 'text-gray-500'
            }`}
          >
            <span className="text-lg">{icon}</span>
            {name}
          </button>
        ))}
      </nav>
    </main>
  );
}
