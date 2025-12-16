-- Drop existing SELECT policies and create a clean setup
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Block anonymous access" ON public.orders;

-- Create a single PERMISSIVE policy that only allows authenticated admins
-- Anonymous users will have NO matching policy, so they're denied by default
CREATE POLICY "Only admins can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));