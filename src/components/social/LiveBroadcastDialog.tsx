import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Video, Radio, Square, Eye, Camera, CameraOff, 
  MessageSquare, Send, Users, X 
} from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useLiveStream, StreamMessage } from '@/hooks/useLiveStream';
import { supabase } from '@/integrations/supabase/client';
import { StreamReactions } from './StreamReactions';


interface LiveBroadcastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
}

export function LiveBroadcastDialog({
  open,
  onOpenChange,
  providerId,
  providerName
}: LiveBroadcastDialogProps) {
  const { i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const tx = (en: string, pt: string, es: string) => (isPt ? pt : isEs ? es : en);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const {
    isStreaming,
    viewerCount,
    messages,
    error,
    startBroadcast,
    stopBroadcast,
    sendMessage
  } = useLiveStream();

  // Initialize camera preview
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });
      
      videoRef.current.srcObject = stream;
      setCameraReady(true);
    } catch (err) {
      toast.error(tx('Failed to access camera. Please check permissions.', 'Falha ao acessar a câmera. Verifique as permissões.', 'No se pudo acceder a la cámara. Revisa los permisos.'));
    }
  }, [isPt, isEs]);

  // Stop camera preview
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  // Notify all followers when going live
  const notifyFollowers = useCallback(async (streamId: string, pId: string, pName: string, streamTitle: string) => {
    try {
      const { data: followers, error: followError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_provider_id', pId);

      if (followError || !followers?.length) return;

      const notifications = followers.map(f => ({
        user_id: f.follower_id,
        title: isPt ? `${pName} está ao vivo!` : isEs ? `¡${pName} está en vivo!` : `${pName} is live!`,
        message: streamTitle || (isPt ? `${pName} iniciou uma transmissão ao vivo` : isEs ? `${pName} inició una transmisión en vivo` : `${pName} started a live stream`),
        type: 'live_stream',
        priority: 'high',
        action_url: '/feed',
        metadata: { stream_id: streamId, provider_id: pId } as Record<string, string>,
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

    } catch (err) {
      // Follower notification failure is non-fatal; stream continues
    }
  }, [isPt, isEs]);

  // Start live stream
  const handleStartStream = async () => {
    if (!title.trim()) {
      toast.error(tx('Please enter a title for your stream', 'Informe um título para sua transmissão', 'Ingresa un título para tu transmisión'));
      return;
    }
    
    if (!videoRef.current) return;
    
    try {
      await startBroadcast(providerId, providerName, title, description, videoRef.current);
      
      // Notify followers about the live stream
      notifyFollowers(providerId, providerId, providerName, title);
      
      toast.success(tx('You are now live!', 'Você está ao vivo!', '¡Ya estás en vivo!'));
    } catch (err) {
      toast.error(tx('Failed to start stream', 'Falha ao iniciar transmissão', 'No se pudo iniciar la transmisión'));
    }
  };

  // End live stream
  const handleEndStream = async () => {
    await stopBroadcast();
    stopCamera();
    toast.success(tx('Stream ended', 'Transmissão encerrada', 'Transmisión finalizada'));
    onOpenChange(false);
  };

  // Send chat message
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    await sendMessage(providerId, providerName, chatMessage);
    setChatMessage('');
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStreaming) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  // Initialize camera when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(initializeCamera, 100);
    } else {
      if (!isStreaming) {
        stopCamera();
      }
    }
  }, [open, isStreaming, initializeCamera, stopCamera]);

  // Cleanup on close
  const handleClose = () => {
    if (isStreaming) {
      handleEndStream();
    } else {
      stopCamera();
    }
    onOpenChange(false);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="flex flex-col">
          {/* Header */}
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <Radio className={`h-5 w-5 ${isStreaming ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
              {isStreaming ? tx('Live Now', 'Ao vivo agora', 'En vivo ahora') : tx('Go Live', 'Entrar ao vivo', 'Transmitir en vivo')}
            </DialogTitle>
            <DialogDescription>
              {isStreaming 
                ? tx('Broadcasting to your audience', 'Transmitindo para sua audiência', 'Transmitiendo para tu audiencia')
                : tx('Start a live video stream for your followers', 'Inicie uma transmissão ao vivo para seus seguidores', 'Inicia una transmisión en vivo para tus seguidores')
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Video Section */}
            <div className="flex-1 flex flex-col p-4">
              {/* Video Preview */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain scale-x-[-1]"
                />
                
                {/* Loading State */}
                {!cameraReady && !error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-muted-foreground">{tx('Starting camera...', 'Iniciando câmera...', 'Iniciando cámara...')}</p>
                    </div>
                  </div>
                )}
                
                {/* Error State */}
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="text-center p-4">
                      <CameraOff className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">{tx('Camera access denied', 'Acesso à câmera negado', 'Acceso a cámara denegado')}</p>
                      <Button variant="outline" size="sm" onClick={initializeCamera}>
                        <Camera className="h-4 w-4 mr-2" />
                        {tx('Retry', 'Tentar novamente', 'Reintentar')}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Live Indicator */}
                {isStreaming && (
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge variant="destructive" className="animate-pulse">
                      <div className="h-2 w-2 rounded-full bg-white mr-1.5" />
                      {tx('LIVE', 'AO VIVO', 'EN VIVO')}
                    </Badge>
                    <Badge variant="secondary">
                      {formatDuration(duration)}
                    </Badge>
                  </div>
                )}
                
                {/* Viewer Count */}
                {isStreaming && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {viewerCount}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Reactions overlay for broadcaster */}
              {isStreaming && (
                <div className="flex justify-center mb-2">
                  <StreamReactions onReact={(emoji) => sendMessage(providerId, providerName, `[reaction:${emoji}]`)} />
                </div>
              )}

              {/* Stream Controls */}
              {!isStreaming ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="stream-title">Stream Title</Label>
                    <Input
                      id="stream-title"
                      placeholder={tx('What are you streaming about?', 'Sobre o que você vai transmitir?', '¿Sobre qué vas a transmitir?')}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stream-description">{tx('Description (optional)', 'Descrição (opcional)', 'Descripción (opcional)')}</Label>
                    <Textarea
                      id="stream-description"
                      placeholder={tx('Tell viewers what to expect...', 'Diga aos espectadores o que esperar...', 'Cuéntales a los espectadores qué esperar...')}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={handleStartStream}
                    disabled={!cameraReady || !title.trim()}
                    className="w-full bg-red-500 hover:bg-red-600"
                  >
                    <Radio className="h-4 w-4 mr-2" />
                    {tx('Go Live', 'Entrar ao vivo', 'Transmitir en vivo')}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleEndStream}
                  variant="destructive"
                  className="w-full"
                >
                  <Square className="h-4 w-4 mr-2" />
                  {tx('End Stream', 'Encerrar transmissão', 'Finalizar transmisión')}
                </Button>
              )}
            </div>

            {/* Chat Section */}
            {isStreaming && (
              <div className="w-72 border-l border-border flex flex-col">
                <div className="p-3 border-b border-border">
                  <h3 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {tx('Live Chat', 'Chat ao vivo', 'Chat en vivo')}
                  </h3>
                </div>
                
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {tx('No messages yet', 'Sem mensagens ainda', 'Aún no hay mensajes')}
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <span className="font-medium text-primary">
                            {msg.userName}:
                          </span>{' '}
                          <span className="text-foreground">{msg.content}</span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                
                <div className="p-3 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder={tx('Say something...', 'Diga algo...', 'Escribe algo...')}
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button size="icon" onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
