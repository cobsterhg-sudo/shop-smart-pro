-- Insert admin role for the existing user
INSERT INTO public.user_roles (user_id, role)
VALUES ('28f04eb7-0d59-4153-9a67-070b17975af2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;