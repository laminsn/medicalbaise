import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Loader2, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useMessages } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { conversations, loading } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations by search
  const filteredConversations = conversations.filter((conv) =>
    conv.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.job?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Not logged in state
  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('messages.yourMessages')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('messages.loginToViewDescription')}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {t('auth.login')}
          </Button>
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

  return (
    <AppLayout>
      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">{t('messages.title')}</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('messages.searchConversations')}
            className="pl-10 h-11 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Conversations list */}
        {filteredConversations.length > 0 ? (
          <div className="space-y-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => navigate(`/chat/${conversation.id}`)}
                className="flex items-start gap-3 w-full p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors text-left"
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback>{conversation.other_user_name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {conversation.other_user_name}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {conversation.last_message?.created_at 
                        ? formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })
                        : ''}
                    </span>
                  </div>
                  
                  {conversation.job && (
                    <p className="text-xs text-muted-foreground mb-1 truncate">
                      {conversation.job.title}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${(conversation.unread_count || 0) > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {conversation.last_message?.content || t('messages.noMessagesYet')}
                    </p>
                    {(conversation.unread_count || 0) > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-xs ml-2 flex-shrink-0">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-1">{t('messages.noConversations')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('messages.conversationsWillAppear')}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
