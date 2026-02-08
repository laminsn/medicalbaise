import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  User, Settings, Heart, Clock, MessageSquare, Star, 
  CreditCard, Gift, HelpCircle, LogOut, ChevronRight, ChevronLeft,
  Briefcase, FileText, Crown,
  Users, Plug, Wallet, AtSign, Shield
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { BecomeProviderForm } from '@/components/provider/BecomeProviderForm';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { ProfileShareSection } from '@/components/profile/ProfileShareSection';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [isProvider, setIsProvider] = useState(false);
  const [providerTier, setProviderTier] = useState<string | null>(null);

  useEffect(() => {
    const checkProvider = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('providers')
        .select('id, subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();
      setIsProvider(!!data);
      setProviderTier(data?.subscription_tier || null);
    };
    checkProvider();
  }, [user]);

  const isEnterprise = providerTier === 'enterprise';

  const handle = (profile as any)?.handle;

  // Build menu items dynamically based on tier
  const accountItems = [
    { icon: User, label: t('profile.editProfile'), path: '/profile/edit' },
    { icon: Crown, label: t('profile.subscription'), path: '/subscription' },
    { icon: Settings, label: t('profile.settings'), path: '/settings' },
    { icon: CreditCard, label: t('profile.payments'), path: '/payments' },
  ];

  // Add services and payouts for providers
  if (isProvider) {
    accountItems.splice(2, 0, { icon: Briefcase, label: t('services.title', 'My Services'), path: '/services' });
    accountItems.push({ icon: Wallet, label: t('payouts.title', 'Payouts'), path: '/payouts' });
  }

  // Add enterprise-only items
  if (isEnterprise) {
    accountItems.push(
      { icon: Users, label: t('profile.team'), path: '/team', badge: 'Enterprise' } as any,
      { icon: Plug, label: t('profile.integrations'), path: '/integrations' }
    );
  }

  const MENU_ITEMS = [
    {
      section: t('profile.account'),
      items: accountItems,
    },
    {
      section: t('profile.activity'),
      items: [
        { icon: Clock, label: t('jobs.myJobs'), path: '/my-jobs' },
        { icon: FileText, label: t('quote.myQuotes'), path: '/my-quotes' },
        { icon: Heart, label: t('profile.favorites'), path: '/favorites' },
        { icon: MessageSquare, label: t('messages.title'), path: '/messages' },
        { icon: Star, label: t('profile.reviews'), path: '/reviews' },
      ],
    },
    {
      section: t('profile.other'),
      items: [
        { icon: Gift, label: t('profile.referFriends'), path: '/referral', badge: t('profile.earnReward') },
        { icon: HelpCircle, label: t('profile.help'), path: '/help' },
        ...(isAdmin ? [{ icon: Shield, label: t('admin.adminDashboard'), path: '/admin', badge: 'Admin' }] : []),
      ],
    },
  ];

  // Not logged in state
  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('profile.loginToViewProfile')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('profile.manageYourInfo')}
          </p>
          <Button onClick={() => navigate('/auth')} className="w-full max-w-xs">
            {t('auth.signIn')}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/auth')} 
            className="mt-2"
          >
            {t('auth.createAccount')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = profile 
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() 
    : 'U';

  return (
    <>
      <Helmet>
        <title>{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : t('profile.title')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
      <div className="px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back')}
        </Button>

        {/* Profile header with gradient background */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-4 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {handle && (
                <div className="flex items-center gap-1 mt-0.5">
                  <AtSign className="w-3 h-3 text-primary" />
                  <span className="text-sm font-medium text-primary">{handle}</span>
                </div>
              )}
              {profile?.credits_balance > 0 && (
                <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary">
                  R${profile.credits_balance} {t('profile.creditsBalance')}
                </Badge>
              )}
            </div>
          </div>

          {/* Bio */}
          {(profile as any)?.bio && (
            <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50">{(profile as any).bio}</p>
          )}
        </div>

        {/* Become provider CTA */}
        {profile?.user_type === 'customer' && (
          <button
            onClick={() => setIsProviderModalOpen(true)}
            className="w-full rounded-xl gradient-border overflow-hidden mb-6"
          >
            <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground text-left hover:opacity-90 transition-opacity">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{t('profile.becomeProvider')}</h3>
                  <p className="text-sm opacity-90">{t('profile.offerServices')}</p>
                </div>
                <ChevronRight className="w-5 h-5 opacity-70" />
              </div>
            </div>
          </button>
        )}

        <BecomeProviderForm 
          open={isProviderModalOpen} 
          onOpenChange={setIsProviderModalOpen}
        />

        {/* Stats with gradient borders */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            {t('profile.stats') || 'Stats'}
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">{t('profile.jobs')}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">{t('profile.reviews')}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">{t('profile.referrals')}</p>
            </div>
          </div>
        </div>

        {/* Menu sections with gradient borders */}
        {MENU_ITEMS.map((section) => (
          <div key={section.section} className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              {section.section}
            </h2>
            <div className="rounded-xl gradient-border overflow-hidden">
              <div className="bg-card divide-y divide-border">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="flex items-center gap-3 w-full p-4 hover:bg-primary/5 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="flex-1 text-foreground">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Sign out */}
        <Button
          variant="ghost"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('profile.signOut')}
        </Button>

        {/* Social Sharing */}
        <ProfileShareSection handle={handle} referralCode={profile?.referral_code} />
      </div>
      </AppLayout>
    </>
  );
}
