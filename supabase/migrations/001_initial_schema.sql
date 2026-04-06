-- Pulse Initial Schema

-- Teams
CREATE TABLE teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id      uuid REFERENCES teams(id),
  display_name text NOT NULL,
  avatar_url   text,
  role         text DEFAULT 'member' CHECK (role IN ('admin', 'member'))
);

-- Tasks
CREATE TABLE tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid REFERENCES teams(id) NOT NULL,
  title        text NOT NULL,
  notes        text,
  status       text DEFAULT 'todo' CHECK (status IN ('todo', 'wip', 'done')),
  category     text DEFAULT 'admin' CHECK (category IN ('education', 'resources', 'support', 'admin')),
  assigned_to  uuid REFERENCES profiles(id),
  created_by   uuid REFERENCES profiles(id) NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  completed_at timestamptz,
  due_date     date,
  sort_order   integer DEFAULT 0
);

-- Subtasks (one level only)
CREATE TABLE subtasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL,
  is_done    boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Task Images
CREATE TABLE task_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      uuid REFERENCES tasks(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption      text,
  created_at   timestamptz DEFAULT now()
);

-- Canvas Positions
CREATE TABLE canvas_positions (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   uuid REFERENCES teams(id) NOT NULL,
  item_type text NOT NULL CHECK (item_type IN ('task', 'sticky')),
  item_id   uuid,
  x         float NOT NULL DEFAULT 0,
  y         float NOT NULL DEFAULT 0,
  width     float DEFAULT 280,
  height    float,
  z_index   integer DEFAULT 0
);

-- Sticky Notes
CREATE TABLE sticky_notes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_position_id uuid REFERENCES canvas_positions(id) ON DELETE CASCADE,
  team_id            uuid REFERENCES teams(id) NOT NULL,
  content            text DEFAULT '',
  color              text DEFAULT '#7C3AED',
  created_by         uuid REFERENCES profiles(id) NOT NULL,
  created_at         timestamptz DEFAULT now()
);

-- Invite links
CREATE TABLE team_invites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid REFERENCES teams(id) NOT NULL,
  code       text NOT NULL UNIQUE,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-set completed_at
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_completed_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_completed_at();

-- Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Teams: users can see their own team
CREATE POLICY "Users can view own team" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Profiles: users can see profiles in their team
CREATE POLICY "Users can view team profiles" ON profiles
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Tasks: team members can CRUD
CREATE POLICY "Team members can view tasks" ON tasks
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Team members can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Team members can update tasks" ON tasks
  FOR UPDATE USING (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Creator or admin can delete tasks" ON tasks
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin' AND profiles.team_id = tasks.team_id)
  );

-- Subtasks: team members can CRUD
CREATE POLICY "Team members can manage subtasks" ON subtasks
  FOR ALL USING (
    task_id IN (SELECT id FROM tasks WHERE team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid()))
  );

-- Task images: team members can CRUD
CREATE POLICY "Team members can manage task images" ON task_images
  FOR ALL USING (
    task_id IN (SELECT id FROM tasks WHERE team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid()))
  );

-- Canvas positions: team members can CRUD
CREATE POLICY "Team members can manage canvas" ON canvas_positions
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Sticky notes: team members can CRUD
CREATE POLICY "Team members can manage stickies" ON sticky_notes
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Team invites: team members can view, admins can create
CREATE POLICY "Team members can view invites" ON team_invites
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Admins can create invites" ON team_invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin' AND profiles.team_id = team_invites.team_id)
  );

-- Indexes
CREATE INDEX idx_tasks_team_id ON tasks(team_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_canvas_positions_team_id ON canvas_positions(team_id);
CREATE INDEX idx_canvas_positions_item ON canvas_positions(item_type, item_id);
CREATE INDEX idx_sticky_notes_canvas ON sticky_notes(canvas_position_id);
CREATE INDEX idx_team_invites_code ON team_invites(code);
