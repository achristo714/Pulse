-- Notification Preferences stub for future Teams integration
CREATE TABLE notification_preferences (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  team_id    uuid REFERENCES teams(id) NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('task_assigned', 'task_completed', 'weekly_report')),
  enabled    boolean DEFAULT true,
  channel    text DEFAULT 'teams' CHECK (channel IN ('teams', 'email')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(profile_id, event_type, channel)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification prefs" ON notification_preferences
  FOR ALL USING (profile_id = auth.uid());
