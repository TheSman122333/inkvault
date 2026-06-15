CREATE TABLE IF NOT EXISTS goals (
  id          TEXT    PRIMARY KEY,
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  created_at  BIGINT  NOT NULL,
  archived_at BIGINT
);

CREATE TABLE IF NOT EXISTS goal_entries (
  goal_id  TEXT  NOT NULL,
  date     TEXT  NOT NULL,
  status   TEXT  NOT NULL CHECK (status IN ('done','skip')),
  user_id  UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (goal_id, date, user_id)
);

CREATE TABLE IF NOT EXISTS daily_logs (
  date       TEXT    NOT NULL,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT    NOT NULL DEFAULT '',
  updated_at BIGINT  NOT NULL,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS locked_notes (
  id              TEXT    PRIMARY KEY,
  user_id         UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT    NOT NULL,
  content         TEXT    NOT NULL,
  created_at      BIGINT  NOT NULL,
  unlock_type     TEXT    NOT NULL CHECK (unlock_type IN ('date','streak')),
  unlock_date     TEXT,
  unlock_goal_id  TEXT,
  unlock_streak   INTEGER,
  unlocked_at     BIGINT
);

ALTER TABLE goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE locked_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own goals"   ON goals;
DROP POLICY IF EXISTS "own entries" ON goal_entries;
DROP POLICY IF EXISTS "own logs"    ON daily_logs;
DROP POLICY IF EXISTS "own notes"   ON locked_notes;

CREATE POLICY "own goals"   ON goals        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own entries" ON goal_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own logs"    ON daily_logs   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notes"   ON locked_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
