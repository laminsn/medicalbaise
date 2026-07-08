-- Mark a user profile as provider after a provider profile is created.
-- Client-side profile updates intentionally cannot change user_type, so this
-- guarded server-side path handles the one allowed transition.

CREATE OR REPLACE FUNCTION public.protect_credits_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allow_profile_role_change boolean :=
    current_setting('app.allow_profile_role_change', true) = 'true';
BEGIN
  IF OLD.credits_balance IS DISTINCT FROM NEW.credits_balance THEN
    IF auth.uid() IS NOT NULL THEN
      NEW.credits_balance := OLD.credits_balance;
    END IF;
  END IF;

  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    IF NOT allow_profile_role_change
      AND auth.uid() IS NOT NULL
      AND auth.uid() = NEW.user_id
    THEN
      NEW.user_type := OLD.user_type;
    END IF;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF auth.uid() IS NOT NULL AND auth.uid() = NEW.user_id THEN
      NEW.status := OLD.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_credits_balance_trigger ON public.profiles;
CREATE TRIGGER protect_credits_balance_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_credits_balance();

CREATE OR REPLACE FUNCTION public.promote_current_user_to_provider()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.providers
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Provider profile not found';
  END IF;

  PERFORM set_config('app.allow_profile_role_change', 'true', true);

  UPDATE public.profiles
  SET user_type = 'provider'::public.user_type
  WHERE user_id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.promote_current_user_to_provider() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_current_user_to_provider() TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_profile_provider_after_provider_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.allow_profile_role_change', 'true', true);

  UPDATE public.profiles
  SET user_type = 'provider'::public.user_type
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_profile_provider_after_provider_insert ON public.providers;
CREATE TRIGGER mark_profile_provider_after_provider_insert
  AFTER INSERT ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_profile_provider_after_provider_insert();
