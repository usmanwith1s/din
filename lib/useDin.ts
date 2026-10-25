'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ClassItem, DinData, Habit, Task, emptyData } from './types';
import { STORAGE_KEY, loadFromStorage, newId } from './storage';
import { dateKey } from './time';
import { sortClasses } from './schedule';

export type ClassInput = Omit<ClassItem, 'id'>;
export type TaskInput = Omit<Task, 'id' | 'done' | 'completedAt'>;

export function useNow(intervalMs = 20_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [intervalMs]);
  return now;
}

export function useDin() {
  const [data, setData] = useState<DinData>(emptyData);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    const { data: d, recovered } = loadFromStorage(window.localStorage);
    setData(d);
    if (recovered) setNotice('Some saved data could not be read and was skipped. Your remaining data was kept.');
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [data]);

  const addClass = useCallback((c: ClassInput) => setData((d) => ({ ...d, classes: [...d.classes, { ...c, id: newId() }].sort(sortClasses) })), []);
  const updateClass = useCallback((id: string, c: ClassInput) => setData((d) => ({ ...d, classes: d.classes.map((x) => (x.id === id ? { ...c, id } : x)).sort(sortClasses) })), []);
  const deleteClass = useCallback((id: string) => setData((d) => ({ ...d, classes: d.classes.filter((x) => x.id !== id) })), []);

  const addTask = useCallback((t: TaskInput) => setData((d) => ({ ...d, tasks: [...d.tasks, { ...t, id: newId(), done: false }] })), []);
  const updateTask = useCallback((id: string, t: TaskInput) => setData((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === id ? { ...x, ...t } : x)) })), []);
  const toggleTask = useCallback((id: string) => setData((d) => ({
    ...d,
    tasks: d.tasks.map((x) => (x.id === id ? { ...x, done: !x.done, completedAt: x.done ? undefined : new Date().toISOString() } : x)),
  })), []);
  const deleteTask = useCallback((id: string) => setData((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) })), []);

  const addHabit = useCallback((name: string) => setData((d) => ({ ...d, habits: [...d.habits, { id: newId(), name, log: [] }] })), []);
  const updateHabit = useCallback((id: string, name: string) => setData((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, name } : h)) })), []);
  const deleteHabit = useCallback((id: string) => setData((d) => ({ ...d, habits: d.habits.filter((h) => h.id !== id) })), []);
  const toggleCheckin = useCallback((id: string, key: string = dateKey(new Date())) => setData((d) => ({
    ...d,
    habits: d.habits.map((h): Habit => (h.id === id ? { ...h, log: h.log.includes(key) ? h.log.filter((k) => k !== key) : [...h.log, key] } : h)),
  })), []);

  const replaceAll = useCallback((next: DinData) => setData(next), []);

  return {
    data, ready, notice, dismissNotice: () => setNotice(null), saveError,
    addClass, updateClass, deleteClass, addTask, updateTask, toggleTask, deleteTask,
    addHabit, updateHabit, deleteHabit, toggleCheckin, replaceAll,
  };
}
export type DinStore = ReturnType<typeof useDin>;
