import { useTranslation } from 'react-i18next';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CallStatus } from '@/hooks/useWebRTCCall';

interface InAppCallProps {
  isOpen: boolean;
  status: CallStatus;
  callerName: string;
  callerAvatar?: string | null;
  isIncoming: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  callType?: 'consultation' | 'follow-up' | 'emergency' | 'general';
  callerSpecialty?: string;
  onAnswer: () => void;
  onDecline: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

export function InAppCall({
  isOpen,
  status,
  callerName,
  callerAvatar,
  isIncoming,
  isMuted,
  isSpeakerOn,
  callDuration,
  callType = 'general',
  callerSpecialty,
  onAnswer,
  onDecline,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
}: InAppCallProps) {
  const { t } = useTranslation();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (status) {
      case 'calling':
        return t('call.calling', 'Calling...');
      case 'ringing':
        return isIncoming ? t('call.incomingCall', 'Incoming call') : t('call.ringing', 'Ringing...');
      case 'connecting':
        return t('call.connecting', 'Connecting...');
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return t('call.ended', 'Call ended');
      default:
        return '';
    }
  };

  if (!isOpen || status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-primary/90 to-primary/70 dark:from-primary/80 dark:to-background/95 flex flex-col items-center justify-between p-8">
      {/* Emergency Disclaimer */}
      {callType === 'emergency' && (
        <Alert variant="destructive" className="mb-4 max-w-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('call.emergencyDisclaimer', 'For life-threatening emergencies, please call 192 (SAMU) or go to the nearest emergency room')}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="text-center">
        {callType === 'emergency' && (
          <Badge variant="destructive" className="mb-2">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t('call.emergency', 'Emergency')}
          </Badge>
        )}
        <p className="text-primary-foreground/80 text-sm font-medium">
          {getStatusText()}
        </p>
      </div>

      {/* Caller Info */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "relative mb-6",
          (status === 'ringing' || status === 'calling') && "animate-pulse"
        )}>
          <Avatar className="h-32 w-32 border-4 border-primary-foreground/20">
            <AvatarImage src={callerAvatar || undefined} />
            <AvatarFallback className="text-4xl bg-primary-foreground/20 text-primary-foreground">
              {callerName?.[0]?.toUpperCase() || <User className="h-16 w-16" />}
            </AvatarFallback>
          </Avatar>
          {status === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-36 w-36 border-4 border-primary-foreground/30 rounded-full animate-ping" />
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-primary-foreground mb-2">
          {callerName}
        </h2>
        {callerSpecialty && (
          <p className="text-sm text-primary-foreground/70 mb-4">
            {callerSpecialty}
          </p>
        )}
        {status === 'connecting' && (
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('call.connecting', 'Connecting')}...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-sm">
        {status === 'connected' && (
          <div className="flex justify-center gap-8 mb-8">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full transition-colors",
                isMuted ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
              )}
              onClick={onToggleMute}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full transition-colors",
                isSpeakerOn ? "bg-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/50" : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
              )}
              onClick={onToggleSpeaker}
            >
              {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>
          </div>
        )}

        <div className="flex justify-center gap-6">
          {isIncoming && status === 'ringing' && (
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
              onClick={onAnswer}
            >
              <Phone className="h-7 w-7" />
            </Button>
          )}
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
            onClick={status === 'ringing' && isIncoming ? onDecline : onEndCall}
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
        </div>

        {/* Recording Disclaimer */}
        {status === 'connected' && (
          <p className="text-xs text-primary-foreground/60 text-center mt-4">
            {t('call.recordingDisclaimer', 'This call may be recorded for quality and training purposes')}
          </p>
        )}
      </div>
    </div>
  );
}
