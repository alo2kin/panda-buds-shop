-- Drop duplicate policy
DROP POLICY IF EXISTS "Authenticated users cannot view orders" ON public.orders;

-- Block anonymous users from reading orders
CREATE POLICY "Anonymous cannot view orders"
ON public.orders
FOR SELECT
TO anon
USING (false);