import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraRecorderOptions {
  onRecordingComplete?: (blob: Blob, url: string) => void;
}

export function useCameraRecorder(options?: UseCameraRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startPreview = useCallback(async (videoElement: HTMLVideoElement, facing?: 'user' | 'environment') => {
    try {
      setError(null);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const mode = facing || facingMode;
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true
      });
      
      streamRef.current = stream;
      videoRef.current = videoElement;
      videoElement.srcObject = stream;
      videoElement.muted = true;
      await videoElement.play();
      
      setIsPreviewing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access camera');
      throw err;
    }
  }, [facingMode]);

  const stopPreview = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsPreviewing(false);
  }, []);

  const flipCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isPreviewing && videoRef.current) {
      await startPreview(videoRef.current, newMode);
    }
  }, [facingMode, isPreviewing, startPreview]);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      throw new Error('No stream available. Start preview first.');
    }

    try {
      setError(null);
      chunksRef.current = [];

      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedMimeType || undefined,
        videoBitsPerSecond: 2500000
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: selectedMimeType || 'video/webm' 
        });
        const url = URL.createObjectURL(blob);
        
        setRecordedBlob(blob);
        setRecordedUrl(url);
        options?.onRecordingComplete?.(blob, url);
      };

      mediaRecorder.onerror = () => {
        setError('Recording error occurred');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      
      startTimeRef.current = Date.now();
      durationIntervalRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      throw err;
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  }, []);

  const cleanup = useCallback(() => {
    stopRecording();
    stopPreview();
    
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setError(null);
  }, [stopRecording, stopPreview, recordedUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, []);

  return {
    isRecording,
    isPreviewing,
    duration,
    error,
    recordedBlob,
    recordedUrl,
    facingMode,
    startPreview,
    stopPreview,
    startRecording,
    stopRecording,
    flipCamera,
    cleanup
  };
}
