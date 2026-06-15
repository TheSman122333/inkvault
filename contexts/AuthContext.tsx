'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/db';

interface AuthState {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

// Merge cloud data into local — always keep the NEWER version of each record.
async function pullCloudIntoLocal(userId: string) {
  if (!isSupabaseConfigured) return;
  const [{ data: cloudGoals }, { data: cloudEntries }, { data: cloudLogs }, { data: cloudNotes }] =
    await Promise.all([
      supabase.from('goals').select('*').eq('user_id', userId),
      supabase.from('goal_entries').select('*').eq('user_id', userId),
      supabase.from('daily_logs').select('*').eq('user_id', userId),
      supabase.from('locked_notes').select('*').eq('user_id', userId),
    ]);

  // Goals: upsert only if cloud version is newer
  if (cloudGoals?.length) {
    const localGoals = await db.goals.toArray();
    const localMap = new Map(localGoals.map(g => [g.id, g]));
    const toUpsert = cloudGoals.filter(cg => {
      const local = localMap.get(cg.id);
      return !local || cg.created_at >= local.createdAt;
    });
    if (toUpsert.length) {
      await db.goals.bulkPut(toUpsert.map(g => ({
        id: g.id, name: g.name, createdAt: g.created_at,
        archivedAt: g.archived_at ?? undefined,
      })));
    }
  }

  // Goal entries: merge — cloud wins only if local doesn't have it
  if (cloudEntries?.length) {
    const localEntries = await db.goalEntries.toArray();
    const localSet = new Set(localEntries.map(e => `${e.goalId}|${e.date}`));
    const toAdd = cloudEntries.filter(e => !localSet.has(`${e.goal_id}|${e.date}`));
    if (toAdd.length) {
      await db.goalEntries.bulkPut(toAdd.map(e => ({
        goalId: e.goal_id, date: e.date, status: e.status as 'done' | 'skip',
      })));
    }
  }

  // Daily logs: keep the NEWER version per date — local wins if same age or newer
  if (cloudLogs?.length) {
    const localLogs = await db.dailyLogs.toArray();
    const localMap = new Map(localLogs.map(l => [l.date, l]));
    const toUpsert = cloudLogs.filter(cl => {
      const local = localMap.get(cl.date);
      // Only pull from cloud if there's no local copy, or cloud is strictly newer
      return !local || cl.updated_at > local.updatedAt;
    });
    if (toUpsert.length) {
      await db.dailyLogs.bulkPut(toUpsert.map(l => ({
        date: l.date, content: l.content, updatedAt: l.updated_at,
      })));
    }
  }

  // Locked notes: upsert all (content doesn't change after creation)
  if (cloudNotes?.length) {
    await db.lockedNotes.bulkPut(cloudNotes.map(n => ({
      id: n.id, title: n.title, content: n.content, createdAt: n.created_at,
      unlockType: n.unlock_type as 'date' | 'streak',
      unlockDate: n.unlock_date ?? undefined,
      unlockGoalId: n.unlock_goal_id ?? undefined,
      unlockStreak: n.unlock_streak ?? undefined,
      unlockedAt: n.unlocked_at ?? undefined,
    })));
  }
}

async function pushLocalToCloud(userId: string) {
  if (!isSupabaseConfigured) return;
  const [goals, entries, logs, notes] = await Promise.all([
    db.goals.toArray(),
    db.goalEntries.toArray(),
    db.dailyLogs.toArray(),
    db.lockedNotes.toArray(),
  ]);
  await Promise.all([
    goals.length
      ? supabase.from('goals').upsert(goals.map(g => ({
          id: g.id, user_id: userId, name: g.name,
          created_at: g.createdAt, archived_at: g.archivedAt ?? null,
        })))
      : Promise.resolve(),
    entries.length
      ? supabase.from('goal_entries').upsert(entries.map(e => ({
          goal_id: e.goalId, date: e.date, status: e.status, user_id: userId,
        })))
      : Promise.resolve(),
    logs.length
      ? supabase.from('daily_logs').upsert(logs.map(l => ({
          date: l.date, user_id: userId, content: l.content, updated_at: l.updatedAt,
        })))
      : Promise.resolve(),
    notes.length
      ? supabase.from('locked_notes').upsert(notes.map(n => ({
          id: n.id, user_id: userId, title: n.title, content: n.content,
          created_at: n.createdAt, unlock_type: n.unlockType,
          unlock_date: n.unlockDate ?? null, unlock_goal_id: n.unlockGoalId ?? null,
          unlock_streak: n.unlockStreak ?? null, unlocked_at: n.unlockedAt ?? null,
        })))
      : Promise.resolve(),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
      if (data.user) pullCloudIntoLocal(data.user.id).catch(() => {});
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (event === 'SIGNED_IN' && u) {
        await pushLocalToCloud(u.id).catch(() => {});
        await pullCloudIntoLocal(u.id).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '/' },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
