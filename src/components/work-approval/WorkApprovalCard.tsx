import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Play, 
  Pause, 
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle,
  MessageSquare,
  Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { WorkApprovalMedia } from '@/hooks/useWorkApproval';
import { format } from 'date-fns';

interface WorkApprovalCardProps {
  item: WorkApprovalMedia;
  isCustomer: boolean;
  onApprove: (id: string, feedback?: string) => Promise<boolean>;
  onReject: (id: string, feedback: string) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

export function WorkApprovalCard({ 
  item, 
  isCustomer, 
  onApprove, 
  onReject,
  onDelete 
}: WorkApprovalCardProps) {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleApprove = async () => {
    setIsSubmitting(true);
    await onApprove(item.id);
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!feedback.trim()) return;
    setIsSubmitting(true);
    const success = await onReject(item.id, feedback.trim());
    if (success) {
      setShowRejectDialog(false);
      setFeedback('');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(item.id);
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case 'approved':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t('workApproval.approved')}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            {t('workApproval.rejected')}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            {t('workApproval.pending')}
          </Badge>
        );
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-muted">
          {item.media_type === 'video' ? (
            <>
              <video
                ref={setVideoRef}
                src={item.media_url}
                className="w-full h-full object-cover"
                poster={item.thumbnail_url || undefined}
                onEnded={() => setIsPlaying(false)}
                playsInline
              />
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Play className="h-5 w-5 text-primary-foreground ml-1" />
                  )}
                </div>
              </button>
            </>
          ) : (
            <img
              src={item.media_url}
              alt={item.caption || 'Work photo'}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            {getStatusBadge()}
          </div>
        </div>

        <CardContent className="p-3 space-y-3">
          {item.caption && (
            <p className="text-sm">{item.caption}</p>
          )}
          
          <p className="text-xs text-muted-foreground">
            {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
          </p>

          {/* Customer Feedback */}
          {item.customer_feedback && (
            <div className="bg-muted rounded-lg p-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <MessageSquare className="h-3 w-3" />
                {t('workApproval.customerFeedback')}
              </div>
              <p className="text-sm">{item.customer_feedback}</p>
            </div>
          )}

          {/* Action Buttons */}
          {item.status === 'pending' && (
            <div className="flex gap-2">
              {isCustomer ? (
                <>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {t('workApproval.approve')}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('workApproval.requestChanges')}
                  </Button>
                </>
              ) : (
                onDelete && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('common.delete')}
                  </Button>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('workApproval.requestChangesTitle')}</DialogTitle>
            <DialogDescription>
              {t('workApproval.requestChangesDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder={t('workApproval.feedbackPlaceholder')}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!feedback.trim() || isSubmitting}
            >
              {t('workApproval.submitFeedback')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
