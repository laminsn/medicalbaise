import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Image, Video, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkApproval } from '@/hooks/useWorkApproval';
import { WorkApprovalCard } from './WorkApprovalCard';

interface WorkApprovalSectionProps {
  activeJobId: string;
  isProvider: boolean;
  isCustomer: boolean;
}

export function WorkApprovalSection({ 
  activeJobId, 
  isProvider,
  isCustomer 
}: WorkApprovalSectionProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    media,
    isLoading,
    isUploading,
    uploadMedia,
    approveMedia,
    rejectMedia,
    deleteMedia,
    pendingCount,
    approvedCount,
    rejectedCount,
  } = useWorkApproval(activeJobId);

  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const success = await uploadMedia(selectedFile, caption || undefined);
    if (success) {
      clearSelection();
    }
  };

  const pendingMedia = media.filter(m => m.status === 'pending');
  const approvedMedia = media.filter(m => m.status === 'approved');
  const rejectedMedia = media.filter(m => m.status === 'rejected');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Image className="h-5 w-5" />
          {t('workApproval.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section - Only for Providers */}
        {isProvider && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">{t('workApproval.uploadWork')}</h4>
            
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{t('workApproval.selectMedia')}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('workApproval.acceptedFormats')}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-muted">
                  {selectedFile.type.startsWith('video/') ? (
                    <video
                      src={previewUrl || undefined}
                      className="w-full aspect-video object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={previewUrl || undefined}
                      alt="Preview"
                      className="w-full aspect-video object-cover"
                    />
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="caption">{t('workApproval.caption')}</Label>
                  <Input
                    id="caption"
                    placeholder={t('workApproval.captionPlaceholder')}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('workApproval.uploading')}
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {t('workApproval.upload')}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={clearSelection} disabled={isUploading}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Media Tabs */}
        {media.length > 0 ? (
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {t('workApproval.pending')} ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {t('workApproval.approved')} ({approvedCount})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                {t('workApproval.rejected')} ({rejectedCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {pendingMedia.length > 0 ? (
                <div className="grid gap-4">
                  {pendingMedia.map((item) => (
                    <WorkApprovalCard
                      key={item.id}
                      item={item}
                      isCustomer={isCustomer}
                      onApprove={approveMedia}
                      onReject={rejectMedia}
                      onDelete={isProvider ? deleteMedia : undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  {t('workApproval.noPending')}
                </p>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-4">
              {approvedMedia.length > 0 ? (
                <div className="grid gap-4">
                  {approvedMedia.map((item) => (
                    <WorkApprovalCard
                      key={item.id}
                      item={item}
                      isCustomer={isCustomer}
                      onApprove={approveMedia}
                      onReject={rejectMedia}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  {t('workApproval.noApproved')}
                </p>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-4">
              {rejectedMedia.length > 0 ? (
                <div className="grid gap-4">
                  {rejectedMedia.map((item) => (
                    <WorkApprovalCard
                      key={item.id}
                      item={item}
                      isCustomer={isCustomer}
                      onApprove={approveMedia}
                      onReject={rejectMedia}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  {t('workApproval.noRejected')}
                </p>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-6">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              {isProvider 
                ? t('workApproval.noMediaProvider') 
                : t('workApproval.noMediaCustomer')
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
