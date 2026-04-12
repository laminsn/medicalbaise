import { useState } from 'react';
import { Camera, X, Plus, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PortfolioItem {
  id: string;
  before_url?: string;
  after_url?: string;
  caption: string;
  category: string;
}

interface PortfolioGalleryProps {
  items: PortfolioItem[];
  editable?: boolean;
  onAdd?: (item: Omit<PortfolioItem, 'id'>) => void;
  onDelete?: (id: string) => void;
}

export function PortfolioGallery({ items, editable = false, onAdd, onDelete }: PortfolioGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  if (items.length === 0 && !editable) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          Portfolio
        </h3>
        {editable && onAdd && (
          <Button size="sm" variant="outline" onClick={() => {/* open upload dialog */}}>
            <Plus className="w-4 h-4 mr-2" /> Add Work
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary/50 transition-colors"
            onClick={() => {
              setSelectedItem(item);
              setSliderPosition(50);
            }}
          >
            <img
              src={item.after_url || item.before_url || '/placeholder.svg'}
              alt={item.caption || 'Portfolio work'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {item.before_url && item.after_url && (
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3" />
                Before/After
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-xs text-white truncate">{item.caption}</p>
            </div>
            {editable && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="absolute top-2 left-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-card rounded-xl max-w-2xl w-full p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">{selectedItem.caption}</h4>
              <button onClick={() => setSelectedItem(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedItem.before_url && selectedItem.after_url ? (
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <img
                  src={selectedItem.after_url}
                  alt="After"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img
                    src={selectedItem.before_url}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute bottom-4 left-4 right-4 w-[calc(100%-2rem)]"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  Before
                </div>
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  After
                </div>
              </div>
            ) : (
              <img
                src={selectedItem.after_url || selectedItem.before_url}
                alt={selectedItem.caption}
                className="w-full rounded-lg"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
