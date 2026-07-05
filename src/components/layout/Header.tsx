import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, MapPin, LayoutDashboard, User, Briefcase, HelpCircle, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const initials = profile 
    ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() 
    : 'U';

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-primary to-black flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">MD</span>
          </div>
          <span className="truncate font-bold text-lg sm:text-xl text-foreground">MD<span className="text-primary">Baise</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/discover" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.discover', 'Discover')}
          </Link>
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
          <Link to="/feed" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <PlayCircle className="w-4 h-4" />
            {t('nav.feed')}
          </Link>
          <Link to="/post-job" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('nav.postJob', 'Post')}
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {/* Help/Learn Center */}
          <Link to="/help" className="hidden sm:inline-flex">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="w-5 h-5" />
            </Button>
          </Link>

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
            <div className="hidden md:flex items-center gap-2">
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

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground"
                aria-label={t('nav.menu', 'Menu')}
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>{t('nav.menu', 'Menu')}</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4">
                <Link
                  to="/discover"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  {t('nav.discover', 'Discover')}
                </Link>
                <Link
                  to="/browse"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  {t('nav.explore')}
                </Link>
                <Link
                  to="/map"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  {t('nav.map')}
                </Link>
                <Link
                  to="/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  {t('nav.jobs')}
                </Link>
                <Link
                  to="/feed"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  {t('nav.feed')}
                </Link>
                <Link
                  to="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  <HelpCircle className="w-5 h-5" />
                  {t('nav.help', 'Help')}
                </Link>

                <div className="mt-2 border-t border-border pt-4">
                  {user ? (
                    <div className="flex flex-col gap-3">
                      <Link to="/customer-dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start">
                          <User className="mr-2 h-4 w-4" />
                          {t('header.customerDashboard')}
                        </Button>
                      </Link>
                      <Link to="/provider-dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start">
                          <Briefcase className="mr-2 h-4 w-4" />
                          {t('header.providerDashboard')}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          {t('header.login')}
                        </Button>
                      </Link>
                      <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                          {t('auth.join')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
