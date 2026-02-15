-- Add last_read_at tracking to conversation_members for unread notifications
ALTER TABLE public.conversation_members
ADD COLUMN last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Allow users to update their own last_read_at
CREATE POLICY "Users can update their own membership"
ON public.conversation_members
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());