import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video, Radio, Square, Eye, Camera, CameraOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { LiveStreamReview } from './LiveStreamReview';
import { useCameraRecorder } from '@/hooks/useCameraRecorder';
import { supabase } from '@/integrations/supabase/client';

interface GoLiveButtonProps {
  providerId: string | null;
}

export function GoLiveButton({ providerId }: GoLiveButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showBookNow, setShowBookNow] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const {
    isRecording,
    isPreviewing,
    duration,
    error: cameraError,
    recordedBlob,
    recordedUrl,
    startPreview,
    stopPreview,
    startRecording,
    stopRecording,
    cleanup
  } = useCameraRecorder();

  const initializeCamera = useCallback(async () => {
    if (videoRef.current) {
      try {
        await startPreview(videoRef.current);
        setCameraReady(true);
      } catch (err) {
        console.error('Camera init error:', err);
        toast.error(t('socialFeed.cameraError', 'Failed to access camera. Please check permissions.'));
      }
    }
  }, [startPreview, t]);

  const handleOpenDialog = async () => {
    setShowDialog(true);
    // Wait for dialog to render, then initialize camera
    setTimeout(() => {
      initializeCamera();
    }, 100);
  };

  const handleCloseDialog = () => {
    if (isRecording) {
      stopRecording();
    }
    stopPreview();
    setCameraReady(false);
    setShowDialog(false);
  };

  const handleStartRecording = async () => {
    if (!title.trim()) {
      toast.error(t('socialFeed.liveTitleRequired', 'Please enter a title for your video'));
      return;
    }

    try {
      await startRecording();
      toast.success(t('socialFeed.liveStarted', 'Recording started!'));
    } catch (err) {
      console.error('Recording error:', err);
      toast.error(t('socialFeed.recordingError', 'Failed to start recording'));
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    stopPreview();
    setCameraReady(false);
    toast.success(t('socialFeed.liveEnded', 'Recording ended'));
    setShowDialog(false);
    
    // Show review dialog after a small delay
    setTimeout(() => {
      setShowReviewDialog(true);
    }, 200);
  };

  const handlePostRecording = async (data: {
    title: string;
    description: string;
    showBookNow: boolean;
    trimStart: number;
    trimEnd: number;
  }) => {
    if (!providerId || !recordedBlob) {
      toast.error(t('socialFeed.noRecording', 'No recording available to post'));
      return;
    }

    try {
      // Upload video to storage
      const fileExt = 'webm';
      const fileName = `${providerId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('testimonials')
        .upload(fileName, recordedBlob, {
          contentType: 'video/webm',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('testimonials')
        .getPublicUrl(fileName);

      // Create social post
      const { error: postError } = await supabase
        .from('social_posts')
        .insert({
          provider_id: providerId,
          content: data.description || data.title,
          media_url: publicUrl,
          media_type: 'video',
          show_book_now: data.showBookNow,
        });

      if (postError) throw postError;

      toast.success(t('socialFeed.recordingPosted', 'Recording posted to your feed!'));
      resetState();
      // Navigate to feed to see the post
      navigate('/feed');
    } catch (error) {
      console.error('Error posting recording:', error);
      toast.error(t('socialFeed.postFailed', 'Failed to post recording'));
      throw error;
    }
  };

  const handleDiscardRecording = () => {
    toast.info(t('socialFeed.recordingDiscarded', 'Recording discarded'));
    resetState();
  };

  const resetState = () => {
    cleanup();
    setCameraReady(false);
    setTitle('');
    setDescription('');
    setShowBookNow(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!providerId) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleOpenDialog}
        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
      >
        <Radio className="h-5 w-5" />
      </Button>

      <Dialog open={showDialog} onOpenChange={(open) => {
        if (!open) {
          handleCloseDialog();
        }
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-red-500" />
              {isRecording 
                ? t('socialFeed.liveNow', 'Recording')
                : t('socialFeed.goLive', 'Go Live')
              }
            </DialogTitle>
            <DialogDescription>
              {isRecording
                ? t('socialFeed.liveInProgress', 'Recording in progress')
                : t('socialFeed.goLiveDescription', 'Record a video to share with your audience')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Video Preview */}
            <div className="relative aspect-[9/16] max-h-[300px] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              
              {/* Loading State */}
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
                    <p className="text-sm text-muted-foreground">
                      {t('socialFeed.initializingCamera', 'Starting camera...')}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Camera Error State */}
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center p-4">
                    <CameraOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {t('socialFeed.cameraAccessDenied', 'Camera access denied')}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={initializeCamera}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {t('socialFeed.retryCamera', 'Retry')}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Recording Indicator */}
              {isRecording && (
                <>
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      REC
                    </div>
                    <div className="bg-black/60 text-white px-2 py-1 rounded text-xs">
                      {formatDuration(duration)}
                    </div>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded text-xs">
                    <Eye className="h-3 w-3" />
                    <span>0</span>
                  </div>
                </>
              )}
              
              {/* Preview Indicator */}
              {cameraReady && !isRecording && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white px-2 py-1 rounded text-xs">
                  <Camera className="h-3 w-3" />
                  {t('socialFeed.preview', 'Preview')}
                </div>
              )}
            </div>

            {isRecording ? (
              <>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium">{title}</p>
                  {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                  )}
                </div>

                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                  className="w-full"
                >
                  <Square className="h-4 w-4 mr-2" />
                  {t('socialFeed.endLive', 'Stop Recording')}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="live-title">{t('socialFeed.liveTitle', 'Video Title')}</Label>
                  <Input
                    id="live-title"
                    placeholder={t('socialFeed.liveTitlePlaceholder', 'What is this video about?')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="live-description">
                    {t('socialFeed.liveDescription', 'Description')} ({t('common.optional', 'Optional')})
                  </Label>
                  <Textarea
                    id="live-description"
                    placeholder={t('socialFeed.liveDescriptionPlaceholder', 'Tell viewers what to expect...')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Book Now Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <Label htmlFor="live-show-book-now" className="font-medium text-sm">
                      {t('socialFeed.showBookNow', 'Show "Book Now" Banner')}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('socialFeed.showBookNowLive', 'Display booking banner on video')}
                    </p>
                  </div>
                  <Switch
                    id="live-show-book-now"
                    checked={showBookNow}
                    onCheckedChange={setShowBookNow}
                  />
                </div>

                <Button
                  onClick={handleStartRecording}
                  disabled={!cameraReady}
                  className="w-full bg-red-500 hover:bg-red-600"
                >
                  <Radio className="h-4 w-4 mr-2" />
                  {t('socialFeed.startLive', 'Start Recording')}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <LiveStreamReview
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        recordingUrl={recordedUrl}
        initialTitle={title}
        initialDescription={description}
        initialShowBookNow={showBookNow}
        providerId={providerId}
        onPost={handlePostRecording}
        onDiscard={handleDiscardRecording}
      />
    </>
  );
}
