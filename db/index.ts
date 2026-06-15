import Dexie, { type Table } from 'dexie';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface Goal {
  id: string;
  name: string;
  createdAt: number;
  archivedAt?: number;
}

export interface GoalEntry {
  goalId: string;
  date: string;
  status: 'done' | 'skip';
}

export interface DailyLog {
  date: string;
  content: string;
  updatedAt: number;
}

export interface LockedNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  unlockType: 'date' | 'streak';
  unlockDate?: string;      // YYYY-MM-DD, for date-based
  unlockGoalId?: string;    // for streak-based
  unlockStreak?: number;    // streak count needed
  unlockedAt?: number;      // timestamp when first unlocked
}

class InkVaultDB extends Dexie {
  goals!: Table<Goal, string>;
  goalEntries!: Table<GoalEntry, [string, string]>;
  dailyLogs!: Table<DailyLog, string>;
  lockedNotes!: Table<LockedNote, string>;

  constructor() {
    super('InkVaultDB');
    this.version(1).stores({
      goals: 'id, createdAt, archivedAt',
      goalEntries: '[goalId+date], goalId, date',
      dailyLogs: 'date',
    });
    this.version(2).stores({
      goals: 'id, createdAt, archivedAt',
      goalEntries: '[goalId+date], goalId, date',
      dailyLogs: 'date',
      lockedNotes: 'id, createdAt, unlockType, unlockedAt',
    });
  }
}

export const db = new InkVaultDB();

// ── Auth helper ──────────────────────────────────────────────────────────────

async function userId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ── Goals ────────────────────────────────────────────────────────────────────

export function getActiveGoals(): Promise<Goal[]> {
  return db.goals.filter(g => !g.archivedAt).sortBy('createdAt');
}

export function getArchivedGoals(): Promise<Goal[]> {
  return db.goals.filter(g => !!g.archivedAt).sortBy('createdAt');
}

export async function addGoal(name: string): Promise<void> {
  const id = `g_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const goal: Goal = { id, name: name.trim(), createdAt: Date.now() };
  await db.goals.add(goal);
  userId().then(uid => {
    if (uid) supabase.from('goals').upsert({
      id, user_id: uid, name: goal.name, created_at: goal.createdAt, archived_at: null,
    }).then(() => {});
  });
}

export async function archiveGoal(id: string): Promise<void> {
  const archivedAt = Date.now();
  await db.goals.update(id, { archivedAt });
  userId().then(uid => {
    if (uid) supabase.from('goals').update({ archived_at: archivedAt }).eq('id', id).eq('user_id', uid).then(() => {});
  });
}

export async function deleteGoal(id: string): Promise<void> {
  await db.goals.delete(id);
  await db.goalEntries.where('goalId').equals(id).delete();
  userId().then(uid => {
    if (uid) {
      supabase.from('goal_entries').delete().eq('goal_id', id).eq('user_id', uid).then(() => {});
      supabase.from('goals').delete().eq('id', id).eq('user_id', uid).then(() => {});
    }
  });
}

export function getGoalById(id: string): Promise<Goal | undefined> {
  return db.goals.get(id);
}

// ── Goal entries ─────────────────────────────────────────────────────────────

export async function getTodayEntries(date: string): Promise<GoalEntry[]> {
  return db.goalEntries.where('date').equals(date).toArray();
}

export async function toggleGoalDone(goalId: string, date: string): Promise<void> {
  const existing = await db.goalEntries.get([goalId, date]);
  const uid = await userId();
  if (existing?.status === 'done') {
    await db.goalEntries.delete([goalId, date]);
    if (uid) supabase.from('goal_entries').delete().eq('goal_id', goalId).eq('date', date).eq('user_id', uid).then(() => {});
  } else {
    await db.goalEntries.put({ goalId, date, status: 'done' });
    if (uid) supabase.from('goal_entries').upsert({ goal_id: goalId, date, status: 'done', user_id: uid }).then(() => {});
  }
}

export async function getGoalDoneDates(goalId: string): Promise<string[]> {
  const entries = await db.goalEntries.where('goalId').equals(goalId).filter(e => e.status === 'done').toArray();
  return entries.map(e => e.date).sort((a, b) => b.localeCompare(a));
}

// ── Daily logs ────────────────────────────────────────────────────────────────

export async function getTodayLog(date: string): Promise<DailyLog | undefined> {
  return db.dailyLogs.get(date);
}

export async function saveLog(date: string, content: string): Promise<void> {
  const updatedAt = Date.now();
  await db.dailyLogs.put({ date, content, updatedAt });
  userId().then(uid => {
    if (uid) supabase.from('daily_logs').upsert({ date, user_id: uid, content, updated_at: updatedAt }).then(() => {});
  });
}

export async function deleteLog(date: string): Promise<void> {
  await db.dailyLogs.delete(date);
  userId().then(uid => {
    if (uid) supabase.from('daily_logs').delete().eq('date', date).eq('user_id', uid).then(() => {});
  });
}

export async function getAllLogs(): Promise<DailyLog[]> {
  const logs = await db.dailyLogs.filter(l => l.content.trim() !== '').toArray();
  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

// ── Locked notes ──────────────────────────────────────────────────────────────

export async function getLockedNotes(): Promise<LockedNote[]> {
  const notes = await db.lockedNotes.toArray();
  return notes.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addLockedNote(note: Omit<LockedNote, 'id' | 'createdAt' | 'unlockedAt'>): Promise<void> {
  const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const full: LockedNote = { ...note, id, createdAt: Date.now() };
  await db.lockedNotes.add(full);
  userId().then(uid => {
    if (uid) supabase.from('locked_notes').upsert({
      id, user_id: uid, title: full.title, content: full.content,
      created_at: full.createdAt, unlock_type: full.unlockType,
      unlock_date: full.unlockDate ?? null,
      unlock_goal_id: full.unlockGoalId ?? null,
      unlock_streak: full.unlockStreak ?? null,
      unlocked_at: null,
    }).then(() => {});
  });
}

export async function markNoteUnlocked(id: string): Promise<void> {
  const unlockedAt = Date.now();
  await db.lockedNotes.update(id, { unlockedAt });
  userId().then(uid => {
    if (uid) supabase.from('locked_notes').update({ unlocked_at: unlockedAt }).eq('id', id).eq('user_id', uid).then(() => {});
  });
}

export async function deleteLockedNote(id: string): Promise<void> {
  await db.lockedNotes.delete(id);
  userId().then(uid => {
    if (uid) supabase.from('locked_notes').delete().eq('id', id).eq('user_id', uid).then(() => {});
  });
}
