import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';
import { useLocation } from 'react-router-dom';

interface MessagePayload {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const { sendNotification, isGranted } = useBrowserNotifications();
  const location = useLocation();
  const currentConversationId = useRef<string | null>(null);

  // Track current conversation from URL
  useEffect(() => {
    const match = location.pathname.match(/\/chat\/(.+)/);
    currentConversationId.current = match ? match[1] : null;
  }, [location.pathname]);

  useEffect(() => {
    if (!user || !isGranted) return;

    // Fetch user's conversation IDs to scope the subscription
    // This prevents receiving messages from conversations the user is not part of
    const setupSubscription = async () => {
      // Get provider IDs for this user
      const { data: userProviders } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id);
      const providerIds = userProviders?.map(p => p.id) || [];

      // Subscribe only to conversations where the user is a participant
      // We listen for inserts where sender is NOT the current user
      const channel = supabase
        .channel('user-messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            const newMessage = payload.new as MessagePayload;

            // Don't notify for own messages
            if (newMessage.sender_id === user.id) return;

            // Don't notify if user is already viewing this conversation
            if (currentConversationId.current === newMessage.conversation_id) return;

            // Verify user is part of this conversation BEFORE accessing content
            const { data: conversation } = await supabase
              .from('conversations')
              .select(`
                id,
                customer_id,
                provider:providers(id, business_name, user_id)
              `)
              .eq('id', newMessage.conversation_id)
              .maybeSingle();

            if (!conversation) return;

            const isCustomer = conversation.customer_id === user.id;
            const isProvider = conversation.provider?.user_id === user.id;

            if (!isCustomer && !isProvider) return;

            // Only access message content after verifying ownership
            let senderName = 'Someone';
            if (isCustomer && conversation.provider) {
              senderName = conversation.provider.business_name;
            } else {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('user_id', newMessage.sender_id)
                .maybeSingle();

              if (profile) {
                senderName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Customer';
              }
            }

            sendNotification(`New message from ${senderName}`, {
              body: newMessage.content.length > 100
                ? newMessage.content.substring(0, 100) + '...'
                : newMessage.content,
              tag: `message-${newMessage.conversation_id}`,
              data: {
                url: `/chat/${newMessage.conversation_id}`,
              },
            });
          }
        )
        .subscribe();

      return channel;
    };

    let channelRef: ReturnType<typeof supabase.channel> | null = null;
    setupSubscription().then(ch => { channelRef = ch; });

    return () => {
      if (channelRef) {
        supabase.removeChannel(channelRef);
      }
    };
  }, [user, isGranted, sendNotification]);
};
