import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, Crown, Phone, Paperclip, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useConversation } from '@/hooks/useMessages';
import { useTranslation } from 'react-i18next';
import { useCall } from '@/contexts/CallContext';
import { format, isToday, isYesterday } from 'date-fns';
import { detectPHI } from '@/lib/phi-detector';
import { PHIWarningModal } from '@/components/compliance/PHIWarningModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Tiers that can access the chat feature (elite and above)
const CHAT_ALLOWED_TIERS = new Set(['elite', 'enterprise']);

const tryParseAttachment = (content: string) => {
  try {
    const parsed = JSON.parse(content);
    if (parsed.__type === 'file_attachment') return parsed;
  } catch {
    // not JSON
  }
  return null;
};

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { conversation, messages, loading, sending, sendMessage } = useConversation(id);
  const { startCall } = useCall();
  const { tier, loading: subLoading } = useSubscription();
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [phiWarning, setPHIWarning] = useState<{ detectedTypes: string[] } | null>(null);
  const pendingMessageRef = useRef<string>('');

  // Customers always have access; providers need elite+ subscription
  const hasAccess = !subLoading
    ? profile?.user_type === 'customer' || CHAT_ALLOWED_TIERS.has(tier)
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const performSend = async (content: string) => {
    await sendMessage(content);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const content = newMessage.trim();

    const phiResult = detectPHI(content);
    if (phiResult.hasPHI) {
      pendingMessageRef.current = content;
      setPHIWarning({ detectedTypes: phiResult.detectedTypes });
      return;
    }

    setNewMessage('');
    await performSend(content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return t('messages.yesterday') + ' ' + format(date, 'HH:mm');
    }
    return format(date, 'dd/MM HH:mm');
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <p className="text-muted-foreground mb-4">{t('messages.loginToViewDescription')}</p>
          <Button onClick={() => navigate('/auth')}>{t('auth.login')}</Button>
        </div>
      </AppLayout>
    );
  }

  if (hasAccess === false) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('messages.eliteFeature')}</h2>
          <p className="text-muted-foreground mb-6">{t('messages.upgradeToAccess')}</p>
          <Button onClick={() => navigate('/profile')}>{t('common.upgrade')}</Button>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!conversation) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <p className="text-muted-foreground mb-4">{t('messages.conversationNotFound')}</p>
          <Button onClick={() => navigate('/messages')}>{t('common.back')}</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarFallback>{conversation.other_user_name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground truncate">{conversation.other_user_name}</h2>
            {conversation.job && (
              <p className="text-xs text-muted-foreground truncate">{conversation.job.title}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-primary/10"
            onClick={() => startCall(
              conversation.other_user_id,
              conversation.other_user_name || 'User',
              undefined
            )}
          >
            <Phone className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">{t('messages.startConversation')}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === user.id;
              const attachment = tryParseAttachment(message.content);
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    {attachment ? (
                      attachment.type?.startsWith('image/') ? (
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="max-w-xs rounded-lg"
                        />
                      ) : (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <FileText className="w-4 h-4 shrink-0" />
                          <span className="text-sm truncate">{attachment.name}</span>
                        </a>
                      )
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <label className="cursor-pointer p-2 hover:bg-muted rounded-lg transition-colors shrink-0">
              {uploading ? (
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5 text-muted-foreground" />
              )}
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                disabled={uploading || sending}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    toast({ title: 'File too large', description: 'Max 10MB', variant: 'destructive' });
                    return;
                  }
                  setUploading(true);
                  try {
                    const filePath = `chat/${id}/${Date.now()}_${file.name}`;
                    const { error: uploadError } = await supabase.storage
                      .from('chat-attachments')
                      .upload(filePath, file);
                    if (uploadError) {
                      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
                      return;
                    }
                    const { data: { publicUrl } } = supabase.storage
                      .from('chat-attachments')
                      .getPublicUrl(filePath);
                    const attachmentMsg = JSON.stringify({
                      __type: 'file_attachment',
                      url: publicUrl,
                      name: file.name,
                      type: file.type,
                      size: file.size,
                    });
                    await sendMessage(attachmentMsg);
                  } finally {
                    setUploading(false);
                    e.target.value = '';
                  }
                }}
              />
            </label>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('messages.typeMessage')}
              className="flex-1"
              disabled={sending || uploading}
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || sending || uploading}>
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {phiWarning && (
        <PHIWarningModal
          detectedTypes={phiWarning.detectedTypes}
          onEdit={() => {
            setPHIWarning(null);
            pendingMessageRef.current = '';
          }}
          onSendAnyway={() => {
            const content = pendingMessageRef.current;
            setPHIWarning(null);
            pendingMessageRef.current = '';
            setNewMessage('');
            performSend(content);
          }}
          onClose={() => {
            setPHIWarning(null);
            pendingMessageRef.current = '';
          }}
        />
      )}
    </AppLayout>
  );
}
