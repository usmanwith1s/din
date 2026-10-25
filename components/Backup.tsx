'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { DinData } from '@/lib/types';
import { exportJson, parseJson } from '@/lib/storage';
import { dateKey } from '@/lib/time';
import { Modal, btnGhost, btnPrimary } from './ui';

const MAX_IMPORT_BYTES = 2_000_000;

export function Backup({ data, onReplace, onClose }: { data: DinData; onReplace: (d: DinData) => void; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const empty = !data.classes.length && !data.tasks.length && !data.habits.length;

  function download() {
    const blob = new Blob([exportJson(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `din-backup-${dateKey(new Date())}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg({ kind: 'ok', text: 'Backup downloaded.' });
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { setMsg({ kind: 'error', text: 'That file is too large to be a Din backup.' }); return; }
    const report = parseJson(await file.text());
    if (!report) { setMsg({ kind: 'error', text: 'This file is not a valid Din backup. Nothing was changed.' }); return; }
    const { classes, tasks, habits } = report.data;
    const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
    const summary = `${n(classes.length, 'class', 'classes')}, ${n(tasks.length, 'task', 'tasks')}, ${n(habits.length, 'habit', 'habits')}` + (report.dropped ? ` (${report.dropped} invalid or conflicting records skipped)` : '');
    if (!window.confirm(`Replace your current data with this backup?\n\n${summary}`)) return;
    onReplace(report.data);
    setMsg({ kind: 'ok', text: `Imported ${summary}.` });
  }

  return (
    <Modal title="Backup and restore" onClose={onClose}>
      <p className="text-sm leading-6 text-gray-400">Din keeps everything on this device. Export a JSON file to back it up or move to another device.</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={download} disabled={empty}>Export JSON</button>
        <button type="button" className={btnGhost} onClick={() => fileRef.current?.click()}>Import JSON</button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose a Din backup file" onChange={onFile} tabIndex={-1} />
      </div>
      {empty && <p className="mt-3 text-xs text-gray-600">Add a class, task, or habit to enable export.</p>}
      <p className="mt-4 text-xs leading-5 text-gray-600">Importing replaces your current data. Invalid records in the file are skipped.</p>
      {msg && <p role="status" className={`mt-4 rounded-xl border px-3.5 py-2.5 text-sm ${msg.kind === 'ok' ? 'border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200' : 'border-rose-300/20 bg-rose-300/[0.06] text-rose-200'}`}>{msg.text}</p>}
    </Modal>
  );
}
