
-- Fix RLS policies to work properly with Clerk authentication
-- The issue is that auth.jwt() ->> 'sub' and auth.uid() aren't working correctly with Clerk tokens
-- We need to use a different approach

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view chats they are members of" ON public.chats;
DROP POLICY IF EXISTS "Users can be added to chats" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view chat members for chats they are in" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view messages in chats they are members of" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in chats they are members of" ON public.messages;

-- Create new policies that work with Clerk's JWT token structure
-- Using current_setting to get the user ID from the JWT token
CREATE POLICY "Users can create chats" ON public.chats 
FOR INSERT WITH CHECK (
  created_by = current_setting('request.jwt.claims', true)::json ->> 'sub'
);

CREATE POLICY "Users can view chats they are members of" ON public.chats 
FOR SELECT USING (
  public.is_chat_member(id, current_setting('request.jwt.claims', true)::json ->> 'sub')
);

CREATE POLICY "Users can be added to chats" ON public.chat_members 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view chat members for chats they are in" ON public.chat_members 
FOR SELECT USING (
  user_id = current_setting('request.jwt.claims', true)::json ->> 'sub' OR
  public.is_chat_member(chat_id, current_setting('request.jwt.claims', true)::json ->> 'sub')
);

CREATE POLICY "Users can view messages in chats they are members of" ON public.messages 
FOR SELECT USING (
  public.is_chat_member(chat_id, current_setting('request.jwt.claims', true)::json ->> 'sub')
);

CREATE POLICY "Users can insert messages in chats they are members of" ON public.messages 
FOR INSERT WITH CHECK (
  sender_id = current_setting('request.jwt.claims', true)::json ->> 'sub' AND
  public.is_chat_member(chat_id, current_setting('request.jwt.claims', true)::json ->> 'sub')
);
