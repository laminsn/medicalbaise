import { useTranslation } from 'react-i18next';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { STORY_FILTERS, type StoryFilter } from '@/lib/constants/stories';
import { cn } from '@/lib/utils';

interface StoryFilterPanelProps {
  selectedFilter: StoryFilter;
  onSelectFilter: (filter: StoryFilter) => void;
  previewUrl: string | null;
  onClose: () => void;
}

export function StoryFilterPanel({ selectedFilter, onSelectFilter, previewUrl, onClose }: StoryFilterPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="py-2">
      <ScrollArea className="w-full">
        <div className="flex gap-3 px-3 pb-2">
          {STORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                onSelectFilter(filter);
                onClose();
              }}
              className="flex-shrink-0 text-center"
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                  selectedFilter.id === filter.id
                    ? "border-white scale-110 ring-2 ring-white/50"
                    : "border-white/20"
                )}
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={filter.name}
                    className="w-full h-full object-cover"
                    style={{ filter: filter.filter }}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: filter.preview }}
                  />
                )}
              </div>
              <p className={cn(
                "text-[10px] mt-1 transition-colors",
                selectedFilter.id === filter.id ? "text-white font-bold" : "text-white/60"
              )}>
                {filter.name}
              </p>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
