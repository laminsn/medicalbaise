import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { resumePathAfterAuth } from '@/lib/clientInvite';

const db = supabase as any;

// Nobody should ever be stranded on this spinner. If sign-in has not settled by
// now, send them back to /auth with something actionable instead.
const AUTH_TIMEOUT_MS = 12_000;

/**
 * OAuth / magic-link landing page.
 *
 * Only two things gate the redirect: a valid session, and a profile row. The
 * referral and partner attribution calls used to be awaited here too, which put
 * four extra network round-trips between a successful login and the app. They
 * now fire after navigating — attribution is not authentication, and it must
 * never be the reason someone waits.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let settled = false;

    const go = (path: string) => {
      if (settled) return;
      settled = true;
      navigate(path, { replace: true });
    };

    const timer = setTimeout(() => go('/auth?error=timeout'), AUTH_TIMEOUT_MS);

    // Fire-and-forget: runs after the redirect and can fail without consequence.
    const recordAttribution = (userId: string, email: string | null) => {
      const appKey = getBaiseAppKey();
      const referralCode = localStorage.getItem('baise_referral_code');
      const referralLanding = localStorage.getItem('baise_referral_landing');
      const partnerCode = localStorage.getItem('baise_partner_code');
      const partnerLanding = localStorage.getItem('baise_partner_landing');

      void db.rpc('ensure_profile_referral_identity', {
        target_user_id: userId, target_app_key: appKey,
      }).then(null, () => null);

      void db.rpc('activate_partner_applications_for_user', {
        target_user_id: userId, target_email: email,
      }).then(null, () => null);

      if (referralCode) {
        void db.rpc('track_referral_event', {
          target_code: referralCode,
          target_event_type: 'signup',
          target_app_key: appKey,
          event_metadata: { source: 'auth_callback', landing: referralLanding || null },
        }).then(null, () => null);
      }

      if (partnerCode) {
        void db.rpc('track_partner_campaign_click', {
          target_tracking_code: partnerCode,
          target_event_type: 'lead',
          event_metadata: { source: 'auth_callback', landing: partnerLanding || null, app_key: appKey },
        }).then(null, () => null);
      }

      if (referralCode || partnerCode) {
        localStorage.removeItem('baise_referral_code');
        localStorage.removeItem('baise_referral_landing');
        localStorage.removeItem('baise_partner_code');
        localStorage.removeItem('baise_partner_landing');
      }
    };

    const handleAuthCallback = async () => {
      const url = new URL(window.location.href);
      if (url.searchParams.get('error')) {
        go('/auth?error=oauth_failed');
        return;
      }

      // The shared client owns the single PKCE exchange via detectSessionInUrl.
      // Never exchange the callback URL a second time here.
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        // PKCE keeps the code verifier in the localStorage of the browser that
        // STARTED the login. Opening the link somewhere else — tapping it inside
        // WhatsApp, or in a different browser — leaves no verifier to exchange.
        // That deserves its own message, not a generic "try again".
        const message = (error.message || '').toLowerCase();
        const wrongBrowser = message.includes('verifier') || message.includes('pkce');
        go(`/auth?error=${wrongBrowser ? 'wrong_browser' : 'oauth_failed'}`);
        return;
      }

      if (!session?.user) {
        go('/auth?error=wrong_browser');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profileError) {
        go('/auth?error=oauth_failed');
        return;
      }

      if (!profile) {
        // handle_new_user() covers normal signup; this is the OAuth fallback.
        const meta = session.user.user_metadata || {};
        const fullName = meta.full_name || meta.name || '';
        const firstName = meta.first_name || fullName.split(' ')[0] || '';
        const lastName = meta.last_name || fullName.split(' ').slice(1).join(' ') || '';

        const { error: insertError } = await supabase.from('profiles').insert({
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
        // 23505 = the row already exists, which is success for our purposes.
        if (insertError && insertError.code !== '23505') {
          go('/auth?error=oauth_failed');
          return;
        }
      }

      clearTimeout(timer);
      const next = url.searchParams.get('next');
      const token = url.searchParams.get('token');
      go(resumePathAfterAuth(next, token));
      recordAttribution(session.user.id, session.user.email || null);
    };

    handleAuthCallback().catch(() => go('/auth?error=oauth_failed'));

    return () => {
      settled = true;
      clearTimeout(timer);
    };
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
