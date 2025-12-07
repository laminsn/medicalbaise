import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Video, Scissors, Play, Pause, RotateCcw, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface LiveStreamReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordingUrl: string | null;
  initialTitle: string;
  initialDescription: string;
  initialShowBookNow: boolean;
  providerId: string;
  onPost: (data: {
    title: string;
    description: string;
    showBookNow: boolean;
    trimStart: number;
    trimEnd: number;
  }) => Promise<void>;
  onDiscard: () => void;
}

export function LiveStreamReview({
  open,
  onOpenChange,
  recordingUrl,
  initialTitle,
  initialDescription,
  initialShowBookNow,
  providerId,
  onPost,
  onDiscard,
}: LiveStreamReviewProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [showBookNow, setShowBookNow] = useState(initialShowBookNow);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    // Video playback would be handled by the video element
  };

  const handlePost = async () => {
    if (!title.trim()) {
      toast.error(t('socialFeed.titleRequired', 'Please enter a title'));
      return;
    }

    setIsPosting(true);
    try {
      await onPost({
        title: title.trim(),
        description: description.trim(),
        showBookNow,
        trimStart,
        trimEnd,
      });
      toast.success(t('socialFeed.recordingPosted', 'Recording posted successfully!'));
      onOpenChange(false);
    } catch (error) {
      toast.error(t('socialFeed.postFailed', 'Failed to post recording'));
    } finally {
      setIsPosting(false);
    }
  };

  const handleDiscard = () => {
    onDiscard();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            {t('socialFeed.reviewRecording', 'Review Recording')}
          </DialogTitle>
          <DialogDescription>
            {t('socialFeed.reviewDescription', 'Review, edit, and post your live stream recording')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative aspect-[9/16] max-h-[300px] bg-muted rounded-lg overflow-hidden">
            {recordingUrl ? (
              <video
                src={recordingUrl}
                className="w-full h-full object-cover"
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Video className="h-12 w-12" />
              </div>
            )}
          </div>

          {/* Trim Controls */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">
                {t('socialFeed.trimRecording', 'Trim Recording')}
              </Label>
            </div>
            <div className="px-2">
              <Slider
                value={[trimStart, trimEnd]}
                onValueChange={([start, end]) => {
                  setTrimStart(start);
                  setTrimEnd(end);
                }}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('socialFeed.start', 'Start')}: {trimStart}%</span>
              <span>{t('socialFeed.end', 'End')}: {trimEnd}%</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <Label htmlFor="review-title">{t('socialFeed.title', 'Title')}</Label>
            <Input
              id="review-title"
              placeholder={t('socialFeed.titlePlaceholder', 'Give your video a title...')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-description">
              {t('socialFeed.description', 'Description')} ({t('common.optional', 'Optional')})
            </Label>
            <Textarea
              id="review-description"
              placeholder={t('socialFeed.descriptionPlaceholder', 'Add a description...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Book Now Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <Label htmlFor="review-show-book-now" className="font-medium text-sm">
                {t('socialFeed.showBookNow', 'Show "Book Now" Banner')}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t('socialFeed.showBookNowDescription', 'Display booking banner on video')}
              </p>
            </div>
            <Switch
              id="review-show-book-now"
              checked={showBookNow}
              onCheckedChange={setShowBookNow}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={handleDiscard}
            disabled={isPosting}
            className="w-full sm:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            {t('socialFeed.discardRecording', 'Discard')}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPosting}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('socialFeed.saveDraft', 'Save Draft')}
          </Button>
          <Button
            onClick={handlePost}
            disabled={isPosting}
            className="w-full sm:w-auto"
          >
            {isPosting ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                {t('socialFeed.posting', 'Posting...')}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('socialFeed.postRecording', 'Post Recording')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
