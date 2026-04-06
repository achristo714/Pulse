-- Custom categories per team
CREATE TABLE IF NOT EXISTS team_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid REFERENCES teams(id) NOT NULL,
  key         text NOT NULL,
  label       text NOT NULL,
  color       text NOT NULL DEFAULT '#7C3AED',
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(team_id, key)
);

ALTER TABLE team_categories DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_team_categories_team ON team_categories(team_id);

-- Remove the CHECK constraint on tasks.category so custom values work
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
-- Also remove it from goals
ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_category_check;
