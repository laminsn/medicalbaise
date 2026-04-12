import { useState, useCallback, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import i18n from '@/i18n';

const FACE_MATCH_THRESHOLD = 0.35; // Lowered for stricter matching — reduces false positives
const MAX_FACE_VERIFY_ATTEMPTS = 5;
const FACE_VERIFY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const FACE_VERIFY_ATTEMPTS_KEY = 'face_verify_attempts';
const MODEL_URL = '/models'; // Models served from public/models/

type FaceAuthStatus = 'idle' | 'loading-models' | 'ready' | 'detecting' | 'enrolling' | 'verifying' | 'success' | 'error';

interface FaceAuthState {
  status: FaceAuthStatus;
  error: string | null;
  modelsLoaded: boolean;
}

const localizeError = (en: string, pt: string, es: string) => {
  const lang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
  if (lang.startsWith('pt')) return pt;
  if (lang.startsWith('es')) return es;
  return en;
};

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
        error: localizeError(
          'Failed to load face recognition models. Please check your connection.',
          'Falha ao carregar os modelos de reconhecimento facial. Verifique sua conexão.',
          'No se pudieron cargar los modelos de reconocimiento facial. Verifica tu conexión.',
        ),
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
        error: localizeError(
          'Camera access denied. Please allow camera permissions to use face authentication.',
          'Acesso à câmera negado. Permita o acesso para usar autenticação facial.',
          'Acceso a la cámara denegado. Permite el acceso para usar autenticación facial.',
        ),
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
      setState((s) => ({
        ...s,
        status: 'ready',
        error: localizeError(
          'No face detected. Please look at the camera.',
          'Nenhum rosto detectado. Olhe para a câmera.',
          'No se detectó ningún rostro. Mira hacia la cámara.',
        ),
      }));
      return null;
    }

    return detection.descriptor;
  }, []);

  /** Enroll a face — store the descriptor for the current user */
  const enrollFace = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setState((s) => ({
        ...s,
        error: localizeError(
          'Must be logged in to enroll face.',
          'Você precisa estar logado para cadastrar o rosto.',
          'Debes iniciar sesión para registrar el rostro.',
        ),
      }));
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
        error: localizeError(
          'Could not capture enough face data. Please try again with better lighting.',
          'Não foi possível capturar dados faciais suficientes. Tente novamente com melhor iluminação.',
          'No se pudieron capturar suficientes datos faciales. Inténtalo de nuevo con mejor iluminación.',
        ),
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
        error: localizeError(
          'Failed to save face data. Please try again.',
          'Falha ao salvar dados faciais. Tente novamente.',
          'No se pudieron guardar los datos faciales. Inténtalo de nuevo.',
        ),
      }));
      return false;
    }

    setState((s) => ({ ...s, status: 'success', error: null }));
    return true;
  }, [user, detectFace]);

  /** Check rate limiting for face verification attempts */
  const checkFaceVerifyRateLimit = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(FACE_VERIFY_ATTEMPTS_KEY);
      if (!stored) return true;
      const attempts: number[] = JSON.parse(stored);
      const cutoff = Date.now() - FACE_VERIFY_WINDOW_MS;
      const recent = attempts.filter((t: number) => t > cutoff);
      return recent.length < MAX_FACE_VERIFY_ATTEMPTS;
    } catch {
      return true;
    }
  }, []);

  const recordFaceVerifyAttempt = useCallback(() => {
    try {
      const stored = localStorage.getItem(FACE_VERIFY_ATTEMPTS_KEY);
      const attempts: number[] = stored ? JSON.parse(stored) : [];
      const cutoff = Date.now() - FACE_VERIFY_WINDOW_MS;
      const recent = attempts.filter((t: number) => t > cutoff);
      recent.push(Date.now());
      localStorage.setItem(FACE_VERIFY_ATTEMPTS_KEY, JSON.stringify(recent));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  /** Verify a face against stored descriptors (for login) */
  const verifyFace = useCallback(async (emailForVerification?: string): Promise<{ matched: boolean; userId?: string; email?: string }> => {
    // Rate limit face verification attempts
    if (!checkFaceVerifyRateLimit()) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: localizeError(
          'Too many face verification attempts. Please try again later or use password login.',
          'Muitas tentativas de verificação facial. Tente novamente mais tarde ou faça login com senha.',
          'Demasiados intentos de verificación facial. Inténtalo más tarde o inicia sesión con contraseña.',
        ),
      }));
      return { matched: false };
    }

    recordFaceVerifyAttempt();
    setState((s) => ({ ...s, status: 'verifying', error: null }));

    const descriptor = await detectFace();
    if (!descriptor) {
      return { matched: false };
    }

    // Server-side face verification — descriptors never leave the server
    const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-face', {
      body: { descriptor: Array.from(descriptor), email: emailForVerification },
    });

    if (verifyError) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: localizeError(
          'Face verification service unavailable. Please use password login.',
          'Serviço de verificação facial indisponível. Use login com senha.',
          'Servicio de verificación facial no disponible. Use inicio de sesión con contraseña.',
        ),
      }));
      return { matched: false };
    }

    if (verifyData?.match && verifyData?.email) {
      setState((s) => ({ ...s, status: 'success', error: null }));
      return { matched: true, email: verifyData.email };
    }

    setState((s) => ({
      ...s,
      status: 'error',
      error: localizeError(
        'Face not recognized. Please try again or use password login.',
        'Rosto não reconhecido. Tente novamente ou entre com senha.',
        'Rostro no reconocido. Inténtalo de nuevo o inicia sesión con contraseña.',
      ),
    }));
    return { matched: false };
  }, [detectFace, checkFaceVerifyRateLimit, recordFaceVerifyAttempt]);

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
