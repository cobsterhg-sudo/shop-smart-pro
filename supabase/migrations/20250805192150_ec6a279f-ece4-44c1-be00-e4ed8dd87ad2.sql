-- First, let's fix the role assignment function to only give admin to the first user
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- First user gets admin, others get cashier by default
    IF user_count <= 1 THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin');
        
        -- Update the role in profiles table
        UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
    ELSE
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'cashier');
        
        -- Update the role in profiles table  
        UPDATE public.profiles SET role = 'cashier' WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Update existing non-admin users to have cashier role instead of admin
-- Get the first user (earliest created) and keep them as admin
WITH first_user AS (
    SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1
)
UPDATE user_roles 
SET role = 'cashier'
WHERE user_id NOT IN (SELECT id FROM first_user) AND role = 'admin';

-- Also update the profiles table
WITH first_user AS (
    SELECT id FROM profiles ORDER BY created_at ASC LIMIT 1
)
UPDATE profiles 
SET role = 'cashier'
WHERE id NOT IN (SELECT id FROM first_user) AND role = 'admin';

-- Now let's update the RLS policies to be more restrictive
-- Users should only see their own data unless they are explicitly an admin/manager

-- Drop existing policies for products
DROP POLICY IF EXISTS "Users can view business products" ON public.products;
DROP POLICY IF EXISTS "Admins and managers can create products" ON public.products;
DROP POLICY IF EXISTS "Admins and managers can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Create new, more restrictive policies
CREATE POLICY "Users can view their own products or admins can view all"
ON public.products
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can create their own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products or admins can update all"
ON public.products
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete any products, users can delete their own"
ON public.products
FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
);

-- Update transaction policies to be more restrictive too
DROP POLICY IF EXISTS "Users can view business transactions" ON public.transactions;
DROP POLICY IF EXISTS "All roles can create transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions or admins can view all"
ON public.transactions
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can create their own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);