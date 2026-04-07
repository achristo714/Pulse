-- Sync agenda items (discussion topics for leadership syncs)
CREATE TABLE IF NOT EXISTS sync_topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid REFERENCES teams(id) NOT NULL,
  title       text NOT NULL,
  notes       text DEFAULT '',
  type        text DEFAULT 'update' CHECK (type IN ('update', 'metric', 'discussion', 'decision', 'blocker')),
  image_urls  text[] DEFAULT '{}',
  sort_order  integer DEFAULT 0,
  is_archived boolean DEFAULT false,
  created_by  uuid REFERENCES profiles(id) NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE sync_topics DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sync_topics_team ON sync_topics(team_id);

CREATE TRIGGER sync_topics_updated_at
  BEFORE UPDATE ON sync_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
