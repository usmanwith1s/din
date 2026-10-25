import type { ClassItem, Task } from './types';
import { dateKey, minutesOfDay, toMinutes, formatDuration, formatTime, addDays } from './time';
import { todayStatus } from './schedule';

export const BUFFER_MIN = 10;
/** When no class remains today, plan an open block of this length. */
export const OPEN_BLOCK_MIN = 120;

export type Urgency = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'none';

export function taskUrgency(task: Task, now: Date): Urgency {
  if (!task.deadline) return 'none';
  const today = dateKey(now);
  if (task.deadline < today) return 'overdue';
  if (task.deadline === today) {
    if (task.deadlineTime && toMinutes(task.deadlineTime) < minutesOfDay(now)) return 'overdue';
    return 'today';
  }
  if (task.deadline === dateKey(addDays(now, 1))) return 'tomorrow';
  if (task.deadline <= dateKey(addDays(now, 7))) return 'week';
  return 'later';
}

export const URGENCY_LABEL: Record<Urgency, string> = {
  overdue: 'Overdue', today: 'Due today', tomorrow: 'Due tomorrow', week: 'This week', later: 'Later', none: 'No deadline',
};
export const URGENCY_ORDER: Urgency[] = ['overdue', 'today', 'tomorrow', 'week', 'later', 'none'];
const PRIORITY_RANK = { high: 3, medium: 2, low: 1 } as const;

export function compareTasks(a: Task, b: Task): number {
  return (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999') ||
    (a.deadlineTime ?? '24:00').localeCompare(b.deadlineTime ?? '24:00') ||
    PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || a.estimateMin - b.estimateMin;
}

export interface Suggestion {
  task: Task;
  score: number;
  reason: string;
}
export interface Alternative { title: string; detail: string }

export interface FreeTimePlan {
  state: 'in-class-gap' | 'before-class' | 'open-day' | 'too-short';
  /** Start of the planning window */
  windowStart: number; // minutes of day
  /** Usable minutes after subtracting the buffer */
  availableMin: number;
  rawGapMin: number;
  nextClass?: ClassItem;
  currentClass?: ClassItem;
  headline: string;
  suggestions: Suggestion[];
  /** Pending tasks that do not fit; shown so the person knows why */
  skipped: { task: Task; note: string }[];
  alternatives: Alternative[];
}

function scoreTask(task: Task, urgency: Urgency, availableMin: number): { score: number; lead: string } {
  const urgencyPts: Record<Urgency, number> = { overdue: 54, today: 40, tomorrow: 26, week: 14, later: 4, none: 0 };
  const prioPts = { high: 24, medium: 14, low: 5 }[task.priority];
  const fit = Math.round((task.estimateMin / availableMin) * 8); // reward using the gap well
  const parts: string[] = [];
  if (urgency === 'overdue') parts.push('it is overdue');
  else if (urgency === 'today') parts.push('it is due today');
  else if (urgency === 'tomorrow') parts.push('it is due tomorrow');
  else if (urgency === 'week') parts.push('it is due this week');
  if (task.priority === 'high') parts.push('you marked it high priority');
  else if (parts.length === 0 && task.priority === 'medium') parts.push('it is a medium-priority task');
  else if (parts.length === 0) parts.push('it is a low-priority task you can clear quickly');
  const lead = parts.join(' and ');
  return { score: urgencyPts[urgency] + prioPts + fit, lead: lead.charAt(0).toUpperCase() + lead.slice(1) };
}

export function planFreeTime(classes: ClassItem[], tasks: Task[], now: Date): FreeTimePlan {
  const { today, current, next } = todayStatus(classes, now);
  const nowM = minutesOfDay(now);
  const windowStart = current ? toMinutes(current.end) : nowM;
  // The class that follows the window: the next one starting after windowStart
  const target = current ? today.find((c) => toMinutes(c.start) >= windowStart) : next;

  let rawGap: number;
  let state: FreeTimePlan['state'];
  if (target) {
    rawGap = toMinutes(target.start) - windowStart;
    state = current ? 'in-class-gap' : 'before-class';
  } else {
    rawGap = OPEN_BLOCK_MIN + BUFFER_MIN;
    state = 'open-day';
  }
  const available = state === 'open-day' ? OPEN_BLOCK_MIN : rawGap - BUFFER_MIN;

  const base = { windowStart, rawGapMin: rawGap, nextClass: target, currentClass: current };
  const pending = tasks.filter((t) => !t.done);

  const alternatives: Alternative[] = [];
  const prepFor = target ?? undefined;

  if (available < 5) {
    return {
      ...base, state: 'too-short', availableMin: Math.max(0, available), suggestions: [], skipped: [],
      headline: target
        ? `Only ${formatDuration(Math.max(0, rawGap))} until ${target.name}. After a ${BUFFER_MIN}-minute buffer there is not enough time for a task.`
        : 'Not enough time to plan.',
      alternatives: [{ title: 'Head over early', detail: 'Use the time to settle in, grab water, and arrive calm.' }],
    };
  }

  const scored = pending
    .filter((t) => t.estimateMin <= available)
    .map((t) => ({ task: t, ...scoreTask(t, taskUrgency(t, now), available) }))
    .sort((a, b) => b.score - a.score || compareTasks(a.task, b.task));

  // Fit tasks one after another until the window is full.
  const suggestions: Suggestion[] = [];
  let used = 0;
  for (const s of scored) {
    if (suggestions.length >= 3) break;
    if (used + s.task.estimateMin > available) continue;
    const remaining = available - used;
    const reason =
      suggestions.length === 0
        ? `${s.lead}, and ${formatDuration(s.task.estimateMin)} fits in your ${formatDuration(available)} window.`
        : `${s.lead}. It fits in the ${formatDuration(remaining)} left after the earlier suggestion${suggestions.length > 1 ? 's' : ''}.`;
    suggestions.push({ task: s.task, score: s.score, reason });
    used += s.task.estimateMin;
  }

  // Explain what was left out: too long for the window, or crowded out by higher-scoring picks.
  const picked = new Set(suggestions.map((s) => s.task.id));
  const scoreById = new Map(scored.map((s) => [s.task.id, s.score]));
  const skipped = pending
    .filter((t) => !picked.has(t.id))
    .sort((a, b) => (scoreById.get(b.id) ?? -1) - (scoreById.get(a.id) ?? -1) || compareTasks(a, b))
    .slice(0, 3)
    .map((task) => ({
      task,
      note:
        task.estimateMin > available
          ? `Needs ${formatDuration(task.estimateMin)}, longer than your ${formatDuration(available)} window.`
          : `Fits on its own (${formatDuration(task.estimateMin)}), but not alongside the tasks above.`,
    }));

  if (prepFor && available >= 10) {
    alternatives.push({
      title: `Prepare for ${prepFor.name}`,
      detail: `Spend ${Math.min(15, available)} minutes skimming notes or readings so ${prepFor.code ?? 'the class'} feels familiar.`,
    });
  }
  if (available >= 5) {
    alternatives.push({
      title: 'Take a real break',
      detail: `Step away from screens for ${Math.min(15, available)} minutes. Rest helps the next study block stick.`,
    });
  }
  if (suggestions.length === 0) {
    alternatives.unshift({ title: 'Break a task down', detail: 'Pick a longer task and decide just the first 10-minute step.' });
  }

  const headline =
    state === 'open-day'
      ? `No more classes today. Here is a ${formatDuration(OPEN_BLOCK_MIN)} focus block.`
      : state === 'in-class-gap'
        ? `You are in ${current!.name} until ${formatTime(current!.end)}. After it you have ${formatDuration(available)} before ${target!.name}, with a ${BUFFER_MIN}-minute buffer.`
        : `${formatDuration(available)} free before ${target!.name} at ${formatTime(target!.start)}, with a ${BUFFER_MIN}-minute buffer.`;

  return { ...base, state, availableMin: available, headline, suggestions, skipped, alternatives };
}
