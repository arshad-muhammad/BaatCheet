
-- Drop the existing problematic policy and recreate it properly
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

-- Create a proper INSERT policy for chats
CREATE POLICY "Users can create chats" ON public.chats 
FOR INSERT WITH CHECK (
  created_by = auth.jwt() ->> 'sub'
);

-- Ensure we have the SELECT policy using the security definer function
DROP POLICY IF EXISTS "Users can view chats they are members of" ON public.chats;
CREATE POLICY "Users can view chats they are members of" ON public.chats 
FOR SELECT USING (
  public.is_chat_member(id, auth.jwt() ->> 'sub')
);

-- Make sure the chat_members INSERT policy exists
DROP POLICY IF EXISTS "Users can be added to chats" ON public.chat_members;
CREATE POLICY "Users can be added to chats" ON public.chat_members 
FOR INSERT WITH CHECK (true);
