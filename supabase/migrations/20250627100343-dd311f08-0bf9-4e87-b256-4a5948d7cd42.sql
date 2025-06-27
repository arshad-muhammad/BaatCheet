
-- Fix RLS policies to work with Clerk string IDs instead of UUIDs
-- First, drop ALL existing policies to ensure clean slate

-- Drop all existing policies on chats table
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view chats they are members of" ON public.chats;

-- Drop all existing policies on chat_members table
DROP POLICY IF EXISTS "Users can be added to chats" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view chat members for chats they are in" ON public.chat_members;

-- Drop all existing policies on messages table
DROP POLICY IF EXISTS "Users can view messages in chats they are members of" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in chats they are members of" ON public.messages;

-- Now recreate all policies that work with Clerk string IDs
CREATE POLICY "Users can create chats" ON public.chats 
FOR INSERT WITH CHECK (
  created_by = auth.jwt() ->> 'sub'
);

CREATE POLICY "Users can view chats they are members of" ON public.chats 
FOR SELECT USING (
  public.is_chat_member(id, auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can be added to chats" ON public.chat_members 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view chat members for chats they are in" ON public.chat_members 
FOR SELECT USING (
  user_id = auth.jwt() ->> 'sub' OR
  public.is_chat_member(chat_id, auth.jwt() ->> 'sub')
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
