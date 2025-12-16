-- Fix RLS policy structure: Add permissive policies for proper access control
-- PostgreSQL RLS requires at least one PERMISSIVE policy to pass, then all RESTRICTIVE policies must pass

-- Drop the confusing restrictive-only policies
DROP POLICY IF EXISTS "Anonymous cannot view orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can view orders" ON public.orders;
DROP POLICY IF EXISTS "Deny public update on orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Deny direct order inserts" ON public.orders;

-- Create proper PERMISSIVE policies that explicitly define who CAN access
-- SELECT: Only admins can view orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- UPDATE: Only admins can update orders  
CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- INSERT: Deny all direct inserts (orders go through edge function with service role)
CREATE POLICY "No direct inserts allowed"
ON public.orders
FOR INSERT
TO public
WITH CHECK (false);

-- DELETE: Only admins can delete orders
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));