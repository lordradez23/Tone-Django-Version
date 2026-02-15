-- Fix 1: Restrict profiles SELECT policy - only allow viewing profiles of conversation members
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view profiles of conversation members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  id IN (
    SELECT cm.user_id FROM public.conversation_members cm
    WHERE cm.conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
  )
);

-- Fix 2: Add UPDATE policy for messages - users can edit their own messages
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Fix 3: Add DELETE policy for messages - users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());