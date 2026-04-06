-- Knowledge Base: team wiki, links, workflows, drafts
CREATE TABLE knowledge_articles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid REFERENCES teams(id) NOT NULL,
  title       text NOT NULL,
  content     text DEFAULT '',        -- rich text (HTML)
  category    text DEFAULT 'general' CHECK (category IN ('workflow', 'guide', 'link', 'reference', 'draft', 'general')),
  tags        text[] DEFAULT '{}',
  pinned      boolean DEFAULT false,
  created_by  uuid REFERENCES profiles(id) NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TRIGGER knowledge_articles_updated_at
  BEFORE UPDATE ON knowledge_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage articles" ON knowledge_articles
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE INDEX idx_knowledge_team ON knowledge_articles(team_id);
CREATE INDEX idx_knowledge_category ON knowledge_articles(category);
