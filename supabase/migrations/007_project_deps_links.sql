-- Add project_number to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_number text;

-- Task dependencies (blockers)
CREATE TABLE IF NOT EXISTS task_dependencies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  depends_on  uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  team_id     uuid REFERENCES teams(id) NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(task_id, depends_on)
);

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends ON task_dependencies(depends_on);

-- Link tasks to goals
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES goals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks(goal_id);

-- Link tasks to knowledge articles
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS knowledge_article_id uuid REFERENCES knowledge_articles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_knowledge ON tasks(knowledge_article_id);

-- Add project_number index
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_number);
