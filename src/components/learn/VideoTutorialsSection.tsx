import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlayCircle, Clock, Eye, ThumbsUp, Share2, BookmarkPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VideoTutorialsSectionProps {
  searchQuery: string;
}

const videoCategories = [
  { id: 'all', label: 'All Videos' },
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'features', label: 'Feature Deep Dives' },
  { id: 'tips', label: 'Tips & Tricks' },
  { id: 'webinars', label: 'Webinars' },
];

const videos = [
  {
    id: 1,
    title: 'MDBaise Platform Overview',
    description: 'A comprehensive introduction to all the features and capabilities of the MDBaise platform.',
    category: 'quickstart',
    duration: '8:45',
    views: 12500,
    likes: 890,
    thumbnail: '/placeholder.svg',
    videoUrl: '#',
    featured: true,
  },
  {
    id: 2,
    title: 'Finding the Right Doctor for You',
    description: 'Learn how to use search filters, compare providers, and make informed decisions.',
    category: 'quickstart',
    duration: '5:20',
    views: 8900,
    likes: 654,
    thumbnail: '/placeholder.svg',
    videoUrl: '#',
  },
  {
    id: 3,
    title: 'Your First Teleconsultation',
    description: 'Everything you need to know before, during, and after your video consultation.',
    category: 'quickstart',
    duration: '6:30',
    views: 7500,
    likes: 521,
    thumbnail: '/placeholder.svg',
    videoUrl: '#',
  },
  {
    id: 4,
    title: 'Provider Dashboard Masterclass',
    description: 'For healthcare providers: maximize your presence and manage your practice efficiently.',
    category: 'features',
    duration: '15:00',
    views: 5200,
    likes: 412,
    thumbnail: '/placeholder.svg',
    videoUrl: '#',
    featured: true,
  },
  {
    id: 5,
    title: 'Advanced Search & Filters',
    description: 'Discover hidden search features to find exactly what you\'re looking for.',
    category: 'features',
    duration: '4:15',
    views: 3800,
    likes: 287,
    thumbnail: '/placeholder.svg',
    videoUrl: '#',
  },
  {
    id: 6,
    title: 'Managing Your Medical History',
    description: 'Keep track of appointments, prescriptions, and health records in one place.',
    category: 'features',
    duration: '7:00',
    views: 4100,
    likes: 298,
    thumbnail: '/placeholder.svg',
    videoUrl: '#',
  },
  {
    id: 7,
    title: '5 Tips for Better Teleconsultations',
    description: 'Quick tips to get the most out of your virtual doctor visits.',
    category: 'tips',
    duration: '3:30',
    views: 6700,
    likes: 534,
    thumbnail: '/placeholder.svg',
    videoUrl: '#',
  },
  {
    id: 8,
    title: 'Provider Pro Tips: Winning More Patients',
    description: 'Proven strategies to grow your patient base on MDBaise.',
    category: 'tips',
    duration: '9:15',
    views: 4500,
    likes: 378,
    thumbnail: '/placeholder.svg',
    videoUrl: '#',
  },
  {
    id: 9,
    title: 'Monthly Feature Update - December 2024',
    description: 'All the new features and improvements released this month.',
    category: 'webinars',
    duration: '25:00',
    views: 2100,
    likes: 156,
    thumbnail: '/placeholder.svg',
    videoUrl: '#',
    isNew: true,
  },
  {
    id: 10,
    title: 'Ask the Experts: Healthcare Q&A',
    description: 'Live Q&A session with top-rated providers on the platform.',
    category: 'webinars',
    duration: '45:00',
    views: 3200,
    likes: 245,
    thumbnail: '/placeholder.svg',
    videoUrl: '#',
  },
];

export function VideoTutorialsSection({ searchQuery }: VideoTutorialsSectionProps) {
  const { i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVideo, setSelectedVideo] = useState<typeof videos[0] | null>(null);

  const videoCategoryLabels: Record<string, { en: string; pt: string }> = {
    all: { en: 'All Videos', pt: 'Todos os vídeos' },
    quickstart: { en: 'Quick Start', pt: 'Início rápido' },
    features: { en: 'Feature Deep Dives', pt: 'Recursos em profundidade' },
    tips: { en: 'Tips & Tricks', pt: 'Dicas e truques' },
    webinars: { en: 'Webinars', pt: 'Webinars' },
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredVideos = filteredVideos.filter((v) => v.featured);
  const regularVideos = filteredVideos.filter((v) => !v.featured);

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <div className="space-y-8">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {videoCategories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
            className={
              selectedCategory === cat.id
                ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                : 'border-border/50 hover:border-cyan-500/30 hover:text-cyan-400'
            }
          >
            {isPt ? (videoCategoryLabels[cat.id]?.pt ?? cat.label) : (videoCategoryLabels[cat.id]?.en ?? cat.label)}
          </Button>
        ))}
      </div>

      {/* Featured Videos */}
      {featuredVideos.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">{isPt ? 'Destaques' : 'Featured'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {featuredVideos.map((video) => (
              <Card
                key={video.id}
                className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-all cursor-pointer group overflow-hidden"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-background/80">
                    <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                    {video.duration}
                  </div>
                  {video.isNew && (
                    <Badge className="absolute top-2 left-2 bg-cyan-500 text-white">NEW</Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-foreground mb-1 group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {video.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {video.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatViews(video.views)} {isPt ? 'visualizações' : 'views'}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {video.likes}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Regular Videos */}
      <div>
        {featuredVideos.length > 0 && <h3 className="text-lg font-semibold mb-4">{isPt ? 'Todos os vídeos' : 'All Videos'}</h3>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularVideos.map((video) => (
            <Card
              key={video.id}
              className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-all cursor-pointer group overflow-hidden"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="relative aspect-video bg-muted">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-background/60">
                  <div className="w-12 h-12 bg-cyan-500/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white">
                  {video.duration}
                </div>
                {video.isNew && (
                  <Badge className="absolute top-2 left-2 bg-cyan-500 text-white text-xs">NEW</Badge>
                )}
              </div>
              <CardContent className="p-3">
                <h4 className="font-medium text-sm text-foreground mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">
                  {video.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatViews(video.views)} {isPt ? 'visualizações' : 'views'}</span>
                  <span className="capitalize">
                    {isPt ? (videoCategoryLabels[video.category]?.pt ?? video.category) : (videoCategoryLabels[video.category]?.en ?? video.category)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{isPt ? 'Nenhum vídeo encontrado para sua busca' : 'No videos found matching your search'}</p>
        </div>
      )}

      {/* Video Player Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl bg-background border-border">
          {selectedVideo && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedVideo.title}</DialogTitle>
              </DialogHeader>

              {/* Video Player Placeholder */}
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cyan-500/20 to-background/80">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-105 transition-transform">
                      <PlayCircle className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-sm text-muted-foreground">{isPt ? 'Espaço para player de vídeo' : 'Video player placeholder'}</p>
                    <p className="text-xs text-muted-foreground">{isPt ? 'Duração' : 'Duration'}: {selectedVideo.duration}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatViews(selectedVideo.views)} {isPt ? 'visualizações' : 'views'}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    {selectedVideo.likes} {isPt ? 'curtidas' : 'likes'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="border-border/50">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    {isPt ? 'Curtir' : 'Like'}
                  </Button>
                  <Button variant="outline" size="sm" className="border-border/50">
                    <BookmarkPlus className="w-4 h-4 mr-2" />
                    {isPt ? 'Salvar' : 'Save'}
                  </Button>
                  <Button variant="outline" size="sm" className="border-border/50">
                    <Share2 className="w-4 h-4 mr-2" />
                    {isPt ? 'Compartilhar' : 'Share'}
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <p className="text-muted-foreground">{selectedVideo.description}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
