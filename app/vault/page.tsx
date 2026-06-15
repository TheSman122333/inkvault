'use client';
import { useState, useEffect, useCallback } from 'react';
import BottomNav from '@/components/BottomNav';
import LockedNoteCard from '@/components/LockedNoteCard';
import {
  getAllLogs, deleteLog, getLockedNotes, addLockedNote,
  getActiveGoals, getGoalDoneDates,
  type DailyLog, type LockedNote, type Goal,
} from '@/db';
import { formatShortDate, calcStreak, toDateStr } from '@/utils/date';

function monthLabel(dateStr: string): string {
  const [y, m] = dateStr.split('-').map(Number);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[m - 1]} ${y}`;
}

type Tab = 'entries' | 'locked';
type UnlockType = 'date' | 'streak';

interface NewNoteForm {
  title: string; content: string; unlockType: UnlockType;
  unlockDate: string; unlockGoalId: string; unlockStreak: string;
}
const BLANK: NewNoteForm = { title: '', content: '', unlockType: 'date', unlockDate: '', unlockGoalId: '', unlockStreak: '' };

export default function VaultPage() {
  const [tab, setTab] = useState<Tab>('entries');
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notes, setNotes] = useState<LockedNote[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewNoteForm>(BLANK);

  const load = useCallback(async () => {
    const [ls, ns, gs] = await Promise.all([getAllLogs(), getLockedNotes(), getActiveGoals()]);
    setLogs(ls); setNotes(ns); setGoals(gs);
    const streaks = await Promise.all(gs.map(async g => calcStreak(await getGoalDoneDates(g.id)).current));
    setCurrentStreak(streaks.length ? Math.max(...streaks) : 0);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteLog = async (date: string) => {
    await deleteLog(date); setConfirmDelete(null); load();
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const base = { title: form.title.trim(), content: form.content.trim(), unlockType: form.unlockType };
    if (form.unlockType === 'date') {
      if (!form.unlockDate) return;
      await addLockedNote({ ...base, unlockDate: form.unlockDate });
    } else {
      if (!form.unlockStreak || !form.unlockGoalId) return;
      await addLockedNote({ ...base, unlockGoalId: form.unlockGoalId, unlockStreak: Number(form.unlockStreak) });
    }
    setForm(BLANK); setShowCreate(false); load();
  };

  const canSubmit = form.title.trim() && form.content.trim() &&
    (form.unlockType === 'date' ? !!form.unlockDate : (!!form.unlockStreak && !!form.unlockGoalId));

  let lastMonth = '';

  return (
    <>
      <main className="flex-1 pb-24">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-ink-200">
          <span className="font-mono text-xs text-ink-950 tracking-[3px]">VAULT</span>
          {tab === 'locked' && (
            <button onClick={() => setShowCreate(true)}
              className="w-8 h-8 border-[1.5px] border-ink-600 flex items-center justify-center font-mono text-xl text-ink-950 leading-none">
              +
            </button>
          )}
          {tab === 'entries' && (
            <span className="font-mono text-[10px] text-ink-400">{logs.length} entries</span>
          )}
        </div>

        {/* Sub-tab toggle */}
        <div className="flex px-6 py-3 border-b border-ink-200 gap-4">
          <button
            onClick={() => setTab('entries')}
            className={`font-mono text-[10px] tracking-[2px] pb-1 border-b-[1.5px] ${
              tab === 'entries' ? 'border-ink-950 text-ink-950' : 'border-transparent text-ink-400'
            }`}
          >JOURNAL</button>
          <button
            onClick={() => setTab('locked')}
            className={`font-mono text-[10px] tracking-[2px] pb-1 border-b-[1.5px] flex items-center gap-1.5 ${
              tab === 'locked' ? 'border-ink-950 text-ink-950' : 'border-transparent text-ink-400'
            }`}
          >
            HIDDEN{notes.length > 0 && <span className="text-[8px] text-ink-400">({notes.length})</span>}
          </button>
        </div>

        {/* Journal entries */}
        {tab === 'entries' && (
          <div className="px-6">
            {logs.length === 0 && (
              <p className="font-serif text-base text-ink-400 text-center mt-16 leading-relaxed">
                Your daily entries will appear here.{'\n'}Start writing in the Today tab.
              </p>
            )}
            {logs.map(log => {
              const month = log.date.slice(0, 7);
              const showHeader = month !== lastMonth;
              lastMonth = month;
              const preview = log.content.trim().slice(0, 100);
              return (
                <div key={log.date}>
                  {showHeader && (
                    <p className="font-mono text-[10px] text-ink-400 tracking-[2px] mt-6 mb-3">{monthLabel(log.date)}</p>
                  )}
                  <div className="flex items-start py-4 border-b border-ink-200 group">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] text-ink-600 tracking-wide mb-1">{formatShortDate(log.date)}</p>
                      <p className="font-serif text-sm text-ink-950 leading-relaxed line-clamp-2">
                        {preview}{log.content.length > 100 ? '…' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmDelete(log.date)}
                      className="ml-3 mt-0.5 font-mono text-[10px] text-ink-200 hover:text-ink-600 opacity-0 group-hover:opacity-100 px-1"
                      title="Delete entry"
                    >×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Locked notes */}
        {tab === 'locked' && (
          <div className="px-6 pt-4">
            {notes.length === 0 && (
              <p className="font-serif text-base text-ink-400 text-center mt-16 leading-relaxed">
                Seal a note to your future self.{'\n'}It will open when the time is right.
              </p>
            )}
            {notes.map(note => (
              <LockedNoteCard key={note.id} note={note} currentStreak={currentStreak} onUpdate={load} />
            ))}
          </div>
        )}
      </main>

      {/* Delete log confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-ink-950/40 flex items-center justify-center px-6 z-50"
          onClick={() => setConfirmDelete(null)}>
          <div className="bg-paper border border-ink-200 p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <p className="font-mono text-[10px] text-ink-400 tracking-[2px] mb-2">DELETE ENTRY</p>
            <p className="font-serif text-base text-ink-950 mb-1">{formatShortDate(confirmDelete)}</p>
            <p className="font-serif text-sm text-ink-400 mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setConfirmDelete(null)}
                className="font-mono text-[11px] text-ink-400 tracking-[2px] py-1 px-3">CANCEL</button>
              <button onClick={() => handleDeleteLog(confirmDelete)}
                className="font-mono text-[11px] text-paper tracking-[2px] bg-ink-950 py-1 px-3">DELETE</button>
            </div>
          </div>
        </div>
      )}

      {/* Create locked note modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-ink-950/40 flex items-center justify-center z-50 px-4 py-8"
          onClick={() => { setShowCreate(false); setForm(BLANK); }}>
          <div className="bg-paper border border-ink-200 w-full max-w-lg max-h-full overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4 border-b border-ink-200 flex justify-between items-center">
              <p className="font-mono text-[10px] text-ink-950 tracking-[2px]">SEAL A NOTE</p>
              <button onClick={() => { setShowCreate(false); setForm(BLANK); }}
                className="font-mono text-sm text-ink-400">×</button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="font-mono text-[9px] text-ink-400 tracking-[2px] block mb-1.5">TITLE</label>
                <input autoFocus
                  className="w-full font-serif text-base text-ink-950 bg-transparent border-b border-ink-400 pb-1.5 outline-none placeholder:text-ink-200"
                  placeholder="A message to yourself" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} maxLength={80} />
              </div>
              <div>
                <label className="font-mono text-[9px] text-ink-400 tracking-[2px] block mb-1.5">CONTENT</label>
                <textarea
                  className="w-full font-serif text-sm text-ink-950 bg-transparent border border-ink-200 p-3 outline-none placeholder:text-ink-200 resize-none leading-relaxed"
                  placeholder="Write whatever you want to reveal..." rows={5}
                  value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div>
                <label className="font-mono text-[9px] text-ink-400 tracking-[2px] block mb-2">UNLOCK WHEN</label>
                <div className="flex gap-3">
                  {(['date', 'streak'] as UnlockType[]).map(type => (
                    <button key={type} onClick={() => setForm(f => ({ ...f, unlockType: type }))}
                      className={`font-mono text-[10px] tracking-[1px] py-1.5 px-4 border ${
                        form.unlockType === type ? 'bg-ink-950 text-paper border-ink-950' : 'border-ink-200 text-ink-600'
                      }`}>
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              {form.unlockType === 'date' && (
                <div>
                  <label className="font-mono text-[9px] text-ink-400 tracking-[2px] block mb-1.5">UNLOCK DATE</label>
                  <input type="date" min={toDateStr()}
                    className="font-mono text-sm text-ink-950 bg-transparent border-b border-ink-400 pb-1.5 outline-none w-full"
                    value={form.unlockDate} onChange={e => setForm(f => ({ ...f, unlockDate: e.target.value }))} />
                </div>
              )}
              {form.unlockType === 'streak' && (
                <>
                  <div>
                    <label className="font-mono text-[9px] text-ink-400 tracking-[2px] block mb-1.5">GOAL</label>
                    <select className="w-full font-mono text-sm text-ink-950 bg-paper border-b border-ink-400 pb-1.5 outline-none"
                      value={form.unlockGoalId} onChange={e => setForm(f => ({ ...f, unlockGoalId: e.target.value }))}>
                      <option value="">Select a goal...</option>
                      {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="font-mono text-[9px] text-ink-400 tracking-[2px] block mb-1.5">STREAK NEEDED (DAYS)</label>
                    <input type="number" min="1" max="365"
                      className="w-full font-mono text-sm text-ink-950 bg-transparent border-b border-ink-400 pb-1.5 outline-none"
                      placeholder="e.g. 30" value={form.unlockStreak}
                      onChange={e => setForm(f => ({ ...f, unlockStreak: e.target.value }))} />
                  </div>
                </>
              )}
            </div>
            <div className="px-6 pb-6 flex justify-end gap-4">
              <button onClick={() => { setShowCreate(false); setForm(BLANK); }}
                className="font-mono text-[11px] text-ink-400 tracking-[2px] py-2 px-4">CANCEL</button>
              <button onClick={handleCreate} disabled={!canSubmit}
                className="font-mono text-[11px] text-paper tracking-[2px] bg-ink-950 py-2 px-4 disabled:opacity-40">SEAL</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
