
-- Create a debug function to see what auth.jwt() returns
CREATE OR REPLACE FUNCTION debug_auth_token()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'jwt_sub', auth.jwt() ->> 'sub',
    'jwt_full', auth.jwt(),
    'user_id', auth.uid()
  );
$$;
