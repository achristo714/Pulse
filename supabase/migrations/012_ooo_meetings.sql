-- OOO (Out of Office) markers
CREATE TABLE IF NOT EXISTS ooo_markers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid REFERENCES teams(id) NOT NULL,
  profile_id  uuid REFERENCES profiles(id) NOT NULL,
  date        date NOT NULL,
  note        text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(profile_id, date)
);
ALTER TABLE ooo_markers DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ooo_team ON ooo_markers(team_id);

-- Meeting notes
CREATE TABLE IF NOT EXISTS meeting_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid REFERENCES teams(id) NOT NULL,
  title       text NOT NULL,
  date        date NOT NULL,
  content     text DEFAULT '',
  attendees   text[] DEFAULT '{}',
  created_by  uuid REFERENCES profiles(id) NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE meeting_notes DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_meeting_notes_team ON meeting_notes(team_id);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_date ON meeting_notes(date);

CREATE TRIGGER meeting_notes_updated_at
  BEFORE UPDATE ON meeting_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
