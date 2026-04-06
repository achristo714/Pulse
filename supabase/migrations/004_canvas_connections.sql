-- Manual connections between canvas items (user-drawn arrows)
CREATE TABLE canvas_connections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid REFERENCES teams(id) NOT NULL,
  from_position_id uuid REFERENCES canvas_positions(id) ON DELETE CASCADE NOT NULL,
  to_position_id   uuid REFERENCES canvas_positions(id) ON DELETE CASCADE NOT NULL,
  color       text DEFAULT '#7C3AED',
  label       text,
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE canvas_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage connections" ON canvas_connections
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE INDEX idx_canvas_connections_team ON canvas_connections(team_id);
CREATE INDEX idx_canvas_connections_from ON canvas_connections(from_position_id);
CREATE INDEX idx_canvas_connections_to ON canvas_connections(to_position_id);
