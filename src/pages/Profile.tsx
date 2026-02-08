import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  User, Settings, Heart, Clock, MessageSquare, Star, 
  CreditCard, Gift, HelpCircle, LogOut, ChevronRight, ChevronLeft,
  Briefcase, FileText, Share2, Copy, Check, Crown,
  Users, Plug, Wallet, AtSign
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { BecomeProviderForm } from '@/components/provider/BecomeProviderForm';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
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
  const referralCode = profile?.referral_code;
  const profileShareUrl = handle 
    ? `${window.location.origin}/@${handle}` 
    : `${window.location.origin}/profile`;
  const shareUrl = referralCode 
    ? `${window.location.origin}/auth?ref=${referralCode}` 
    : window.location.origin;
  const shareMessage = t('profile.shareMessage', { code: referralCode || '' });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('profile.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('profile.copyFailed'));
    }
  };

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage + ' ' + shareUrl)}`, '_blank');
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

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

        {/* Social Sharing with gradient border */}
        <div className="mt-6 rounded-xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
              <Share2 className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-foreground">{t('profile.shareProfile')}</h3>
          </div>
          
          {profile?.referral_code && (
            <p className="text-xs text-muted-foreground mb-2">
              {t('profile.yourReferralCode')}: <span className="font-mono font-semibold text-primary">{profile.referral_code}</span>
            </p>
          )}
          
          {handle && (
            <p className="text-xs text-muted-foreground mb-3">
              {t('profile.yourProfileLink', 'Your profile link')}: <span className="font-mono font-semibold text-primary">{profileShareUrl}</span>
            </p>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gradient-border"
              onClick={handleShareWhatsApp}
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gradient-border"
              onClick={handleShareFacebook}
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gradient-border"
              onClick={handleShareTwitter}
            >
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X
            </Button>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            className="w-full mt-2"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="w-4 h-4 mr-2 text-primary" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copied ? t('profile.copied') : t('profile.copyLink')}
          </Button>
        </div>
      </div>
      </AppLayout>
    </>
  );
}
