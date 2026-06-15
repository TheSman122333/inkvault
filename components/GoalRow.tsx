'use client';

interface GoalRowProps {
  name: string;
  currentStreak: number;
  longestStreak: number;
  checked: boolean;
  atRisk: boolean;
  onToggle: () => void;
}

export default function GoalRow({ name, currentStreak, longestStreak, checked, atRisk, onToggle }: GoalRowProps) {
  return (
    <div className="flex items-start py-3.5 border-b border-ink-200">
      <button
        onClick={onToggle}
        className={`mt-0.5 w-5 h-5 border flex-shrink-0 mr-3 flex items-center justify-center transition-colors ${
          checked
            ? 'bg-ink-950 border-ink-950'
            : atRisk
            ? 'border-ink-800 border-2'
            : 'border-ink-600'
        }`}
        aria-label={checked ? 'Unmark done' : 'Mark done'}
      >
        {checked && <div className="w-2 h-2 bg-paper" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-serif text-base leading-snug ${checked ? 'text-ink-400 line-through' : 'text-ink-950'}`}>
          {name}
        </p>
        {(currentStreak > 0 || longestStreak > 0) && (
          <p className="mt-0.5 font-mono text-[10px] tracking-wide">
            {currentStreak > 0 && (
              <span className={atRisk && !checked ? 'text-ink-800' : 'text-ink-600'}>
                {currentStreak} DAY STREAK
              </span>
            )}
            {longestStreak > 1 && (
              <span className="text-ink-400">
                {currentStreak > 0 ? '  ·  ' : ''}BEST {longestStreak}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
