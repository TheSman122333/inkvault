import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[InkVault] Supabase env vars not set — running local-only mode.');
}

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'placeholder'
);

export const isSupabaseConfigured = Boolean(url && key);
