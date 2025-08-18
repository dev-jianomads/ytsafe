/*
  # Safe Migration: Add Missing Columns to search_analytics

  This migration safely adds missing columns without dropping the table.
  It checks for each column's existence before adding it.

  1. Core Columns
    - `query` (text) - the search query
    - `query_type` (text) - type of query
    - `created_at` (timestamptz) - timestamp
    - All other analytics columns

  2. Security
    - Enable RLS if not already enabled
    - Add policies if they don't exist

  3. Indexes
    - Add performance indexes if they don't exist
*/

DO $$
BEGIN
  -- Add query column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'query'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN query text NOT NULL DEFAULT '';
  END IF;

  -- Add query_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'query_type'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN query_type text NOT NULL DEFAULT 'search_term' CHECK (query_type IN ('channel_url', 'video_url', 'handle', 'search_term'));
  END IF;

  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- Add age_band column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'age_band'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN age_band text CHECK (age_band IN ('E', 'E10+', 'T', '16+'));
  END IF;

  -- Add video_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'video_count'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN video_count integer DEFAULT 0;
  END IF;

  -- Add transcript_coverage_percent column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'transcript_coverage_percent'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN transcript_coverage_percent integer DEFAULT 0 CHECK (transcript_coverage_percent >= 0 AND transcript_coverage_percent <= 100);
  END IF;

  -- Add warnings_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'warnings_count'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN warnings_count integer DEFAULT 0;
  END IF;

  -- Add high_controversy_videos_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'high_controversy_videos_count'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN high_controversy_videos_count integer DEFAULT 0;
  END IF;

  -- Add suspicious_engagement_videos_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'suspicious_engagement_videos_count'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN suspicious_engagement_videos_count integer DEFAULT 0;
  END IF;

  -- Add avg_engagement_velocity column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'avg_engagement_velocity'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN avg_engagement_velocity numeric DEFAULT 0;
  END IF;

  -- Add analysis_success column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'analysis_success'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN analysis_success boolean NOT NULL DEFAULT false;
  END IF;

  -- Add error_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'error_type'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN error_type text;
  END IF;

  -- Add session_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN session_id text NOT NULL DEFAULT 'unknown';
  END IF;

  -- Add user_agent_hash column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'user_agent_hash'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN user_agent_hash text;
  END IF;

  -- Add total_prompt_tokens column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'total_prompt_tokens'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN total_prompt_tokens integer DEFAULT 0;
  END IF;

  -- Add total_completion_tokens column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'total_completion_tokens'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN total_completion_tokens integer DEFAULT 0;
  END IF;

  -- Add total_tokens column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'total_tokens'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN total_tokens integer DEFAULT 0;
  END IF;

  -- Add openai_requests_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'search_analytics' AND column_name = 'openai_requests_count'
  ) THEN
    ALTER TABLE search_analytics ADD COLUMN openai_requests_count integer DEFAULT 0;
  END IF;
END $$;

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'search_analytics' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$
BEGIN
  -- Check if insert policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'search_analytics' 
    AND policyname = 'Allow public insert to search_analytics'
  ) THEN
    CREATE POLICY "Allow public insert to search_analytics"
      ON search_analytics
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  -- Check if select policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'search_analytics' 
    AND policyname = 'Allow authenticated read access to search_analytics'
  ) THEN
    CREATE POLICY "Allow authenticated read access to search_analytics"
      ON search_analytics
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_success ON search_analytics(analysis_success);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query_type ON search_analytics(query_type);
CREATE INDEX IF NOT EXISTS idx_search_analytics_age_band ON search_analytics(age_band);
CREATE INDEX IF NOT EXISTS idx_search_analytics_session ON search_analytics(session_id);