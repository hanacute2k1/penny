/**
 * Icons for categories, plans and transit types.
 *
 * A stored `icon` is either one of the ids below (drawn with a Lucide icon) or any
 * emoji the user typed from their keyboard. Older data saved emoji for everything;
 * the emoji the app itself used to offer are shown as their Lucide twin (LEGACY_EMOJI).
 * Ids are short on purpose: the database column holds 16 characters.
 */

export const GLYPH_IDS = [
  // Spending
  'food',
  'coffee',
  'groceries',
  'home',
  'car',
  'fuel',
  'health',
  'pill',
  'game',
  'book',
  'school',
  'shirt',
  'gift',
  'plane',
  'pet',
  'cat',
  'baby',
  'bulb',
  'power',
  'water',
  'wifi',
  'phone',
  'laptop',
  'beauty',
  'gym',
  'beer',
  'wine',
  'pizza',
  'cake',
  'movie',
  'music',
  'ticket',
  'camera',
  'sofa',
  'tools',
  'bill',
  'card',
  'box',
  'flower',
  'heart',
  // Income
  'wallet',
  'work',
  'growth',
  'bank',
  'savings',
  'cash',
  'coins',
  'bonus',
  'store',
  'star',
  'trophy',
  'gem',
  'percent',
  'building',
  // Plans
  'outing',
  'luggage',
  'beach',
  'mountain',
  'party',
  'bag',
  'dining',
  'camp',
  'ship',
  'palette',
  // Transit
  'bus',
  'train',
  'bike',
  'motorbike',
  'taxi',
  'sailboat',
  // Fallbacks
  'pin',
  'note',
] as const;

export type GlyphId = (typeof GLYPH_IDS)[number];

/** What each picker offers, in order. */
export const ICON_CHOICES = {
  expense: [
    'food',
    'coffee',
    'groceries',
    'home',
    'car',
    'fuel',
    'health',
    'pill',
    'game',
    'book',
    'school',
    'shirt',
    'gift',
    'plane',
    'pet',
    'baby',
    'bulb',
    'water',
    'wifi',
    'phone',
    'beauty',
    'gym',
    'beer',
    'movie',
    'sofa',
    'tools',
    'bill',
    'card',
    'flower',
    'box',
  ],
  income: [
    'wallet',
    'work',
    'growth',
    'bank',
    'savings',
    'cash',
    'coins',
    'bonus',
    'store',
    'gift',
    'star',
    'trophy',
    'gem',
    'percent',
    'home',
  ],
  plan: [
    'outing',
    'luggage',
    'beach',
    'mountain',
    'party',
    'bag',
    'gift',
    'dining',
    'camp',
    'plane',
    'ship',
    'ticket',
    'music',
    'camera',
    'heart',
  ],
  transport: ['motorbike', 'car', 'bus', 'train', 'bike', 'taxi', 'fuel', 'plane', 'sailboat'],
} satisfies Record<string, GlyphId[]>;

/** Emoji the app used to offer → the Lucide icon shown for them now. */
const LEGACY_EMOJI: Record<string, GlyphId> = {
  '🍜': 'food',
  '☕': 'coffee',
  '🛒': 'groceries',
  '🏠': 'home',
  '🚗': 'car',
  '⛽': 'fuel',
  '💊': 'health',
  '🎮': 'game',
  '📚': 'book',
  '👕': 'shirt',
  '🎁': 'gift',
  '✈': 'plane',
  '🐶': 'pet',
  '👶': 'baby',
  '💡': 'bulb',
  '📱': 'phone',
  '💄': 'beauty',
  '🏋': 'gym',
  '🍺': 'beer',
  '📦': 'box',
  '💰': 'wallet',
  '💼': 'work',
  '📈': 'growth',
  '🏦': 'bank',
  '🧧': 'bonus',
  '💵': 'cash',
  '🛍': 'bag',
  '⭐': 'star',
  '➕': 'coins',
  '🎡': 'outing',
  '🧳': 'luggage',
  '🏖': 'beach',
  '⛰': 'mountain',
  '🎉': 'party',
  '🍽': 'dining',
  '🏕': 'camp',
  '🏍': 'motorbike',
  '🛵': 'motorbike',
  '🚌': 'bus',
  '🚂': 'train',
  '🚲': 'bike',
  '🚕': 'taxi',
  '📌': 'pin',
  '📝': 'note',
};

const GLYPH_SET = new Set<string>(GLYPH_IDS);

export function isGlyphId(value: string): value is GlyphId {
  return GLYPH_SET.has(value);
}

/** The Lucide icon to draw for a stored value, or null to show it as typed (an emoji). */
export function glyphFor(value: string | undefined): GlyphId | null {
  if (!value) return null;
  if (isGlyphId(value)) return value;
  // Emoji may or may not carry the "show as emoji" variation selector.
  return LEGACY_EMOJI[value.replace(/\uFE0F/g, '')] ?? null;
}

/** Text for places that can only show text (a native <select>): the emoji, or nothing. */
export function iconText(value: string | undefined): string {
  return value && !glyphFor(value) ? `${value} ` : '';
}

/** The last emoji typed into a text field, or '' if the last character isn't an emoji. */
export function lastEmoji(text: string): string {
  const parts = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)];
  const last = parts.at(-1)?.segment.trim() ?? '';
  return /\p{Extended_Pictographic}/u.test(last) ? last : '';
}
