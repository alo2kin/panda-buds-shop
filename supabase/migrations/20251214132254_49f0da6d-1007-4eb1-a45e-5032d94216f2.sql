-- Drop existing SELECT policies to recreate with proper permissions
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Deny public select on orders" ON public.orders;

-- Create a single permissive policy that only allows admin access
CREATE POLICY "Only admins can view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Also add policy for authenticated non-admin users (deny)
CREATE POLICY "Authenticated users cannot view orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));