'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import {
  getActiveGoals, getArchivedGoals, addGoal,
  archiveGoal, deleteGoal, getGoalDoneDates, type Goal,
} from '@/db';
import { calcStreak } from '@/utils/date';

interface GoalState { goal: Goal; current: number; longest: number }

type ActionTarget = { goal: Goal; mode: 'active' | 'archived' };

export default function GoalsPage() {
  const [active, setActive] = useState<GoalState[]>([]);
  const [archived, setArchived] = useState<GoalState[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [action, setAction] = useState<ActionTarget | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const loadStreak = async (goal: Goal): Promise<GoalState> => {
    const dates = await getGoalDoneDates(goal.id);
    return { goal, ...calcStreak(dates) };
  };

  const load = useCallback(async () => {
    const [ag, ar] = await Promise.all([getActiveGoals(), getArchivedGoals()]);
    const [activeStates, archivedStates] = await Promise.all([
      Promise.all(ag.map(loadStreak)),
      Promise.all(ar.map(loadStreak)),
    ]);
    setActive(activeStates);
    setArchived(archivedStates);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addGoal(newName);
    setNewName(''); setShowAdd(false); load();
  };

  const handleArchive = async () => {
    if (!action) return;
    await archiveGoal(action.goal.id);
    setAction(null); load();
  };

  const handleDelete = async () => {
    if (!action) return;
    await deleteGoal(action.goal.id);
    setAction(null); load();
  };

  const GoalRow = ({ gs, mode }: { gs: GoalState; mode: 'active' | 'archived' }) => (
    <div className="flex items-center py-4 border-b border-ink-200 group">
      {mode === 'active' ? (
        <Link href={`/goal/${gs.goal.id}`} className="flex-1 min-w-0">
          <p className="font-serif text-base text-ink-950">{gs.goal.name}</p>
          <p className="font-mono text-[10px] text-ink-400 mt-0.5 tracking-wide">
            {gs.current > 0 ? `${gs.current} day streak` : 'No active streak'}
            {gs.longest > 1 ? `  ·  best ${gs.longest}` : ''}
          </p>
        </Link>
      ) : (
        <div className="flex-1 min-w-0">
          <p className="font-serif text-base text-ink-400 line-through">{gs.goal.name}</p>
          <p className="font-mono text-[10px] text-ink-200 mt-0.5 tracking-wide">
            archived  ·  best {gs.longest}
          </p>
        </div>
      )}
      <button
        onClick={() => setAction({ goal: gs.goal, mode })}
        className="ml-3 font-mono text-[10px] text-ink-200 hover:text-ink-600 tracking-wide px-1"
      >
        ···
      </button>
      {mode === 'active' && (
        <Link href={`/goal/${gs.goal.id}`} className="font-serif text-xl text-ink-200 group-hover:text-ink-400 ml-1">›</Link>
      )}
    </div>
  );

  return (
    <>
      <main className="flex-1 pb-24">
        <div className="flex justify-between items-center px-6 py-5 border-b border-ink-200">
          <span className="font-mono text-xs text-ink-950 tracking-[3px]">GOALS</span>
          <button
            onClick={() => setShowAdd(true)}
            className="w-8 h-8 border-[1.5px] border-ink-600 flex items-center justify-center font-mono text-xl text-ink-950 leading-none"
          >
            +
          </button>
        </div>

        <div className="px-6">
          {active.length === 0 && (
            <p className="font-serif text-base text-ink-400 text-center mt-16 leading-relaxed">
              No goals yet.{'\n'}Tap + to add your first one.
            </p>
          )}
          {active.map(gs => <GoalRow key={gs.goal.id} gs={gs} mode="active" />)}

          {archived.length > 0 && (
            <button
              onClick={() => setShowArchived(v => !v)}
              className="mt-6 font-mono text-[10px] text-ink-400 tracking-[2px] flex items-center gap-2"
            >
              {showArchived ? '▾' : '▸'} ARCHIVED ({archived.length})
            </button>
          )}
          {showArchived && archived.map(gs => <GoalRow key={gs.goal.id} gs={gs} mode="archived" />)}
        </div>
      </main>

      {/* Add goal */}
      {showAdd && (
        <div className="fixed inset-0 bg-ink-950/40 flex items-center justify-center px-6 z-50"
          onClick={() => { setShowAdd(false); setNewName(''); }}>
          <div className="bg-paper border border-ink-200 p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <p className="font-mono text-[10px] text-ink-950 tracking-[2px] mb-4">NEW GOAL</p>
            <input
              autoFocus
              className="w-full font-serif text-base text-ink-950 bg-transparent border-b border-ink-600 pb-2 mb-6 outline-none placeholder:text-ink-200"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. Read for 30 minutes"
              maxLength={80}
            />
            <div className="flex justify-end gap-4">
              <button onClick={() => { setShowAdd(false); setNewName(''); }}
                className="font-mono text-[11px] text-ink-400 tracking-[2px] py-1 px-3">CANCEL</button>
              <button onClick={handleAdd} disabled={!newName.trim()}
                className="font-mono text-[11px] text-paper tracking-[2px] bg-ink-950 py-1 px-3 disabled:opacity-40">ADD</button>
            </div>
          </div>
        </div>
      )}

      {/* Action menu */}
      {action && (
        <div className="fixed inset-0 bg-ink-950/40 flex items-end justify-center z-50 px-6 pb-6"
          onClick={() => setAction(null)}>
          <div className="bg-paper border border-ink-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-4 border-b border-ink-200">
              <p className="font-mono text-[9px] text-ink-400 tracking-[2px] mb-1">GOAL</p>
              <p className="font-serif text-base text-ink-950 truncate">{action.goal.name}</p>
            </div>
            {action.mode === 'active' && (
              <button onClick={handleArchive}
                className="w-full px-6 py-4 text-left font-serif text-base text-ink-950 border-b border-ink-200 hover:bg-paper-dark">
                Archive
                <span className="block font-mono text-[9px] text-ink-400 mt-0.5 tracking-wide">Hide from active list, keep history</span>
              </button>
            )}
            <button onClick={handleDelete}
              className="w-full px-6 py-4 text-left font-serif text-base text-red-800 hover:bg-paper-dark">
              Delete permanently
              <span className="block font-mono text-[9px] text-ink-400 mt-0.5 tracking-wide">Remove goal and all streak data</span>
            </button>
            <button onClick={() => setAction(null)}
              className="w-full px-6 py-4 text-left font-mono text-[11px] text-ink-400 tracking-[2px]">
              CANCEL
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
