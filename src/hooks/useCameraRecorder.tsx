import { useState, useRef, useCallback, useEffect } from 'react';
import {
  applyCameraZoom,
  captureHighQualityPhoto,
  findCameraDeviceForZoom,
  getCameraZoomSupport,
  getCameraVideoConstraints,
  getVideoBitsPerSecond,
  listVideoInputDevices,
  normalizeCameraTrack,
  type CameraZoomPreset,
} from '@/lib/camera';

interface UseCameraRecorderOptions {
  onRecordingComplete?: (blob: Blob, url: string) => void;
  maxDuration?: number; // seconds, default 60
}

export function useCameraRecorder(options?: UseCameraRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isStartingPreview, setIsStartingPreview] = useState(false);
  const [isChangingZoom, setIsChangingZoom] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoom, setZoomState] = useState<CameraZoomPreset>(1);
  const [supportedZooms, setSupportedZooms] = useState<CameraZoomPreset[]>([1]);
  const [supportedTrackZooms, setSupportedTrackZooms] = useState<CameraZoomPreset[]>([1]);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<number | null>(null);
  const maxDurationTimeoutRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const recordedUrlRef = useRef<string | null>(null);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);
  const physicalLensZoomRef = useRef<CameraZoomPreset>(1);

  useEffect(() => {
    recordedUrlRef.current = recordedUrl;
  }, [recordedUrl]);

  const startPreview = useCallback(async (
    videoElement: HTMLVideoElement,
    facing?: 'user' | 'environment',
    deviceId?: string,
    displayedZoom: CameraZoomPreset = 1,
  ) => {
    try {
      setError(null);
      setIsStartingPreview(true);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.onended = null;
          track.stop();
        });
      }
      
      const mode = facing || facingMode;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: getCameraVideoConstraints(mode, deviceId),
        audio: false,
      });

      await Promise.all(stream.getVideoTracks().map((track) => normalizeCameraTrack(track, 'detail')));
      const devices = await listVideoInputDevices();
      const videoTrack = stream.getVideoTracks()[0];
      const zoomSupport = videoTrack
        ? getCameraZoomSupport(videoTrack, devices, mode)
        : {
            presets: [1] as CameraZoomPreset[],
            trackPresets: [1] as CameraZoomPreset[],
          };
      const resolvedZoom = zoomSupport.presets.includes(displayedZoom) ? displayedZoom : 1;

      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          setError('Camera disconnected. Please try again.');
          setIsPreviewing(false);
        };
      });

      streamRef.current = stream;
      videoRef.current = videoElement;
      videoElement.srcObject = stream;
      videoElement.muted = true;
      await videoElement.play();

      devicesRef.current = devices;
      physicalLensZoomRef.current = resolvedZoom === 0.5 || resolvedZoom >= 2
        ? resolvedZoom
        : 1;
      setZoomState(resolvedZoom);
      setSupportedZooms(zoomSupport.presets);
      setSupportedTrackZooms(zoomSupport.trackPresets);
      setFacingMode(mode);
      setIsPreviewing(true);
    } catch (err) {
      const errorName = err instanceof Error ? (err as DOMException).name : '';
      if (errorName === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access in your browser settings to record videos.');
      } else if (errorName === 'NotFoundError') {
        setError('No camera found on this device. Please connect a camera and try again.');
      } else if (errorName === 'NotReadableError') {
        setError('Camera is in use by another application. Please close other apps using the camera.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
      throw err;
    } finally {
      setIsStartingPreview(false);
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
    setIsStartingPreview(false);
  }, []);

  const flipCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    setZoomState(1);
    setSupportedZooms([1]);
    setSupportedTrackZooms([1]);
    physicalLensZoomRef.current = 1;
    if (isPreviewing && videoRef.current) {
      await startPreview(videoRef.current, newMode);
    }
  }, [facingMode, isPreviewing, startPreview]);

  const setZoom = useCallback(async (preset: CameraZoomPreset) => {
    const stream = streamRef.current;
    const videoElement = videoRef.current;
    const track = stream?.getVideoTracks()[0];
    if (!stream || !videoElement || !track || isChangingZoom) return;
    if (!supportedZooms.includes(preset)) return;

    setIsChangingZoom(true);
    setError(null);

    try {
      const currentDeviceId = track.getSettings().deviceId;
      const currentPhysicalZoom = physicalLensZoomRef.current;
      const needsStandardLens = preset === 1 && currentPhysicalZoom !== 1;
      const targetDevice = findCameraDeviceForZoom(
        devicesRef.current,
        facingMode,
        preset,
        currentDeviceId,
      );
      const needsLensSwitch = targetDevice
        && targetDevice.deviceId !== currentDeviceId
        && (preset === 0.5 || preset >= 2 || needsStandardLens);

      if (needsLensSwitch) {
        await startPreview(videoElement, facingMode, targetDevice.deviceId, preset);
        return;
      }

      if (preset === 1 && needsStandardLens && targetDevice) {
        await startPreview(videoElement, facingMode, targetDevice.deviceId, 1);
        return;
      }

      const applied = await applyCameraZoom(track, preset);
      if (applied || preset === 1) {
        physicalLensZoomRef.current = 1;
        setZoomState(preset);
      } else {
        setError('Zoom is not supported by the active camera.');
      }
    } catch {
      setError('Unable to change zoom on the active camera.');
    } finally {
      setIsChangingZoom(false);
    }
  }, [facingMode, isChangingZoom, startPreview, supportedZooms]);

  const capturePhoto = useCallback(async () => {
    if (!streamRef.current || !videoRef.current) {
      throw new Error('No camera preview is available.');
    }

    return captureHighQualityPhoto(
      streamRef.current,
      videoRef.current,
      facingMode === 'user',
    );
  }, [facingMode]);

  const stopRecording = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      throw new Error('No stream available. Start preview first.');
    }

    try {
      setError(null);
      chunksRef.current = [];

      if (streamRef.current.getAudioTracks().length === 0) {
        try {
          const microphoneStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          microphoneStream.getAudioTracks().forEach((track) => streamRef.current?.addTrack(track));
        } catch {
          // A silent video is still better than blocking the camera experience.
        }
      }

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
        videoBitsPerSecond: getVideoBitsPerSecond(streamRef.current)
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

        if (recordedUrlRef.current) {
          URL.revokeObjectURL(recordedUrlRef.current);
        }
        
        setRecordedBlob(blob);
        setRecordedUrl(url);
        options?.onRecordingComplete?.(blob, url);
      };

      mediaRecorder.onerror = (event) => {
        setError('Recording error occurred');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      
      startTimeRef.current = Date.now();
      durationIntervalRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      // Auto-stop at max duration
      const maxMs = (options?.maxDuration ?? 60) * 1000;
      maxDurationTimeoutRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, maxMs);

      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      throw err;
    }
  }, [options, stopRecording]);

  const cleanup = useCallback(() => {
    stopRecording();
    stopPreview();
    
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }
    
    setRecordedBlob(null);
    setRecordedUrl(null);
    setDuration(0);
    setError(null);
  }, [stopRecording, stopPreview]);

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedUrlRef.current) {
        URL.revokeObjectURL(recordedUrlRef.current);
        recordedUrlRef.current = null;
      }
    };
  }, []);

  return {
    isRecording,
    isPreviewing,
    isStartingPreview,
    isChangingZoom,
    duration,
    error,
    recordedBlob,
    recordedUrl,
    facingMode,
    zoom,
    supportedZooms,
    supportedTrackZooms,
    startPreview,
    stopPreview,
    startRecording,
    stopRecording,
    capturePhoto,
    flipCamera,
    setZoom,
    cleanup
  };
}
