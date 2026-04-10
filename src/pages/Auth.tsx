import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, ShieldAlert, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { LanguageFluencySelector } from '@/components/LanguageFluencySelector';
import { LanguageSelector } from '@/components/LanguageSelector';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { FaceAuthVerify } from '@/components/auth/FaceAuthVerify';
import {
  validatePasswordStrength,
  isAccountLocked,
  recordFailedAttempt,
  clearLoginAttempts,
  getRemainingAttempts,
  formatLockoutTime,
} from '@/lib/security';

export default function Auth() {
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showFaceAuth, setShowFaceAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['portuguese']);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const signUpSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string()
      .min(12, t('security.passwordMinLength12'))
      .refine((val) => validatePasswordStrength(val).isValid, {
        message: t('security.passwordRequirements'),
      }),
    firstName: z.string().min(2, t('auth.firstNameTooShort')).optional(),
    lastName: z.string().min(2, t('auth.lastNameTooShort')).optional(),
  });

  const signInSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(1, t('auth.passwordRequired')),
  });

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: t('auth.errorSigningIn'),
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: t('auth.errorSigningIn'),
        description: err instanceof Error ? err.message : isPt ? 'Erro desconhecido' : isEs ? 'Error desconocido' : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFaceAuthSuccess = () => {
    toast({ title: t('auth.welcomeBack') + '!' });
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isSignUp) {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          selectedLanguages
        );

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: t('auth.emailAlreadyRegistered'),
              description: t('auth.tryLoginOrUseAnotherEmail'),
              variant: 'destructive',
            });
          } else {
            toast({
              title: t('auth.errorCreatingAccount'),
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: t('auth.accountCreatedSuccess'),
            description: t('auth.welcomeToBrasilBase'),
          });
          navigate('/');
        }
      } else {
        const result = signInSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        // Check account lockout before attempting sign-in
        const lockout = isAccountLocked(formData.email);
        if (lockout.locked) {
          toast({
            title: t('security.accountLocked'),
            description: t('security.accountLockedDescription', {
              time: formatLockoutTime(lockout.remainingMs),
            }),
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          recordFailedAttempt(formData.email);
          const remaining = getRemainingAttempts(formData.email);
          toast({
            title: t('auth.errorSigningIn'),
            description: remaining > 0
              ? t('security.attemptsRemaining', { count: remaining })
              : t('security.accountLocked'),
            variant: 'destructive',
          });
        } else {
          clearLoginAttempts(formData.email);
          toast({
            title: t('auth.welcomeBack') + '!',
          });
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Face auth login view
  if (showFaceAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-4 safe-top flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFaceAuth(false)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <LanguageSelector />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          <FaceAuthVerify onSuccess={handleFaceAuthSuccess} />
          <Button
            variant="link"
            className="mt-4 text-muted-foreground"
            onClick={() => setShowFaceAuth(false)}
          >
            {t('security.usePasswordInstead')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 safe-top flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <LanguageSelector />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-primary-foreground">B</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? t('auth.joinUs') : t('auth.welcomeBack')}
          </p>
        </div>

        {/* Face Auth Login Button (sign-in only) */}
        {!isSignUp && (
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 mb-3 font-medium border-primary/30 hover:border-primary"
            onClick={() => setShowFaceAuth(true)}
          >
            <Camera className="w-5 h-5 mr-2" />
            {t('security.signInWithFace')}
          </Button>
        )}

        {/* Google Sign In */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 mb-4 font-medium"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading ? t('common.loading') : t('auth.continueWithGoogle')}
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder={t('auth.firstName')}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="pl-10"
                    autoComplete="given-name"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-destructive">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                <Input
                  id="lastName"
                  placeholder={t('auth.lastName')}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <p className="text-xs text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>
          )}

          {isSignUp && (
            <div className="space-y-2">
              <LanguageFluencySelector
                selectedLanguages={selectedLanguages}
                onLanguagesChange={setSelectedLanguages}
                label={t('profile.languageFluency')}
                description={t('profile.languageFluencyDescription')}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={isPt ? 'seu@email.com' : isEs ? 'tu@email.com' : 'your@email.com'}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 pr-10"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
            {isSignUp && <PasswordStrengthIndicator password={formData.password} />}
          </div>

          {/* Lockout warning */}
          {!isSignUp && formData.email && isAccountLocked(formData.email).locked && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-xs text-destructive">
                {t('security.accountLockedDescription', {
                  time: formatLockoutTime(isAccountLocked(formData.email).remainingMs),
                })}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold"
            disabled={loading || (!isSignUp && formData.email ? isAccountLocked(formData.email).locked : false)}
          >
            {loading ? t('common.loading') : isSignUp ? t('auth.createAccount') : t('auth.signIn')}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6">
          <p className="text-muted-foreground">
            {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
            <Button
              variant="link"
              className="text-primary p-1"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
            >
              {isSignUp ? t('auth.signIn') : t('auth.createAccount')}
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
