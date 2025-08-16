/*
  # Search Analytics Table

  1. New Tables
    - `search_analytics`
      - `id` (uuid, primary key, auto-generated)
      - `created_at` (timestamptz, auto-generated)
      - `query` (text) - the actual search query
      - `query_type` (text) - channel_url, video_url, handle, search_term
      - `age_band` (text, nullable) - E, E10+, T, 16+ (null for failed analyses)
      - `video_count` (integer) - number of videos analyzed
      - `transcript_coverage_percent` (integer) - percentage of videos with transcripts
      - `warnings_count` (integer) - number of warnings shown to user
      - `high_controversy_videos_count` (integer) - videos with controversy score > 0.7
      - `suspicious_engagement_videos_count` (integer) - videos with suspicious engagement
      - `avg_engagement_velocity` (numeric) - average views per day across videos
      - `analysis_success` (boolean) - true for successful, false for failed analyses
      - `error_type` (text, nullable) - error code for failed analyses
      - `session_id` (text) - anonymous session identifier
      - `user_agent_hash` (text, nullable) - hashed user agent for demographics
      - `total_prompt_tokens` (integer) - total OpenAI prompt tokens used
      - `total_completion_tokens` (integer) - total OpenAI completion tokens used
      - `total_tokens` (integer) - total OpenAI tokens used
      - `openai_requests_count` (integer) - number of OpenAI API calls made

  2. Security
    - Enable RLS on search_analytics table
    - Add policy for public insert access (for saving analytics)
    - Add policy for authenticated read access (for viewing analytics)

  3. Indexes
    - Index on created_at for time-based queries
    - Index on analysis_success for filtering
    - Index on query_type for analysis
*/

-- Create search_analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
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
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_success ON search_analytics(analysis_success);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query_type ON search_analytics(query_type);
CREATE INDEX IF NOT EXISTS idx_search_analytics_age_band ON search_analytics(age_band);
CREATE INDEX IF NOT EXISTS idx_search_analytics_session ON search_analytics(session_id);