import { describe, expect, it } from 'vitest';
import { glyphFor, iconText, lastEmoji } from '../icons';

describe('glyphFor', () => {
  it('draws ids and the emoji the app used to offer with Lucide', () => {
    expect(glyphFor('food')).toBe('food');
    expect(glyphFor('🍜')).toBe('food');
    expect(glyphFor('✈️')).toBe('plane');
    expect(glyphFor('✈')).toBe('plane');
  });

  it("keeps the user's own emoji as typed", () => {
    expect(glyphFor('🦄')).toBeNull();
    expect(iconText('🦄')).toBe('🦄 ');
    expect(iconText('food')).toBe('');
  });
});

it('lastEmoji keeps one whole emoji and ignores letters', () => {
  expect(lastEmoji('🙂👨‍👩‍👧')).toBe('👨‍👩‍👧');
  expect(lastEmoji('abc')).toBe('');
});
