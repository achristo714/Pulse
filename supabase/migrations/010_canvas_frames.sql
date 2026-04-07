-- Canvas frames (labeled containers for grouping cards)
CREATE TABLE IF NOT EXISTS canvas_frames (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid REFERENCES teams(id) NOT NULL,
  label       text NOT NULL DEFAULT 'Frame',
  x           float NOT NULL DEFAULT 0,
  y           float NOT NULL DEFAULT 0,
  width       float NOT NULL DEFAULT 600,
  height      float NOT NULL DEFAULT 400,
  color       text NOT NULL DEFAULT '#7C3AED',
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE canvas_frames DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_canvas_frames_team ON canvas_frames(team_id);
