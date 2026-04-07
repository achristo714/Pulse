-- Add connection type to canvas_connections
ALTER TABLE canvas_connections ADD COLUMN IF NOT EXISTS connection_type text DEFAULT 'link' CHECK (connection_type IN ('link', 'blocker', 'dependency'));
