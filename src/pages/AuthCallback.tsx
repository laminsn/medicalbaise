import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import {
  persistSignupRole,
  resolvePostAuthPath,
  resolveSignupIntent,
} from '@/lib/postAuthDestination';

const db = supabase as any;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const providerError = url.searchParams.get('error');
      const providerErrorDescription =
        url.searchParams.get('error_description') || url.searchParams.get('error_code');

      // Provider-side failure (user denied, misconfigured client, etc.) — surface it.
      if (providerError) {
        const message = providerErrorDescription || providerError;
        navigate(`/auth?error=${encodeURIComponent(message)}`, { replace: true });
        return;
      }

      // PKCE flow: convert ?code=... into a session before anything else.
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );
        if (exchangeError) {
          navigate(
            `/auth?error=${encodeURIComponent(exchangeError.message)}`,
            { replace: true },
          );
          return;
        }
      }

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        navigate(`/auth?error=${encodeURIComponent(error.message)}`, { replace: true });
        return;
      }

      if (session?.user) {
        const callbackSearch = window.location.search;
        persistSignupRole(url.searchParams.get('role'));
        const lng = url.searchParams.get('lng') || url.searchParams.get('locale') || url.searchParams.get('lang');
        if (lng) void i18n.changeLanguage(lng);
        const signupIntent = resolveSignupIntent(callbackSearch);
        if (signupIntent === 'provider') persistSignupRole('provider');

        const meta = session.user.user_metadata || {};
        if (!meta.signup_intent) {
          await supabase.auth.updateUser({
            data: { signup_intent: signupIntent },
          }).catch(() => null);
        }

        const appKey = getBaiseAppKey();
        const inboundReferralCode = localStorage.getItem('baise_referral_code');
        const inboundReferralLanding = localStorage.getItem('baise_referral_landing');
        const inboundPartnerCode = localStorage.getItem('baise_partner_code');
        const inboundPartnerLanding = localStorage.getItem('baise_partner_landing');

        // Ensure profile exists for OAuth users
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!profile) {
          // Profile missing — create one from OAuth metadata
          const fullName = meta.full_name || meta.name || '';
          const firstName = meta.first_name || fullName.split(' ')[0] || '';
          const lastName = meta.last_name || fullName.split(' ').slice(1).join(' ') || '';

          await supabase.from('profiles').insert({
            user_id: session.user.id,
            email: session.user.email,
            first_name: firstName || null,
            last_name: lastName || null,
            avatar_url: meta.avatar_url || meta.picture || null,
            user_type: signupIntent === 'provider' ? 'provider' : 'customer',
            handle: `user_${session.user.id.slice(0, 8)}`,
            referral_code: `REF${session.user.id.slice(0, 6).toUpperCase()}`,
            credits_balance: 0,
            status: 'active',
            languages: ['portuguese'],
          });
        }

        await db.rpc('ensure_profile_referral_identity', {
          target_user_id: session.user.id,
          target_app_key: appKey,
        }).catch(() => null);

        await db.rpc('activate_partner_applications_for_user', {
          target_user_id: session.user.id,
          target_email: session.user.email || null,
        }).catch(() => null);

        if (inboundReferralCode) {
          await db.rpc('track_referral_event', {
            target_code: inboundReferralCode,
            target_event_type: 'signup',
            target_app_key: appKey,
            event_metadata: {
              source: 'auth_callback',
              landing: inboundReferralLanding || null,
            },
          }).catch(() => null);
        }

        if (inboundPartnerCode) {
          await db.rpc('track_partner_campaign_click', {
            target_tracking_code: inboundPartnerCode,
            target_event_type: 'lead',
            event_metadata: {
              source: 'auth_callback',
              landing: inboundPartnerLanding || null,
              app_key: appKey,
            },
          }).catch(() => null);
        }

        if (inboundReferralCode || inboundPartnerCode) {
          localStorage.removeItem('baise_referral_code');
          localStorage.removeItem('baise_referral_landing');
          localStorage.removeItem('baise_partner_code');
          localStorage.removeItem('baise_partner_landing');
        }

        navigate(resolvePostAuthPath(callbackSearch), { replace: true });
        return;
      }

      // No session and no code — the user landed here without completing OAuth.
      navigate(
        `/auth?error=${encodeURIComponent('No authentication code received. Please try signing in again.')}`,
        { replace: true },
      );
    };

    handleAuthCallback();
  }, [i18n, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">{t('auth.completingSignIn', 'Completing sign-in...')}</p>
      </div>
    </div>
  );
}
