import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Camera, RotateCcw, Image, Type, Smile, Sparkles,
  Send, Trash2, SwitchCamera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useStories } from '@/hooks/useStories';
import { useCameraRecorder } from '@/hooks/useCameraRecorder';
import {
  STORY_FILTERS,
  GRADIENT_BACKGROUNDS,
  MAX_STORY_VIDEO_DURATION,
  type StoryFilter,
  type TextOverlay,
  type StickerOverlay,
} from '@/lib/constants/stories';
import { StoryFilterPanel } from './StoryFilterPanel';
import { StoryTextPanel } from './StoryTextPanel';
import { StickerPanel } from './StickerPanel';

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CaptureMode = 'normal' | 'create' | 'gallery';
type EditorMode = 'capture' | 'edit';
type ToolMode = 'none' | 'filter' | 'text' | 'sticker';

export function CreateStoryDialog({ open, onOpenChange }: CreateStoryDialogProps) {
  const { t } = useTranslation();
  const { uploadStory, isUploading } = useStories();
  const [captureMode, setCaptureMode] = useState<CaptureMode>('normal');
  const [mode, setMode] = useState<EditorMode>('capture');
  const [toolMode, setToolMode] = useState<ToolMode>('none');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<StoryFilter>(STORY_FILTERS[0]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickers, setStickers] = useState<StickerOverlay[]>([]);

  // Text-only story state
  const [textStoryContent, setTextStoryContent] = useState('');
  const [textStoryBgIndex, setTextStoryBgIndex] = useState(0);
  const [textStoryFontSize, setTextStoryFontSize] = useState(28);

  // Long press for video recording
  const longPressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);

  // Drag state
  const [activeDrag, setActiveDrag] = useState<{ kind: 'text' | 'sticker'; id: string } | null>(null);
  const dragRef = useRef<{
    target: { kind: 'text' | 'sticker'; id: string };
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const textOverlaysRef = useRef<TextOverlay[]>([]);
  const stickersRef = useRef<StickerOverlay[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const {
    isRecording,
    isPreviewing,
    duration,
    recordedUrl,
    recordedBlob,
    facingMode,
    startPreview,
    stopPreview,
    startRecording,
    stopRecording,
    flipCamera,
    cleanup: cleanupCamera,
  } = useCameraRecorder();

  // Keep refs in sync
  useEffect(() => { textOverlaysRef.current = textOverlays; }, [textOverlays]);
  useEffect(() => { stickersRef.current = stickers; }, [stickers]);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  // Auto-start camera
  useEffect(() => {
    if (open && captureMode === 'normal' && mode === 'capture' && !isPreviewing && videoRef.current) {
      startPreview(videoRef.current).catch(() => {});
    }
  }, [open, captureMode, mode]);

  // Auto-stop at max duration
  useEffect(() => {
    if (isRecording && duration >= MAX_STORY_VIDEO_DURATION) {
      stopRecording();
    }
  }, [isRecording, duration, stopRecording]);

  // ─── Drag handlers ───
  const startDrag = useCallback(
    (target: { kind: 'text' | 'sticker'; id: string }) => (e: React.PointerEvent) => {
      const container = canvasRef.current;
      if (!container) return;
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const item = target.kind === 'text'
        ? textOverlaysRef.current.find(t => t.id === target.id)
        : stickersRef.current.find(s => s.id === target.id);
      if (!item) return;

      const itemX = rect.left + (item.x / 100) * rect.width;
      const itemY = rect.top + (item.y / 100) * rect.height;

      dragRef.current = { target, offsetX: e.clientX - itemX, offsetY: e.clientY - itemY };
      setActiveDrag(target);
    },
    [],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const container = canvasRef.current;
      if (!drag || !container) return;

      const rect = container.getBoundingClientRect();
      const x = clamp(((e.clientX - rect.left - drag.offsetX) / rect.width) * 100, 0, 100);
      const y = clamp(((e.clientY - rect.top - drag.offsetY) / rect.height) * 100, 0, 100);

      if (drag.target.kind === 'text') {
        setTextOverlays(prev => prev.map(t => t.id === drag.target.id ? { ...t, x, y } : t));
      } else {
        setStickers(prev => prev.map(s => s.id === drag.target.id ? { ...s, x, y } : s));
      }
    };
    const onUp = () => { dragRef.current = null; setActiveDrag(null); };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  // ─── File select ───
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMode('edit');
    stopPreview();
  };

  // ─── Shutter: tap = photo, hold = video ───
  const handleShutterDown = useCallback(() => {
    if (!isPreviewing || !videoRef.current) return;
    isLongPress.current = false;
    longPressTimer.current = window.setTimeout(async () => {
      isLongPress.current = true;
      try { await startRecording(); } catch {}
    }, 300);
  }, [isPreviewing, startRecording]);

  const handleShutterUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isRecording) {
      stopRecording();
    } else if (!isLongPress.current && isPreviewing && videoRef.current) {
      // Quick tap → capture photo
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0);
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          setMediaFile(file);
          setMediaType('image');
          setPreviewUrl(URL.createObjectURL(blob));
          setMode('edit');
          stopPreview();
        }
      }, 'image/jpeg', 0.92);
    }
  }, [isRecording, isPreviewing, stopRecording, stopPreview, facingMode]);

  // When recording finishes → go to edit
  useEffect(() => {
    if (recordedBlob && recordedUrl && !isRecording) {
      const file = new File([recordedBlob], 'video.webm', { type: recordedBlob.type });
      setMediaFile(file);
      setMediaType('video');
      setPreviewUrl(recordedUrl);
      setMode('edit');
      stopPreview();
    }
  }, [recordedBlob, recordedUrl, isRecording, stopPreview]);

  // ─── Text story publish ───
  const handleTextStoryPublish = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw gradient
    const gradient = GRADIENT_BACKGROUNDS[textStoryBgIndex];
    const colorMatch = gradient.match(/#[0-9a-fA-F]{6}/g);
    if (colorMatch && colorMatch.length >= 2) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, colorMatch[0]);
      grad.addColorStop(1, colorMatch[1]);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#1a1a2e';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text with word-wrap
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${textStoryFontSize * 3}px sans-serif`;

    const words = textStoryContent.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = canvas.width - 120;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = textStoryFontSize * 3.5;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
    });

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'text-story.jpg', { type: 'image/jpeg' });
        await uploadStory(file, 'image', {
          durationSeconds: 5,
          backgroundGradient: GRADIENT_BACKGROUNDS[textStoryBgIndex],
        });
        handleClose();
      }
    }, 'image/jpeg', 0.92);
  };

  // ─── Overlay handlers ───
  const handleAddText = (text: string, color: string, fontSize: number, fontFamily: string) => {
    setTextOverlays(prev => [...prev, {
      id: crypto.randomUUID(), text, x: 50, y: 50, fontSize, color, fontFamily, rotation: 0,
    }]);
    setToolMode('none');
  };

  const handleAddSticker = (emoji: string) => {
    setStickers(prev => [...prev, {
      id: crypto.randomUUID(), emoji, x: 50, y: 50, scale: 1, rotation: 0,
    }]);
  };

  const handleRemoveText = (id: string) => setTextOverlays(prev => prev.filter(t => t.id !== id));
  const handleRemoveSticker = (id: string) => setStickers(prev => prev.filter(s => s.id !== id));

  // ─── Publish media story ───
  const handlePublish = async () => {
    if (!mediaFile) return;
    await uploadStory(mediaFile, mediaType, {
      textOverlays,
      stickers,
      filter: selectedFilter.filter !== 'none' ? selectedFilter.filter : undefined,
      durationSeconds: mediaType === 'video' ? Math.min(duration || 15, 60) : 5,
    });
    handleClose();
  };

  // ─── Lifecycle ───
  const handleClose = () => {
    cleanupCamera();
    setMode('capture');
    setCaptureMode('normal');
    setToolMode('none');
    setMediaFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFilter(STORY_FILTERS[0]);
    setTextOverlays([]);
    setStickers([]);
    setTextStoryContent('');
    setTextStoryBgIndex(0);
    onOpenChange(false);
  };

  const handleReset = () => {
    setMode('capture');
    setMediaFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFilter(STORY_FILTERS[0]);
    setTextOverlays([]);
    setStickers([]);
  };

  // Recording progress ring
  const recordingProgress = isRecording ? Math.min(duration / MAX_STORY_VIDEO_DURATION, 1) : 0;
  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference * (1 - recordingProgress);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-[420px] h-[90vh] max-h-[800px] p-0 overflow-hidden bg-black border-0 rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>{t('stories.create', 'Create Story')}</DialogTitle>
          <DialogDescription>{t('stories.createDesc', 'Capture or upload media')}</DialogDescription>
        </VisuallyHidden>

        <div className="h-full flex flex-col relative">
          {/* ─── CAPTURE MODE ─── */}
          {mode === 'capture' && (
            <>
              <div className="flex-1 relative bg-black overflow-hidden">
                {/* Normal (Camera) Mode */}
                {captureMode === 'normal' && (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={cn(
                        "absolute inset-0 w-full h-full object-contain",
                        facingMode === 'user' && "scale-x-[-1]"
                      )}
                    />

                    {!isPreviewing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="text-center text-white/60">
                          <Camera className="h-12 w-12 mx-auto mb-2 animate-pulse" />
                          <p className="text-sm">{t('stories.startingCamera', 'Starting camera...')}</p>
                        </div>
                      </div>
                    )}

                    {/* Top controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                      <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20">
                        <X className="h-6 w-6" />
                      </Button>
                      <div className="flex gap-1">
                        {isPreviewing && (
                          <Button variant="ghost" size="icon" onClick={flipCamera} className="text-white hover:bg-white/20">
                            <SwitchCamera className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Recording indicator */}
                    {isRecording && (
                      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-white text-sm font-mono font-bold">
                          {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    )}

                    {/* Bottom: shutter + gallery */}
                    <div className="absolute bottom-20 left-0 right-0 flex items-center justify-center gap-8 z-10">
                      {/* Gallery */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 rounded-lg border-2 border-white/60 bg-white/20 backdrop-blur-sm flex items-center justify-center"
                      >
                        <Image className="h-5 w-5 text-white" />
                      </button>

                      {/* Shutter button */}
                      <button
                        onPointerDown={handleShutterDown}
                        onPointerUp={handleShutterUp}
                        onPointerLeave={handleShutterUp}
                        className="relative w-20 h-20 flex items-center justify-center"
                      >
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="38" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                          {isRecording && (
                            <circle
                              cx="40" cy="40" r="38" fill="none" stroke="#EF4444" strokeWidth="3"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              className="transition-all duration-1000"
                            />
                          )}
                        </svg>
                        <div className={cn(
                          "rounded-full border-4 border-white transition-all duration-200",
                          isRecording ? "w-8 h-8 bg-red-500 rounded-md" : "w-16 h-16 bg-white/20"
                        )} />
                      </button>

                      {/* Flip camera */}
                      <button onClick={flipCamera} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <SwitchCamera className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </>
                )}

                {/* Create (Text-only) Mode */}
                {captureMode === 'create' && (
                  <>
                    <div
                      className="absolute inset-0 flex items-center justify-center p-8"
                      style={{ background: GRADIENT_BACKGROUNDS[textStoryBgIndex] }}
                    >
                      <textarea
                        value={textStoryContent}
                        onChange={(e) => setTextStoryContent(e.target.value)}
                        placeholder={t('stories.typeSomething', 'Type something...')}
                        className="bg-transparent text-white text-center font-bold placeholder:text-white/50 resize-none outline-none w-full max-w-xs"
                        style={{ fontSize: `${textStoryFontSize}px`, lineHeight: 1.3 }}
                        rows={5}
                        autoFocus
                      />
                    </div>

                    {/* Top controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                      <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20">
                        <X className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => setTextStoryFontSize(prev => prev >= 42 ? 18 : prev + 6)}
                        className="text-white hover:bg-white/20 font-bold text-xs"
                      >
                        Aa
                      </Button>
                    </div>

                    {/* Gradient picker */}
                    <div className="absolute bottom-20 left-0 right-0 z-10 px-4">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {GRADIENT_BACKGROUNDS.map((bg, i) => (
                          <button
                            key={i}
                            onClick={() => setTextStoryBgIndex(i)}
                            className={cn(
                              "w-8 h-8 rounded-full transition-all border-2",
                              i === textStoryBgIndex ? "border-white scale-110" : "border-white/30"
                            )}
                            style={{ background: bg }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Publish text story */}
                    <div className="absolute bottom-24 right-4 z-10">
                      <Button
                        onClick={handleTextStoryPublish}
                        disabled={!textStoryContent.trim() || isUploading}
                        className="rounded-full bg-white text-black hover:bg-white/90"
                        size="icon"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </>
                )}

                {/* Gallery mode */}
                {captureMode === 'gallery' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="text-center text-white/60">
                      <Image className="h-12 w-12 mx-auto mb-3" />
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="border-white/30 text-white hover:bg-white/10">
                        {t('stories.chooseFromGallery', 'Choose from Gallery')}
                      </Button>
                    </div>
                    <div className="absolute top-4 left-4">
                      <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20">
                        <X className="h-6 w-6" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mode tabs */}
              <div className="bg-black/90 flex items-center justify-center gap-8 py-4 px-4">
                {[
                  { key: 'normal' as CaptureMode, label: t('stories.normal', 'Normal') },
                  { key: 'create' as CaptureMode, label: t('stories.createText', 'Create') },
                  { key: 'gallery' as CaptureMode, label: t('stories.gallery', 'Gallery') },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setCaptureMode(tab.key);
                      if (tab.key === 'gallery') setTimeout(() => fileInputRef.current?.click(), 100);
                    }}
                    className={cn(
                      "text-sm font-semibold transition-colors pb-1 border-b-2",
                      captureMode === tab.key
                        ? "text-white border-white"
                        : "text-white/50 border-transparent hover:text-white/70"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ─── EDIT MODE ─── */}
          {mode === 'edit' && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-3 z-10">
                <Button variant="ghost" size="icon" onClick={handleReset} className="text-white hover:bg-white/20">
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setToolMode(toolMode === 'text' ? 'none' : 'text')}
                    className={cn("text-white hover:bg-white/20 rounded-full", toolMode === 'text' && "bg-white/20")}
                  >
                    <Type className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setToolMode(toolMode === 'sticker' ? 'none' : 'sticker')}
                    className={cn("text-white hover:bg-white/20 rounded-full", toolMode === 'sticker' && "bg-white/20")}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => setToolMode(toolMode === 'filter' ? 'none' : 'filter')}
                    className={cn("text-white hover:bg-white/20 rounded-full", toolMode === 'filter' && "bg-white/20")}
                  >
                    <Sparkles className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Canvas */}
              <div ref={canvasRef} className="flex-1 relative overflow-hidden mx-3 rounded-xl">
                {mediaType === 'image' ? (
                  <img
                    src={previewUrl!}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    style={{ filter: selectedFilter.filter }}
                  />
                ) : (
                  <video
                    src={previewUrl!}
                    autoPlay loop muted playsInline
                    className="w-full h-full object-contain"
                    style={{ filter: selectedFilter.filter }}
                  />
                )}

                {/* Text Overlays */}
                {textOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    onPointerDown={startDrag({ kind: 'text', id: overlay.id })}
                    className="absolute cursor-move group touch-none select-none"
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <span
                      className="px-2 py-1 rounded drop-shadow-lg whitespace-nowrap"
                      style={{
                        color: overlay.color,
                        fontSize: `${overlay.fontSize}px`,
                        fontFamily: overlay.fontFamily,
                        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      }}
                    >
                      {overlay.text}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveText(overlay.id); }}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}

                {/* Stickers */}
                {stickers.map((sticker) => (
                  <div
                    key={sticker.id}
                    onPointerDown={startDrag({ kind: 'sticker', id: sticker.id })}
                    className="absolute cursor-move group touch-none select-none"
                    style={{
                      left: `${sticker.x}%`,
                      top: `${sticker.y}%`,
                      transform: `translate(-50%, -50%) scale(${sticker.scale})`,
                      fontSize: '2rem',
                    }}
                  >
                    {sticker.emoji}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveSticker(sticker.id); }}
                      className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Tools Panel */}
              <div className="mt-auto">
                {toolMode === 'filter' && (
                  <StoryFilterPanel
                    selectedFilter={selectedFilter}
                    onSelectFilter={setSelectedFilter}
                    previewUrl={previewUrl}
                    onClose={() => setToolMode('none')}
                  />
                )}

                {toolMode === 'text' && (
                  <StoryTextPanel onAddText={handleAddText} onClose={() => setToolMode('none')} />
                )}

                {toolMode === 'sticker' && (
                  <StickerPanel onAddSticker={handleAddSticker} onClose={() => setToolMode('none')} />
                )}

                {/* Publish bar */}
                <div className="flex items-center justify-between p-3 gap-3">
                  <Button variant="ghost" onClick={handleReset} className="text-white/70 hover:text-white hover:bg-white/10">
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t('common.discard', 'Discard')}
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={isUploading}
                    className="bg-white text-black hover:bg-white/90 rounded-full px-6"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isUploading ? t('stories.publishing', 'Publishing...') : t('stories.yourStory', 'Your Story')}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
