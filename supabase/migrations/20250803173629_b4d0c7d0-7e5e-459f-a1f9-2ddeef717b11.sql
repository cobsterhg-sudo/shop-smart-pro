-- Fix database function security vulnerability
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'full_name'
  );
  RETURN new;
END;
$function$;

-- Create role-based access control system
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier');

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Update products table policies for role-based access
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can create their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

-- New role-based policies for products
CREATE POLICY "Users can view business products"
ON public.products
FOR SELECT
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'cashier')
);

CREATE POLICY "Admins and managers can create products"
ON public.products
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  ))
);

CREATE POLICY "Admins and managers can update products"
ON public.products
FOR UPDATE
USING (
  auth.uid() = user_id AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  )
);

CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (
  auth.uid() = user_id AND public.has_role(auth.uid(), 'admin')
);

-- Update transactions policies for role-based access
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;

CREATE POLICY "Users can view business transactions"
ON public.transactions
FOR SELECT
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'cashier')
);

CREATE POLICY "All roles can create transactions"
ON public.transactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager') OR
    public.has_role(auth.uid(), 'cashier')
  )
);

-- Add role column to profiles for easier role management
ALTER TABLE public.profiles ADD COLUMN role app_role DEFAULT 'admin';

-- Update profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view business profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'manager')
);

-- Trigger to assign default admin role to first user and admin role to subsequent users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count existing users
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- First user gets admin, others get admin by default (can be changed later)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
    
    -- Update the role in profiles table
    UPDATE public.profiles SET role = 'admin' WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- Create trigger for role assignment
DROP TRIGGER IF EXISTS assign_role_on_signup ON public.profiles;
CREATE TRIGGER assign_role_on_signup
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_default_role();