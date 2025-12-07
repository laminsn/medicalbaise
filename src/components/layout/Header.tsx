import { Link } from 'react-router-dom';
import { Menu, MapPin, LayoutDashboard, User, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  const initials = profile 
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() 
    : 'U';

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-black flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">MD</span>
          </div>
          <span className="font-bold text-xl text-foreground">MD<span className="text-primary">Baise</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.explore')}
          </Link>
          <Link to="/map" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {t('nav.map')}
          </Link>
          <Link to="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.jobs')}
          </Link>
          {user && (
            <Link to="/post-job" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('nav.postJob')}
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Language Selector */}
          <LanguageSelector />

          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-foreground">
                    <LayoutDashboard className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/customer-dashboard" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t('header.customerDashboard')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/provider-dashboard" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      {t('header.providerDashboard')}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <NotificationBell />
              <Link to="/profile">
                <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-transparent hover:ring-primary transition-all">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  {t('header.login')}
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                  {t('auth.join')}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}