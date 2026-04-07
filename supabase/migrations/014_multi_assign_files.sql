-- Multi-assignee: change from single to array
-- Keep assigned_to for backwards compat, add assignees array
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignees text[] DEFAULT '{}';

-- Personal workspace flag
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_personal boolean DEFAULT false;

-- File attachments (supports images, PDFs, videos)
CREATE TABLE IF NOT EXISTS task_attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  team_id     uuid REFERENCES teams(id) NOT NULL,
  file_name   text NOT NULL,
  file_type   text NOT NULL,  -- 'image', 'pdf', 'video', 'other'
  storage_path text NOT NULL,
  file_size   integer,
  uploaded_by uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE task_attachments DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_attachments_task ON task_attachments(task_id);
