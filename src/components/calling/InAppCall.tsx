import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  User,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface InAppCallProps {
  isOpen: boolean;
  onClose: () => void;
  callerName: string;
  callerAvatar?: string;
  isIncoming?: boolean;
  onAnswer?: () => void;
  onDecline?: () => void;
}

export function InAppCall({
  isOpen,
  onClose,
  callerName,
  callerAvatar,
  isIncoming = false,
  onAnswer,
  onDecline,
}: InAppCallProps) {
  const { t } = useTranslation();
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended'>('ringing');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  useEffect(() => {
    if (!isOpen) {
      setCallStatus('ringing');
      setCallDuration(0);
      setIsMuted(false);
      setIsSpeakerOn(false);
    }
  }, [isOpen]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    setCallStatus('connecting');
    setTimeout(() => {
      setCallStatus('connected');
    }, 1500);
    onAnswer?.();
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 500);
    onDecline?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-primary/90 to-emerald-900/90 flex flex-col items-center justify-between p-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-primary-foreground/80 text-sm">
          {callStatus === 'ringing' && (isIncoming ? t('call.incomingCall') : t('call.calling'))}
          {callStatus === 'connecting' && t('call.connecting')}
          {callStatus === 'connected' && formatDuration(callDuration)}
          {callStatus === 'ended' && t('call.ended')}
        </p>
      </div>

      {/* Caller Info */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "relative mb-6",
          callStatus === 'ringing' && "animate-pulse"
        )}>
          <Avatar className="h-32 w-32 border-4 border-primary-foreground/20">
            <AvatarImage src={callerAvatar} />
            <AvatarFallback className="text-4xl bg-primary-foreground/20 text-primary-foreground">
              <User className="h-16 w-16" />
            </AvatarFallback>
          </Avatar>
          {callStatus === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-36 w-36 border-4 border-primary-foreground/30 rounded-full animate-ping" />
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-primary-foreground mb-2">
          {callerName}
        </h2>
        {callStatus === 'connecting' && (
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('call.connecting')}...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-sm">
        {callStatus === 'connected' && (
          <div className="flex justify-center gap-8 mb-8">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full",
                isMuted ? "bg-red-500/20 text-red-300" : "bg-primary-foreground/20 text-primary-foreground"
              )}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full",
                isSpeakerOn ? "bg-primary-foreground/40 text-primary-foreground" : "bg-primary-foreground/20 text-primary-foreground"
              )}
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            >
              {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>
          </div>
        )}

        <div className="flex justify-center gap-6">
          {isIncoming && callStatus === 'ringing' && (
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
              onClick={handleAnswer}
            >
              <Phone className="h-7 w-7" />
            </Button>
          )}
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </div>
  );
}
