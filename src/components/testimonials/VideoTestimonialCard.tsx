import { useState } from 'react';
import { Play, Pause, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { VideoTestimonial } from '@/hooks/useVideoTestimonials';

interface VideoTestimonialCardProps {
  testimonial: VideoTestimonial;
}

export function VideoTestimonialCard({ testimonial }: VideoTestimonialCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  return (
    <Card className="overflow-hidden border-primary/20 hover:border-primary/40 transition-colors">
      <div className="relative aspect-video bg-muted">
        <video
          ref={setVideoRef}
          src={testimonial.video_url}
          className="w-full h-full object-cover"
          poster={testimonial.thumbnail_url || undefined}
          onEnded={handleVideoEnded}
          playsInline
        />
        
        {/* Play/Pause Overlay */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
        >
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
            {isPlaying ? (
              <Pause className="h-6 w-6 text-primary-foreground" />
            ) : (
              <Play className="h-6 w-6 text-primary-foreground ml-1" />
            )}
          </div>
        </button>
      </div>

      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={testimonial.customer_avatar} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {testimonial.customer_name}
            </p>
            {testimonial.title && (
              <p className="text-xs text-muted-foreground truncate">
                {testimonial.title}
              </p>
            )}
          </div>
        </div>
        {testimonial.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {testimonial.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
