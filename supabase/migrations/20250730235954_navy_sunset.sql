/*
  # Sync all voted_for values

  1. Data Synchronization
    - Update all NULL voted_for values with data from votes table
    - Ensure all existing votes are properly reflected in voters table
  
  2. Trigger Function
    - Create/replace trigger function to handle future votes
    - Ensure trigger is properly attached to votes table
  
  3. Verification
    - Check and report sync status
    - Ensure data consistency
*/

-- First, let's sync all existing votes to voters table
UPDATE voters 
SET voted_for = votes.candidate_name
FROM votes 
WHERE voters.id = votes.user_id 
AND voters.voted_for IS NULL;

-- Create or replace the trigger function
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_voter_choice ON votes;

-- Create the trigger
CREATE TRIGGER trigger_update_voter_choice
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_voter_choice();

-- Verify the sync worked by checking how many are still NULL
DO $$
DECLARE
  null_count INTEGER;
  total_voters INTEGER;
  total_votes INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM voters WHERE voted_for IS NULL;
  SELECT COUNT(*) INTO total_voters FROM voters;
  SELECT COUNT(*) INTO total_votes FROM votes;
  
  RAISE NOTICE 'Sync completed:';
  RAISE NOTICE '- Total voters: %', total_voters;
  RAISE NOTICE '- Total votes: %', total_votes;
  RAISE NOTICE '- Voters with NULL voted_for: %', null_count;
  RAISE NOTICE '- Voters with voted_for set: %', (total_voters - null_count);
END $$;