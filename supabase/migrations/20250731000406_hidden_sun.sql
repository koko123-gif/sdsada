/*
  # Integrate voted_for with votes table

  1. Database Changes
    - Create proper trigger function to update voted_for
    - Sync existing data between votes and voters tables
    - Add proper indexes for performance
  
  2. Data Synchronization
    - Update all existing voters with their vote choices
    - Ensure data consistency between tables
  
  3. Trigger Setup
    - Create reliable trigger for future votes
    - Handle edge cases and errors
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_update_voter_choice ON votes;
DROP FUNCTION IF EXISTS update_voter_choice();

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_voter_choice()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the voters table with the candidate choice
  UPDATE voters 
  SET voted_for = NEW.candidate_name 
  WHERE id = NEW.user_id;
  
  -- Log the update for debugging
  RAISE NOTICE 'Updated voter % with choice %', NEW.user_id, NEW.candidate_name;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_update_voter_choice
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_voter_choice();

-- Sync existing data: Update voters.voted_for based on existing votes
UPDATE voters 
SET voted_for = votes.candidate_name
FROM votes 
WHERE voters.id = votes.user_id 
AND voters.voted_for IS NULL;

-- Verify the sync worked
DO $$
DECLARE
  synced_count INTEGER;
  total_votes INTEGER;
  null_voted_for INTEGER;
BEGIN
  -- Count synced records
  SELECT COUNT(*) INTO synced_count
  FROM voters v
  INNER JOIN votes vt ON v.id = vt.user_id
  WHERE v.voted_for = vt.candidate_name;
  
  -- Count total votes
  SELECT COUNT(*) INTO total_votes FROM votes;
  
  -- Count NULL voted_for
  SELECT COUNT(*) INTO null_voted_for 
  FROM voters 
  WHERE voted_for IS NULL;
  
  RAISE NOTICE 'Sync Results:';
  RAISE NOTICE '- Total votes: %', total_votes;
  RAISE NOTICE '- Synced voted_for: %', synced_count;
  RAISE NOTICE '- Still NULL voted_for: %', null_voted_for;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_voters_voted_for ON voters(voted_for);
CREATE INDEX IF NOT EXISTS idx_votes_user_candidate ON votes(user_id, candidate_name);