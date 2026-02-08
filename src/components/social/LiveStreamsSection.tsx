import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Users, Stethoscope, MapPin, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { LiveStreamViewer } from './LiveStreamViewer';
import { LiveStream } from '@/hooks/useLiveStream';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LiveStreamsSectionProps {
  specialtyFilter?: string | null;
  locationFilter?: string | null;
}

// Mock live streams for demo purposes - medical themed
const MOCK_LIVE_STREAMS: LiveStream[] = [
  {
    id: '1',
    providerId: 'provider-1',
    providerName: 'Dr. Maria Silva',
    title: 'Cardiologia: Prevenção de Doenças',
    description: 'Discussão ao vivo sobre saúde cardiovascular',
    viewerCount: 234,
    startedAt: new Date(),
    isLive: true,
    specialty: 'Cardiologia',
    location: 'SP'
  },
  {
    id: '2',
    providerId: 'provider-2',
    providerName: 'Dr. Carlos Santos',
    title: 'Dermatologia: Cuidados com a Pele',
    description: 'Rotina diária recomendada para pele saudável',
    viewerCount: 156,
    startedAt: new Date(),
    isLive: true,
    specialty: 'Dermatologia',
    location: 'RJ'
  },
  {
    id: '3',
    providerId: 'provider-3',
    providerName: 'Dra. Ana Costa',
    title: 'Pediatria: Nutrição Infantil',
    description: 'Dicas de alimentação saudável para crianças',
    viewerCount: 89,
    startedAt: new Date(),
    isLive: true,
    specialty: 'Pediatria',
    location: 'MG'
  },
  {
    id: '4',
    providerId: 'provider-4',
    providerName: 'Dr. Roberto Lima',
    title: 'Ortopedia: Postura no Trabalho',
    description: 'Como evitar lesões no home office',
    viewerCount: 145,
    startedAt: new Date(),
    isLive: true,
    specialty: 'Ortopedia',
    location: 'SP'
  }
];

export function LiveStreamsSection({ specialtyFilter, locationFilter }: LiveStreamsSectionProps) {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuth();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>(MOCK_LIVE_STREAMS);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);

  // Filter streams based on specialty and location
  const filteredStreams = liveStreams.filter((stream) => {
    if (specialtyFilter && stream.specialty !== specialtyFilter) {
      // For demo, we use specialty name matching
      return false;
    }
    if (locationFilter && stream.location !== locationFilter) {
      return false;
    }
    return true;
  });

  // In production, fetch real live streams
  useEffect(() => {
    // For now, use mock data
    // In production, subscribe to realtime channel to get active streams
  }, []);

  if (filteredStreams.length === 0) {
    return null;
  }

  return (
    <>
      <section className="py-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Video className="h-5 w-5 text-red-500" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            </div>
            <h2 className="font-bold text-lg">{t('liveStream.liveNow', 'Transmissões Ao Vivo')}</h2>
            <Badge variant="destructive" className="text-xs animate-pulse">
              {filteredStreams.length} {t('liveStream.live', 'AO VIVO')}
            </Badge>
          </div>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-4 px-4 pb-3">
            {filteredStreams.map((stream) => (
              <button
                key={stream.id}
                onClick={() => setSelectedStream(stream)}
                className="flex-shrink-0 w-44 group"
              >
                {/* Avatar with live ring */}
                <div className="relative mx-auto mb-2">
                  <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-r from-red-500 via-pink-500 to-red-500 animate-pulse">
                    <div className="w-full h-full rounded-full bg-card p-[2px]">
                      <Avatar className="w-full h-full">
                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                          {stream.providerName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  
                  {/* Live badge */}
                  <Badge 
                    variant="destructive" 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0 font-bold"
                  >
                    <span className="animate-pulse">●</span> LIVE
                  </Badge>
                </div>
                
                {/* Stream info */}
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                    {stream.providerName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate px-1">
                    {stream.title}
                  </p>
                  
                  {/* Specialty & Location badges */}
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {stream.specialty && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                        <Stethoscope className="h-2.5 w-2.5" />
                        {stream.specialty}
                      </Badge>
                    )}
                    {stream.location && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        {stream.location}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span className="font-medium">{stream.viewerCount}</span>
                    <span>{t('liveStream.watching', 'assistindo')}</span>
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
          userName={profile?.first_name || t('liveStream.guest', 'Convidado')}
        />
      )}
    </>
  );
}
