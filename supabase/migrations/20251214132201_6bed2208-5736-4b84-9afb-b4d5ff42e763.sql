-- Explicitly deny public/anonymous SELECT access to orders
CREATE POLICY "Deny public select on orders"
ON public.orders
FOR SELECT
TO anon
USING (false);

-- Explicitly deny public/anonymous UPDATE access to orders  
CREATE POLICY "Deny public update on orders"
ON public.orders
FOR UPDATE
TO anon
USING (false);