-- Create the trigger to auto-create profiles on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert missing profiles for existing users
INSERT INTO public.profiles (user_id, email, first_name, last_name, referral_code)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data ->> 'first_name',
  u.raw_user_meta_data ->> 'last_name',
  UPPER(SUBSTRING(COALESCE(u.raw_user_meta_data ->> 'first_name', 'USER'), 1, 5) || '-' || SUBSTRING(u.id::text, 1, 5))
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);