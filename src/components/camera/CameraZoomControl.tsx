import { type CameraZoomPreset } from '@/lib/camera';
import { cn } from '@/lib/utils';

interface CameraZoomControlProps {
  value: CameraZoomPreset;
  supportedPresets: CameraZoomPreset[];
  disabled?: boolean;
  onChange: (preset: CameraZoomPreset) => void;
  unsupportedLabel?: string;
  className?: string;
}

function formatZoom(preset: CameraZoomPreset): string {
  return preset === 0.5 ? '.5' : `${preset}×`;
}

export function CameraZoomControl({
  value,
  supportedPresets,
  disabled = false,
  onChange,
  unsupportedLabel = 'Zoom is not supported by this camera',
  className,
}: CameraZoomControlProps) {
  const visiblePresets = Array.from(new Set(supportedPresets));

  if (visiblePresets.length <= 1) {
    return (
      <div
        className={cn(
          'rounded-full border border-white/10 bg-black/55 px-3 py-2 text-xs font-medium text-white/70 shadow-lg backdrop-blur-md',
          className,
        )}
        role="status"
      >
        {unsupportedLabel}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1 rounded-full border border-white/10 bg-black/55 p-1.5 shadow-lg backdrop-blur-md',
        className,
      )}
      role="group"
      aria-label="Camera zoom"
    >
      {visiblePresets.map((preset) => {
        const selected = value === preset;

        return (
          <button
            key={preset}
            type="button"
            disabled={disabled}
            onClick={() => onChange(preset)}
            className={cn(
              'grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-semibold tabular-nums outline-none',
              'transition-[transform,background-color,color,opacity] duration-150 ease-out active:scale-[0.96]',
              'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              selected
                ? 'scale-110 bg-white text-black shadow-md'
                : 'text-white hover:bg-white/15',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            aria-label={`${formatZoom(preset)} zoom`}
            aria-pressed={selected}
            title={`${formatZoom(preset)} zoom`}
          >
            {formatZoom(preset)}
          </button>
        );
      })}
    </div>
  );
}
