/*
  # Fix search_analytics table schema

  1. Drop and recreate search_analytics table with correct schema
    - All required columns from the analytics interface
    - Proper constraints and defaults
    - Correct data types

  2. Security
    - Enable RLS
    - Add policies for public insert and authenticated read

  3. Indexes
    - Performance indexes for common queries
*/

-- Drop the existing table if it exists (it has wrong schema)
DROP TABLE IF EXISTS search_analytics;

-- Create search_analytics table with correct schema
CREATE TABLE search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  query text NOT NULL,
  query_type text NOT NULL CHECK (query_type IN ('channel_url', 'video_url', 'handle', 'search_term')),
  age_band text CHECK (age_band IN ('E', 'E10+', 'T', '16+')),
  video_count integer DEFAULT 0,
  transcript_coverage_percent integer DEFAULT 0 CHECK (transcript_coverage_percent >= 0 AND transcript_coverage_percent <= 100),
  warnings_count integer DEFAULT 0,
  high_controversy_videos_count integer DEFAULT 0,
  suspicious_engagement_videos_count integer DEFAULT 0,
  avg_engagement_velocity numeric DEFAULT 0,
  analysis_success boolean NOT NULL DEFAULT false,
  error_type text,
  session_id text NOT NULL,
  user_agent_hash text,
  total_prompt_tokens integer DEFAULT 0,
  total_completion_tokens integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  openai_requests_count integer DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert access (anyone can save analytics)
CREATE POLICY "Allow public insert to search_analytics"
  ON search_analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for authenticated read access (for viewing analytics dashboard)
CREATE POLICY "Allow authenticated read access to search_analytics"
  ON search_analytics
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX idx_search_analytics_success ON search_analytics(analysis_success);
CREATE INDEX idx_search_analytics_query_type ON search_analytics(query_type);
CREATE INDEX idx_search_analytics_age_band ON search_analytics(age_band);
CREATE INDEX idx_search_analytics_session ON search_analytics(session_id);