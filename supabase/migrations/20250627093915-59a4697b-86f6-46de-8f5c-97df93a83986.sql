
-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view chats they are members of" ON public.chats;
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update chats they created" ON public.chats;
DROP POLICY IF EXISTS "Users can view messages in chats they are members of" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to chats they are members of" ON public.messages;
DROP POLICY IF EXISTS "Users can view chat members for chats they are in" ON public.chat_members;
DROP POLICY IF EXISTS "Users can add members to chats they created" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS public.chat_members CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.chats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate profiles table with text ID to handle Clerk user IDs
CREATE TABLE public.profiles (
  id text PRIMARY KEY,
  email text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create chats table
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  is_group boolean DEFAULT false,
  created_by text REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id text REFERENCES public.profiles(id),
  content text NOT NULL,
  message_type text DEFAULT 'text',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create chat_members table
CREATE TABLE public.chat_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES public.profiles(id),
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  joined_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, chat_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (true);

-- Create RLS policies for chats
CREATE POLICY "Users can view chats they are members of" ON public.chats FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_members.chat_id = chats.id 
    AND chat_members.user_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can create chats" ON public.chats FOR INSERT WITH CHECK (
  created_by = auth.jwt() ->> 'sub'
);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in chats they are members of" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_members.chat_id = messages.chat_id 
    AND chat_members.user_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can insert messages in chats they are members of" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.jwt() ->> 'sub' AND
  EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_members.chat_id = messages.chat_id 
    AND chat_members.user_id = auth.jwt() ->> 'sub'
  )
);

-- Create RLS policies for chat_members
CREATE POLICY "Users can view chat members for chats they are in" ON public.chat_members FOR SELECT USING (
  user_id = auth.jwt() ->> 'sub' OR
  EXISTS (
    SELECT 1 FROM public.chat_members cm2
    WHERE cm2.chat_id = chat_members.chat_id 
    AND cm2.user_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can be added to chats" ON public.chat_members FOR INSERT WITH CHECK (true);

-- Enable realtime for messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;
