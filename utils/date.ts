export function toDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function subtractDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - n);
  return toDateStr(date);
}

export function calcStreak(doneDates: string[]): { current: number; longest: number } {
  if (doneDates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...doneDates].sort(); // ascending

  // Longest streak: scan ascending, count consecutive days
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const expected = subtractDays(sorted[i], 1);
    if (sorted[i - 1] === expected) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  // Current streak: walk backward from today or yesterday
  const todayStr = toDateStr();
  const yesterdayStr = subtractDays(todayStr, 1);
  const desc = [...sorted].reverse();
  const anchor = desc[0];

  let current = 0;
  if (anchor === todayStr || anchor === yesterdayStr) {
    let expected = anchor;
    for (const date of desc) {
      if (date === expected) {
        current++;
        expected = subtractDays(expected, 1);
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

export function formatDisplayDate(date: Date = new Date()): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}, ${y}`;
}
