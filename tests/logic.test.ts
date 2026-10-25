import { describe, it, expect } from 'vitest';
import { validateClass, todayStatus } from '../lib/schedule';
import { planFreeTime, taskUrgency, BUFFER_MIN } from '../lib/planner';
import { sanitize, parseJson, loadFromStorage, STORAGE_KEY, exportJson } from '../lib/storage';
import { dateKey, dayIndex } from '../lib/time';
import type { ClassItem, Task } from '../lib/types';

// Monday 2026-10-26, 10:00 local
const now = new Date(2026, 9, 26, 10, 0);
const cls = (o: Partial<ClassItem>): ClassItem => ({ id: Math.random().toString(), name: 'Class', day: 0, start: '09:00', end: '10:00', ...o });
const task = (o: Partial<Task>): Task => ({ id: Math.random().toString(), title: 'T', category: 'Study', priority: 'medium', estimateMin: 30, done: false, ...o });

describe('time', () => {
  it('maps Monday to index 0', () => expect(dayIndex(now)).toBe(0));
});

describe('class validation', () => {
  const existing = [cls({ id: 'a', name: 'Calc', start: '09:00', end: '10:30' })];
  it('rejects end <= start', () => {
    expect(validateClass({ name: 'x', day: 0, start: '11:00', end: '11:00' }, [])).toHaveProperty('end');
    expect(validateClass({ name: 'x', day: 0, start: '12:00', end: '11:00' }, [])).toHaveProperty('end');
  });
  it('rejects bad times and empty name', () => {
    const e = validateClass({ name: ' ', day: 0, start: '25:00', end: '' }, []);
    expect(e).toHaveProperty('name'); expect(e).toHaveProperty('start'); expect(e).toHaveProperty('end');
  });
  it('detects overlap on same day only', () => {
    expect(validateClass({ name: 'x', day: 0, start: '10:00', end: '11:00' }, existing)).toHaveProperty('overlap');
    expect(validateClass({ name: 'x', day: 1, start: '10:00', end: '11:00' }, existing)).toEqual({});
  });
  it('allows back-to-back classes', () => {
    expect(validateClass({ name: 'x', day: 0, start: '10:30', end: '11:30' }, existing)).toEqual({});
  });
  it('ignores itself when editing', () => {
    expect(validateClass({ name: 'Calc', day: 0, start: '09:15', end: '10:15' }, existing, 'a')).toEqual({});
  });
});

describe('today status', () => {
  const classes = [cls({ name: 'A', start: '09:00', end: '10:00' }), cls({ name: 'B', start: '11:00', end: '12:00' }), cls({ name: 'Other', day: 2 })];
  it('finds next class and countdown', () => {
    const s = todayStatus(classes, now);
    expect(s.today.map((c) => c.name)).toEqual(['A', 'B']);
    expect(s.next?.name).toBe('B'); expect(s.minutesToNext).toBe(60); expect(s.current).toBeUndefined();
  });
  it('detects class in progress', () => {
    expect(todayStatus(classes, new Date(2026, 9, 26, 9, 30)).current?.name).toBe('A');
  });
});

describe('Plan My Free Time', () => {
  const classes = [cls({ name: 'B', start: '11:00', end: '12:00' })];
  it('leaves a 10 minute buffer', () => {
    const p = planFreeTime(classes, [], now);
    expect(p.rawGapMin).toBe(60); expect(p.availableMin).toBe(60 - BUFFER_MIN);
  });
  it('never recommends a task longer than the available time', () => {
    const tasks = [task({ title: 'fits', estimateMin: 50 }), task({ title: 'too long', estimateMin: 51, priority: 'high', deadline: dateKey(now) })];
    const p = planFreeTime(classes, tasks, now);
    expect(p.suggestions.map((s) => s.task.title)).toEqual(['fits']);
    expect(p.skipped.map((s) => s.task.title)).toEqual(['too long']);
  });
  it('explains tasks that fit alone but were crowded out', () => {
    const tasks = [
      task({ title: 'overdue 25', priority: 'medium', deadline: '2026-10-24', estimateMin: 25 }),
      task({ title: 'today 40', priority: 'high', deadline: '2026-10-26', estimateMin: 40 }),
    ];
    const p = planFreeTime(classes, tasks, now);
    expect(p.suggestions.map((s) => s.task.title)).toEqual(['overdue 25']);
    expect(p.skipped[0].task.title).toBe('today 40');
    expect(p.skipped[0].note).toMatch(/not alongside/);
  });
  it('total suggested time never exceeds the window', () => {
    const tasks = [30, 25, 20, 15, 10].map((m) => task({ estimateMin: m }));
    const p = planFreeTime(classes, tasks, now);
    expect(p.suggestions.reduce((n, s) => n + s.task.estimateMin, 0)).toBeLessThanOrEqual(p.availableMin);
  });
  it('prioritises overdue and urgent over low-priority', () => {
    const tasks = [
      task({ title: 'later low', priority: 'low', deadline: '2026-12-01', estimateMin: 15 }),
      task({ title: 'overdue', priority: 'medium', deadline: '2026-10-20', estimateMin: 15 }),
      task({ title: 'today high', priority: 'high', deadline: '2026-10-26', estimateMin: 15 }),
    ];
    const p = planFreeTime(classes, tasks, now);
    expect(p.suggestions[0].task.title).toBe('overdue'); // already late beats due-today at similar priority
    expect(p.suggestions[1].task.title).toBe('today high');
    expect(p.suggestions[2].task.title).toBe('later low');
    expect(p.suggestions.every((s) => s.reason.length > 10)).toBe(true);
  });
  it('ignores completed tasks', () => {
    expect(planFreeTime(classes, [task({ done: true })], now).suggestions).toHaveLength(0);
  });
  it('offers alternatives', () => {
    const p = planFreeTime(classes, [], now);
    expect(p.alternatives.map((a) => a.title).join()).toMatch(/Prepare for B/);
    expect(p.alternatives.map((a) => a.title).join()).toMatch(/break/i);
  });
  it('handles too-short gaps', () => {
    const p = planFreeTime([cls({ start: '10:12', end: '11:00' })], [task({ estimateMin: 1 })], now);
    expect(p.state).toBe('too-short'); expect(p.suggestions).toHaveLength(0);
  });
  it('plans the gap after the current class', () => {
    const cs = [cls({ name: 'A', start: '09:00', end: '10:30' }), cls({ name: 'B', start: '12:00', end: '13:00' })];
    const p = planFreeTime(cs, [task({ estimateMin: 60 })], now);
    expect(p.state).toBe('in-class-gap'); expect(p.availableMin).toBe(80); expect(p.nextClass?.name).toBe('B');
  });
  it('plans an open block when no class remains', () => {
    const p = planFreeTime([], [task({ estimateMin: 45 })], now);
    expect(p.state).toBe('open-day'); expect(p.suggestions).toHaveLength(1);
  });
});

describe('urgency', () => {
  it('classifies deadlines', () => {
    expect(taskUrgency(task({ deadline: '2026-10-25' }), now)).toBe('overdue');
    expect(taskUrgency(task({ deadline: '2026-10-26', deadlineTime: '09:00' }), now)).toBe('overdue');
    expect(taskUrgency(task({ deadline: '2026-10-26', deadlineTime: '18:00' }), now)).toBe('today');
    expect(taskUrgency(task({ deadline: '2026-10-27' }), now)).toBe('tomorrow');
    expect(taskUrgency(task({ deadline: '2026-11-01' }), now)).toBe('week');
    expect(taskUrgency(task({}), now)).toBe('none');
  });
});

describe('storage validation', () => {
  it('rejects non-objects and unknown versions', () => {
    expect(sanitize(null)).toBeNull(); expect(sanitize([])).toBeNull(); expect(sanitize('x')).toBeNull();
    expect(sanitize({ version: 2 })).toBeNull();
  });
  it('rejects malformed JSON text', () => expect(parseJson('{oops')).toBeNull());
  it('drops bad records and keeps good ones', () => {
    const r = sanitize({
      version: 1,
      classes: [{ name: 'Good', day: 1, start: '09:00', end: '10:00' }, { name: 'Bad', day: 9, start: '09:00', end: '10:00' }, 5,
        { name: 'Overlap', day: 1, start: '09:30', end: '10:30' }],
      tasks: [{ title: 'ok', estimateMin: 20, priority: 'high', deadline: '2026-02-30' }, { title: '', estimateMin: 5 }, { title: 'nan', estimateMin: 'x' }],
      habits: [{ name: 'Read', log: ['2026-10-01', 'nope', '2026-10-01'] }, { name: 7 }],
    })!;
    expect(r.data.classes).toHaveLength(1); expect(r.data.tasks).toHaveLength(1); expect(r.data.habits).toHaveLength(1);
    expect(r.data.tasks[0].deadline).toBeUndefined(); // invalid date stripped
    expect(r.data.habits[0].log).toEqual(['2026-10-01']);
    expect(r.dropped).toBe(6);
  });
  it('de-duplicates ids and neutralises prototype-pollution style keys', () => {
    const r = sanitize({ version: 1, tasks: [{ id: 'x', title: 'a', estimateMin: 5 }, { id: 'x', title: 'b', estimateMin: 5 }], __proto__: { polluted: 1 } })!;
    expect(new Set(r.data.tasks.map((t) => t.id)).size).toBe(2);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it('round-trips export → import', () => {
    const original = sanitize({ version: 1, classes: [{ name: 'C', day: 0, start: '08:00', end: '09:00', room: 'R1' }], tasks: [{ title: 'T', estimateMin: 15, priority: 'low' }], habits: [{ name: 'H', log: ['2026-10-26'] }] })!.data;
    const back = parseJson(exportJson(original))!;
    expect(back.dropped).toBe(0); expect(back.data).toEqual(original);
  });
  it('recovers safely from corrupt saved data', () => {
    const bad = { getItem: (k: string) => (k === STORAGE_KEY ? '{{{{' : null) };
    const r = loadFromStorage(bad);
    expect(r.recovered).toBe(true); expect(r.data.tasks).toEqual([]);
    expect(loadFromStorage({ getItem: () => null }).recovered).toBe(false);
    expect(loadFromStorage({ getItem: () => { throw new Error('denied'); } }).data.classes).toEqual([]);
  });
});
