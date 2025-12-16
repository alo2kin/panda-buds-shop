-- Remove the policy that allows anyone to insert orders directly
-- Orders will now only be created through the edge function (which uses service role key and bypasses RLS)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Add a restrictive policy that denies all direct inserts
-- This ensures no one can insert directly via the Supabase client
CREATE POLICY "Deny direct order inserts"
ON public.orders
FOR INSERT
TO public
WITH CHECK (false);