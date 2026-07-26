import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { sanitizeRedirectUrl } from '@/lib/security';

const db = supabase;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const url = new URL(window.location.href);
      const providerError = url.searchParams.get('error');

      // The shared client performs the single PKCE exchange via detectSessionInUrl.
      if (providerError) {
        navigate('/auth?error=oauth_failed', { replace: true });
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        navigate('/auth?error=oauth_failed', { replace: true });
        return;
      }

      if (session?.user) {
        const appKey = getBaiseAppKey();
        const inboundReferralCode = localStorage.getItem('baise_referral_code');
        const inboundReferralLanding = localStorage.getItem('baise_referral_landing');
        const inboundPartnerCode = localStorage.getItem('baise_partner_code');
        const inboundPartnerLanding = localStorage.getItem('baise_partner_landing');

        // Ensure profile exists for OAuth users
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profileError) {
          navigate('/auth?error=oauth_failed', { replace: true });
          return;
        }

        if (!profile) {
          // Profile missing — create one from OAuth metadata
          const meta = session.user.user_metadata || {};
          const fullName = meta.full_name || meta.name || '';
          const firstName = meta.first_name || fullName.split(' ')[0] || '';
          const lastName = meta.last_name || fullName.split(' ').slice(1).join(' ') || '';

          const { error: profileInsertError } = await supabase.from('profiles').insert({
            user_id: session.user.id,
            email: session.user.email,
            first_name: firstName || null,
            last_name: lastName || null,
            avatar_url: meta.avatar_url || meta.picture || null,
            user_type: 'customer',
            handle: `user_${session.user.id.slice(0, 8)}`,
            referral_code: `REF${session.user.id.slice(0, 6).toUpperCase()}`,
            credits_balance: 0,
            status: 'active',
            languages: ['portuguese'],
          });
          if (profileInsertError && profileInsertError.code !== '23505') {
            navigate('/auth?error=oauth_failed', { replace: true });
            return;
          }
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

        let returnTo = '/';
        try {
          returnTo = sanitizeRedirectUrl(sessionStorage.getItem('baise_auth_return_to') || '/');
          sessionStorage.removeItem('baise_auth_return_to');
        } catch {
          // Storage can be unavailable in strict privacy modes.
        }
        navigate(returnTo, { replace: true });
        return;
      }

      navigate('/auth?error=oauth_failed', { replace: true });
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">{t('auth.completingSignIn', 'Completing sign-in...')}</p>
      </div>
    </div>
  );
}
