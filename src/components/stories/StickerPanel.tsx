import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { STICKER_CATEGORIES } from '@/lib/constants/stories';
import { cn } from '@/lib/utils';

interface StickerPanelProps {
  onAddSticker: (emoji: string) => void;
  onClose: () => void;
}

export function StickerPanel({ onAddSticker, onClose }: StickerPanelProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="p-3 space-y-2">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {STICKER_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            className={cn(
              "px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all",
              activeCategory === i
                ? "bg-white text-black font-bold"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-1">
        {STICKER_CATEGORIES[activeCategory].emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onAddSticker(emoji);
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-white/10 active:scale-90 transition-all"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
