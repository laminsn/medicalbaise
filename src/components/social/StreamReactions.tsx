import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

const REACTION_EMOJIS = ['❤️', '🔥', '👏', '😍', '🎉', '💯', '😂', '🙌'];

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
  startTime: number;
}

interface StreamReactionsProps {
  onReact?: (emoji: string) => void;
  incomingReactions?: { emoji: string; id: string }[];
}

export function StreamReactions({ onReact, incomingReactions }: StreamReactionsProps) {
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // Clean up old reactions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setFloatingReactions((prev) =>
        prev.filter((r) => now - r.startTime < 3000)
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Handle incoming reactions from other viewers
  useEffect(() => {
    if (incomingReactions && incomingReactions.length > 0) {
      const latest = incomingReactions[incomingReactions.length - 1];
      addFloatingReaction(latest.emoji);
    }
  }, [incomingReactions?.length]);

  const addFloatingReaction = useCallback((emoji: string) => {
    const reaction: FloatingReaction = {
      id: crypto.randomUUID(),
      emoji,
      x: 10 + Math.random() * 60, // random horizontal position (10-70%)
      startTime: Date.now(),
    };
    setFloatingReactions((prev) => [...prev.slice(-30), reaction]); // Keep max 30
  }, []);

  const handleReact = (emoji: string) => {
    addFloatingReaction(emoji);
    onReact?.(emoji);
  };

  return (
    <>
      {/* Floating Reactions */}
      <div className="absolute bottom-24 right-4 w-20 h-64 pointer-events-none overflow-hidden">
        {floatingReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute animate-float-up text-2xl"
            style={{
              left: `${reaction.x}%`,
              bottom: 0,
              animation: 'floatUp 3s ease-out forwards',
              opacity: 1,
            }}
          >
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Reaction Bar */}
      <div className="flex items-center gap-1 pointer-events-auto">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="text-lg hover:scale-150 active:scale-90 transition-transform duration-150 p-1"
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
