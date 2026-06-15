'use client';
import { toDateStr, subtractDays } from '@/utils/date';

interface HeatmapCalendarProps {
  doneDates: Set<string>;
}

export default function HeatmapCalendar({ doneDates }: HeatmapCalendarProps) {
  const today = toDateStr();

  const days = Array.from({ length: 84 }, (_, i) => {
    const date = subtractDays(today, 83 - i);
    return {
      date,
      done: doneDates.has(date),
      isToday: date === today,
    };
  });

  // Group into 12 columns of 7
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex gap-1">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map(day => (
            <div
              key={day.date}
              title={day.date}
              className={`w-3 h-3 ${
                day.done
                  ? 'bg-ink-950'
                  : 'bg-ink-100'
              } ${day.isToday ? 'ring-1 ring-ink-800' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
