'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import BottomNav from '@/components/BottomNav';
import GoalRow from '@/components/GoalRow';
import {
  getActiveGoals, getTodayEntries, getTodayLog,
  toggleGoalDone, saveLog,
  type Goal,
} from '@/db';
import { toDateStr, calcStreak, formatDisplayDate } from '@/utils/date';
import { getMilestone, milestoneMessage } from '@/utils/streak';

const NAV_GUIDE = [
  { tab: 'TODAY', desc: 'Check off daily goals and write your journal entry. Entries auto-save as you type.' },
  { tab: 'GOALS', desc: 'Create and manage what you want to track. Tap a goal to see its full heatmap and streak history. Tap ··· to archive or permanently delete.' },
  { tab: 'VAULT', desc: 'Two sections — Journal shows all past entries by month; Hidden lets you seal notes to yourself that only open on a future date or when a streak milestone is reached.' },
];

function WelcomeGuide({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 bg-ink-950/40 flex items-center justify-center px-6 z-50"
      onClick={onDismiss}>
      <div className="bg-paper border border-ink-200 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b border-ink-200">
          <p className="font-mono text-[9px] text-ink-400 tracking-[3px] mb-1">WELCOME TO</p>
          <p className="font-serif text-xl text-ink-950">Ink Vault</p>
          <p className="font-serif text-sm text-ink-400 mt-1 leading-relaxed">A daily journal with goals and streaks. Here's what each tab does:</p>
        </div>
        <div className="divide-y divide-ink-200">
          {NAV_GUIDE.map(({ tab, desc }) => (
            <div key={tab} className="px-6 py-4">
              <span className="font-mono text-[10px] text-ink-950 tracking-[2px]">{tab}</span>
              <p className="font-serif text-sm text-ink-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <div className="px-6 py-4">
          <button onClick={onDismiss}
            className="w-full font-mono text-[11px] text-paper tracking-[2px] bg-ink-950 py-2.5">
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}

function isAtRisk(currentStreak: number, checked: boolean): boolean {
  return currentStreak > 0 && !checked && new Date().getHours() >= 18;
}

interface GoalState {
  goal: Goal;
  current: number;
  longest: number;
}

export default function TodayPage() {
  const today = toDateStr();
  const [goalStates, setGoalStates] = useState<GoalState[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [logContent, setLogContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [milestone, setMilestone] = useState<{ name: string; msg: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const logContentRef = useRef('');

  useEffect(() => {
    if (!localStorage.getItem('iv_welcomed')) {
      setShowGuide(true);
    }
  }, []);

  const dismissGuide = () => {
    localStorage.setItem('iv_welcomed', '1');
    setShowGuide(false);
  };

  const load = useCallback(async () => {
    const [goals, entries, log] = await Promise.all([
      getActiveGoals(),
      getTodayEntries(today),
      getTodayLog(today),
    ]);
    const states = await Promise.all(
      goals.map(async goal => {
        const dates = await import('@/db').then(m => m.getGoalDoneDates(goal.id));
        const { current, longest } = calcStreak(dates);
        return { goal, current, longest };
      })
    );
    setGoalStates(states);
    setCheckedIds(new Set(entries.filter(e => e.status === 'done').map(e => e.goalId)));
    setLogContent(log?.content ?? '');
    setLoaded(true);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (goalId: string) => {
    const wasChecked = checkedIds.has(goalId);
    await toggleGoalDone(goalId, today);
    setCheckedIds(prev => {
      const next = new Set(prev);
      wasChecked ? next.delete(goalId) : next.add(goalId);
      return next;
    });
    const { getGoalDoneDates } = await import('@/db');
    const dates = await getGoalDoneDates(goalId);
    const { current, longest } = calcStreak(dates);
    setGoalStates(prev =>
      prev.map(s => s.goal.id === goalId ? { ...s, current, longest } : s)
    );
    if (!wasChecked) {
      const m = getMilestone(current);
      if (m) {
        const gs = goalStates.find(s => s.goal.id === goalId);
        setMilestone({ name: gs?.goal.name ?? '', msg: milestoneMessage(m) });
      }
    }
  };

  const handleLogChange = (text: string) => {
    setLogContent(text);
    logContentRef.current = text;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveLog(today, text), 600);
  };

  const flushSave = useCallback(() => {
    if (saveTimer.current === undefined) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = undefined;
    saveLog(today, logContentRef.current);
  }, [today]);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushSave(); };
    window.addEventListener('beforeunload', flushSave);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', flushSave);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [flushSave]);

  if (!loaded) return null;

  return (
    <>
      <main className="flex-1 px-6 pb-24 pt-6">
        <h1 className="font-serif text-2xl text-ink-950 mb-6">{formatDisplayDate()}</h1>

        {goalStates.length > 0 && (
          <div className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono text-[10px] text-ink-400 tracking-[3px]">GOALS</span>
              <span className="font-mono text-[10px] text-ink-400">
                {checkedIds.size}/{goalStates.length}
              </span>
            </div>
            {goalStates.map(({ goal, current, longest }) => (
              <GoalRow
                key={goal.id}
                name={goal.name}
                currentStreak={current}
                longestStreak={longest}
                checked={checkedIds.has(goal.id)}
                atRisk={isAtRisk(current, checkedIds.has(goal.id))}
                onToggle={() => handleToggle(goal.id)}
              />
            ))}
          </div>
        )}

        {goalStates.length === 0 && (
          <p className="font-serif text-sm text-ink-400 mb-6 leading-relaxed">
            Add goals in the Goals tab to start tracking streaks.
          </p>
        )}

        <hr className="border-ink-200 my-6" />

        <textarea
          className="w-full min-h-52 font-serif text-base text-ink-950 bg-transparent leading-relaxed outline-none placeholder:text-ink-200"
          value={logContent}
          onChange={e => handleLogChange(e.target.value)}
          onBlur={flushSave}
          placeholder="Write today's entry..."
        />
      </main>

      {showGuide && <WelcomeGuide onDismiss={dismissGuide} />}

      {milestone && (
        <div
          className="fixed inset-0 bg-ink-950/40 flex items-center justify-center px-6 z-50"
          onClick={() => setMilestone(null)}
        >
          <div className="bg-paper border border-ink-200 p-6 max-w-sm w-full">
            <p className="font-mono text-[10px] text-ink-400 tracking-[2px] mb-2">{milestone.name}</p>
            <p className="font-serif text-lg text-ink-950 leading-snug mb-6">{milestone.msg}</p>
            <button
              className="font-mono text-[11px] text-ink-400 tracking-[2px] hover:text-ink-950"
              onClick={() => setMilestone(null)}
            >
              KEEP GOING
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
