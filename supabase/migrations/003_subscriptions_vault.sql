-- Shared team subscriptions / password vault
CREATE TABLE subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid REFERENCES teams(id) NOT NULL,
  name        text NOT NULL,             -- e.g. "Adobe Creative Cloud"
  url         text,                      -- login URL
  username    text,                      -- login email/username
  password    text,                      -- encrypted in app layer
  notes       text,
  category    text DEFAULT 'other' CHECK (category IN ('design', 'engineering', 'productivity', 'cloud', 'ai', 'communication', 'other')),
  cost        numeric(10,2),             -- monthly cost
  billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one-time')),
  renewal_date date,
  created_by  uuid REFERENCES profiles(id) NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage subscriptions" ON subscriptions
  FOR ALL USING (
    team_id IN (SELECT team_id FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE INDEX idx_subscriptions_team_id ON subscriptions(team_id);
