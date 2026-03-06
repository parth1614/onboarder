/*
  # Add Public Form Viewing Policy

  1. Changes
    - Add RLS policy to allow anonymous users to view published forms
    - This enables public access to form metadata when forms are published
  
  2. Security
    - Only allows SELECT access
    - Only for forms where is_published = true
    - Anonymous users cannot view unpublished forms
*/

-- Allow anyone (including anonymous users) to view published forms
CREATE POLICY "Anyone can view published forms"
  ON forms
  FOR SELECT
  TO anon
  USING (is_published = true);
