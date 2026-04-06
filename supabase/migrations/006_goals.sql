-- Goals: long-term team objectives with progress tracking
CREATE TABLE goals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid REFERENCES teams(id) NOT NULL,
  title       text NOT NULL,
  description text,
  status      text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  progress    integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  target_date date,
  category    text DEFAULT 'admin' CHECK (category IN ('education', 'resources', 'support', 'admin')),
  created_by  uuid REFERENCES profiles(id) NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage goals" ON goals
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE INDEX idx_goals_team ON goals(team_id);
