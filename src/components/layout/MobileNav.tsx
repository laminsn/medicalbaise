import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, MessageSquare, User, Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function MobileNav() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  const initials = profile 
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() 
    : 'U';

  const NAV_ITEMS = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/browse', icon: Search, label: t('nav.browse') },
    { path: '/feed', icon: Clapperboard, label: t('nav.feed') },
    { path: '/post-job', icon: PlusCircle, label: t('nav.postJob') },
    { path: '/profile', icon: User, label: t('nav.profile'), isProfile: true },
  ];

  return (
    <nav className="mobile-nav z-50">
      <div className="flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          // Redirect to auth if not logged in for protected routes
          const href = !user && ['/post-job', '/messages', '/profile'].includes(item.path) 
            ? '/auth' 
            : item.path;

          return (
            <Link
              key={item.path}
              to={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.isProfile && user && profile?.avatar_url ? (
                <Avatar className={cn(
                  "w-6 h-6 transition-transform",
                  isActive && "scale-110 ring-2 ring-primary"
                )}>
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-transform",
                    isActive && "scale-110"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              )}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
