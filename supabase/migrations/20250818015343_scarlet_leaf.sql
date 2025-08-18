/*
  # Add Missing Columns to search_analytics Table

  1. New Columns Added
    - `age_band` (text) - E, E10+, T, 16+ rating
    - `video_count` (integer) - Number of videos analyzed
    - `transcript_coverage_percent` (integer) - Percentage of videos with transcripts
    - `warnings_count` (integer) - Number of warnings shown
    - `high_controversy_videos_count` (integer) - Videos with high controversy
    - `suspicious_engagement_videos_count` (integer) - Videos with suspicious engagement
    - `avg_engagement_velocity` (numeric) - Average views per day
    - `analysis_success` (boolean) - Whether analysis succeeded
    - `error_type` (text) - Error code for failed analyses
    - `session_id` (text) - Anonymous session identifier
    - `user_agent_hash` (text) - Hashed user agent
    - `total_prompt_tokens` (integer) - OpenAI prompt tokens used
    - `total_completion_tokens` (integer) - OpenAI completion tokens used
    - `total_tokens` (integer) - Total OpenAI tokens used
    - `openai_requests_count` (integer) - Number of OpenAI API calls

  2. Constraints
    - Age band validation
    - Transcript coverage percentage validation
    - Non-negative counters
*/

-- Add missing columns to search_analytics table
DO $$
BEGIN
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

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_search_analytics_age_band ON search_analytics(age_band);
CREATE INDEX IF NOT EXISTS idx_search_analytics_success ON search_analytics(analysis_success);
CREATE INDEX IF NOT EXISTS idx_search_analytics_session ON search_analytics(session_id);