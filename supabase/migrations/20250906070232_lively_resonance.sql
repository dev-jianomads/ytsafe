/*
  # Add Channel Fields to Search Analytics

  1. New Columns
    - `channel_name` (text) - The actual channel title/name
    - `channel_url` (text) - The channel URL for easy access

  2. Indexes
    - Index on channel_name for searching by channel name
    - Index on channel_url for deduplication
*/

-- Add channel_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'channel_name'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN channel_name text;
  END IF;
END $$;

-- Add channel_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'channel_url'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN channel_url text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_channel_name ON search_analytics(channel_name);
CREATE INDEX IF NOT EXISTS idx_search_analytics_channel_url ON search_analytics(channel_url);