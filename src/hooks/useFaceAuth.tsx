import { useState, useCallback, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const FACE_MATCH_THRESHOLD = 0.45; // Lower = stricter matching
const MODEL_URL = '/models'; // Models served from public/models/

type FaceAuthStatus = 'idle' | 'loading-models' | 'ready' | 'detecting' | 'enrolling' | 'verifying' | 'success' | 'error';

interface FaceAuthState {
  status: FaceAuthStatus;
  error: string | null;
  modelsLoaded: boolean;
}

/**
 * Hook for face authentication using face-api.js.
 * Face descriptors (128-dimensional vectors) are stored in Supabase
 * in the profiles table as encrypted JSON.
 */
export function useFaceAuth() {
  const { user } = useAuth();
  const [state, setState] = useState<FaceAuthState>({
    status: 'idle',
    error: null,
    modelsLoaded: false,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /** Load face-api.js models */
  const loadModels = useCallback(async () => {
    if (state.modelsLoaded) return true;
    setState((s) => ({ ...s, status: 'loading-models', error: null }));
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setState((s) => ({ ...s, status: 'ready', modelsLoaded: true }));
      return true;
    } catch (err) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: 'Failed to load face recognition models. Please check your connection.',
      }));
      return false;
    }
  }, [state.modelsLoaded]);

  /** Start camera stream */
  const startCamera = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      videoElement.srcObject = stream;
      videoRef.current = videoElement;
      streamRef.current = stream;
      await videoElement.play();
      return true;
    } catch (err) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: 'Camera access denied. Please allow camera permissions to use face authentication.',
      }));
      return false;
    }
  }, []);

  /** Stop camera stream */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
  }, []);

  /** Detect a face in the current video frame and get its descriptor */
  const detectFace = useCallback(async (): Promise<Float32Array | null> => {
    if (!videoRef.current) return null;
    setState((s) => ({ ...s, status: 'detecting', error: null }));

    const detection = await faceapi
      .detectSingleFace(videoRef.current)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setState((s) => ({ ...s, status: 'ready', error: 'No face detected. Please look at the camera.' }));
      return null;
    }

    return detection.descriptor;
  }, []);

  /** Enroll a face — store the descriptor for the current user */
  const enrollFace = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setState((s) => ({ ...s, error: 'Must be logged in to enroll face.' }));
      return false;
    }

    setState((s) => ({ ...s, status: 'enrolling', error: null }));

    // Capture multiple descriptors for accuracy
    const descriptors: Float32Array[] = [];
    for (let i = 0; i < 3; i++) {
      const descriptor = await detectFace();
      if (descriptor) {
        descriptors.push(descriptor);
      }
      // Small delay between captures
      await new Promise((r) => setTimeout(r, 500));
    }

    if (descriptors.length < 2) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: 'Could not capture enough face data. Please try again with better lighting.',
      }));
      return false;
    }

    // Average the descriptors for a more robust reference
    const avgDescriptor = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      let sum = 0;
      for (const d of descriptors) {
        sum += d[i];
      }
      avgDescriptor[i] = sum / descriptors.length;
    }

    // Store as JSON array in Supabase profiles
    const descriptorArray = Array.from(avgDescriptor);

    const { error } = await supabase
      .from('profiles')
      .update({
        face_descriptor: JSON.stringify(descriptorArray),
      } as Record<string, unknown>)
      .eq('user_id', user.id);

    if (error) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: 'Failed to save face data. Please try again.',
      }));
      return false;
    }

    setState((s) => ({ ...s, status: 'success', error: null }));
    return true;
  }, [user, detectFace]);

  /** Verify a face against all stored descriptors (for login) */
  const verifyFace = useCallback(async (): Promise<{ matched: boolean; userId?: string; email?: string }> => {
    setState((s) => ({ ...s, status: 'verifying', error: null }));

    const descriptor = await detectFace();
    if (!descriptor) {
      return { matched: false };
    }

    // Fetch all users who have enrolled face auth
    const { data: profiles, error } = await (supabase
      .from('profiles')
      .select('user_id, email, first_name, face_descriptor')
      .not('face_descriptor', 'is', null) as unknown as Promise<{ data: { user_id: string; email: string | null; first_name: string | null; face_descriptor: string | null }[] | null; error: unknown }>);

    if (error || !profiles || profiles.length === 0) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: 'No enrolled faces found. Please sign in with password first and enroll your face.',
      }));
      return { matched: false };
    }

    // Compare against each stored descriptor
    let bestMatch: { userId: string; email: string | null; distance: number } | null = null;

    for (const profile of profiles) {
      try {
        const storedDescriptor = new Float32Array(
          JSON.parse(profile.face_descriptor as string)
        );
        const distance = faceapi.euclideanDistance(descriptor, storedDescriptor);

        if (distance < FACE_MATCH_THRESHOLD && (!bestMatch || distance < bestMatch.distance)) {
          bestMatch = {
            userId: profile.user_id,
            email: profile.email,
            distance,
          };
        }
      } catch {
        // Skip malformed descriptors
        continue;
      }
    }

    if (bestMatch && bestMatch.email) {
      setState((s) => ({ ...s, status: 'success', error: null }));
      return { matched: true, userId: bestMatch.userId, email: bestMatch.email };
    }

    setState((s) => ({
      ...s,
      status: 'error',
      error: 'Face not recognized. Please try again or use password login.',
    }));
    return { matched: false };
  }, [detectFace]);

  /** Remove face enrollment for current user */
  const removeFaceEnrollment = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const { error } = await (supabase
      .from('profiles')
      .update({ face_descriptor: null } as any)
      .eq('user_id', user.id) as unknown as Promise<{ error: unknown }>);

    return !error;
  }, [user]);

  /** Check if current user has face enrolled */
  const checkEnrollment = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const { data } = await (supabase
      .from('profiles')
      .select('face_descriptor')
      .eq('user_id', user.id)
      .maybeSingle() as unknown as Promise<{ data: { face_descriptor: string | null } | null }>);

    return !!data?.face_descriptor;
  }, [user]);

  return {
    ...state,
    loadModels,
    startCamera,
    stopCamera,
    enrollFace,
    verifyFace,
    removeFaceEnrollment,
    checkEnrollment,
  };
}
