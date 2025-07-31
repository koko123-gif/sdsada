/*
  # Create voting system tables
  
  1. New Tables
    - `voters`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text) 
      - `created_at` (timestamp)
    - `votes`
      - `id` (uuid, primary key)
      - `candidate_name` (text)
      - `voter_id` (uuid, references voters.id)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated access
*/

CREATE TABLE IF NOT EXISTS voters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name text NOT NULL,
  voter_id uuid REFERENCES voters(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Allow public access for this voting system
CREATE POLICY "Anyone can insert voters"
  ON voters
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read voters"
  ON voters
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert votes"
  ON votes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read votes"
  ON votes
  FOR SELECT
  TO public
  USING (true);