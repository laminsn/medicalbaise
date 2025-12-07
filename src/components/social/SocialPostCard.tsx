import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, MessageCircle, Share2, MoreHorizontal, TrendingUp, UserPlus, UserMinus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SocialPostCardProps {
  post: {
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
  };
  currentUserId?: string;
  isProvider: boolean;
  onBoostClick: (postId: string) => void;
}

export function SocialPostCard({ post, currentUserId, isProvider, onBoostClick }: SocialPostCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [following, setFollowing] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);

  const isOwnPost = post.provider?.user_id === currentUserId;

  // Check if user has liked the post
  useEffect(() => {
    const checkLiked = async () => {
      if (!currentUserId) return;

      const { data } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      setLiked(!!data);
    };

    checkLiked();
  }, [post.id, currentUserId]);

  // Check if user follows this provider
  useEffect(() => {
    const checkFollowing = async () => {
      if (!currentUserId || !post.provider_id) return;

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_provider_id', post.provider_id)
        .maybeSingle();

      setFollowing(!!data);
    };

    checkFollowing();
  }, [post.provider_id, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error(t('socialFeed.signInToLike'));
      return;
    }

    setLoadingLike(true);

    if (liked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', currentUserId);

      if (!error) {
        setLiked(false);
        setLikesCount(prev => prev - 1);
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: post.id, user_id: currentUserId });

      if (!error) {
        setLiked(true);
        setLikesCount(prev => prev + 1);
      }
    }

    setLoadingLike(false);
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      toast.error(t('socialFeed.signInToFollow'));
      return;
    }

    setLoadingFollow(true);

    if (following) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_provider_id', post.provider_id);

      if (!error) {
        setFollowing(false);
        toast.success(t('socialFeed.unfollowed'));
      }
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_provider_id: post.provider_id });

      if (!error) {
        setFollowing(true);
        toast.success(t('socialFeed.followed'));
      }
    }

    setLoadingFollow(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/feed?post=${post.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.provider?.business_name || 'Post',
          text: post.content || '',
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('socialFeed.linkCopied'));
    }
  };

  return (
    <article className="p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link to={`/provider/${post.provider_id}`}>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {post.provider?.business_name?.charAt(0) || 'P'}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Link 
                to={`/provider/${post.provider_id}`}
                className="font-semibold hover:underline"
              >
                {post.provider?.business_name || t('socialFeed.unknownProvider')}
              </Link>
              {post.is_promoted && (
                <Badge variant="secondary" className="text-xs">
                  {t('socialFeed.sponsored')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOwnPost && currentUserId && (
            <Button
              variant={following ? "secondary" : "outline"}
              size="sm"
              onClick={handleFollow}
              disabled={loadingFollow}
            >
              {following ? (
                <>
                  <UserMinus className="h-4 w-4 mr-1" />
                  {t('socialFeed.following')}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  {t('socialFeed.follow')}
                </>
              )}
            </Button>
          )}

          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onBoostClick(post.id)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t('socialFeed.boostPost')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <p className="mb-3 whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Media - Videos 9:16 (Reels), Photos 4:5 (Instagram) */}
      <div className="rounded-lg overflow-hidden mb-3 bg-muted relative group">
        {post.media_type === 'video' ? (
          <div className="relative w-full" style={{ aspectRatio: '9/16', maxHeight: '600px' }}>
            <video
              src={post.media_url}
              controls
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="relative w-full" style={{ aspectRatio: '4/5' }}>
            <img
              src={post.media_url}
              alt={post.content || 'Post image'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Book Now Banner - only show if enabled */}
        {(post.show_book_now !== false) && (
          <button
            onClick={() => navigate(`/provider/${post.provider_id}`)}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent py-4 px-4 flex items-center justify-between opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
          >
            <div className="flex items-center gap-2 text-white">
              <Calendar className="h-4 w-4" />
              <span className="font-semibold text-sm">
                {t('socialFeed.bookNow', 'Book Now')}
              </span>
            </div>
            <span className="text-white/80 text-xs">
              {t('socialFeed.viewProfile', 'View Profile')} →
            </span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleLike}
          disabled={loadingLike}
        >
          <Heart
            className={`h-5 w-5 ${liked ? 'fill-red-500 text-red-500' : ''}`}
          />
          <span>{likesCount}</span>
        </Button>

        <Button variant="ghost" size="sm" className="gap-2">
          <MessageCircle className="h-5 w-5" />
          <span>{post.comments_count}</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </article>
  );
}
