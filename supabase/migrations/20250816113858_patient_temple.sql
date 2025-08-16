/*
  # Search Analytics Schema

  1. New Tables
    - `searches`
      - `id` (uuid, primary key)
      - `query` (text) - the search query (channel URL, handle, etc.)
      - `channel_id` (text) - YouTube channel ID
      - `channel_title` (text) - Channel name
      - `channel_handle` (text) - Channel @handle
      - `age_band` (text) - E, E10+, T, 16+
      - `verdict` (text) - Safety verdict
      - `aggregate_scores` (jsonb) - Category scores
      - `video_count` (integer) - Number of videos analyzed
      - `transcript_coverage` (jsonb) - Transcript availability data
      - `warnings` (text[]) - Any warnings from analysis
      - `created_at` (timestamp)
      - `user_ip` (text) - For basic analytics (optional)
    
    - `video_analyses`
      - `id` (uuid, primary key)
      - `search_id` (uuid, foreign key to searches)
      - `video_id` (text) - YouTube video ID
      - `title` (text) - Video title
      - `url` (text) - Video URL
      - `published_at` (timestamp) - When video was published
      - `view_count` (bigint) - Video views
      - `like_count` (bigint) - Video likes
      - `comment_count` (bigint) - Video comments
      - `category_scores` (jsonb) - Per-category safety scores
      - `risk_note` (text) - Brief risk description
      - `engagement_metrics` (jsonb) - Engagement analysis
      - `comment_analysis` (jsonb) - Community sentiment data
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access (for analytics)
    - Add policies for insert access (for saving searches)

  3. Indexes
    - Index on searches.created_at for analytics queries
    - Index on searches.age_band for filtering
    - Index on video_analyses.search_id for joins
*/

-- Create searches table
CREATE TABLE IF NOT EXISTS searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  channel_id text,
  channel_title text,
  channel_handle text,
  age_band text NOT NULL CHECK (age_band IN ('E', 'E10+', 'T', '16+')),
  verdict text NOT NULL,
  aggregate_scores jsonb NOT NULL DEFAULT '{}',
  video_count integer DEFAULT 0,
  transcript_coverage jsonb DEFAULT '{}',
  warnings text[] DEFAULT '{}',
  user_ip text,
  created_at timestamptz DEFAULT now()
);

-- Create video_analyses table
CREATE TABLE IF NOT EXISTS video_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  published_at timestamptz,
  view_count bigint DEFAULT 0,
  like_count bigint DEFAULT 0,
  comment_count bigint DEFAULT 0,
  category_scores jsonb NOT NULL DEFAULT '{}',
  risk_note text DEFAULT '',
  engagement_metrics jsonb DEFAULT '{}',
  comment_analysis jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public safety tool)
CREATE POLICY "Allow public read access to searches"
  ON searches
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to searches"
  ON searches
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access to video analyses"
  ON video_analyses
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to video analyses"
  ON video_analyses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_searches_created_at ON searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_age_band ON searches(age_band);
CREATE INDEX IF NOT EXISTS idx_searches_channel_id ON searches(channel_id);
CREATE INDEX IF NOT EXISTS idx_video_analyses_search_id ON video_analyses(search_id);
CREATE INDEX IF NOT EXISTS idx_video_analyses_video_id ON video_analyses(video_id);