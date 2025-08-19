/*
  # Create Feedback Table and Policies

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key, auto-generated)
      - `created_at` (timestamptz, auto-generated)
      - `session_id` (text) - anonymous session identifier
      - `score` (integer) - rating from 0-10
      - `comment` (text, nullable) - optional feedback comment

  2. Security
    - Enable RLS on feedback table
    - Add policy for public insert access (for saving feedback)
    - Add policy for authenticated read access (for viewing feedback)

  3. Indexes
    - Index on created_at for time-based queries
    - Index on session_id for session analysis
    - Index on score for rating analysis
*/

-- Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  session_id text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 10),
  comment text
);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert access (anyone can save feedback)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'feedback' 
    AND policyname = 'Allow public insert to feedback'
  ) THEN
    CREATE POLICY "Allow public insert to feedback"
      ON feedback
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

-- Create policy for authenticated read access (for viewing feedback dashboard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'feedback' 
    AND policyname = 'Allow authenticated read access to feedback'
  ) THEN
    CREATE POLICY "Allow authenticated read access to feedback"
      ON feedback
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_score ON feedback(score);