export type CameraFacingMode = 'user' | 'environment';
export const CAMERA_ZOOM_PRESETS = [0.5, 1, 2, 5] as const;
export type CameraZoomPreset = (typeof CAMERA_ZOOM_PRESETS)[number];

type ExtendedTrackCapabilities = MediaTrackCapabilities & {
  zoom?: { min: number; max: number; step: number };
  focusMode?: string[];
  exposureMode?: string[];
  whiteBalanceMode?: string[];
};

type ExtendedConstraintSet = MediaTrackConstraintSet & {
  zoom?: number;
  focusMode?: string;
  exposureMode?: string;
  whiteBalanceMode?: string;
};

type ExtendedSupportedConstraints = MediaTrackSupportedConstraints & {
  resizeMode?: boolean;
};

type ExtendedVideoConstraints = MediaTrackConstraints & {
  resizeMode?: ConstrainDOMString;
};

export interface CameraZoomSupport {
  min: number;
  max: number;
  presets: CameraZoomPreset[];
  trackPresets: CameraZoomPreset[];
  hasVariableZoom: boolean;
}

export interface CameraZoomEvidence {
  min?: number;
  max?: number;
  step?: number;
  hasVariableZoom: boolean;
  hasUltraWideLens: boolean;
  hasTelephotoLens: boolean;
}

type ImageCaptureConstructor = new (track: MediaStreamTrack) => {
  takePhoto: () => Promise<Blob>;
};

export function getCameraVideoConstraints(
  facingMode: CameraFacingMode = 'environment',
  deviceId?: string,
): MediaTrackConstraints {
  const constraints: ExtendedVideoConstraints = {
    ...(deviceId
      ? { deviceId: { exact: deviceId } }
      : { facingMode: { ideal: facingMode } }),
    width: { ideal: 1920 },
    height: { ideal: 1440 },
    frameRate: { ideal: 30, max: 60 },
  };

  const supported = navigator.mediaDevices?.getSupportedConstraints?.() as ExtendedSupportedConstraints | undefined;
  if (supported?.resizeMode) {
    constraints.resizeMode = { ideal: 'none' };
  }

  return constraints;
}

function zoomRange(track: MediaStreamTrack): { min: number; max: number; step: number } | null {
  if (!track.getCapabilities) return null;

  const capabilities = track.getCapabilities() as ExtendedTrackCapabilities;
  const zoom = capabilities.zoom;
  if (!zoom || !Number.isFinite(zoom.min) || !Number.isFinite(zoom.max)) return null;

  return {
    min: zoom.min,
    max: zoom.max,
    step: zoom.step || 0.1,
  };
}

function normalizeLabel(label: string): string {
  return label.toLocaleLowerCase();
}

function isFrontCameraLabel(label: string): boolean {
  return /(front|facetime|user|selfie|frontal|avant|delantera)/i.test(label);
}

function isUltraWideLabel(label: string): boolean {
  return /(ultra[\s-]?wide|ultrawide|0[.,]?5x?|grand[\s-]?angle|super[\s-]?wide)/i.test(label);
}

function isTelephotoLabel(label: string): boolean {
  return /(telephoto|tele[\s-]?lens|telecamera|teleobjetivo|téléobjectif)/i.test(label);
}

export async function listVideoInputDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
  } catch {
    return [];
  }
}

function cameraCandidates(
  devices: MediaDeviceInfo[],
  facingMode: CameraFacingMode,
): MediaDeviceInfo[] {
  if (facingMode === 'user') {
    const front = devices.filter((device) => isFrontCameraLabel(normalizeLabel(device.label)));
    return front.length > 0 ? front : devices.slice(0, 1);
  }

  const rear = devices.filter((device) => !isFrontCameraLabel(normalizeLabel(device.label)));
  return rear.length > 0 ? rear : devices;
}

export function findCameraDeviceForZoom(
  devices: MediaDeviceInfo[],
  facingMode: CameraFacingMode,
  preset: CameraZoomPreset,
  currentDeviceId?: string,
): MediaDeviceInfo | null {
  const candidates = cameraCandidates(devices, facingMode);
  if (candidates.length === 0) return null;

  if (facingMode === 'user') {
    return candidates.find((device) => device.deviceId === currentDeviceId) ?? candidates[0];
  }

  if (preset === 0.5) {
    return candidates.find((device) => isUltraWideLabel(normalizeLabel(device.label))) ?? null;
  }

  if (preset >= 2) {
    const telephoto = candidates.find((device) => isTelephotoLabel(normalizeLabel(device.label)));
    if (telephoto) return telephoto;
  }

  const standardWide = candidates.find((device) => {
    const label = normalizeLabel(device.label);
    return !isUltraWideLabel(label) && !isTelephotoLabel(label);
  });

  return standardWide
    ?? candidates.find((device) => device.deviceId === currentDeviceId)
    ?? candidates[0];
}

/**
 * Pure capability mapping kept separate from browser APIs so it can be unit tested.
 * A preset is advertised only when the active track exposes that value or a
 * separately enumerated physical lens explicitly identifies the scale.
 */
export function getSupportedCameraZoomPresets(
  evidence: CameraZoomEvidence,
): { presets: CameraZoomPreset[]; trackPresets: CameraZoomPreset[] } {
  const min = evidence.min ?? 1;
  const max = evidence.max ?? 1;
  const step = evidence.step && evidence.step > 0 ? evidence.step : 0.1;
  const withinTrackRange = (preset: CameraZoomPreset) => {
    if (!evidence.hasVariableZoom || preset < min || preset > max) return false;
    const stepsFromMinimum = (preset - min) / step;
    return Math.abs(stepsFromMinimum - Math.round(stepsFromMinimum)) <= 0.001;
  };

  const trackPresets = evidence.hasVariableZoom
    ? CAMERA_ZOOM_PRESETS.filter(withinTrackRange)
    : [1] as CameraZoomPreset[];
  const presets = CAMERA_ZOOM_PRESETS.filter((preset) => {
    if (preset === 0.5) return evidence.hasUltraWideLens || withinTrackRange(preset);
    if (preset === 1) return !evidence.hasVariableZoom || withinTrackRange(preset);
    if (preset === 2) return evidence.hasTelephotoLens || withinTrackRange(preset);
    return withinTrackRange(preset);
  });

  return { presets, trackPresets };
}

export function getCameraZoomSupport(
  track: MediaStreamTrack,
  devices: MediaDeviceInfo[] = [],
  facingMode: CameraFacingMode = 'environment',
): CameraZoomSupport {
  const range = zoomRange(track);
  const candidates = cameraCandidates(devices, facingMode);
  const hasUltraWide = facingMode === 'environment'
    && candidates.some((device) => isUltraWideLabel(normalizeLabel(device.label)));
  const hasTelephoto = facingMode === 'environment'
    && candidates.some((device) => isTelephotoLabel(normalizeLabel(device.label)));
  const min = range?.min ?? 1;
  const max = range?.max ?? 1;
  const hasVariableZoom = range !== null && max > min;
  const { presets, trackPresets } = getSupportedCameraZoomPresets({
    min,
    max,
    step: range?.step,
    hasVariableZoom,
    hasUltraWideLens: hasUltraWide,
    hasTelephotoLens: hasTelephoto,
  });

  return {
    min,
    max,
    presets,
    trackPresets,
    hasVariableZoom,
  };
}

export async function applyCameraZoom(
  track: MediaStreamTrack,
  preset: CameraZoomPreset,
): Promise<boolean> {
  const range = zoomRange(track);
  if (!range || preset < range.min || preset > range.max) return false;

  const stepped = Math.round((preset - range.min) / range.step) * range.step + range.min;
  const zoom = Math.min(range.max, Math.max(range.min, stepped));

  try {
    await track.applyConstraints({
      advanced: [{ zoom } as MediaTrackConstraintSet],
    });
    return true;
  } catch {
    return false;
  }
}

export async function normalizeCameraTrack(
  track: MediaStreamTrack,
  contentHint: 'detail' | 'motion' = 'detail',
): Promise<void> {
  track.contentHint = contentHint;

  if (!track.getCapabilities || !track.applyConstraints) return;

  const capabilities = track.getCapabilities() as ExtendedTrackCapabilities;
  const advanced: ExtendedConstraintSet = {};

  if (capabilities.focusMode?.includes('continuous')) advanced.focusMode = 'continuous';
  if (capabilities.exposureMode?.includes('continuous')) advanced.exposureMode = 'continuous';
  if (capabilities.whiteBalanceMode?.includes('continuous')) {
    advanced.whiteBalanceMode = 'continuous';
  }

  if (Object.keys(advanced).length === 0) return;

  try {
    await track.applyConstraints({
      advanced: [advanced as MediaTrackConstraintSet],
    });
  } catch {
    // Advanced controls are optional; keep the high-resolution base stream.
  }
}

export function getVideoBitsPerSecond(stream: MediaStream): number {
  const settings = stream.getVideoTracks()[0]?.getSettings();
  const pixels = (settings?.width ?? 1280) * (settings?.height ?? 720);

  if (pixels >= 1920 * 1080) return 8_000_000;
  if (pixels >= 1280 * 720) return 5_000_000;
  return 3_000_000;
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Unable to encode camera photo.'))),
      'image/jpeg',
      0.98,
    );
  });
}

async function mirrorPhoto(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');

  if (!context) {
    bitmap.close();
    throw new Error('Unable to prepare camera photo.');
  }

  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvasToJpeg(canvas);
}

export async function captureHighQualityPhoto(
  stream: MediaStream,
  video: HTMLVideoElement,
  mirror: boolean,
): Promise<Blob> {
  const track = stream.getVideoTracks()[0];
  const ImageCaptureApi = (
    globalThis as typeof globalThis & { ImageCapture?: ImageCaptureConstructor }
  ).ImageCapture;

  if (track && ImageCaptureApi) {
    try {
      const photo = await new ImageCaptureApi(track).takePhoto();
      return mirror && typeof createImageBitmap === 'function'
        ? await mirrorPhoto(photo)
        : photo;
    } catch {
      // Fall back to the active video frame below.
    }
  }

  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) throw new Error('Camera is not ready yet. Please try again.');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to prepare camera photo.');

  if (mirror) {
    context.translate(width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(video, 0, 0, width, height);
  return canvasToJpeg(canvas);
}
