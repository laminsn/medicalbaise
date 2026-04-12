import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended';

interface CallState {
  status: CallStatus;
  remoteUserId: string | null;
  remoteUserName: string | null;
  remoteUserAvatar: string | null;
  isIncoming: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
}

interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accept' | 'call-reject' | 'call-end';
  from: string;
  fromName: string;
  fromAvatar?: string;
  to: string;
  data?: any;
}

export function useWebRTCCall() {
  const { user, profile } = useAuth();
  const [callState, setCallState] = useState<CallState>({
    status: 'idle',
    remoteUserId: null,
    remoteUserName: null,
    remoteUserAvatar: null,
    isIncoming: false,
    isMuted: false,
    isSpeakerOn: false,
    callDuration: 0,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

  const userName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User' : 'User';
  const userAvatar = profile?.avatar_url || undefined;

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.autoplay = true;
    return () => {
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callState.status === 'connected') {
      timerRef.current = setInterval(() => {
        setCallState(prev => ({ ...prev, callDuration: prev.callDuration + 1 }));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callState.status]);

  // Set up signaling channel
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`calls:${user.id}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'signal' }, async ({ payload }) => {
        const signal = payload as SignalData;

        if (signal.to !== user.id) return;

        switch (signal.type) {
          case 'call-request':
            handleIncomingCall(signal);
            break;
          case 'call-accept':
            handleCallAccepted(signal);
            break;
          case 'call-reject':
            handleCallRejected();
            break;
          case 'call-end':
            handleCallEnded();
            break;
          case 'offer':
            await handleOffer(signal);
            break;
          case 'answer':
            await handleAnswer(signal);
            break;
          case 'ice-candidate':
            await handleIceCandidate(signal);
            break;
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && callState.remoteUserId) {
        sendSignal({
          type: 'ice-candidate',
          from: user!.id,
          fromName: userName,
          fromAvatar: userAvatar,
          to: callState.remoteUserId,
          data: event.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState(prev => ({ ...prev, status: 'connected' }));
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [callState.remoteUserId, user?.id, userName, userAvatar]);

  const sendSignal = async (signal: SignalData) => {
    const targetChannel = supabase.channel(`calls:${signal.to}`);
    await targetChannel.send({
      type: 'broadcast',
      event: 'signal',
      payload: signal,
    });
    targetChannel.unsubscribe();
  };

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      toast.error('Could not access microphone');
      throw error;
    }
  };

  const handleIncomingCall = (signal: SignalData) => {
    setCallState({
      status: 'ringing',
      remoteUserId: signal.from,
      remoteUserName: signal.fromName,
      remoteUserAvatar: signal.fromAvatar || null,
      isIncoming: true,
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
    });
  };

  const handleCallAccepted = async (signal: SignalData) => {
    setCallState(prev => ({ ...prev, status: 'connecting' }));

    try {
      const stream = await getLocalStream();
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal({
        type: 'offer',
        from: user!.id,
        fromName: userName,
        fromAvatar: userAvatar,
        to: signal.from,
        data: offer,
      });
    } catch (error) {
      endCall();
    }
  };

  const handleCallRejected = () => {
    toast.error('Call was declined');
    cleanup();
    setCallState({
      status: 'idle',
      remoteUserId: null,
      remoteUserName: null,
      remoteUserAvatar: null,
      isIncoming: false,
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
    });
  };

  const handleCallEnded = () => {
    cleanup();
    setCallState(prev => ({ ...prev, status: 'ended' }));
    setTimeout(() => {
      setCallState({
        status: 'idle',
        remoteUserId: null,
        remoteUserName: null,
        remoteUserAvatar: null,
        isIncoming: false,
        isMuted: false,
        isSpeakerOn: false,
        callDuration: 0,
      });
    }, 1000);
  };

  const handleOffer = async (signal: SignalData) => {
    try {
      const stream = await getLocalStream();
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(signal.data));

      // Process queued ICE candidates
      for (const candidate of iceCandidatesQueue.current) {
        await pc.addIceCandidate(candidate);
      }
      iceCandidatesQueue.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal({
        type: 'answer',
        from: user!.id,
        fromName: userName,
        fromAvatar: userAvatar,
        to: signal.from,
        data: answer,
      });
    } catch (error) {
      endCall();
    }
  };

  const handleAnswer = async (signal: SignalData) => {
    try {
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));

        // Process queued ICE candidates
        for (const candidate of iceCandidatesQueue.current) {
          await pc.addIceCandidate(candidate);
        }
        iceCandidatesQueue.current = [];
      }
    } catch (error) {
      // Error handled: call state remains unchanged
    }
  };

  const handleIceCandidate = async (signal: SignalData) => {
    try {
      const pc = peerConnectionRef.current;
      const candidate = new RTCIceCandidate(signal.data);

      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else {
        iceCandidatesQueue.current.push(candidate);
      }
    } catch (error) {
      // ICE candidate error is non-fatal; connection will retry via other candidates
    }
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    iceCandidatesQueue.current = [];
  };

  const startCall = useCallback(async (targetUserId: string, targetUserName: string, targetUserAvatar?: string) => {
    if (!user?.id) {
      toast.error('You must be logged in to make calls');
      return;
    }

    setCallState({
      status: 'calling',
      remoteUserId: targetUserId,
      remoteUserName: targetUserName,
      remoteUserAvatar: targetUserAvatar || null,
      isIncoming: false,
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
    });

    sendSignal({
      type: 'call-request',
      from: user.id,
      fromName: userName,
      fromAvatar: userAvatar,
      to: targetUserId,
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (callState.status === 'calling') {
        toast.error('No answer');
        endCall();
      }
    }, 30000);
  }, [user?.id, userName, userAvatar, callState.status]);

  const answerCall = useCallback(async () => {
    if (!callState.remoteUserId) return;

    setCallState(prev => ({ ...prev, status: 'connecting' }));

    sendSignal({
      type: 'call-accept',
      from: user!.id,
      fromName: userName,
      fromAvatar: userAvatar,
      to: callState.remoteUserId,
    });
  }, [callState.remoteUserId, user?.id, userName, userAvatar]);

  const declineCall = useCallback(() => {
    if (!callState.remoteUserId) return;

    sendSignal({
      type: 'call-reject',
      from: user!.id,
      fromName: userName,
      fromAvatar: userAvatar,
      to: callState.remoteUserId,
    });

    cleanup();
    setCallState({
      status: 'idle',
      remoteUserId: null,
      remoteUserName: null,
      remoteUserAvatar: null,
      isIncoming: false,
      isMuted: false,
      isSpeakerOn: false,
      callDuration: 0,
    });
  }, [callState.remoteUserId, user?.id, userName, userAvatar]);

  const endCall = useCallback(() => {
    if (callState.remoteUserId) {
      sendSignal({
        type: 'call-end',
        from: user!.id,
        fromName: userName,
        fromAvatar: userAvatar,
        to: callState.remoteUserId,
      });
    }

    cleanup();
    setCallState(prev => ({ ...prev, status: 'ended' }));
    setTimeout(() => {
      setCallState({
        status: 'idle',
        remoteUserId: null,
        remoteUserName: null,
        remoteUserAvatar: null,
        isIncoming: false,
        isMuted: false,
        isSpeakerOn: false,
        callDuration: 0,
      });
    }, 1000);
  }, [callState.remoteUserId, user?.id, userName, userAvatar]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setCallState(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
    // Note: Speaker toggle is mainly for mobile apps with sinkId support
  }, []);

  return {
    callState,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleSpeaker,
  };
}
