
-- Fix the RLS policy for chats table to work with Clerk authentication
-- The issue is that auth.jwt() ->> 'sub' might not match the Clerk user ID format

-- First, let's drop the existing problematic policy
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

-- Create a new policy that checks if the created_by matches the current user ID
-- This should work better with Clerk since we're storing the Clerk user ID directly
CREATE POLICY "Users can create chats" ON public.chats 
FOR INSERT WITH CHECK (
  created_by = auth.uid()::text
);

-- Also ensure we have proper SELECT policy
DROP POLICY IF EXISTS "Users can view chats they are members of" ON public.chats;
CREATE POLICY "Users can view chats they are members of" ON public.chats 
FOR SELECT USING (
  public.is_chat_member(id, auth.uid()::text)
);

-- Make sure the chat_members policies are correct too
DROP POLICY IF EXISTS "Users can be added to chats" ON public.chat_members;
CREATE POLICY "Users can be added to chats" ON public.chat_members 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view chat members for chats they are in" ON public.chat_members;
CREATE POLICY "Users can view chat members for chats they are in" ON public.chat_members 
FOR SELECT USING (
  user_id = auth.uid()::text OR
  public.is_chat_member(chat_id, auth.uid()::text)
);
