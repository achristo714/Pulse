-- Task comments with @mentions
CREATE TABLE IF NOT EXISTS task_comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  team_id     uuid REFERENCES teams(id) NOT NULL,
  author_id   uuid REFERENCES profiles(id) NOT NULL,
  content     text NOT NULL,
  mentions    text[] DEFAULT '{}',    -- profile IDs mentioned
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_team ON task_comments(team_id);

-- Approval flags on tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS needs_approval boolean DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Time tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_estimate_hours numeric(6,1);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_actual_hours numeric(6,1);
