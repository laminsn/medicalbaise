import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { SocialPostCard } from '@/components/social/SocialPostCard';
import { Loader2, ImageOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProviderFeedTabProps {
  providerId: string;
}

interface SocialPost {
  id: string;
  provider_id: string;
  content: string | null;
  media_url: string;
  media_type: string;
  likes_count: number;
  comments_count: number;
  is_promoted: boolean;
  show_book_now?: boolean;
  created_at: string;
  provider?: {
    id: string;
    business_name: string;
    user_id: string;
  };
}

export function ProviderFeedTab({ providerId }: ProviderFeedTabProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [providerUserId, setProviderUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviderPosts = async () => {
      setIsLoading(true);
      
      // Fetch provider info and posts
      const { data: providerData } = await supabase
        .from('providers')
        .select('id, business_name, user_id')
        .eq('id', providerId)
        .single();

      if (providerData) {
        setProviderUserId(providerData.user_id);
      }

      const { data: postsData, error } = await supabase
        .from('social_posts')
        .select(`
          id,
          provider_id,
          content,
          media_url,
          media_type,
          likes_count,
          comments_count,
          is_promoted,
          show_book_now,
          created_at
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (!error && postsData) {
        // Attach provider info to each post
        const postsWithProvider = postsData.map(post => ({
          ...post,
          provider: providerData ? {
            id: providerData.id,
            business_name: providerData.business_name,
            user_id: providerData.user_id,
          } : undefined,
        }));
        setPosts(postsWithProvider);
      }

      setIsLoading(false);
    };

    if (providerId) {
      fetchProviderPosts();
    }
  }, [providerId]);

  const isProvider = !!providerUserId && user?.id === providerUserId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ImageOff className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">{t('providerProfile.noFeedPosts', 'No posts yet')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('providerProfile.noFeedPostsDesc', 'This provider hasn\'t shared any content yet.')}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border -mx-4">
      {posts.map((post) => (
        <SocialPostCard
          key={post.id}
          post={post}
          currentUserId={user?.id}
          isProvider={isProvider}
          onBoostClick={() => {}}
        />
      ))}
    </div>
  );
}
