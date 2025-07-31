/*
  # Fix foreign key constraint for votes table

  1. Changes
    - Drop the existing foreign key constraint that references auth.users
    - Add new foreign key constraint that references voters table
    - This aligns the database schema with the application logic

  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- Drop the existing foreign key constraint
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_user_id_fkey;

-- Add new foreign key constraint that references voters table
ALTER TABLE votes ADD CONSTRAINT votes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES voters(id) ON DELETE CASCADE;