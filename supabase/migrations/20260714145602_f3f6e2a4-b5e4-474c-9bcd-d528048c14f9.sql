
-- tg_profiles_updated_at doesn't need SECURITY DEFINER
ALTER FUNCTION public.tg_profiles_updated_at() SECURITY INVOKER;

-- Both helper functions should only be callable by the trigger system, not by API roles
REVOKE EXECUTE ON FUNCTION public.tg_profiles_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
