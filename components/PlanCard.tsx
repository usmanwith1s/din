'use client';

import { useState } from 'react';
import { ClassItem, Task } from '@/lib/types';
import { planFreeTime } from '@/lib/planner';
import { formatDuration, formatTime } from '@/lib/time';
import { btnGhost, btnPrimary } from './ui';

export function PlanCard({ classes, tasks, now, onComplete }: { classes: ClassItem[]; tasks: Task[]; now: Date; onComplete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const plan = open ? planFreeTime(classes, tasks, now) : null;
  const pending = tasks.filter((t) => !t.done).length;

  return (
    <section aria-labelledby="plan-title" className="rounded-3xl border border-emerald-200/10 bg-gradient-to-br from-[#18352c] via-[#14251f] to-[#111817] p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-md">
          <h3 id="plan-title" className="text-xl font-semibold tracking-tight">Plan my free time</h3>
          <p className="mt-1.5 text-sm leading-6 text-gray-400">Find what fits before your next class, with a 10-minute buffer so you are never rushing.</p>
        </div>
        <button type="button" className={open ? btnGhost : btnPrimary} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="plan-result">
          {open ? 'Hide plan' : 'Plan my free time'}
        </button>
      </div>

      {open && plan && (
        <div id="plan-result" className="din-pop mt-6 space-y-5" aria-live="polite">
          <p className="text-sm leading-6 text-gray-200">{plan.headline}</p>

          {plan.suggestions.length > 0 && (
            <ol className="space-y-2.5" aria-label="Suggested tasks">
              {plan.suggestions.map((s, i) => (
                <li key={s.task.id} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-100">{i === 0 ? 'Start with: ' : 'Then: '}{s.task.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{s.task.category} · {formatDuration(s.task.estimateMin)}</p>
                    </div>
                    <button type="button" className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/[0.06]" onClick={() => onComplete(s.task.id)} aria-label={`Mark ${s.task.title} as done`}>Mark done</button>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-emerald-100/80"><span className="sr-only">Why: </span>{s.reason}</p>
                </li>
              ))}
            </ol>
          )}

          {plan.suggestions.length === 0 && pending === 0 && plan.state !== 'too-short' && (
            <p className="text-sm text-gray-400">You have no pending tasks. Add one from the Tasks tab, or use this time another way below.</p>
          )}
          {plan.suggestions.length === 0 && pending > 0 && plan.state !== 'too-short' && (
            <p className="text-sm text-gray-400">None of your pending tasks fit in {formatDuration(plan.availableMin)}.</p>
          )}

          {plan.skipped.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-gray-500">Not now</p>
              <ul className="space-y-1 text-sm text-gray-500">
                {plan.skipped.map((s) => <li key={s.task.id}><span className="text-gray-400">{s.task.title}</span>: {s.note}</li>)}
              </ul>
            </div>
          )}

          {plan.alternatives.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-gray-500">Other ways to use the time</p>
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {plan.alternatives.map((a) => (
                  <li key={a.title} className="rounded-2xl border border-white/[0.08] p-3.5">
                    <p className="text-sm font-medium text-gray-200">{a.title}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{a.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {plan.nextClass && <p className="text-xs text-gray-600">Window: {formatDuration(plan.rawGapMin)} until {plan.nextClass.name} ({formatTime(plan.nextClass.start)}), minus a 10-minute buffer.</p>}
        </div>
      )}
    </section>
  );
}
