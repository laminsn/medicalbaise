import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Conversation {
  id: string;
  customer_id: string;
  provider_id: string;
  job_id: string | null;
  created_at: string;
  updated_at: string;
  provider?: {
    id: string;
    business_name: string;
    user_id: string;
  };
  job?: {
    id: string;
    title: string;
  } | null;
  last_message?: Message | null;
  unread_count?: number;
  other_user_name?: string;
  other_user_avatar?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const useMessages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          provider:providers(id, business_name, user_id),
          job:jobs_posted(id, title)
        `)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // For each conversation, get the last message and unread count
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count for current user
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          // Determine other user's name
          const isCustomer = conv.customer_id === user.id;
          let otherUserName = '';
          
          if (isCustomer && conv.provider) {
            otherUserName = conv.provider.business_name;
          } else {
            // Get customer profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', conv.customer_id)
              .maybeSingle();
            
            otherUserName = profile 
              ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Customer'
              : 'Customer';
          }

          return {
            ...conv,
            last_message: lastMsg,
            unread_count: unreadCount || 0,
            other_user_name: otherUserName,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
  };
};

export const useConversation = (conversationId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchConversation = async () => {
    if (!conversationId || !user) return;

    try {
      setLoading(true);

      // Fetch conversation details
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          provider:providers(id, business_name, user_id),
          job:jobs_posted(id, title)
        `)
        .eq('id', conversationId)
        .maybeSingle();

      if (convError) throw convError;
      if (!convData) return;

      // Get other user's name
      const isCustomer = convData.customer_id === user.id;
      let otherUserName = '';
      
      if (isCustomer && convData.provider) {
        otherUserName = convData.provider.business_name;
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', convData.customer_id)
          .maybeSingle();
        
        otherUserName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Customer'
          : 'Customer';
      }

      setConversation({
        ...convData,
        other_user_name: otherUserName,
      });

      // Fetch messages
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;
      setMessages(msgData || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);

    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!conversationId || !user || !content.trim()) return;

    try {
      setSending(true);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // Mark as read if from other user
          if (user && newMessage.sender_id !== user.id) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  useEffect(() => {
    fetchConversation();
  }, [conversationId, user]);

  return {
    conversation,
    messages,
    loading,
    sending,
    sendMessage,
    refetch: fetchConversation,
  };
};

export const useStartConversation = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const startConversation = async (providerId: string, jobId?: string) => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      let query = supabase
        .from('conversations')
        .select('id')
        .eq('customer_id', user.id)
        .eq('provider_id', providerId);
      
      if (jobId) {
        query = query.eq('job_id', jobId);
      } else {
        query = query.is('job_id', null);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          customer_id: user.id,
          provider_id: providerId,
          job_id: jobId || null,
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
      return null;
    }
  };

  return { startConversation };
};
