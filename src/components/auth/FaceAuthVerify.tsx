import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2, CheckCircle, XCircle, RefreshCw, ScanFace } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFaceAuth } from '@/hooks/useFaceAuth';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface FaceAuthVerifyProps {
  onSuccess: () => void;
}

export function FaceAuthVerify({ onSuccess }: FaceAuthVerifyProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { signIn } = useAuth();
  const {
    status,
    error,
    loadModels,
    startCamera,
    stopCamera,
    verifyFace,
  } = useFaceAuth();
  const [step, setStep] = useState<'init' | 'camera' | 'verifying' | 'otp-sent' | 'done' | 'error'>('init');
  const [matchError, setMatchError] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleStart = async () => {
    setMatchError(null);
    const modelsOk = await loadModels();
    if (!modelsOk) {
      setStep('error');
      return;
    }
    if (videoRef.current) {
      const cameraOk = await startCamera(videoRef.current);
      if (cameraOk) {
        setStep('camera');
      } else {
        setStep('error');
      }
    }
  };

  const handleVerify = async () => {
    setStep('verifying');
    setMatchError(null);

    const result = await verifyFace();

    if (result.matched && result.email) {
      // Face matched — send OTP for second-factor verification.
      // The user MUST confirm via the email link before being authenticated.
      // This prevents client-side face-matching bypass attacks.
      const { error: signInError } = await supabaseSignInWithOtp(result.email);

      if (signInError) {
        setMatchError(t('security.faceAuthSignInFailed'));
        setStep('error');
        return;
      }

      // Do NOT call onSuccess() here — the user must click the OTP link first.
      // Supabase auth state listener in useAuth will detect the session once
      // the OTP link is confirmed, triggering navigation automatically.
      setOtpEmail(result.email);
      setStep('otp-sent');
      stopCamera();
    } else {
      setMatchError(error || t('security.faceNotRecognized'));
      setStep('error');
    }
  };

  const handleRetry = () => {
    setMatchError(null);
    setStep('camera');
  };

  return (
    <div className="space-y-4 w-full max-w-sm mx-auto">
      <div className="text-center">
        <ScanFace className="w-10 h-10 mx-auto mb-2 text-primary" />
        <h3 className="text-lg font-semibold">{t('security.faceLogin')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('security.faceLoginDescription')}
        </p>
      </div>

      {/* Video preview */}
      <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        {step === 'init' && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <ScanFace className="w-20 h-20 text-muted-foreground/20" />
          </div>
        )}
        {(status === 'loading-models' || step === 'verifying') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-center text-white">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">
                {status === 'loading-models' ? t('security.loadingModels') : t('security.verifyingFace')}
              </p>
            </div>
          </div>
        )}
        {(step === 'done' || step === 'otp-sent') && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
            <div className="text-center px-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-semibold text-green-700 dark:text-green-300">
                {t('security.faceVerified')}
              </p>
              {step === 'otp-sent' && otpEmail && (
                <p className="text-sm text-muted-foreground mt-2">
                  {t('security.otpSentCheckEmail', { email: otpEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') })}
                </p>
              )}
            </div>
          </div>
        )}
        {/* Scanning overlay */}
        {step === 'camera' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-60 border-2 border-dashed border-primary/60 rounded-[50%] animate-pulse" />
          </div>
        )}
      </div>

      {(matchError || error) && step === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{matchError || error}</p>
        </div>
      )}

      <div className="flex gap-2">
        {step === 'init' && (
          <Button onClick={handleStart} className="flex-1 h-12" size="lg">
            <Camera className="w-5 h-5 mr-2" />
            {t('security.startFaceScan')}
          </Button>
        )}
        {step === 'camera' && (
          <Button onClick={handleVerify} className="flex-1 h-12" size="lg">
            <ScanFace className="w-5 h-5 mr-2" />
            {t('security.verifyMyFace')}
          </Button>
        )}
        {step === 'error' && (
          <Button onClick={handleRetry} variant="outline" className="flex-1 h-12" size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.tryAgain')}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Helper to trigger Supabase OTP sign-in for a verified face match */
async function supabaseSignInWithOtp(email: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Sign-in failed') };
  }
}
