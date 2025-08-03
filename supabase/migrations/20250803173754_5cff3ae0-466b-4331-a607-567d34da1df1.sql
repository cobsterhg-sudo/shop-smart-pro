-- Fix remaining function search path issues
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS assign_role_on_signup ON public.profiles;
CREATE TRIGGER assign_role_on_signup
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_default_role();