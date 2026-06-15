# Ink Vault

A daily journal and goal streak tracker with an E-ink aesthetic. Write every day, build streaks on your goals, and seal private notes to your future self that only unlock on a date or when a streak is reached.

No account required. Everything is stored locally first — Google sign-in is optional and syncs your data across devices.

---

## Features

**Today** — Check off daily goals and write a freeform journal entry. Entries auto-save as you type.

**Goals** — Create named goals and track streaks. Each goal shows a 12-week heatmap of check-ins, a current streak, and an all-time best. Archive goals to keep their history without cluttering the active list, or delete them permanently.

**Vault → Journal** — Every past journal entry, browsed by month. Hover an entry to delete it.

**Vault → Hidden** — Seal private notes to yourself. Each note locks until either a specific date arrives or a goal streak count is reached. Locked notes show blurred placeholder content until they open.

**Streak milestones** — Alerts at 3, 7, 14, 21, 30, 60, 100, 200, and 365 days.

**PWA** — Installable on mobile and desktop. Works offline.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Local storage | Dexie (IndexedDB) |
| Cloud sync | Supabase (Postgres + Google OAuth) |
| Deployment | Any static/Node host (Vercel, etc.) |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables (optional — for sync)

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Without these the app runs fully local — no sign-in button appears.

### 3. Supabase schema (if using sync)

Run `supabase/schema.sql` in the Supabase SQL editor. It creates the four tables (`goals`, `goal_entries`, `daily_logs`, `locked_notes`) with Row Level Security so each user only sees their own data.

Enable Google as a provider under **Authentication → Providers** in your Supabase dashboard, and add your domain to the redirect allow-list.

### 4. Run

```bash
npm run dev
```

---

## Design

The UI uses a warm paper tone (`#f5f0e8`) with near-black ink (`#1a1a1a`), Georgia serif for body text, and monospace for labels and metadata. No animations. Intentionally slow and deliberate — it should feel like opening a notebook.
