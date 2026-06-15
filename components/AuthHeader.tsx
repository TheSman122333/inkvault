'use client';
import { useAuth } from '@/contexts/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AuthHeader() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (!isSupabaseConfigured) return null;
  if (loading) return <div className="h-9 border-b border-ink-200" />;

  return (
    <div className="flex items-center justify-between px-6 py-2 border-b border-ink-200 bg-paper">
      <span className="font-mono text-[9px] text-ink-200 tracking-[3px]">INK VAULT</span>
      {user ? (
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-ink-400 truncate max-w-[140px]">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="font-mono text-[9px] text-ink-400 tracking-[1px] hover:text-ink-950 transition-colors"
          >
            SIGN OUT
          </button>
        </div>
      ) : (
        <button
          onClick={signInWithGoogle}
          className="font-mono text-[9px] text-ink-950 tracking-[1px] border border-ink-200 px-2 py-1 hover:border-ink-600 transition-colors"
        >
          SIGN IN WITH GOOGLE
        </button>
      )}
    </div>
  );
}
