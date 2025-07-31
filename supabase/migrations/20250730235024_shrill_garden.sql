/*
  # Fix timezone and voted_for update issues

  1. Database Changes
    - Set default timezone to Asia/Jakarta for all timestamp columns
    - Add trigger to automatically update voted_for in voters table when vote is inserted
    - Update existing records to use correct timezone

  2. Security
    - Maintain existing RLS policies
    - Add policy for updating voted_for field

  3. Improvements
    - Automatic sync between votes and voters table
    - Consistent timezone handling
*/

-- Set timezone to Asia/Jakarta for the session
SET timezone = 'Asia/Jakarta';

-- Update existing voters table to use timestamptz with Asia/Jakarta timezone
ALTER TABLE voters ALTER COLUMN created_at SET DEFAULT (now() AT TIME ZONE 'Asia/Jakarta');

-- Update existing votes table to use timestamptz with Asia/Jakarta timezone  
ALTER TABLE votes ALTER COLUMN created_at SET DEFAULT (now() AT TIME ZONE 'Asia/Jakarta');

-- Create or replace function to update voted_for when a vote is inserted
CREATE OR REPLACE FUNCTION update_voter_choice()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the voters table with the candidate choice
  UPDATE voters 
  SET voted_for = NEW.candidate_name 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_update_voter_choice ON votes;

CREATE TRIGGER trigger_update_voter_choice
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_voter_choice();

-- Add policy to allow users to update their own voted_for field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'voters' 
    AND policyname = 'Users can update own voted_for'
  ) THEN
    CREATE POLICY "Users can update own voted_for"
      ON voters
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Update existing records to sync voted_for with votes table
UPDATE voters 
SET voted_for = votes.candidate_name
FROM votes 
WHERE voters.id = votes.user_id 
AND voters.voted_for IS NULL;

-- Update timezone for existing records (convert to Asia/Jakarta)
UPDATE voters 
SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
WHERE created_at IS NOT NULL;

UPDATE votes 
SET created_at = created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'
WHERE created_at IS NOT NULL;