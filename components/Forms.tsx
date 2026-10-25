'use client';

import { FormEvent, useState } from 'react';
import { ClassItem, DAY_NAMES, DEFAULT_CATEGORIES, PRIORITIES, Priority, Task } from '@/lib/types';
import { ClassErrors, validateClass } from '@/lib/schedule';
import { isValidDateKey, isValidTime } from '@/lib/time';
import type { ClassInput, TaskInput } from '@/lib/useDin';
import { Field, Modal, btnGhost, btnPrimary, inputCls } from './ui';

export function ClassForm({ classes, editing, defaultDay = 0, onSave, onClose }: {
  classes: ClassItem[]; editing?: ClassItem; defaultDay?: number; onSave: (c: ClassInput) => void; onClose: () => void;
}) {
  const [f, setF] = useState({
    name: editing?.name ?? '', day: editing?.day ?? defaultDay, start: editing?.start ?? '09:00', end: editing?.end ?? '10:00',
    room: editing?.room ?? '', code: editing?.code ?? '', instructor: editing?.instructor ?? '',
  });
  const [errors, setErrors] = useState<ClassErrors>({});
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateClass(f, classes, editing?.id);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ name: f.name.trim(), day: f.day, start: f.start, end: f.end, room: f.room.trim() || undefined, code: f.code.trim() || undefined, instructor: f.instructor.trim() || undefined });
    onClose();
  }

  return (
    <Modal title={editing ? 'Edit class' : 'Add class'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Class name" htmlFor="c-name" error={errors.name}>
          <input id="c-name" data-autofocus className={inputCls} value={f.name} maxLength={80} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'c-name-err' : undefined}
            onChange={(e) => set('name', e.target.value)} placeholder="Probability & Statistics" />
        </Field>
        <Field label="Day" htmlFor="c-day" error={errors.day}>
          <select id="c-day" className={inputCls} value={f.day} onChange={(e) => set('day', Number(e.target.value))}>
            {DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts" htmlFor="c-start" error={errors.start}>
            <input id="c-start" type="time" className={inputCls} value={f.start} aria-invalid={!!errors.start} aria-describedby={errors.start ? 'c-start-err' : undefined} onChange={(e) => set('start', e.target.value)} />
          </Field>
          <Field label="Ends" htmlFor="c-end" error={errors.end}>
            <input id="c-end" type="time" className={inputCls} value={f.end} aria-invalid={!!errors.end} aria-describedby={errors.end ? 'c-end-err' : undefined} onChange={(e) => set('end', e.target.value)} />
          </Field>
        </div>
        {errors.overlap && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-3.5 py-2.5 text-sm text-rose-200">{errors.overlap}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Room (optional)" htmlFor="c-room"><input id="c-room" className={inputCls} value={f.room} maxLength={40} onChange={(e) => set('room', e.target.value)} placeholder="Room 204" /></Field>
          <Field label="Course code (optional)" htmlFor="c-code"><input id="c-code" className={inputCls} value={f.code} maxLength={20} onChange={(e) => set('code', e.target.value)} placeholder="MATH-201" /></Field>
        </div>
        <Field label="Instructor (optional)" htmlFor="c-inst"><input id="c-inst" className={inputCls} value={f.instructor} maxLength={60} onChange={(e) => set('instructor', e.target.value)} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary}>{editing ? 'Save changes' : 'Add class'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function TaskForm({ editing, categories, onSave, onClose }: {
  editing?: Task; categories: string[]; onSave: (t: TaskInput) => void; onClose: () => void;
}) {
  const [f, setF] = useState({
    title: editing?.title ?? '', category: editing?.category ?? 'Study', priority: (editing?.priority ?? 'medium') as Priority,
    deadline: editing?.deadline ?? '', deadlineTime: editing?.deadlineTime ?? '', estimate: String(editing?.estimateMin ?? 30),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const options = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const est = Number(f.estimate);
    if (!f.title.trim()) errs.title = 'Enter a task title.';
    if (!f.category.trim()) errs.category = 'Enter a category.';
    if (!Number.isInteger(est) || est < 1 || est > 1440) errs.estimate = 'Enter whole minutes between 1 and 1440.';
    if (f.deadline && !isValidDateKey(f.deadline)) errs.deadline = 'Enter a valid date.';
    if (f.deadlineTime && !f.deadline) errs.deadlineTime = 'Add a date to use a deadline time.';
    if (f.deadlineTime && !isValidTime(f.deadlineTime)) errs.deadlineTime = 'Enter a valid time.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({
      title: f.title.trim(), category: f.category.trim(), priority: f.priority, estimateMin: est,
      deadline: f.deadline || undefined, deadlineTime: f.deadline && f.deadlineTime ? f.deadlineTime : undefined,
    });
    onClose();
  }

  return (
    <Modal title={editing ? 'Edit task' : 'Add task'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Title" htmlFor="t-title" error={errors.title}>
          <input id="t-title" data-autofocus className={inputCls} value={f.title} maxLength={140} aria-invalid={!!errors.title} aria-describedby={errors.title ? 't-title-err' : undefined}
            onChange={(e) => set('title', e.target.value)} placeholder="Finish OOP assignment" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="t-cat" error={errors.category}>
            <input id="t-cat" list="t-cat-list" className={inputCls} value={f.category} maxLength={30} onChange={(e) => set('category', e.target.value)} />
            <datalist id="t-cat-list">{options.map((o) => <option key={o} value={o} />)}</datalist>
          </Field>
          <Field label="Priority" htmlFor="t-prio">
            <select id="t-prio" className={inputCls} value={f.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Deadline (optional)" htmlFor="t-date" error={errors.deadline}>
            <input id="t-date" type="date" className={inputCls} value={f.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </Field>
          <Field label="Time (optional)" htmlFor="t-time" error={errors.deadlineTime}>
            <input id="t-time" type="time" className={inputCls} value={f.deadlineTime} onChange={(e) => set('deadlineTime', e.target.value)} />
          </Field>
        </div>
        <Field label="Estimated duration (minutes)" htmlFor="t-est" error={errors.estimate} hint="Plan My Free Time only suggests tasks that fit the gap.">
          <input id="t-est" type="number" inputMode="numeric" min={1} max={1440} step={5} className={inputCls} value={f.estimate} aria-invalid={!!errors.estimate} onChange={(e) => set('estimate', e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary}>{editing ? 'Save changes' : 'Add task'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function HabitForm({ editingName, onSave, onClose }: { editingName?: string; onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState(editingName ?? '');
  const [error, setError] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Enter a habit name.'); return; }
    onSave(name.trim());
    onClose();
  }
  return (
    <Modal title={editingName ? 'Edit habit' : 'Add habit'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Habit" htmlFor="h-name" error={error}>
          <input id="h-name" data-autofocus className={inputCls} value={name} maxLength={80} aria-invalid={!!error} aria-describedby={error ? 'h-name-err' : undefined}
            onChange={(e) => setName(e.target.value)} placeholder="Study for 30 minutes" />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary}>{editingName ? 'Save changes' : 'Add habit'}</button>
        </div>
      </form>
    </Modal>
  );
}
