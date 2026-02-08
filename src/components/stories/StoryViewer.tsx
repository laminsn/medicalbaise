import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, Pause, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { Story, StoryGroup } from '@/hooks/useStories';
import { formatDistanceToNow } from 'date-fns';

interface StoryViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  onMarkViewed: (storyId: string) => void;
  onDeleteStory?: (storyId: string) => void;
}

export function StoryViewer({
  open,
  onOpenChange,
  storyGroups,
  initialGroupIndex,
  onMarkViewed,
  onDeleteStory,
}: StoryViewerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isOwnStory = currentStory && user?.id === currentStory.user_id;

  // Reset when opening
  useEffect(() => {
    if (open) {
      setGroupIndex(initialGroupIndex);
      setStoryIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [open, initialGroupIndex]);

  // Mark story as viewed
  useEffect(() => {
    if (open && currentStory) {
      onMarkViewed(currentStory.id);
    }
  }, [open, currentStory?.id, onMarkViewed]);

  // Auto-advance timer
  const startTimer = useCallback(() => {
    if (!currentStory) return;

    const durationMs = (currentStory.duration_seconds || 5) * 1000;
    const remaining = durationMs - elapsedRef.current;

    startTimeRef.current = Date.now();

    timerRef.current = window.setInterval(() => {
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const pct = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        goNext();
      }
    }, 50);
  }, [currentStory]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      elapsedRef.current += Date.now() - startTimeRef.current;
    }
  }, []);

  useEffect(() => {
    if (open && !isPaused && currentStory) {
      startTimer();
    }
    return () => stopTimer();
  }, [open, isPaused, groupIndex, storyIndex, startTimer, stopTimer]);

  // Reset elapsed when story changes
  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
  }, [groupIndex, storyIndex]);

  const goNext = useCallback(() => {
    stopTimer();
    if (!currentGroup) return;

    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
    } else {
      onOpenChange(false);
    }
  }, [storyIndex, groupIndex, currentGroup, storyGroups.length, stopTimer, onOpenChange]);

  const goPrev = useCallback(() => {
    stopTimer();
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      setStoryIndex(storyGroups[groupIndex - 1]?.stories.length - 1 || 0);
    }
  }, [storyIndex, groupIndex, storyGroups, stopTimer]);

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      stopTimer();
      setIsPaused(true);
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goPrev();
    } else if (x > (rect.width * 2) / 3) {
      goNext();
    } else {
      togglePause();
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] h-[90vh] max-h-[800px] p-0 overflow-hidden bg-black border-0 rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>Story</DialogTitle>
          <DialogDescription>Viewing story</DialogDescription>
        </VisuallyHidden>

        <div className="h-full flex flex-col relative" onClick={handleTap}>
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {currentGroup.stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{
                    width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-3 pt-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border-2 border-white">
                {currentGroup.avatarUrl ? (
                  <AvatarImage src={currentGroup.avatarUrl} />
                ) : null}
                <AvatarFallback className="text-xs bg-primary/20">
                  {currentGroup.userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-sm font-semibold">{currentGroup.userName}</p>
                <p className="text-white/60 text-[10px]">
                  {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); togglePause(); }} className="text-white hover:bg-white/20 h-8 w-8">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              {isOwnStory && onDeleteStory && (
                <Button
                  variant="ghost" size="icon"
                  onClick={(e) => { e.stopPropagation(); onDeleteStory(currentStory.id); onOpenChange(false); }}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onOpenChange(false); }} className="text-white hover:bg-white/20 h-8 w-8">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Story content */}
          <div className="flex-1 flex items-center justify-center">
            {currentStory.media_type === 'video' ? (
              <video
                key={currentStory.id}
                src={currentStory.media_url}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-contain"
                style={{ filter: currentStory.filter || 'none' }}
              />
            ) : (
              <img
                key={currentStory.id}
                src={currentStory.media_url}
                alt="Story"
                className="w-full h-full object-contain"
                style={{ filter: currentStory.filter || 'none' }}
              />
            )}

            {/* Overlays from story data */}
            {currentStory.overlays && (currentStory.overlays as any)?.textOverlays?.map((overlay: any) => (
              <div
                key={overlay.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${overlay.x}%`,
                  top: `${overlay.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span
                  style={{
                    color: overlay.color,
                    fontSize: `${overlay.fontSize}px`,
                    fontFamily: overlay.fontFamily,
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  {overlay.text}
                </span>
              </div>
            ))}

            {currentStory.overlays && (currentStory.overlays as any)?.stickers?.map((sticker: any) => (
              <div
                key={sticker.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${sticker.x}%`,
                  top: `${sticker.y}%`,
                  transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                  fontSize: '2rem',
                }}
              >
                {sticker.emoji}
              </div>
            ))}
          </div>

          {/* Navigation hints */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-10" />
          <div className="absolute inset-y-0 right-0 w-1/3 z-10" />

          {/* Paused indicator */}
          {isPaused && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-black/50 rounded-full p-4">
                <Pause className="h-8 w-8 text-white" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
