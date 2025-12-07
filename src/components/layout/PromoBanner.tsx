import { X } from 'lucide-react';
import { useState } from 'react';

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const bannerText = '🎉 New Providers: First 14 Days FREE! | 💰 December Special: First Transaction Fee Waived! | 🎁 Annual Plans: Get 2 Months FREE!';

  return (
    <div className="bg-gradient-to-r from-destructive via-destructive/90 to-primary text-white py-1.5 px-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-marquee whitespace-nowrap inline-block">
            <span className="text-sm font-semibold mx-8">{bannerText}</span>
            <span className="text-sm font-semibold mx-8">{bannerText}</span>
            <span className="text-sm font-semibold mx-8">{bannerText}</span>
            <span className="text-sm font-semibold mx-8">{bannerText}</span>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 hover:bg-white/20 rounded-full p-0.5 transition-colors flex-shrink-0"
          aria-label="Close banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
