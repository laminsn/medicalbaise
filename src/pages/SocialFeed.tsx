import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Plus, TrendingUp, MessageSquare, Bell, Radio, Stethoscope } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SocialPostCard } from '@/components/social/SocialPostCard';
import { CreatePostDialog } from '@/components/social/CreatePostDialog';
import { AdManagerDialog } from '@/components/social/AdManagerDialog';
import { LiveBroadcastDialog } from '@/components/social/LiveBroadcastDialog';
import { LiveStreamsSection } from '@/components/social/LiveStreamsSection';
import { FeedFilters } from '@/components/social/FeedFilters';
import { toast } from 'sonner';

interface SocialPost {
  id: string;
  provider_id: string;
  content: string | null;
  media_url: string;
  media_type: string;
  likes_count: number;
  comments_count: number;
  is_promoted: boolean;
  created_at: string;
  provider?: {
    id: string;
    business_name: string;
    user_id: string;
    specialty_id?: string;
    address?: string;
  };
}

export default function SocialFeed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProvider, setIsProvider] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showAdManager, setShowAdManager] = useState(false);
  const [showLiveBroadcast, setShowLiveBroadcast] = useState(false);
  const [providerName, setProviderName] = useState('');
  const [viewStartTime] = useState(Date.now());
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter states
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Check if user is a provider
  useEffect(() => {
    const checkProvider = async () => {
      if (!user) {
        setIsProvider(false);
        return;
      }

      const { data } = await supabase
        .from('providers')
        .select('id, business_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setIsProvider(true);
        setProviderId(data.id);
        setProviderName(data.business_name);
      }
    };

    checkProvider();
  }, [user]);

  // 28-second timer for non-authenticated users
  useEffect(() => {
    if (!user) {
      timerRef.current = setTimeout(() => {
        setShowAuthPrompt(true);
      }, 28000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [user]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          provider:providers(id, business_name, user_id, specialty_id, address)
        `)
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching posts:', error);
        toast.error(t('socialFeed.errorLoading'));
      } else {
        setPosts(data || []);
      }
      
      setLoading(false);
    };

    fetchPosts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('social-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_posts' },
        () => fetchPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [t]);

  // Filter posts based on selected filters
  useEffect(() => {
    let filtered = posts;

    if (selectedSpecialty) {
      filtered = filtered.filter(post => 
        post.provider?.specialty_id === selectedSpecialty
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(post => 
        post.provider?.address?.includes(selectedLocation)
      );
    }

    setFilteredPosts(filtered);
  }, [posts, selectedSpecialty, selectedLocation]);

  const handlePostCreated = () => {
    setShowCreatePost(false);
    toast.success(t('socialFeed.postCreated'));
  };

  if (showAuthPrompt && !user) {
    return (
      <AppLayout>
        <Helmet>
          <title>{t('socialFeed.title')} | MD Baise</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">{t('socialFeed.signInToView')}</h2>
            <p className="text-muted-foreground mb-6">{t('socialFeed.signInDescription')}</p>
            <Button onClick={() => navigate('/auth')} size="lg">
              {t('auth.signIn')}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Helmet>
        <title>{t('socialFeed.title', 'Feed Médico')} | MD Baise</title>
        <meta name="description" content={t('socialFeed.description', 'Acompanhe as últimas publicações de profissionais de saúde')} />
      </Helmet>

      <div className="max-w-lg mx-auto pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">{t('socialFeed.title', 'Feed Médico')}</h1>
            </div>
            <div className="flex items-center gap-1">
              {isProvider && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowLiveBroadcast(true)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Radio className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowAdManager(true)}
                  >
                    <TrendingUp className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowCreatePost(true)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/messages')}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Feed Filters */}
        <FeedFilters
          selectedSpecialty={selectedSpecialty}
          selectedLocation={selectedLocation}
          onSpecialtyChange={setSelectedSpecialty}
          onLocationChange={setSelectedLocation}
        />

        {/* Live Streams Section */}
        <LiveStreamsSection 
          specialtyFilter={selectedSpecialty}
          locationFilter={selectedLocation}
        />

        {/* Posts Feed */}
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              {t('common.loading', 'Carregando...')}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="mb-4">{selectedSpecialty || selectedLocation 
                ? t('socialFeed.noPostsFiltered', 'Nenhuma publicação encontrada com esses filtros')
                : t('socialFeed.noPosts', 'Nenhuma publicação ainda')}</p>
              {isProvider && !selectedSpecialty && !selectedLocation && (
                <Button onClick={() => setShowCreatePost(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('socialFeed.createPost', 'Criar Publicação')}
                </Button>
              )}
            </div>
          ) : (
            filteredPosts.map((post) => (
              <SocialPostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                isProvider={isProvider}
                onBoostClick={(postId) => {
                  setShowAdManager(true);
                }}
              />
            ))
          )}
        </div>

        {/* Floating Action Button for providers */}
        {isProvider && (
          <Button
            className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg"
            onClick={() => setShowCreatePost(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Dialogs */}
      <CreatePostDialog
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
        providerId={providerId}
        onSuccess={handlePostCreated}
      />

      <AdManagerDialog
        open={showAdManager}
        onOpenChange={setShowAdManager}
        providerId={providerId}
      />

      {providerId && (
        <LiveBroadcastDialog
          open={showLiveBroadcast}
          onOpenChange={setShowLiveBroadcast}
          providerId={providerId}
          providerName={providerName}
        />
      )}
    </AppLayout>
  );
}
