import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          navigate('/auth?error=' + encodeURIComponent(error.message));
          return;
        }

        if (session?.user) {
          // Ensure profile exists for OAuth users
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!profile) {
            // Profile missing — create one from OAuth metadata
            const meta = session.user.user_metadata || {};
            const fullName = meta.full_name || meta.name || '';
            const firstName = meta.first_name || fullName.split(' ')[0] || '';
            const lastName = meta.last_name || fullName.split(' ').slice(1).join(' ') || '';

            await supabase.from('profiles').insert({
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
          }

          navigate('/');
        } else {
          // No session, redirect to auth page
          navigate('/auth');
        }
      } catch {
        navigate('/auth');
      }
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
