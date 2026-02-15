import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFaceAuth } from '@/hooks/useFaceAuth';

interface FaceAuthEnrollProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FaceAuthEnroll({ onSuccess, onCancel }: FaceAuthEnrollProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    status,
    error,
    loadModels,
    startCamera,
    stopCamera,
    enrollFace,
  } = useFaceAuth();
  const [step, setStep] = useState<'init' | 'camera' | 'capturing' | 'done' | 'error'>('init');

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleStart = async () => {
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

  const handleCapture = async () => {
    setStep('capturing');
    const success = await enrollFace();
    if (success) {
      setStep('done');
      stopCamera();
      onSuccess?.();
    } else {
      setStep('error');
    }
  };

  const handleRetry = () => {
    setStep('init');
  };

  return (
    <div className="space-y-4 w-full max-w-sm mx-auto">
      <div className="text-center">
        <Camera className="w-8 h-8 mx-auto mb-2 text-primary" />
        <h3 className="text-lg font-semibold">{t('security.enrollFace')}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('security.enrollFaceDescription')}
        </p>
      </div>

      {/* Video preview */}
      <div className="relative aspect-[4/3] bg-muted rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
          style={{ transform: 'scaleX(-1)' }}
        />
        {step === 'init' && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Camera className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}
        {(status === 'loading-models' || status === 'detecting' || step === 'capturing') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="text-center text-white">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">
                {status === 'loading-models' ? t('security.loadingModels') : t('security.capturingFace')}
              </p>
            </div>
          </div>
        )}
        {step === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                {t('security.faceEnrolled')}
              </p>
            </div>
          </div>
        )}
        {/* Face guide overlay */}
        {step === 'camera' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-60 border-2 border-dashed border-primary/60 rounded-[50%]" />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        {step === 'init' && (
          <>
            <Button onClick={handleStart} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              {t('security.startCamera')}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
            )}
          </>
        )}
        {step === 'camera' && (
          <>
            <Button onClick={handleCapture} className="flex-1">
              {t('security.captureFace')}
            </Button>
            <Button variant="outline" onClick={() => { stopCamera(); onCancel?.(); }}>
              {t('common.cancel')}
            </Button>
          </>
        )}
        {step === 'error' && (
          <>
            <Button onClick={handleRetry} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('common.tryAgain')}
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
            )}
          </>
        )}
        {step === 'done' && onCancel && (
          <Button onClick={onCancel} className="flex-1">
            {t('common.done')}
          </Button>
        )}
      </div>
    </div>
  );
}
