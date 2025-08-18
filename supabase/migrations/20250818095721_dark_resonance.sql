/*
  # Feedback Table Policies

  1. Security
    - Enable RLS on feedback table
    - Add policy for public insert access (for saving feedback)
    - Add policy for authenticated read access (for viewing feedback)

  2. Indexes
    - Index on created_at for time-based queries
    - Index on session_id for session analysis
    - Index on score for rating analysis
*/

-- Enable Row Level Security on feedback table
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert access (anyone can save feedback)
CREATE POLICY "Allow public insert to feedback"
  ON feedback
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy for authenticated read access (for viewing feedback dashboard)
CREATE POLICY "Allow authenticated read access to feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_score ON feedback(score);