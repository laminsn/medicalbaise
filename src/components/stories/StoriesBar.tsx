import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useStories, type StoryGroup } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { CreateStoryDialog } from './CreateStoryDialog';
import { StoryViewer } from './StoryViewer';

export function StoriesBar() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { storyGroups, loading, markViewed, deleteStory } = useStories();
  const [showCreate, setShowCreate] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);

  const handleOpenStory = (groupIndex: number) => {
    setViewerGroupIndex(groupIndex);
    setViewerOpen(true);
  };

  // Check if current user has stories
  const hasOwnStories = storyGroups.length > 0 && storyGroups[0].userId === user?.id;

  if (loading && storyGroups.length === 0) return null;

  return (
    <>
      <div className="py-3 bg-background border-b border-border">
        <ScrollArea className="w-full">
          <div className="flex gap-3 px-4">
            {/* Your Story / Add button */}
            <button
              onClick={() => hasOwnStories ? handleOpenStory(0) : setShowCreate(true)}
              className="flex-shrink-0 flex flex-col items-center gap-1 w-16"
            >
              <div className="relative">
                <div className={cn(
                  "w-16 h-16 rounded-full p-[2px]",
                  hasOwnStories
                    ? "bg-gradient-to-r from-primary via-purple-500 to-pink-500"
                    : "bg-muted"
                )}>
                  <div className="w-full h-full rounded-full bg-background p-[2px]">
                    <Avatar className="w-full h-full">
                      {profile?.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} />
                      ) : null}
                      <AvatarFallback className="text-sm bg-primary/10">
                        {profile?.first_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                {!hasOwnStories && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-0.5 border-2 border-background">
                    <Plus className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                {hasOwnStories ? t('stories.yourStory', 'Your Story') : t('stories.addStory', 'Add Story')}
              </span>
            </button>

            {/* Other users' stories */}
            {storyGroups.map((group, index) => {
              if (group.userId === user?.id) return null; // Already shown above
              return (
                <button
                  key={group.userId}
                  onClick={() => handleOpenStory(index)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 w-16"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-full p-[2px]",
                    group.hasUnviewed
                      ? "bg-gradient-to-r from-primary via-purple-500 to-pink-500"
                      : "bg-muted"
                  )}>
                    <div className="w-full h-full rounded-full bg-background p-[2px]">
                      <Avatar className="w-full h-full">
                        {group.avatarUrl ? (
                          <AvatarImage src={group.avatarUrl} />
                        ) : null}
                        <AvatarFallback className="text-sm bg-primary/10">
                          {group.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {group.userName}
                  </span>
                </button>
              );
            })}

            {/* Add story shortcut if no own stories */}
            {!hasOwnStories && storyGroups.length > 0 && null}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Create Story Dialog */}
      <CreateStoryDialog open={showCreate} onOpenChange={setShowCreate} />

      {/* Story Viewer */}
      <StoryViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        storyGroups={storyGroups}
        initialGroupIndex={viewerGroupIndex}
        onMarkViewed={markViewed}
        onDeleteStory={deleteStory}
      />
    </>
  );
}
