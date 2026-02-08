import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { TextOverlay, StickerOverlay } from '@/lib/constants/stories';

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  thumbnail_url: string | null;
  background_gradient: string | null;
  overlays: any;
  filter: string | null;
  duration_seconds: number;
  view_count: number;
  expires_at: string;
  created_at: string;
  // Joined data
  user?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export interface StoryGroup {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  stories: Story[];
  hasUnviewed: boolean;
}

interface UploadStoryOptions {
  textOverlays?: TextOverlay[];
  stickers?: StickerOverlay[];
  filter?: string;
  durationSeconds?: number;
  backgroundGradient?: string;
}

export function useStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<string>>(new Set());

  const fetchStories = useCallback(async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching stories:', error);
      return;
    }

    const storiesData = data || [];

    // Fetch user profiles for story authors
    const userIds = [...new Set(storiesData.map(s => s.user_id))];
    
    const { data: profiles } = userIds.length > 0
      ? await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, avatar_url')
          .in('user_id', userIds)
      : { data: [] as any[] };

    const profileMap = new Map(
      (profiles || []).map((p: any) => [p.user_id, p])
    );

    const enrichedStories: Story[] = storiesData.map(s => ({
      ...s,
      user: profileMap.get(s.user_id) || null,
    }));

    setStories(enrichedStories);

    // Fetch viewed stories for current user
    let viewedIds = new Set<string>();
    if (user) {
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_id', user.id);
      
      viewedIds = new Set((views || []).map(v => v.story_id));
      setViewedStoryIds(viewedIds);
    }

    // Group stories by user
    const groupMap = new Map<string, StoryGroup>();
    
    // Put current user's stories first
    if (user) {
      const myStories = enrichedStories.filter(s => s.user_id === user.id);
      if (myStories.length > 0) {
        groupMap.set(user.id, {
          userId: user.id,
          userName: myStories[0].user?.first_name || 'You',
          avatarUrl: myStories[0].user?.avatar_url || null,
          stories: myStories,
          hasUnviewed: false, // Own stories always "viewed"
        });
      }
    }

    for (const story of enrichedStories) {
      if (user && story.user_id === user.id) continue; // Already added
      
      if (!groupMap.has(story.user_id)) {
        groupMap.set(story.user_id, {
          userId: story.user_id,
          userName: story.user?.first_name || 'User',
          avatarUrl: story.user?.avatar_url || null,
          stories: [],
          hasUnviewed: false,
        });
      }
      
      const group = groupMap.get(story.user_id)!;
      group.stories.push(story);
      if (!viewedIds.has(story.id)) {
        group.hasUnviewed = true;
      }
    }

    setStoryGroups(Array.from(groupMap.values()));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStories();

    const channel = supabase
      .channel('stories-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
        fetchStories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStories]);

  const uploadStory = useCallback(async (
    file: File,
    mediaType: 'image' | 'video',
    options?: UploadStoryOptions
  ) => {
    if (!user) {
      toast.error('Please sign in to post stories');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || (mediaType === 'image' ? 'jpg' : 'webm');
      const fileName = `stories/${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('testimonials')
        .upload(fileName, file, {
          contentType: file.type || (mediaType === 'image' ? 'image/jpeg' : 'video/webm'),
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('testimonials')
        .getPublicUrl(fileName);

      const overlays = {
        textOverlays: options?.textOverlays || [],
        stickers: options?.stickers || [],
      };

      const storyData: any = {
        user_id: user.id,
        media_url: publicUrl,
        media_type: mediaType,
        overlays,
        filter: options?.filter || null,
        duration_seconds: options?.durationSeconds || (mediaType === 'video' ? 15 : 5),
        background_gradient: options?.backgroundGradient || null,
      };

      const { error: insertError } = await supabase
        .from('stories')
        .insert(storyData);

      if (insertError) throw insertError;

      toast.success('Story published!');
      fetchStories();
    } catch (err) {
      console.error('Error uploading story:', err);
      toast.error('Failed to publish story');
    } finally {
      setIsUploading(false);
    }
  }, [user, fetchStories]);

  const markViewed = useCallback(async (storyId: string) => {
    if (!user) return;
    if (viewedStoryIds.has(storyId)) return;

    setViewedStoryIds(prev => new Set(prev).add(storyId));

    await supabase
      .from('story_views')
      .upsert({ story_id: storyId, viewer_id: user.id }, { onConflict: 'story_id,viewer_id' });
  }, [user, viewedStoryIds]);

  const deleteStory = useCallback(async (storyId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to delete story');
      return;
    }

    toast.success('Story deleted');
    fetchStories();
  }, [user, fetchStories]);

  return {
    stories,
    storyGroups,
    loading,
    isUploading,
    viewedStoryIds,
    uploadStory,
    markViewed,
    deleteStory,
    refetch: fetchStories,
  };
}
