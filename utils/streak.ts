const MILESTONES = [3, 7, 14, 21, 30, 60, 100, 200, 365];

export function getMilestone(streak: number): number | null {
  return MILESTONES.includes(streak) ? streak : null;
}

export function milestoneMessage(streak: number): string {
  if (streak >= 365) return `One full year. That is not a streak — that is a practice.`;
  if (streak >= 200) return `${streak} days. Consistency at this level is rare.`;
  if (streak >= 100) return `${streak} days. Triple digits.`;
  if (streak >= 60) return `${streak} days. Two months of showing up.`;
  if (streak >= 30) return `${streak} days. A full month.`;
  if (streak >= 21) return `21 days. Habit territory.`;
  if (streak >= 14) return `Two weeks. The first hard part is done.`;
  if (streak >= 7) return `One week. Keep going.`;
  if (streak >= 3) return `3 days in. Good start.`;
  return '';
}
