import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { Button } from '@/components/ui/button';

type SignaturePadProps = {
  value?: string;
  onChange: (value: string) => void;
  height?: number;
  disabled?: boolean;
  clearLabel?: string;
  placeholder?: string;
};

export function SignaturePad({
  value,
  onChange,
  height = 160,
  disabled = false,
  clearLabel = 'Clear',
  placeholder = 'Sign here',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const scale = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    canvas.width = width * scale;
    canvas.height = height * scale;
    context.scale(scale, scale);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2.5;
    context.strokeStyle = '#111827';

    if (value) {
      const image = new Image();
      image.onload = () => {
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
      };
      image.src = value;
    }
  }, [height, value]);

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const point = getPoint(event);
    isDrawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (disabled || !isDrawingRef.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-lg border bg-background">
        {!value && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="block w-full touch-none"
          style={{ height }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          aria-label={placeholder}
        />
      </div>
      <Button type="button" size="sm" variant="outline" onClick={clear} disabled={disabled || !value}>
        {clearLabel}
      </Button>
    </div>
  );
}
