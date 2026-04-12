import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Video, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { detectPHI } from '@/lib/phi-detector';
import { PHIWarningModal } from '@/components/compliance/PHIWarningModal';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string | null;
  onSuccess: () => void;
}

export function CreatePostDialog({ open, onOpenChange, providerId, onSuccess }: CreatePostDialogProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);
  const [showBookNow, setShowBookNow] = useState(true);
  const [phiWarning, setPHIWarning] = useState<{ detectedTypes: string[] } | null>(null);
  const pendingSubmitRef = useRef<boolean>(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error(t('socialFeed.invalidFileType'));
      return;
    }

    // Check file size (50MB for video, 10MB for image)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('socialFeed.fileTooLarge'));
      return;
    }

    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const performSubmit = async () => {
    if (!providerId || !mediaFile) {
      toast.error(t('socialFeed.mediaRequired'));
      return;
    }

    setUploading(true);
    pendingSubmitRef.current = false;

    try {
      // Upload media to storage
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${providerId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('testimonials')
        .upload(fileName, mediaFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('testimonials')
        .getPublicUrl(fileName);

      // Create post
      const { error: postError } = await supabase
        .from('social_posts')
        .insert({
          provider_id: providerId,
          content: content.trim() || null,
          media_url: publicUrl,
          media_type: mediaType,
          show_book_now: showBookNow,
        });

      if (postError) throw postError;

      // Reset form
      setContent('');
      clearMedia();
      setShowBookNow(true);
      onSuccess();
    } catch (error) {

      toast.error(t('socialFeed.errorCreating'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!providerId || !mediaFile) {
      toast.error(t('socialFeed.mediaRequired'));
      return;
    }

    if (content.trim()) {
      const phiResult = detectPHI(content);
      if (phiResult.hasPHI) {
        pendingSubmitRef.current = true;
        setPHIWarning({ detectedTypes: phiResult.detectedTypes });
        return;
      }
    }

    await performSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('socialFeed.createPost')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Caption */}
          <div className="space-y-2">
            <Label>{t('socialFeed.caption')}</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('socialFeed.captionPlaceholder')}
              rows={3}
              maxLength={2200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/2200
            </p>
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label>{t('socialFeed.media')} *</Label>

            {mediaPreview ? (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                {mediaType === 'video' ? (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-64 object-contain"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain"
                  />
                )}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Image className="h-6 w-6 text-primary" />
                    </div>
                    <div className="p-3 rounded-full bg-primary/10">
                      <Video className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{t('socialFeed.uploadMedia')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('socialFeed.uploadHint')}
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      {t('socialFeed.selectFile')}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Book Now Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <Label htmlFor="show-book-now" className="font-medium">
                {t('socialFeed.showBookNow', 'Show "Book Now" Banner')}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t('socialFeed.showBookNowDescription', 'Display a booking banner on your post')}
              </p>
            </div>
            <Switch
              id="show-book-now"
              checked={showBookNow}
              onCheckedChange={setShowBookNow}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!mediaFile || uploading}
            >
              {uploading ? t('common.uploading') : t('socialFeed.post')}
            </Button>
          </div>
        </div>
      </DialogContent>

      {phiWarning && (
        <PHIWarningModal
          detectedTypes={phiWarning.detectedTypes}
          onEdit={() => setPHIWarning(null)}
          onSendAnyway={() => {
            setPHIWarning(null);
            performSubmit();
          }}
          onClose={() => setPHIWarning(null)}
        />
      )}
    </Dialog>
  );
}
