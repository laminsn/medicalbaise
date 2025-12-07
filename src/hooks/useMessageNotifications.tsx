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

    // Subscribe to all new messages for the current user
    const channel = supabase
      .channel('global-messages')
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

          // Check if this message is in a conversation the user is part of
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

          // Verify user is part of this conversation
          const isCustomer = conversation.customer_id === user.id;
          const isProvider = conversation.provider?.user_id === user.id;
          
          if (!isCustomer && !isProvider) return;

          // Get sender name
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

          // Send browser notification
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isGranted, sendNotification]);
};
