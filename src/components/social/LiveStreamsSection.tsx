import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Users, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { LiveStreamViewer } from './LiveStreamViewer';
import { LiveStream } from '@/hooks/useLiveStream';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Mock live streams for demo purposes
const MOCK_LIVE_STREAMS: LiveStream[] = [
  {
    id: '1',
    providerId: 'provider-1',
    providerName: 'Dr. Maria Silva',
    title: 'Q&A: Heart Health Tips',
    description: 'Live discussion about cardiovascular health',
    viewerCount: 234,
    startedAt: new Date(),
    isLive: true
  },
  {
    id: '2',
    providerId: 'provider-2',
    providerName: 'Dr. Carlos Santos',
    title: 'Skin Care Routine Demo',
    description: 'Showing my recommended daily routine',
    viewerCount: 156,
    startedAt: new Date(),
    isLive: true
  },
  {
    id: '3',
    providerId: 'provider-3',
    providerName: 'Dra. Ana Costa',
    title: 'Pediatric Nutrition Talk',
    description: 'Tips for healthy eating for kids',
    viewerCount: 89,
    startedAt: new Date(),
    isLive: true
  }
];

export function LiveStreamsSection() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>(MOCK_LIVE_STREAMS);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  // In production, fetch real live streams
  useEffect(() => {
    // For now, use mock data
    // In production, subscribe to realtime channel to get active streams
  }, []);

  if (liveStreams.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-4">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-red-500" />
            <h2 className="font-bold text-lg">Live Now</h2>
            <Badge variant="destructive" className="text-xs">
              {liveStreams.length}
            </Badge>
          </div>
          <button className="text-primary text-sm font-medium flex items-center gap-1">
            See All <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-3 px-4 pb-2">
            {liveStreams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => setSelectedStream(stream)}
                className="flex-shrink-0 w-40 group"
              >
                {/* Avatar with live ring */}
                <div className="relative mx-auto mb-2">
                  <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-r from-red-500 via-pink-500 to-red-500 animate-pulse">
                    <div className="w-full h-full rounded-full bg-card p-[2px]">
                      <Avatar className="w-full h-full">
                        <AvatarFallback className="text-lg">
                          {stream.providerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  
                  {/* Live badge */}
                  <Badge 
                    variant="destructive" 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0"
                  >
                    LIVE
                  </Badge>
                </div>
                
                {/* Stream info */}
                <div className="text-center">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {stream.providerName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {stream.title}
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {stream.viewerCount}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* Stream Viewer Dialog */}
      {selectedStream && (
        <LiveStreamViewer
          open={!!selectedStream}
          onOpenChange={(open) => !open && setSelectedStream(null)}
          stream={selectedStream}
          userId={user?.id || 'anonymous'}
          userName={profile?.first_name || 'Guest'}
        />
      )}
    </>
  );
}
