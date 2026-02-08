import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TEXT_FONTS, TEXT_COLORS } from '@/lib/constants/stories';
import { cn } from '@/lib/utils';

interface StoryTextPanelProps {
  onAddText: (text: string, color: string, fontSize: number, fontFamily: string) => void;
  onClose: () => void;
}

export function StoryTextPanel({ onAddText, onClose }: StoryTextPanelProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedFont, setSelectedFont] = useState(TEXT_FONTS[0]);
  const [fontSize, setFontSize] = useState(24);

  const handleAdd = () => {
    if (!text.trim()) return;
    onAddText(text.trim(), selectedColor, fontSize, selectedFont.family);
    setText('');
    onClose();
  };

  return (
    <div className="p-3 space-y-3">
      {/* Text input */}
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('stories.typeText', 'Type your text...')}
        className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
      />

      {/* Font selector */}
      <div className="flex gap-2 overflow-x-auto">
        {TEXT_FONTS.map((font) => (
          <button
            key={font.id}
            onClick={() => setSelectedFont(font)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all",
              selectedFont.id === font.id
                ? "bg-white text-black font-bold"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            )}
            style={{ fontFamily: font.family }}
          >
            {font.name}
          </button>
        ))}
      </div>

      {/* Color selector */}
      <div className="flex gap-2 items-center">
        {TEXT_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            className={cn(
              "w-7 h-7 rounded-full border-2 transition-all flex-shrink-0",
              selectedColor === color ? "border-white scale-125" : "border-white/20"
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Font size */}
      <div className="flex items-center gap-3">
        <span className="text-white/60 text-xs">Aa</span>
        <input
          type="range"
          min={14}
          max={48}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="flex-1 accent-white"
        />
        <span className="text-white/60 text-xs font-bold">AA</span>
      </div>

      {/* Preview + Add */}
      <div className="flex items-center justify-between">
        <p
          className="text-sm truncate max-w-[60%]"
          style={{ color: selectedColor, fontFamily: selectedFont.family, fontSize: `${Math.min(fontSize, 20)}px` }}
        >
          {text || 'Preview'}
        </p>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!text.trim()}
          className="bg-white text-black hover:bg-white/90"
        >
          {t('stories.addText', 'Add Text')}
        </Button>
      </div>
    </div>
  );
}
