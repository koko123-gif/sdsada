/*
  # Fix voted_for synchronization

  1. Database Functions
    - Create function to update voter choice when vote is inserted
    - Create trigger to automatically sync voted_for field
  
  2. Data Sync
    - Sync existing votes with voted_for field
    - Ensure data consistency
  
  3. Security
    - Maintain existing RLS policies
*/

-- Create function to update voter choice
CREATE OR REPLACE FUNCTION update_voter_choice()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the voted_for field in voters table when a vote is inserted
  UPDATE voters 
  SET voted_for = NEW.candidate_name 
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_voter_choice ON votes;

-- Create trigger to automatically update voted_for when vote is inserted
CREATE TRIGGER trigger_update_voter_choice
  AFTER INSERT ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_voter_choice();

-- Sync existing data: Update voted_for based on existing votes
UPDATE voters 
SET voted_for = votes.candidate_name
FROM votes 
WHERE voters.id = votes.user_id 
AND voters.voted_for IS NULL;

-- Verify the sync worked
DO $$
DECLARE
  unsynced_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unsynced_count
  FROM voters v
  LEFT JOIN votes vt ON v.id = vt.user_id
  WHERE vt.user_id IS NOT NULL AND v.voted_for IS NULL;
  
  IF unsynced_count > 0 THEN
    RAISE NOTICE 'Warning: % voters still have unsynced voted_for field', unsynced_count;
  ELSE
    RAISE NOTICE 'All voters voted_for fields are now synced';
  END IF;
END $$;