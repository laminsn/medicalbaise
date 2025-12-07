import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Radio, Users, MessageSquare, Send, Heart, 
  Share2, X, Volume2, VolumeX 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useLiveStream, LiveStream, StreamMessage } from '@/hooks/useLiveStream';

interface LiveStreamViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stream: LiveStream;
  userId: string;
  userName: string;
}

export function LiveStreamViewer({
  open,
  onOpenChange,
  stream,
  userId,
  userName
}: LiveStreamViewerProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const {
    isWatching,
    viewerCount,
    messages,
    joinStream,
    leaveStream,
    sendMessage
  } = useLiveStream();

  // Join stream when opening
  useEffect(() => {
    if (open && videoRef.current) {
      joinStream(stream.id, userId, userName, videoRef.current);
    }
    
    return () => {
      leaveStream();
    };
  }, [open, stream.id, userId, userName, joinStream, leaveStream]);

  // Handle close
  const handleClose = () => {
    leaveStream();
    onOpenChange(false);
  };

  // Send chat message
  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    await sendMessage(userId, userName, chatMessage);
    setChatMessage('');
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // Like animation
  const handleLike = () => {
    setIsLiked(true);
    setTimeout(() => setIsLiked(false), 1000);
    toast.success('💖');
  };

  // Share stream
  const handleShare = async () => {
    try {
      await navigator.share({
        title: stream.title,
        text: `Watch ${stream.providerName} live on MD Baise!`,
        url: window.location.href
      });
    } catch (err) {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>{stream.title} - Live Stream</DialogTitle>
          <DialogDescription>Watch {stream.providerName}'s live stream</DialogDescription>
        </VisuallyHidden>
        <div className="flex h-[80vh]">
          {/* Video Section */}
          <div className="flex-1 bg-black relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            
            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
            
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-red-500">
                  <AvatarFallback>{stream.providerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium text-sm">{stream.providerName}</p>
                  <p className="text-white/70 text-xs">{stream.title}</p>
                </div>
                <Badge variant="destructive" className="animate-pulse ml-2">
                  <div className="h-2 w-2 rounded-full bg-white mr-1" />
                  LIVE
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1 bg-black/50 text-white border-0">
                  <Users className="h-3 w-3" />
                  {viewerCount}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 pointer-events-auto"
                  onClick={handleClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-auto">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`text-white hover:bg-white/20 ${isLiked ? 'text-red-500 animate-ping' : ''}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Floating Hearts Animation */}
            {isLiked && (
              <div className="absolute bottom-20 right-10 animate-fade-in">
                <Heart className="h-8 w-8 text-red-500 fill-red-500 animate-bounce" />
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="w-80 bg-card flex flex-col border-l border-border">
            <div className="p-3 border-b border-border">
              <h3 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Live Chat
              </h3>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Be the first to chat!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="flex gap-2 text-sm">
                      <span className="font-medium text-primary shrink-0">
                        {msg.userName}:
                      </span>
                      <span className="text-foreground break-words">{msg.content}</span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Send a message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
