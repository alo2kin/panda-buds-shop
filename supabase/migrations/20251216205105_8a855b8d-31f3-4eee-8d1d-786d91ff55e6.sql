-- Block anonymous users from reading orders
CREATE POLICY "Block anonymous access"
ON public.orders
FOR SELECT
TO anon
USING (false);