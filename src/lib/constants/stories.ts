export interface StoryFilter {
  id: string;
  name: string;
  filter: string; // CSS filter value
  preview: string; // gradient/color for preview thumbnail
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation: number;
}

export interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export const STORY_FILTERS: StoryFilter[] = [
  { id: 'none', name: 'Normal', filter: 'none', preview: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)' },
  { id: 'clarendon', name: 'Clarendon', filter: 'contrast(1.2) saturate(1.35)', preview: 'linear-gradient(135deg, #7ec8e3, #3b82f6)' },
  { id: 'gingham', name: 'Gingham', filter: 'brightness(1.05) hue-rotate(-10deg)', preview: 'linear-gradient(135deg, #e8d5b7, #f5e6d3)' },
  { id: 'moon', name: 'Moon', filter: 'grayscale(1) contrast(1.1) brightness(1.1)', preview: 'linear-gradient(135deg, #8e8e8e, #bdbdbd)' },
  { id: 'lark', name: 'Lark', filter: 'contrast(0.9) brightness(1.15) saturate(0.85)', preview: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 'reyes', name: 'Reyes', filter: 'sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)', preview: 'linear-gradient(135deg, #f8e8d4, #e8c8a8)' },
  { id: 'juno', name: 'Juno', filter: 'contrast(1.15) saturate(1.8) sepia(0.1)', preview: 'linear-gradient(135deg, #ff9a9e, #fad0c4)' },
  { id: 'slumber', name: 'Slumber', filter: 'saturate(0.66) brightness(1.05) sepia(0.15)', preview: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { id: 'crema', name: 'Crema', filter: 'sepia(0.5) contrast(0.9) brightness(1.1) saturate(0.6)', preview: 'linear-gradient(135deg, #d4a574, #e8c8a0)' },
  { id: 'ludwig', name: 'Ludwig', filter: 'brightness(1.05) saturate(1.3) contrast(1.05)', preview: 'linear-gradient(135deg, #ffeaa7, #dfe6e9)' },
  { id: 'aden', name: 'Aden', filter: 'hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.2)', preview: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 'perpetua', name: 'Perpetua', filter: 'brightness(1.05) saturate(1.1)', preview: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
];

export const GRADIENT_BACKGROUNDS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  'linear-gradient(135deg, #000000 0%, #434343 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
];

export const STICKER_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😂', '🥰', '😍', '🤩', '😎', '🥳', '😇', '🤗', '🫡', '🤔', '🫢', '😮', '🥺', '😢', '💀'],
  },
  {
    name: 'Medical',
    emojis: ['🩺', '💊', '🏥', '🩹', '🧬', '🔬', '💉', '🫀', '🫁', '🧠', '🦷', '🦴', '👨‍⚕️', '👩‍⚕️', '🚑', '❤️‍🩹'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👏', '🙌', '💪', '🤝', '✌️', '🤞', '👋', '🫶', '❤️', '🔥', '⭐', '✨', '💯', '🎉', '🏆'],
  },
  {
    name: 'Nature',
    emojis: ['🌸', '🌺', '🌻', '🍀', '🌈', '☀️', '🌙', '⛅', '🌊', '🦋', '🐾', '🍎', '🥑', '🥗', '🧘', '💧'],
  },
];

export const TEXT_FONTS = [
  { id: 'sans', name: 'Sans', family: 'system-ui, sans-serif' },
  { id: 'serif', name: 'Serif', family: 'Georgia, serif' },
  { id: 'mono', name: 'Mono', family: 'ui-monospace, monospace' },
  { id: 'cursive', name: 'Script', family: 'cursive' },
];

export const TEXT_COLORS = [
  '#FFFFFF', '#000000', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4',
];

export const MAX_STORY_VIDEO_DURATION = 60; // seconds
