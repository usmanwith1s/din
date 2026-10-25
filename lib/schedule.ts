import type { ClassItem } from './types';
import { isValidTime, toMinutes, minutesOfDay, dayIndex } from './time';

export interface ClassDraft {
  name: string;
  day: number;
  start: string;
  end: string;
  room?: string;
  code?: string;
  instructor?: string;
}

export type ClassErrors = Partial<Record<'name' | 'day' | 'start' | 'end' | 'overlap', string>>;

export function findOverlap(draft: Pick<ClassDraft, 'day' | 'start' | 'end'>, classes: ClassItem[], ignoreId?: string): ClassItem | undefined {
  const s = toMinutes(draft.start);
  const e = toMinutes(draft.end);
  return classes.find(
    (c) => c.id !== ignoreId && c.day === draft.day && s < toMinutes(c.end) && toMinutes(c.start) < e,
  );
}

export function validateClass(draft: ClassDraft, classes: ClassItem[], ignoreId?: string): ClassErrors {
  const errors: ClassErrors = {};
  if (!draft.name.trim()) errors.name = 'Enter a class name.';
  if (!Number.isInteger(draft.day) || draft.day < 0 || draft.day > 6) errors.day = 'Choose a day.';
  if (!isValidTime(draft.start)) errors.start = 'Enter a valid start time.';
  if (!isValidTime(draft.end)) errors.end = 'Enter a valid end time.';
  if (!errors.start && !errors.end && toMinutes(draft.end) <= toMinutes(draft.start)) {
    errors.end = 'End time must be after the start time.';
  }
  if (!errors.day && !errors.start && !errors.end) {
    const clash = findOverlap(draft, classes, ignoreId);
    if (clash) errors.overlap = `Overlaps with ${clash.name} (${clash.start}–${clash.end}) on the same day.`;
  }
  return errors;
}

export const sortClasses = (a: ClassItem, b: ClassItem) => a.day - b.day || toMinutes(a.start) - toMinutes(b.start);

export function classesOnDay(classes: ClassItem[], day: number): ClassItem[] {
  return classes.filter((c) => c.day === day).sort(sortClasses);
}

export interface TodayStatus {
  today: ClassItem[];
  current?: ClassItem;
  next?: ClassItem;
  /** Minutes until `next` starts (fractional-free, based on whole minutes) */
  minutesToNext?: number;
}

export function todayStatus(classes: ClassItem[], now: Date): TodayStatus {
  const today = classesOnDay(classes, dayIndex(now));
  const nowM = minutesOfDay(now);
  const current = today.find((c) => toMinutes(c.start) <= nowM && nowM < toMinutes(c.end));
  const next = today.find((c) => toMinutes(c.start) > nowM);
  return { today, current, next, minutesToNext: next ? toMinutes(next.start) - nowM : undefined };
}
