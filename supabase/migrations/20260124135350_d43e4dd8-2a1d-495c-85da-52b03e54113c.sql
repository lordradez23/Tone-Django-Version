-- Drop the existing restrictive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view profiles of conversation members" ON public.profiles;

-- Create a new policy that allows authenticated users to view all profiles
-- This enables users to search for and find other users to start conversations
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);