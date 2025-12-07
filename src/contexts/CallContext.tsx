import React, { createContext, useContext, ReactNode } from 'react';
import { useWebRTCCall, CallStatus } from '@/hooks/useWebRTCCall';
import { InAppCall } from '@/components/calling/InAppCall';

interface CallContextType {
  startCall: (targetUserId: string, targetUserName: string, targetUserAvatar?: string) => void;
  callState: {
    status: CallStatus;
    remoteUserId: string | null;
    remoteUserName: string | null;
    remoteUserAvatar: string | null;
    isIncoming: boolean;
    isMuted: boolean;
    isSpeakerOn: boolean;
    callDuration: number;
  };
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const {
    callState,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    toggleSpeaker,
  } = useWebRTCCall();

  const isCallActive = callState.status !== 'idle';

  return (
    <CallContext.Provider value={{ startCall, callState }}>
      {children}
      <InAppCall
        isOpen={isCallActive}
        status={callState.status}
        callerName={callState.remoteUserName || 'Unknown'}
        callerAvatar={callState.remoteUserAvatar}
        isIncoming={callState.isIncoming}
        isMuted={callState.isMuted}
        isSpeakerOn={callState.isSpeakerOn}
        callDuration={callState.callDuration}
        onAnswer={answerCall}
        onDecline={declineCall}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
      />
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
