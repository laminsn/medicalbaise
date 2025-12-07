import { useTranslation } from 'react-i18next';
import { Video, Loader2 } from 'lucide-react';
import { VideoTestimonialCard } from './VideoTestimonialCard';
import { useVideoTestimonials } from '@/hooks/useVideoTestimonials';

interface VideoTestimonialListProps {
  providerId: string;
}

export function VideoTestimonialList({ providerId }: VideoTestimonialListProps) {
  const { t } = useTranslation();
  const { testimonials, isLoading } = useVideoTestimonials(providerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className="text-center py-8">
        <Video className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">
          {t('videoTestimonials.noTestimonials')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {testimonials.map((testimonial) => (
        <VideoTestimonialCard key={testimonial.id} testimonial={testimonial} />
      ))}
    </div>
  );
}
