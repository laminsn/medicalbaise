import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Video, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useVideoTestimonials } from '@/hooks/useVideoTestimonials';

interface UploadTestimonialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
  jobId?: string;
}

export function UploadTestimonialDialog({
  open,
  onOpenChange,
  providerId,
  providerName,
  jobId,
}: UploadTestimonialDialogProps) {
  const { t } = useTranslation();
  const { uploadTestimonial, isUploading } = useVideoTestimonials();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        return;
      }
      // Validate file size (50MB max)
      if (file.size > 52428800) {
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !title.trim()) return;

    const success = await uploadTestimonial(
      selectedFile,
      providerId,
      title.trim(),
      description.trim() || undefined,
      jobId
    );

    if (success) {
      clearSelection();
      setTitle('');
      setDescription('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      clearSelection();
      setTitle('');
      setDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            {t('videoTestimonials.uploadTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('videoTestimonials.uploadDescription', { provider: providerName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Upload */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                {t('videoTestimonials.selectVideo')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, WebM, MOV • Max 50MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <video
                src={previewUrl || undefined}
                className="w-full aspect-video object-cover"
                controls
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={clearSelection}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('videoTestimonials.titleLabel')}</Label>
            <Input
              id="title"
              placeholder={t('videoTestimonials.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t('videoTestimonials.descriptionLabel')}
            </Label>
            <Textarea
              id="description"
              placeholder={t('videoTestimonials.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isUploading}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || !title.trim() || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('videoTestimonials.uploading')}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {t('videoTestimonials.submit')}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t('videoTestimonials.approvalNote')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
