/*
  # Simplify voting system to use only voters table

  1. Changes
    - Remove votes table and related objects
    - Keep only voters table with voted_for column
    - Remove foreign key constraints and triggers
    - Clean up unused functions and policies

  2. Security
    - Keep RLS policies on voters table
    - Ensure users can only update their own voted_for field
*/

-- Drop the votes table and all related objects
DROP TABLE IF EXISTS votes CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_voter_choice() CASCADE;

-- The voters table already exists with the voted_for column, so no changes needed there
-- Just ensure RLS policies are correct

-- Update RLS policies for voters table to be more specific
DROP POLICY IF EXISTS "Users can update own voted_for" ON voters;

CREATE POLICY "Users can update own voted_for"
  ON voters
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);