
-- Update the is_chat_member function to work with string user IDs instead of UUIDs
CREATE OR REPLACE FUNCTION public.is_chat_member(chat_id uuid, user_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_members 
    WHERE chat_members.chat_id = $1 
    AND chat_members.user_id = $2
  );
$$;
