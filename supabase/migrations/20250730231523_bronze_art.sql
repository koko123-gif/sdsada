/*
  # Add voted_for column to voters table

  1. Changes
    - Add `voted_for` column to `voters` table to track who each voter chose
    - Column allows NULL values for voters who haven't voted yet
    - Add index for better query performance

  2. Security
    - No changes to RLS policies needed
    - Existing policies will cover the new column
*/

-- Add voted_for column to voters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'voters' AND column_name = 'voted_for'
  ) THEN
    ALTER TABLE voters ADD COLUMN voted_for text;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_voters_voted_for ON voters(voted_for);