import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveStream {
  id: string;
  providerId: string;
  providerName: string;
  title: string;
  description?: string;
  viewerCount: number;
  startedAt: Date;
  isLive: boolean;
  specialty?: string;
  location?: string;
  categoryId?: string;
}

export interface StreamMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export function useLiveStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const currentStreamIdRef = useRef<string | null>(null);

  // Start broadcasting
  const startBroadcast = useCallback(async (
    providerId: string,
    providerName: string,
    title: string,
    description: string,
    videoElement: HTMLVideoElement
  ) => {
    try {
      setError(null);
      
      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: true
      });
      
      streamRef.current = stream;
      videoElement.srcObject = stream;
      localVideoRef.current = videoElement;
      
      // Generate stream ID
      const streamId = crypto.randomUUID();
      currentStreamIdRef.current = streamId;
      
      // Create Supabase realtime channel for this stream
      const channel = supabase.channel(`live-stream-${streamId}`, {
        config: {
          presence: { key: providerId },
          broadcast: { self: true }
        }
      });
      
      // Track presence for viewer count
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length - 1; // Exclude broadcaster
        setViewerCount(Math.max(0, count));
      });
      
      // Handle chat messages
      channel.on('broadcast', { event: 'chat' }, (payload) => {
        const msg = payload.payload as StreamMessage;
        setMessages(prev => [...prev, msg]);
      });
      
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            providerId,
            providerName,
            title,
            description,
            isHost: true,
            startedAt: new Date().toISOString()
          });
        }
      });
      
      channelRef.current = channel;
      setIsStreaming(true);
      
      console.log('Broadcast started:', streamId);
      
      return streamId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start broadcast';
      setError(errorMessage);
      console.error('Broadcast error:', err);
      throw err;
    }
  }, []);

  // Stop broadcasting
  const stopBroadcast = useCallback(async () => {
    try {
      // Stop media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Leave channel
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      
      currentStreamIdRef.current = null;
      setIsStreaming(false);
      setViewerCount(0);
      setMessages([]);
      
      console.log('Broadcast stopped');
    } catch (err) {
      console.error('Error stopping broadcast:', err);
    }
  }, []);

  // Join a stream as viewer
  const joinStream = useCallback(async (
    streamId: string,
    userId: string,
    userName: string,
    videoElement: HTMLVideoElement
  ) => {
    try {
      setError(null);
      remoteVideoRef.current = videoElement;
      currentStreamIdRef.current = streamId;
      
      const channel = supabase.channel(`live-stream-${streamId}`, {
        config: {
          presence: { key: userId }
        }
      });
      
      // Track presence
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setViewerCount(Object.keys(state).length - 1);
      });
      
      // Handle chat messages
      channel.on('broadcast', { event: 'chat' }, (payload) => {
        const msg = payload.payload as StreamMessage;
        setMessages(prev => [...prev, msg]);
      });
      
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: userId,
            userName,
            isHost: false,
            joinedAt: new Date().toISOString()
          });
        }
      });
      
      channelRef.current = channel;
      setIsWatching(true);
      
      console.log('Joined stream:', streamId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join stream';
      setError(errorMessage);
      console.error('Join stream error:', err);
      throw err;
    }
  }, []);

  // Leave stream
  const leaveStream = useCallback(async () => {
    try {
      if (channelRef.current) {
        await channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      
      currentStreamIdRef.current = null;
      setIsWatching(false);
      setMessages([]);
      
      console.log('Left stream');
    } catch (err) {
      console.error('Error leaving stream:', err);
    }
  }, []);

  // Send chat message
  const sendMessage = useCallback(async (userId: string, userName: string, content: string) => {
    if (!channelRef.current) return;
    
    const message: StreamMessage = {
      id: crypto.randomUUID(),
      userId,
      userName,
      content,
      timestamp: new Date()
    };
    
    await channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: message
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    isStreaming,
    isWatching,
    viewerCount,
    liveStreams,
    messages,
    error,
    startBroadcast,
    stopBroadcast,
    joinStream,
    leaveStream,
    sendMessage
  };
}
