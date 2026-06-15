'use client';
import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import HeatmapCalendar from '@/components/HeatmapCalendar';
import { getGoalById, getGoalDoneDates, type Goal } from '@/db';
import { calcStreak } from '@/utils/date';

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [goal, setGoal] = useState<Goal | undefined>();
  const [doneDates, setDoneDates] = useState<string[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    if (!id) return;
    Promise.all([getGoalById(id), getGoalDoneDates(id)]).then(([g, dates]) => {
      setGoal(g);
      setDoneDates(dates);
      setStreak(calcStreak(dates));
    });
  }, [id]);

  if (!goal) return null;

  const doneSet = new Set(doneDates);

  return (
    <>
      <main className="flex-1 pb-24">
        <div className="px-6 py-4 border-b border-ink-200">
          <Link href="/goals" className="font-mono text-[11px] text-ink-400 tracking-wide">
            ‹ Back
          </Link>
        </div>

        <div className="px-6">
          <h1 className="font-serif text-2xl text-ink-950 mt-6 mb-6 leading-snug">{goal.name}</h1>

          <div className="flex border border-ink-200 mb-8">
            {[
              { value: streak.current, label: 'CURRENT' },
              { value: streak.longest, label: 'BEST' },
              { value: doneDates.length, label: 'TOTAL' },
            ].map((stat, i) => (
              <div key={stat.label} className={`flex-1 text-center py-4 ${i > 0 ? 'border-l border-ink-200' : ''}`}>
                <p className="font-mono text-2xl text-ink-950">{stat.value}</p>
                <p className="font-mono text-[9px] text-ink-400 tracking-[2px] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <p className="font-mono text-[10px] text-ink-400 tracking-[2px] mb-3">LAST 12 WEEKS</p>
          <HeatmapCalendar doneDates={doneSet} />
          <p className="font-mono text-[10px] text-ink-200 mt-2 tracking-wide">
            Each square = one day. Filled = done.
          </p>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
