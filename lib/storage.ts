import { DinData, ClassItem, Task, Habit, PRIORITIES, Priority, emptyData } from './types';
import { isValidDateKey, isValidTime, toMinutes } from './time';
import { findOverlap } from './schedule';

export const STORAGE_KEY = 'din:v1';

export interface ParseReport {
  data: DinData;
  /** Number of records that were skipped because they were malformed or conflicting */
  dropped: number;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim().slice(0, max);
  return t || undefined;
};

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueId(raw: unknown, seen: Set<string>): string {
  let id = typeof raw === 'string' && raw.trim() && raw.length <= 80 ? raw : newId();
  if (seen.has(id)) id = newId();
  seen.add(id);
  return id;
}

/** Validate unknown input into DinData. Never throws. */
export function sanitize(input: unknown): ParseReport | null {
  if (!isObj(input)) return null;
  if (input.version !== undefined && input.version !== 1) return null;
  const data = emptyData();
  let dropped = 0;
  const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

  const seen = new Set<string>();
  for (const raw of arr(input.classes)) {
    if (!isObj(raw)) { dropped++; continue; }
    const name = str(raw.name, 80);
    const day = raw.day;
    if (!name || typeof day !== 'number' || !Number.isInteger(day) || day < 0 || day > 6 ||
        !isValidTime(raw.start) || !isValidTime(raw.end) || toMinutes(raw.end) <= toMinutes(raw.start)) {
      dropped++; continue;
    }
    const item: ClassItem = {
      id: uniqueId(raw.id, seen), name, day, start: raw.start, end: raw.end,
      room: str(raw.room, 40), code: str(raw.code, 20), instructor: str(raw.instructor, 60),
    };
    if (findOverlap(item, data.classes)) { dropped++; continue; }
    data.classes.push(item);
  }

  for (const raw of arr(input.tasks)) {
    if (!isObj(raw)) { dropped++; continue; }
    const title = str(raw.title, 140);
    const est = raw.estimateMin;
    if (!title || typeof est !== 'number' || !Number.isFinite(est) || est < 1 || est > 1440) { dropped++; continue; }
    const priority: Priority = PRIORITIES.includes(raw.priority as Priority) ? (raw.priority as Priority) : 'medium';
    const deadline = isValidDateKey(raw.deadline) ? raw.deadline : undefined;
    const task: Task = {
      id: uniqueId(raw.id, seen), title, category: str(raw.category, 30) ?? 'Study', priority,
      deadline, deadlineTime: deadline && isValidTime(raw.deadlineTime) ? raw.deadlineTime : undefined,
      estimateMin: Math.round(est), done: raw.done === true,
      completedAt: typeof raw.completedAt === 'string' ? raw.completedAt.slice(0, 40) : undefined,
    };
    data.tasks.push(task);
  }

  for (const raw of arr(input.habits)) {
    if (!isObj(raw)) { dropped++; continue; }
    const name = str(raw.name, 80);
    if (!name) { dropped++; continue; }
    const log = Array.from(new Set(arr(raw.log).filter(isValidDateKey))).slice(-400);
    data.habits.push({ id: uniqueId(raw.id, seen), name, log } as Habit);
  }
  return { data, dropped };
}

export function parseJson(text: string): ParseReport | null {
  try { return sanitize(JSON.parse(text)); } catch { return null; }
}

export type LoadResult = { data: DinData; recovered: boolean };

export function loadFromStorage(storage: Pick<Storage, 'getItem'>): LoadResult {
  let raw: string | null = null;
  try { raw = storage.getItem(STORAGE_KEY); } catch { return { data: emptyData(), recovered: false }; }
  if (raw === null) return { data: emptyData(), recovered: false };
  const parsed = parseJson(raw);
  if (!parsed) return { data: emptyData(), recovered: true };
  return { data: parsed.data, recovered: parsed.dropped > 0 };
}

export function exportJson(data: DinData): string {
  return JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2);
}
