'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';

export const inputCls =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-gray-100 placeholder:text-gray-600 focus:border-emerald-300/60 [color-scheme:dark]';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-[#08140f] transition-colors hover:bg-emerald-200 disabled:opacity-50';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white';
export const iconBtn =
  'rounded-lg p-2 text-xs text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200';
export const card = 'rounded-2xl border border-white/[0.07] bg-white/[0.02]';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current!;
    const focusables = () => Array.from(root.querySelectorAll<HTMLElement>('input,select,textarea,button,[href],[tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute('disabled'));
    (root.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      if (e.key === 'Tab') {
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; previous?.focus?.(); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="din-pop max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-[#11161a] p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className={iconBtn}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-600">{hint}</p>}
      {error && <p id={`${htmlFor}-err`} role="alert" className="mt-1 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-8 text-center">
      <p className="text-sm font-medium text-gray-200">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-gray-500">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function CheckBox({ checked, label, onToggle, round }: { checked: boolean; label: string; onToggle: () => void; round?: boolean }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-label={label} onClick={onToggle}
      className={`flex h-6 w-6 shrink-0 items-center justify-center border text-xs transition-colors ${round ? 'rounded-full' : 'rounded-md'} ${checked ? 'border-emerald-300 bg-emerald-300 text-black' : 'border-gray-600 text-transparent hover:border-emerald-300/70'}`}>
      ✓
    </button>
  );
}
