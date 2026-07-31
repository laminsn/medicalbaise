import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Finger or trackpad signature.
 *
 * Optional by design: the checkbox above it is the operative acceptance, so a
 * device that cannot draw must never block someone from joining. This adds a
 * personal mark to the record, nothing more.
 *
 * Pointer events cover mouse, pen and touch in one path. touch-action: none
 * stops the browser scrolling the page while a finger is drawing on it.
 */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const dirty = useRef(false);
  const [hasMark, setHasMark] = useState(false);

  // Back the canvas at device resolution so the line is not soft on mobile.
  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // currentColor equivalent: read the resolved text colour so the stroke
    // stays legible in both themes.
    ctx.strokeStyle = getComputedStyle(canvas).color || '#000';
  }, []);

  useEffect(() => {
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
    return () => window.removeEventListener('resize', sizeCanvas);
  }, [sizeCanvas]);

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pointFrom(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pointFrom(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!dirty.current) { dirty.current = true; setHasMark(true); }
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas || !dirty.current) return;
    onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    dirty.current = false;
    setHasMark(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        onPointerCancel={end}
        className="h-32 w-full cursor-crosshair rounded-md border border-dashed bg-background text-foreground"
        style={{ touchAction: 'none' }}
        aria-label={t('pilot.signature.label', 'Assine com o dedo ou o mouse')}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hasMark
            ? t('pilot.signature.done', 'Assinatura registrada.')
            : t('pilot.signature.hint', 'Opcional — assine com o dedo ou o mouse.')}
        </p>
        {hasMark && (
          <Button type="button" size="sm" variant="ghost" onClick={clear}>
            <Eraser className="mr-1.5 h-3.5 w-3.5" />
            {t('pilot.signature.clear', 'Limpar')}
          </Button>
        )}
      </div>
    </div>
  );
}
