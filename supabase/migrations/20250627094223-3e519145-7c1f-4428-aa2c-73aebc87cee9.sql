
-- Create a security definer function to check if user is member of a chat
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_chat_member(chat_id uuid, user_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_members.chat_id = $1 
    AND chat_members.user_id = $2
  );
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view chats they are members of" ON public.chats;
DROP POLICY IF EXISTS "Users can view messages in chats they are members of" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in chats they are members of" ON public.messages;
DROP POLICY IF EXISTS "Users can view chat members for chats they are in" ON public.chat_members;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view chats they are members of" ON public.chats 
FOR SELECT USING (
  public.is_chat_member(id, auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can view messages in chats they are members of" ON public.messages 
FOR SELECT USING (
  public.is_chat_member(chat_id, auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can insert messages in chats they are members of" ON public.messages 
FOR INSERT WITH CHECK (
  sender_id = auth.jwt() ->> 'sub' AND
  public.is_chat_member(chat_id, auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can view chat members for chats they are in" ON public.chat_members 
FOR SELECT USING (
  user_id = auth.jwt() ->> 'sub' OR
  public.is_chat_member(chat_id, auth.jwt() ->> 'sub')
);
